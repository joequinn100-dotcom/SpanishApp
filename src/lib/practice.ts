import 'server-only';
import { tx } from '@/db';
import { db } from './queries';
import {
  errorTransition,
  topicTransition,
  newErrorState,
  type ErrorState,
  type ErrorStatus,
  type TopicState,
  type TopicStatus,
} from '@/domain/mastery';
import { grade, errorOutcome, rollingAccuracy, type DrillPayload, type Grade } from '@/domain/grading';
import {
  planSession,
  sessionProgress,
  warmupGuaranteeHeld,
  type ContentRef,
  type SessionPlan,
} from '@/domain/session';

/**
 * The practice loop's database side.
 *
 * The pure logic lives in `@/domain` — this file is the part that reads rows,
 * calls those functions, and writes the results back. Every write path goes
 * through one transaction, so a crash mid-answer leaves the attempt, the topic
 * state, the error state and the cursor either all applied or all absent
 * (Build Principle 1).
 */

/* ------------------------------------------------------------------ *
 * Session lifecycle
 * ------------------------------------------------------------------ */

export interface SessionRow {
  id: number;
  started_at: string;
  ended_at: string | null;
  kind: string;
  topics: string | null;
  xp_earned: number;
  plan_json: string | null;
  cursor: number;
  handoff_json: string | null;
  handoff_md: string | null;
}

/** The session in progress, if there is one. There is at most one. */
export function openSession(): SessionRow | undefined {
  return db()
    .prepare('SELECT * FROM session WHERE ended_at IS NULL ORDER BY id DESC LIMIT 1')
    .get() as SessionRow | undefined;
}

export function sessionById(id: number): SessionRow | undefined {
  return db().prepare('SELECT * FROM session WHERE id = ?').get(id) as SessionRow | undefined;
}

export function planOf(s: SessionRow): SessionPlan {
  return s.plan_json
    ? (JSON.parse(s.plan_json) as SessionPlan)
    : { items: [], focusTopicId: null, warmupErrors: [] };
}

/** Content available for a topic, excluding retired rows. */
function contentForTopic(topicId: string): ContentRef[] {
  return (
    db()
      .prepare(
        `SELECT id, topic_id AS topicId, kind, difficulty, targets_error AS targetsError
           FROM content WHERE topic_id = ? AND retired = 0`,
      )
      .all(topicId) as ContentRef[]
  ).filter((c) => c.targetsError === null);
}

/**
 * The first candidate topic that actually has drills written for it.
 *
 * Content coverage is partial until the gauntlet fills it in, so the highest
 * leverage topic in the graph is often one with nothing to practise. Promising
 * a topic block that turns out to be empty is worse than picking second best.
 */
export function firstTopicWithContent(candidates: string[]): string | null {
  for (const id of candidates) {
    if (contentForTopic(id).length > 0) return id;
  }
  return null;
}

function contentByError(): Map<string, ContentRef[]> {
  const rows = db()
    .prepare(
      `SELECT id, topic_id AS topicId, kind, difficulty, targets_error AS targetsError
         FROM content WHERE targets_error IS NOT NULL AND retired = 0`,
    )
    .all() as ContentRef[];
  const map = new Map<string, ContentRef[]>();
  for (const r of rows) {
    const list = map.get(r.targetsError!) ?? [];
    list.push(r);
    map.set(r.targetsError!, list);
  }
  return map;
}

function liveErrors(): { code: string; state: ErrorState }[] {
  const rows = db()
    .prepare(
      `SELECT code, status, severity, occurrences, clean_streak, spontaneous_ok,
              last_occurred, consolidating_since, resolved_at
         FROM error WHERE status <> 'resolved'`,
    )
    .all() as {
    code: string;
    status: ErrorStatus;
    severity: number;
    occurrences: number;
    clean_streak: number;
    spontaneous_ok: number;
    last_occurred: string | null;
    consolidating_since: string | null;
    resolved_at: string | null;
  }[];

  return rows.map((r) => ({
    code: r.code,
    state: {
      status: r.status,
      severity: r.severity,
      occurrences: r.occurrences,
      cleanStreak: r.clean_streak,
      spontaneousOk: r.spontaneous_ok,
      lastOccurred: r.last_occurred,
      consolidatingSince: r.consolidating_since,
      resolvedAt: r.resolved_at,
    },
  }));
}

