import 'server-only';
import { tx } from '@/db';
import { db } from './queries';
import { contentForTopic, contentByError, liveErrors } from './pools';
import { readTopicState, writeTopicState } from './topic-state';
import { touchStreak } from './streak';
import { TOPIC, bossReady, topicTransition } from '@/domain/mastery';
import {
  BOSS_MIN_POOL,
  SPRINT,
  bossProgress,
  leaderboard,
  personalBest,
  planBoss,
  planSprint,
  sprintProgress,
  type SprintRecord,
} from '@/domain/challenge';
import type { PlannedItem, SessionPlan } from '@/domain/session';

/**
 * The database side of SPEC §8's two challenges.
 *
 * Both are stored as sessions (migration 007), so the queue, the cursor, the
 * attempt rows, the error state machine and the XP ledger are the ones
 * `practice.ts` already drives. This file adds only what is specific to a
 * challenge: deciding whether one may start, recording the running score, and
 * ending the run — including firing §4's `boss_fight` event, which is the
 * whole reason the boss fight exists.
 *
 * `submitAnswer` calls `applyChallengeAnswer` inside its transaction, so a
 * cleared boss fight and the attempt that cleared it commit together.
 */

/* ------------------------------------------------------------------ *
 * Starting
 * ------------------------------------------------------------------ */

export class ChallengeUnavailable extends Error {}

function assertNothingOpen() {
  const open = db()
    .prepare('SELECT id, kind FROM session WHERE ended_at IS NULL ORDER BY id DESC LIMIT 1')
    .get() as { id: number; kind: string } | undefined;
  if (open) {
    throw new ChallengeUnavailable(
      open.kind === 'boss' || open.kind === 'sprint'
        ? 'A challenge is already in progress. Finish it first — that is the point of no retries.'
        : 'Finish or end the open practice session first.',
    );
  }
}

function openChallenge(kind: 'boss' | 'sprint') {
  return db()
    .prepare('SELECT * FROM session WHERE kind = ? AND ended_at IS NULL ORDER BY id DESC LIMIT 1')
    .get(kind) as { id: number; cursor: number; plan_json: string | null } | undefined;
}

function planToJson(items: PlannedItem[], focusTopicId: string | null): string {
  const plan: SessionPlan = { items, focusTopicId, warmupErrors: [] };
  return JSON.stringify(plan);
}

export interface BossAvailability {
  ready: boolean;
  /** Why not, in words the UI can show. Null when ready. */
  reason: string | null;
  poolSize: number;
}

/**
 * May this topic face its boss fight?
 *
 * Two separate questions, and the UI needs to tell them apart: has the learner
 * earned the attempt (§4's reviews and spontaneous use), and is there enough
 * written material to make the attempt honest.
 */
export function bossAvailability(topicId: string): BossAvailability {
  const state = readTopicState(topicId);
  const poolSize = contentForTopic(topicId).length;

  if (!state) return { ready: false, reason: 'No state for that topic.', poolSize };
  if (state.bossClearedAt !== null) {
    return { ready: false, reason: 'Already cleared.', poolSize };
  }
  if (state.status !== 'consolidating') {
    return {
      ready: false,
      reason: 'The boss fight opens once a topic reaches consolidating.',
      poolSize,
    };
  }
  if (!bossReady(state)) {
    const missing: string[] = [];
    if (state.reviewsPassed < TOPIC.REQUIRED_REVIEWS) {
      missing.push(`${TOPIC.REQUIRED_REVIEWS - state.reviewsPassed} more clean spaced review(s)`);
    }
    if (state.spontaneous < TOPIC.REQUIRED_SPONTANEOUS) {
      missing.push('one spontaneous correct use in a transcript');
    }
    return { ready: false, reason: `Still needs ${missing.join(' and ')}.`, poolSize };
  }
  if (poolSize < BOSS_MIN_POOL) {
    return {
      ready: false,
      reason: `Only ${poolSize} drills written for this topic; the challenge needs at least ${BOSS_MIN_POOL} so it tests the topic rather than this morning's drill order.`,
      poolSize,
    };
  }
  return { ready: true, reason: null, poolSize };
}

