import 'server-only';
import { tx } from '@/db';
import { db } from './queries';
import {
  isDue,
  markSpontaneous,
  promptDirection,
  reviewVocab,
  selectVocab,
  type Recall,
  type VocabStage,
  type VocabState,
} from '@/domain/srs';

/**
 * Vocabulary SRS — the database side.
 *
 * The scheduling logic is pure and lives in `@/domain/srs`; this file reads
 * rows, calls it, and writes the result back inside one transaction, the same
 * shape as the drill loop.
 */

export interface VocabRow {
  id: number;
  term: string;
  gloss_en: string;
  category: string;
  level_id: string;
  example_es: string;
  stage: VocabStage;
  ease: number;
  interval_days: number;
  due_at: string | null;
  reps: number;
  lapses: number;
  last_reviewed: string | null;
}

export interface VocabCard extends VocabRow {
  /** Recognition on first sight, production once the word is known. */
  direction: 'es_to_en' | 'en_to_es';
}

function stateOf(r: VocabRow): VocabState {
  return {
    stage: r.stage,
    ease: r.ease,
    intervalDays: r.interval_days,
    dueAt: r.due_at,
    reps: r.reps,
    lapses: r.lapses,
    lastReviewed: r.last_reviewed,
  };
}

export function allVocab(): VocabRow[] {
  return db()
    .prepare(
      `SELECT * FROM vocab
        ORDER BY CASE stage WHEN 'spontaneous' THEN 0 WHEN 'using' THEN 1
                            WHEN 'recognizing' THEN 2 ELSE 3 END,
                 due_at IS NULL, due_at, term`,
    )
    .all() as VocabRow[];
}

export function vocabById(id: number): VocabRow | undefined {
  return db().prepare('SELECT * FROM vocab WHERE id = ?').get(id) as VocabRow | undefined;
}

/** Today's queue: due reviews first, then a capped number of new words. */
export function dueVocab(count = 10, now: string = new Date().toISOString()): VocabCard[] {
  const rows = allVocab();
  const chosen = selectVocab(
    rows.map((r) => ({ item: r, state: stateOf(r) })),
    count,
    now,
  );
  return chosen.map(({ item, state }) => ({ ...item, direction: promptDirection(state.stage) }));
}

export function dueVocabCount(now: string = new Date().toISOString()): number {
  return allVocab().filter((r) => isDue(stateOf(r), now)).length;
}

export interface VocabStats {
  total: number;
  new: number;
  recognizing: number;
  using: number;
  spontaneous: number;
  due: number;
  /** Words forgotten at least once — the ones the schedule taught rather than use. */
  leaky: number;
}

export function vocabStats(now: string = new Date().toISOString()): VocabStats {
  const rows = allVocab();
  const count = (s: VocabStage) => rows.filter((r) => r.stage === s).length;
  return {
    total: rows.length,
    new: count('new'),
    recognizing: count('recognizing'),
    using: count('using'),
    spontaneous: count('spontaneous'),
    due: rows.filter((r) => isDue(stateOf(r), now)).length,
    leaky: rows.filter((r) => r.lapses > 0).length,
  };
}

export interface VocabResult {
  stage: VocabStage;
  intervalDays: number;
  dueAt: string | null;
  /** Anything worth telling the learner about the change. */
  note: string | null;
}

/**
 * Record one review and reschedule the card.
 *
 * The review row and the new schedule are written together: a card whose
 * history says it was reviewed but whose due date did not move would be a
 * schedule that silently stopped working.
 */
export function reviewCard(
  vocabId: number,
  recall: Recall,
  sessionId: number | null = null,
): VocabResult {
  const database = db();
  return tx(database, () => {
    const row = database.prepare('SELECT * FROM vocab WHERE id = ?').get(vocabId) as
      | VocabRow
      | undefined;
    if (!row) throw new Error(`No vocabulary card ${vocabId}.`);

    const now = new Date().toISOString();
    const before = stateOf(row);
    const after = reviewVocab(before, recall, now);

    database
      .prepare(
        `UPDATE vocab
            SET stage = ?, ease = ?, interval_days = ?, due_at = ?, reps = ?,
                lapses = ?, last_reviewed = ?
          WHERE id = ?`,
      )
      .run(
        after.stage,
        after.ease,
        after.intervalDays,
        after.dueAt,
        after.reps,
        after.lapses,
        after.lastReviewed,
        vocabId,
      );

    database
      .prepare(
        `INSERT INTO vocab_review (vocab_id, session_id, recall, interval_days, ease, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(vocabId, sessionId, recall, after.intervalDays, after.ease, now);

    let note: string | null = null;
    if (after.stage !== before.stage) {
      if (after.stage === 'using') {
        note = `«${row.term}» moved to using — ${after.intervalDays} days until the next review.`;
      } else if (after.stage === 'recognizing' && before.stage === 'new') {
        note = `«${row.term}» added to the schedule.`;
      } else if (after.lapses > before.lapses) {
        note = `«${row.term}» slipped back to recognizing. Back tomorrow.`;
      }
    }

    return { stage: after.stage, intervalDays: after.intervalDays, dueAt: after.dueAt, note };
  });
}

/**
 * Promote a word to `spontaneous` on the strength of unprompted use.
 *
 * Called from the transcript review, never from a card. §4's standard applies
 * to vocabulary as much as to grammar: recalling a word when asked is not the
 * same as reaching for it, and only the second one is worth calling acquired.
 */
export function markVocabSpontaneous(terms: string[]): number {
  const database = db();
  return tx(database, () => {
    let n = 0;
    for (const term of terms) {
      const row = database
        .prepare('SELECT * FROM vocab WHERE lower(term) = lower(?)')
        .get(term) as VocabRow | undefined;
      if (!row || row.stage === 'spontaneous') continue;
      const after = markSpontaneous(stateOf(row));
      database.prepare('UPDATE vocab SET stage = ? WHERE id = ?').run(after.stage, row.id);
      n++;
    }
    return n;
  });
}

/**
 * Vocabulary the learner used correctly and unprompted in a stretch of text.
 *
 * Every content word of the term has to appear, not just the most distinctive
 * one. Matching on the head alone credited «levantar una observación» to a
 * sentence that only contained «observaciones», and «quedar pendiente» to one
 * that said «sigue pendiente» — promotions the learner had not earned, on the
 * one route to the top stage. Over-crediting here is worse than missing a word:
 * a missed word simply comes round again on the schedule.
 *
 * Verbs are matched on a stem, because they arrive conjugated («subsanar» →
 * «subsanamos»); short stems fall back to the whole token so «dar» cannot match
 * every word containing a d.
 */
export function vocabUsedIn(text: string): string[] {
  const strip = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hay = strip(text);
  const GRAMMAR = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'en', 'a', 'al', 'de', 'del', 'que', 'por', 'se', 'su',
  ]);

  const needleFor = (token: string): string => {
    if (!/(arse|erse|irse|ar|er|ir)$/.test(token)) return token;
    const stem = token.replace(/(arse|erse|irse|ar|er|ir)$/, '');
    return stem.length >= 4 ? stem.slice(0, 5) : token;
  };

  return allVocab()
    .filter((v) => {
      const tokens = strip(v.term)
        .split(/\s+/)
        .filter((w) => !GRAMMAR.has(w) && w.length > 1);
      if (tokens.length === 0) return hay.includes(strip(v.term));
      return tokens.every((t) => hay.includes(needleFor(t)));
    })
    .map((v) => v.term);
}