/**
 * Start a session, or return the one already open.
 *
 * Resuming rather than restarting is the point: a session interrupted at item 7
 * of 16 picks up at item 7, because the plan and the cursor are both on disk.
 */
export function startSession(focusTopicId: string | null): SessionRow {
  const existing = openSession();
  if (existing) return existing;

  const database = db();
  const now = new Date().toISOString();
  const errors = liveErrors();

  const plan = planSession({
    errors,
    contentByError: contentByError(),
    topicContent: focusTopicId ? contentForTopic(focusTopicId) : [],
    focusTopicId,
    now,
  });

  return tx(database, () => {
    // §4's guarantee is asserted before the plan is committed, not only in
    // tests — a guarantee checked nowhere but the test suite quietly stops
    // holding the first time production data looks different.
    if (!warmupGuaranteeHeld(plan, errors)) {
      throw new Error('Refusing to open a session whose warm-up skips the top-severity errors.');
    }

    const info = database
      .prepare(
        `INSERT INTO session (started_at, kind, topics, xp_earned, plan_json, cursor)
         VALUES (?, 'self_study', ?, 0, ?, 0)`,
      )
      .run(
        now,
        JSON.stringify([...new Set(plan.items.map((i) => i.topicId))]),
        JSON.stringify(plan),
      );

    touchStreak(now);
    return database.prepare('SELECT * FROM session WHERE id = ?').get(info.lastInsertRowid) as SessionRow;
  });
}

/* ------------------------------------------------------------------ *
 * The current item
 * ------------------------------------------------------------------ */

export interface CurrentItem {
  session: SessionRow;
  index: number;
  total: number;
  fraction: number;
  source: 'warmup' | 'topic';
  contentId: number;
  kind: string;
  difficulty: number;
  topicId: string;
  topicName: string;
  topicSlug: string;
  errorCode: string | null;
  errorLabel: string | null;
  payload: DrillPayload;
}

export function currentItem(s: SessionRow): CurrentItem | null {
  const plan = planOf(s);
  const p = sessionProgress(plan, s.cursor);
  if (!p.current) return null;

  const row = db()
    .prepare(
      `SELECT c.id, c.kind, c.difficulty, c.payload, c.topic_id,
              t.name_en AS topic_name, t.slug AS topic_slug
         FROM content c JOIN topic t ON t.id = c.topic_id
        WHERE c.id = ?`,
    )
    .get(p.current.contentId) as
    | {
        id: number;
        kind: string;
        difficulty: number;
        payload: string;
        topic_id: string;
        topic_name: string;
        topic_slug: string;
      }
    | undefined;

  if (!row) return null;

  const label = p.current.errorCode
    ? (db().prepare('SELECT label_en FROM error WHERE code = ?').get(p.current.errorCode) as
        | { label_en: string }
        | undefined)
    : undefined;

  return {
    session: s,
    index: p.answered,
    total: p.total,
    fraction: p.fraction,
    source: p.current.source,
    contentId: row.id,
    kind: row.kind,
    difficulty: row.difficulty,
    topicId: row.topic_id,
    topicName: row.topic_name,
    topicSlug: row.topic_slug,
    errorCode: p.current.errorCode,
    errorLabel: label?.label_en ?? null,
    payload: JSON.parse(row.payload) as DrillPayload,
  };
}

/* ------------------------------------------------------------------ *
 * Answering
 * ------------------------------------------------------------------ */

/** SPEC §8's XP weights. Written now because §7's handoff reports them. */
export const XP = {
  CORRECT_DRILL: 10,
  ERROR_AVOIDED: 25,
  ERROR_CONSOLIDATING: 100,
  ERROR_RESOLVED: 250,
  TOPIC_MASTERED: 500,
} as const;

export interface AnswerResult extends Grade {
  xp: number;
  /** State changes worth telling the user about. */
  notes: string[];
}

/**
 * Grade an answer and write every consequence in one transaction.
 *
 * The consequences are: the attempt row, the error event and error state, the
 * topic state and its rolling accuracy, the XP ledger, and the session cursor.
 * They move together or not at all.
 */