export function startBoss(topicId: string): number {
  const database = db();
  return tx(database, () => {
    const availability = bossAvailability(topicId);
    if (!availability.ready) throw new ChallengeUnavailable(availability.reason!);
    assertNothingOpen();

    const plan = planBoss({ topicId, content: contentForTopic(topicId) });
    if (!plan) throw new ChallengeUnavailable('Not enough material for a boss fight.');

    const now = new Date().toISOString();
    const items: PlannedItem[] = plan.contentIds.map((contentId) => ({
      contentId,
      source: 'boss',
      topicId,
      errorCode: null,
    }));

    const info = database
      .prepare(
        `INSERT INTO session (started_at, kind, topics, xp_earned, plan_json, cursor)
         VALUES (?, 'boss', ?, 0, ?, 0)`,
      )
      .run(now, JSON.stringify([topicId]), planToJson(items, topicId));

    const sessionId = Number(info.lastInsertRowid);
    database
      .prepare('INSERT INTO boss_attempt (session_id, topic_id, started_at) VALUES (?, ?, ?)')
      .run(sessionId, topicId, now);

    // Twelve unaided items is more work than §8's streak minimum of one
    // warm-up, so a day spent on a boss fight keeps the streak.
    touchStreak(now);
    return sessionId;
  });
}

export interface SprintAvailability {
  ready: boolean;
  reason: string | null;
}

export function sprintAvailability(now = new Date().toISOString()): SprintAvailability {
  const plan = planSprint({ errors: liveErrors(), contentByError: contentByError(), now });
  if (!plan) {
    return {
      ready: false,
      // An empty error list is good news, and saying "unavailable" about it
      // would read as a fault.
      reason: `Not enough drills across your active errors to fill ${SPRINT.ITEMS} items.`,
    };
  }
  return { ready: true, reason: null };
}

export function startSprint(): number {
  const database = db();
  return tx(database, () => {
    assertNothingOpen();
    const now = new Date().toISOString();
    const plan = planSprint({ errors: liveErrors(), contentByError: contentByError(), now });
    if (!plan) throw new ChallengeUnavailable(sprintAvailability(now).reason!);

    const byId = new Map(
      [...contentByError().values()].flat().map((c) => [c.id, c] as const),
    );
    const items: PlannedItem[] = plan.contentIds.map((contentId) => {
      const ref = byId.get(contentId)!;
      return {
        contentId,
        source: 'sprint',
        topicId: ref.topicId,
        errorCode: ref.targetsError,
      };
    });

    const info = database
      .prepare(
        `INSERT INTO session (started_at, kind, topics, xp_earned, plan_json, cursor)
         VALUES (?, 'sprint', ?, 0, ?, 0)`,
      )
      .run(now, JSON.stringify([...new Set(items.map((i) => i.topicId))]), planToJson(items, null));

    const sessionId = Number(info.lastInsertRowid);
    database
      .prepare('INSERT INTO sprint_run (session_id, started_at, lives_left) VALUES (?, ?, ?)')
      .run(sessionId, now, SPRINT.LIVES);
    touchStreak(now);
    return sessionId;
  });
}

/* ------------------------------------------------------------------ *
 * Answering
 * ------------------------------------------------------------------ */

/** Every answer given in a run so far, oldest first. */
function answersOf(sessionId: number): boolean[] {
  return (
    db()
      .prepare('SELECT correct FROM attempt WHERE session_id = ? ORDER BY item_index, id')
      .all(sessionId) as { correct: number }[]
  ).map((r) => r.correct === 1);
}

export interface ChallengeOutcome {
  kind: 'boss' | 'sprint';
  finished: boolean;
  correct: number;
  /** Boss only. */
  passed?: boolean;
  /** Sprint only. */
  livesLeft?: number;
  outcome?: 'cleared' | 'out_of_lives' | 'abandoned';
  notes: string[];
}

/**
 * Fold one graded answer into the run.
 *
 * Called from `submitAnswer`, inside its transaction, after the attempt row
 * exists — `answersOf` reads it back rather than taking the verdict as an
 * argument, so a resumed run and a fresh one are scored by the same code path.
 *
 * Returns null for an ordinary practice session.
 */
export function applyChallengeAnswer(
  sessionId: number,
  kind: string,
  now: string,
): ChallengeOutcome | null {
  if (kind !== 'boss' && kind !== 'sprint') return null;
  return kind === 'boss' ? applyBossAnswer(sessionId, now) : applySprintAnswer(sessionId, now);
}

