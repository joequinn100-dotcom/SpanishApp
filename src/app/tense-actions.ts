'use server';

import { PERSONS, TENSE_BY_ID, fullTable, type Person, type Tense } from '@/domain/conjugation';
import { VERB_BY_INFINITIVE } from '@/domain/verbs';
import { drillsForTense, type TenseDrill } from '@/domain/tense-drills';
import { grade, type Grade } from '@/domain/grading';
import { db } from '@/lib/queries';
import { tx } from '@/db';

/**
 * The tense trainer's server side.
 *
 * Free practice, deliberately: these attempts do not feed §4's mastery
 * machines. A topic reaches `mastered` on evidence gathered under the app's own
 * conditions — a planned session, a spaced review, an unaided boss fight — and
 * letting a self-selected grind of twenty imperfect subjunctives count towards
 * that would let the learner farm the strongest claim the app makes about them.
 *
 * They are still logged, because "which cells do I keep missing" is a real
 * question and the answer has to come from somewhere.
 */

export interface TrainerItem {
  verb: string;
  verbEn: string;
  tense: Tense;
  tenseEn: string;
  person: Person;
  prompt: string;
  context?: string;
  sentence: string;
  /** Held server-side between rounds; the client never sees it before grading. */
  index: number;
}

/** A round of items for one tense. */
export async function tenseRound(
  tense: Tense,
  count = 10,
  maxFrequency: 1 | 2 | 3 = 2,
): Promise<TrainerItem[]> {
  const drills = drillsForTense(tense, count, maxFrequency);
  return drills.map((d, index) => ({
    verb: d.verb,
    verbEn: VERB_BY_INFINITIVE.get(d.verb)?.en ?? '',
    tense: d.tense,
    tenseEn: TENSE_BY_ID[d.tense].en,
    person: d.person,
    prompt: d.payload.prompt,
    context: d.payload.context,
    sentence: d.payload.sentence,
    index,
  }));
}

export interface TrainerResult extends Grade {
  answer: string;
  explanation: string;
}

/**
 * Grade one item.
 *
 * The drill is regenerated rather than trusted from the client. The generator
 * is deterministic, so the same tense, count and index always yield the same
 * item — which means the answer never has to travel to the browser and back,
 * where it could be read out of the page source or edited before submission.
 */
export async function gradeTenseItem(
  tense: Tense,
  index: number,
  submitted: string,
  count = 10,
  maxFrequency: 1 | 2 | 3 = 2,
): Promise<TrainerResult> {
  const drills = drillsForTense(tense, count, maxFrequency);
  const drill = drills[index];
  if (!drill) throw new Error('No such item in this round.');

  const g = grade(drill.payload, submitted, null);
  logAttempt(drill, submitted, g.correct);

  return { ...g, answer: drill.payload.answer, explanation: drill.payload.explanation };
}

/**
 * Record the attempt against the conjugation cell.
 *
 * Its own table rather than `attempt`, which is keyed to a `content` row and a
 * session. These items have neither: they are generated on demand and never
 * stored, so there is nothing for a foreign key to point at. Keeping them
 * separate also keeps them out of the rolling accuracy §4 reads, which is the
 * point — see the note at the top of this file.
 */
function logAttempt(drill: TenseDrill, submitted: string, correct: boolean) {
  const database = db();
  tx(database, () => {
    database
      .prepare(
        `INSERT INTO tense_attempt (verb, tense, person, submitted, correct, attempted_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(drill.verb, drill.tense, drill.person, submitted, correct ? 1 : 0, new Date().toISOString());
  });
}

export interface ConjugationTable {
  infinitive: string;
  en: string;
  rows: { tense: Tense; en: string; es: string; mood: string; forms: Record<Person, string> }[];
  persons: readonly Person[];
}

/** The full paradigm for one verb, for the reference view. */
export async function conjugationTable(infinitive: string): Promise<ConjugationTable | null> {
  const verb = VERB_BY_INFINITIVE.get(infinitive);
  if (!verb) return null;
  const table = fullTable(verb);
  return {
    infinitive: verb.infinitive,
    en: verb.en,
    persons: PERSONS,
    rows: Object.entries(table).map(([tense, forms]) => ({
      tense: tense as Tense,
      en: TENSE_BY_ID[tense as Tense].en,
      es: TENSE_BY_ID[tense as Tense].es,
      mood: TENSE_BY_ID[tense as Tense].mood,
      forms,
    })),
  };
}

export interface WeakCell {
  tense: Tense;
  person: Person;
  attempts: number;
  wrong: number;
}

/** Where the learner keeps slipping — the answer to "what should I drill?". */
export async function weakestCells(limit = 8): Promise<WeakCell[]> {
  return db()
    .prepare(
      `SELECT tense, person, count(*) AS attempts,
              SUM(CASE WHEN correct = 1 THEN 0 ELSE 1 END) AS wrong
         FROM tense_attempt
        GROUP BY tense, person
       HAVING attempts >= 3 AND wrong > 0
        ORDER BY (CAST(wrong AS REAL) / attempts) DESC, attempts DESC
        LIMIT ?`,
    )
    .all(limit) as WeakCell[];
}