export function submitAnswer(sessionId: number, answer: string, latencyMs?: number): AnswerResult {
  const database = db();
  return tx(database, () => {
    const s = database.prepare('SELECT * FROM session WHERE id = ?').get(sessionId) as SessionRow;
    if (!s || s.ended_at) throw new Error('That session is not open.');

    const item = currentItem(s);
    if (!item) throw new Error('That session has no item left to answer.');

    const now = new Date().toISOString();
    const g = grade(item.payload, answer, item.errorCode);
    const notes: string[] = [];
    let xp = 0;

    database
      .prepare(
        `INSERT INTO attempt (content_id, session_id, user_answer, correct, partial,
                              feedback, errors_found, latency_ms, attempted_at, item_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        item.contentId,
        sessionId,
        answer,
        g.correct ? 1 : 0,
        g.partial,
        g.feedback,
        JSON.stringify(g.errorsFound),
        latencyMs ?? null,
        now,
        item.index,
      );

    if (g.verdict !== 'blank') {
      if (g.correct) xp += XP.CORRECT_DRILL;
      applyTopic(item.topicId, g, now, notes, () => {
        xp += XP.TOPIC_MASTERED;
      });
      if (item.errorCode) {
        applyError(item.errorCode, g, sessionId, answer, now, notes, (amount) => {
          xp += amount;
        });
      }
    }

    if (xp > 0) {
      database
        .prepare('INSERT INTO xp_event (session_id, amount, reason, occurred_at) VALUES (?,?,?,?)')
        .run(sessionId, xp, item.errorCode ?? item.topicId, now);
      database.prepare('UPDATE session SET xp_earned = xp_earned + ? WHERE id = ?').run(xp, sessionId);
    }

    database.prepare('UPDATE session SET cursor = cursor + 1 WHERE id = ?').run(sessionId);

    return { ...g, xp, notes };
  });
}

/** Rolling accuracy over this topic's last 20 attempts (SPEC §2). */
function recentPartials(topicId: string): number[] {
  return (
    db()
      .prepare(
        `SELECT a.partial, a.correct
           FROM attempt a JOIN content c ON c.id = a.content_id
          WHERE c.topic_id = ?
          ORDER BY a.id DESC
          LIMIT 20`,
      )
      .all(topicId) as { partial: number | null; correct: number }[]
  ).map((r) => r.partial ?? r.correct);
}

function applyTopic(
  topicId: string,
  g: Grade,
  now: string,
  notes: string[],
  onMastered: () => void,
) {
  const database = db();
  const row = database
    .prepare(
      `SELECT status, accuracy, attempts, correct, spontaneous, first_seen, last_seen,
              mastered_at, consolidating_since, reviews_passed, next_review_at
         FROM topic_state WHERE topic_id = ?`,
    )
    .get(topicId) as
    | {
        status: TopicStatus;
        accuracy: number;
        attempts: number;
        correct: number;
        spontaneous: number;
        first_seen: string | null;
        last_seen: string | null;
        mastered_at: string | null;
        consolidating_since: string | null;
        reviews_passed: number;
        next_review_at: string | null;
      }
    | undefined;
  if (!row) return;

  const before: TopicState = {
    status: row.status,
    accuracy: row.accuracy,
    attempts: row.attempts,
    correct: row.correct,
    spontaneous: row.spontaneous,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    masteredAt: row.mastered_at,
    consolidatingSince: row.consolidating_since,
    reviewsPassed: row.reviews_passed,
    nextReviewAt: row.next_review_at,
  };

  // The attempt is already inserted, so this window includes it.
  const after = topicTransition(
    before,
    { type: 'attempt', correct: g.correct, rollingAccuracy: rollingAccuracy(recentPartials(topicId)) },
    now,
  );

  database
    .prepare(
      `UPDATE topic_state
          SET status = ?, accuracy = ?, attempts = ?, correct = ?, first_seen = ?,
              last_seen = ?, mastered_at = ?, consolidating_since = ?,
              reviews_passed = ?, next_review_at = ?
        WHERE topic_id = ?`,
    )
    .run(
      after.status,
      after.accuracy,
      after.attempts,
      after.correct,
      after.firstSeen,
      after.lastSeen,
      after.masteredAt,
      after.consolidatingSince,
      after.reviewsPassed,
      after.nextReviewAt,
      topicId,
    );

  if (after.status !== before.status) {
    if (after.status === 'consolidating') {
      notes.push('This topic moved to consolidating — two spaced reviews to go.');
    } else if (after.status === 'mastered') {
      notes.push('Topic mastered.');
      onMastered();
    } else if (before.status === 'mastered') {
      notes.push('That was a mastered topic, so it drops back to studying.');
    }
  }
}

function applyError(
  code: string,
  g: Grade,
  sessionId: number,
  evidence: string,
  now: string,
  notes: string[],
  addXp: (n: number) => void,
) {
  const outcome = errorOutcome(g);
  if (!outcome) return;

  const database = db();
  const row = database
    .prepare(
      `SELECT id, status, severity, occurrences, clean_streak, spontaneous_ok,
              last_occurred, consolidating_since, resolved_at
         FROM error WHERE code = ?`,
    )
    .get(code) as
    | {
        id: number;
        status: ErrorStatus;
        severity: number;
        occurrences: number;
        clean_streak: number;
        spontaneous_ok: number;
        last_occurred: string | null;
        consolidating_since: string | null;
        resolved_at: string | null;
      }
    | undefined;
  if (!row) return;

  database
    .prepare(
      `INSERT INTO error_event (error_id, session_id, source, outcome, evidence, occurred_at)
       VALUES (?, ?, 'drill', ?, ?, ?)`,
    )
    .run(row.id, sessionId, outcome, evidence, now);

  const before: ErrorState = {
    ...newErrorState(row.severity, row.status),
    occurrences: row.occurrences,
    cleanStreak: row.clean_streak,
    spontaneousOk: row.spontaneous_ok,
    lastOccurred: row.last_occurred,
    consolidatingSince: row.consolidating_since,
    resolvedAt: row.resolved_at,
  };
  const after = errorTransition(before, { type: outcome }, now);

  database
    .prepare(
      `UPDATE error
          SET status = ?, occurrences = ?, clean_streak = ?, spontaneous_ok = ?,
              last_occurred = ?, consolidating_since = ?, resolved_at = ?
        WHERE id = ?`,
    )
    .run(
      after.status,
      after.occurrences,
      after.cleanStreak,
      after.spontaneousOk,
      after.lastOccurred,
      after.consolidatingSince,
      after.resolvedAt,
      row.id,
    );

  // §8: "Weight toward error extinction, not volume."
  if (outcome === 'avoided' && (before.status === 'active' || before.status === 'regressed')) {
    addXp(XP.ERROR_AVOIDED);
  }
  if (after.status !== before.status) {
    if (after.status === 'improving') notes.push(`«${code}» moved to improving.`);
    if (after.status === 'consolidating') {
      notes.push(`«${code}» moved to consolidating — 21 silent days from resolved.`);
      addXp(XP.ERROR_CONSOLIDATING);
    }
    if (after.status === 'regressed') notes.push(`«${code}» regressed. It comes back at 1.4× weight.`);
  }
}

/* ------------------------------------------------------------------ *
 * Streak (SPEC §8 — recorded now because §7's handoff reports it)
 * ------------------------------------------------------------------ */

function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

export function touchStreak(now: string): void {
  const database = db();
  database
    .prepare('INSERT OR IGNORE INTO streak (id, current, longest, freezes) VALUES (1, 0, 0, 2)')
    .run();
  const s = database.prepare('SELECT * FROM streak WHERE id = 1').get() as {
    current: number;
    longest: number;
    last_active: string | null;
  };

  const today = dayOf(now);
  if (s.last_active && dayOf(s.last_active) === today) return;

  const yesterday = dayOf(new Date(new Date(today).getTime() - 86_400_000).toISOString());
  const current = s.last_active && dayOf(s.last_active) === yesterday ? s.current + 1 : 1;

  database
    .prepare('UPDATE streak SET current = ?, longest = max(longest, ?), last_active = ? WHERE id = 1')
    .run(current, current, now);
}

export function streak(): { current: number; longest: number; freezes: number } {
  const row = db().prepare('SELECT current, longest, freezes FROM streak WHERE id = 1').get() as
    | { current: number; longest: number; freezes: number }
    | undefined;
  return row ?? { current: 0, longest: 0, freezes: 2 };
}