function applyBossAnswer(sessionId: number, now: string): ChallengeOutcome {
  const database = db();
  const answers = answersOf(sessionId);
  const p = bossProgress(answers);
  const notes: string[] = [];

  database
    .prepare('UPDATE boss_attempt SET correct = ? WHERE session_id = ?')
    .run(p.correct, sessionId);

  // §8: no retries. Once the verdict cannot change, playing out the remaining
  // items would be theatre, so the run ends where it stands.
  if (!p.settled) {
    return { kind: 'boss', finished: false, correct: p.correct, notes };
  }

  const row = database
    .prepare('SELECT topic_id AS topicId, passed FROM boss_attempt WHERE session_id = ?')
    .get(sessionId) as { topicId: string; passed: number | null };

  // Idempotence: a resubmitted final answer must not fire `boss_fight` twice.
  if (row.passed !== null) {
    return { kind: 'boss', finished: true, correct: p.correct, passed: row.passed === 1, notes };
  }

  const passed = p.passed === true;
  database
    .prepare('UPDATE boss_attempt SET passed = ?, ended_at = ? WHERE session_id = ?')
    .run(passed ? 1 : 0, now, sessionId);
  database.prepare('UPDATE session SET ended_at = ? WHERE id = ?').run(now, sessionId);

  const before = readTopicState(row.topicId);
  if (before) {
    const after = topicTransition(before, { type: 'boss_fight', passed }, now);
    writeTopicState(row.topicId, after);
    notes.push(
      passed
        ? `Boss cleared, ${p.correct}/${TOPIC.BOSS_ITEMS}. Topic mastered.`
        : `Boss failed, ${p.correct}/${TOPIC.BOSS_ITEMS} — ${TOPIC.BOSS_PASS} needed. Back to studying; the consolidation did not hold.`,
    );
  }

  return { kind: 'boss', finished: true, correct: p.correct, passed, notes };
}

function applySprintAnswer(sessionId: number, now: string): ChallengeOutcome {
  const database = db();
  const answers = answersOf(sessionId);
  const p = sprintProgress(answers);
  const notes: string[] = [];

  database
    .prepare('UPDATE sprint_run SET correct = ?, lives_left = ? WHERE session_id = ?')
    .run(p.correct, p.livesLeft, sessionId);

  if (p.outcome === null) {
    return { kind: 'sprint', finished: false, correct: p.correct, livesLeft: p.livesLeft, notes };
  }

  const row = database
    .prepare('SELECT started_at AS startedAt, outcome FROM sprint_run WHERE session_id = ?')
    .get(sessionId) as { startedAt: string; outcome: string | null };

  if (row.outcome !== null) {
    return {
      kind: 'sprint',
      finished: true,
      correct: p.correct,
      livesLeft: p.livesLeft,
      outcome: row.outcome as ChallengeOutcome['outcome'],
      notes,
    };
  }

  const durationMs = new Date(now).getTime() - new Date(row.startedAt).getTime();
  database
    .prepare('UPDATE sprint_run SET outcome = ?, ended_at = ?, duration_ms = ? WHERE session_id = ?')
    .run(p.outcome, now, durationMs, sessionId);
  database.prepare('UPDATE session SET ended_at = ? WHERE id = ?').run(now, sessionId);

  if (p.outcome === 'cleared') {
    const best = personalBest(finishedSprints().filter((r) => r.id !== sessionId));
    notes.push(
      best === null
        ? `Gauntlet Run cleared in ${(durationMs / 1000).toFixed(1)}s. That is the time to beat.`
        : durationMs < best.durationMs
          ? `Gauntlet Run cleared in ${(durationMs / 1000).toFixed(1)}s — a new personal best, ${((best.durationMs - durationMs) / 1000).toFixed(1)}s faster.`
          : `Gauntlet Run cleared in ${(durationMs / 1000).toFixed(1)}s. Your best is ${(best.durationMs / 1000).toFixed(1)}s.`,
    );
  } else {
    notes.push(`Out of lives at item ${p.answered}. The run ends here — that is what the lives are for.`);
  }

  return {
    kind: 'sprint',
    finished: true,
    correct: p.correct,
    livesLeft: p.livesLeft,
    outcome: p.outcome,
    notes,
  };
}

/**
 * Abandon the open run.
 *
 * A boss fight cannot be abandoned into nothing: §8 gives it no retries, so
 * walking away is a loss, and the topic goes back to `studying` exactly as if
 * it had been failed. Anything softer makes the challenge optional, and an
 * optional gate is not a gate.
 */
export function abandonChallenge(sessionId: number): void {
  const database = db();
  tx(database, () => {
    const s = database.prepare('SELECT kind, ended_at FROM session WHERE id = ?').get(sessionId) as
      | { kind: string; ended_at: string | null }
      | undefined;
    if (!s || s.ended_at) return;
    const now = new Date().toISOString();

    if (s.kind === 'boss') {
      const row = database
        .prepare('SELECT topic_id AS topicId FROM boss_attempt WHERE session_id = ?')
        .get(sessionId) as { topicId: string };
      database
        .prepare('UPDATE boss_attempt SET passed = 0, ended_at = ? WHERE session_id = ?')
        .run(now, sessionId);
      const before = readTopicState(row.topicId);
      if (before) {
        writeTopicState(row.topicId, topicTransition(before, { type: 'boss_fight', passed: false }, now));
      }
    } else if (s.kind === 'sprint') {
      const row = database
        .prepare('SELECT started_at AS startedAt FROM sprint_run WHERE session_id = ?')
        .get(sessionId) as { startedAt: string };
      database
        .prepare(
          "UPDATE sprint_run SET outcome = 'abandoned', ended_at = ?, duration_ms = ? WHERE session_id = ?",
        )
        .run(now, new Date(now).getTime() - new Date(row.startedAt).getTime(), sessionId);
    }

    database.prepare('UPDATE session SET ended_at = ? WHERE id = ?').run(now, sessionId);
  });
}

/* ------------------------------------------------------------------ *
 * Reading
 * ------------------------------------------------------------------ */

export function openBoss() {
  return openChallenge('boss');
}

export function openSprint() {
  return openChallenge('sprint');
}

export function finishedSprints(): SprintRecord[] {
  return (
    db()
      .prepare(
        `SELECT session_id AS id, started_at AS startedAt, outcome, correct,
                lives_left AS livesLeft, duration_ms AS durationMs
           FROM sprint_run
          WHERE outcome IS NOT NULL AND duration_ms IS NOT NULL`,
      )
      .all() as SprintRecord[]
  );
}

/** §8: "Leaderboard against your own past runs." */
export function sprintBoard(limit = 10): SprintRecord[] {
  return leaderboard(finishedSprints(), limit);
}

export function sprintPersonalBest(): SprintRecord | null {
  return personalBest(finishedSprints());
}

export interface ChallengeStatus {
  sessionId: number;
  kind: 'boss' | 'sprint';
  items: number;
  answered: number;
  correct: number;
  finished: boolean;
  /** Boss only. */
  topicId?: string;
  topicName?: string;
  topicSlug?: string;
  passed?: boolean;
  /** Sprint only. */
  livesLeft?: number;
  outcome?: 'cleared' | 'out_of_lives' | 'abandoned';
  durationMs?: number;
  /** The run to beat, excluding this one. Sprint only. */
  previousBest?: SprintRecord | null;
}

/** Everything the challenge screen needs, in one read. */
export function challengeStatus(sessionId: number): ChallengeStatus | null {
  const s = db()
    .prepare('SELECT id, kind, ended_at, plan_json FROM session WHERE id = ?')
    .get(sessionId) as
    | { id: number; kind: string; ended_at: string | null; plan_json: string | null }
    | undefined;
  if (!s || (s.kind !== 'boss' && s.kind !== 'sprint')) return null;

  const plan = s.plan_json ? (JSON.parse(s.plan_json) as SessionPlan) : { items: [] };
  const answers = answersOf(sessionId);
  const base = {
    sessionId,
    kind: s.kind,
    items: plan.items.length,
    answered: answers.length,
    correct: answers.filter(Boolean).length,
    finished: s.ended_at !== null,
  };

  if (s.kind === 'boss') {
    const row = db()
      .prepare(
        `SELECT b.topic_id AS topicId, t.name_en AS topicName, t.slug AS topicSlug, b.passed
           FROM boss_attempt b JOIN topic t ON t.id = b.topic_id
          WHERE b.session_id = ?`,
      )
      .get(sessionId) as
      | { topicId: string; topicName: string; topicSlug: string; passed: number | null }
      | undefined;
    return {
      ...base,
      kind: 'boss',
      topicId: row?.topicId,
      topicName: row?.topicName,
      topicSlug: row?.topicSlug,
      passed: row?.passed === null || row?.passed === undefined ? undefined : row.passed === 1,
    };
  }

  const row = db()
    .prepare(
      `SELECT lives_left AS livesLeft, outcome, duration_ms AS durationMs
         FROM sprint_run WHERE session_id = ?`,
    )
    .get(sessionId) as
    | { livesLeft: number; outcome: string | null; durationMs: number | null }
    | undefined;
  return {
    ...base,
    kind: 'sprint',
    livesLeft: row?.livesLeft ?? SPRINT.LIVES,
    outcome: (row?.outcome ?? undefined) as ChallengeStatus['outcome'],
    durationMs: row?.durationMs ?? undefined,
    previousBest: personalBest(finishedSprints().filter((r) => r.id !== sessionId)),
  };
}

export interface BossHistoryRow {
  sessionId: number;
  topicId: string;
  startedAt: string;
  endedAt: string | null;
  correct: number;
  passed: boolean | null;
}

/** Every attempt at a topic's boss, newest first — four goes is a real fact. */
export function bossHistory(topicId: string): BossHistoryRow[] {
  return (
    db()
      .prepare(
        `SELECT session_id AS sessionId, topic_id AS topicId, started_at AS startedAt,
                ended_at AS endedAt, correct, passed
           FROM boss_attempt WHERE topic_id = ? ORDER BY started_at DESC`,
      )
      .all(topicId) as (Omit<BossHistoryRow, 'passed'> & { passed: number | null })[]
  ).map((r) => ({ ...r, passed: r.passed === null ? null : r.passed === 1 }));
}
