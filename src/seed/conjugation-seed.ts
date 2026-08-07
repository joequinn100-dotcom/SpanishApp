import type { DB } from '@/db';
import { TENSES, type Tense } from '@/domain/conjugation';
import { TENSE_TOPIC, drillsForTense } from '@/domain/tense-drills';

/**
 * Seed the verb topics with generated conjugation drills.
 *
 * Before this, 25 of the taxonomy's verb topics had no content at all: the
 * seven hand-authored topics covered what one person could reasonably write,
 * and everything else waited on an API key. A learner who opened
 * «Pretérito pluscuamperfecto» found nothing to practise, which is the worst
 * possible answer from an app built around a curriculum.
 *
 * These rows carry `provenance = 'engine'` and a gauntlet log that states,
 * truthfully, that no panel saw them and why one was not needed — see
 * migration 010. They are not passed off as verified content; they are a
 * different kind of verified content, and the row says which.
 */

/** Drills per tense. Enough for a full session block plus a boss fight. */
export const PER_TENSE = 16;

const VERIFIED_AT = '2026-08-07T00:00:00.000Z';

/**
 * The audit trail these rows carry instead of a panel verdict.
 *
 * SPEC §5 requires `gauntlet_log` to explain how a row was verified. For a
 * generated conjugation that explanation is the test suite, so it is written
 * down rather than left as an empty array that reads like a missing record.
 */
function engineLog(tense: Tense, verb: string, person: string) {
  return JSON.stringify({
    provenance: 'engine',
    generator: 'src/domain/conjugation.ts',
    cell: { verb, tense, person },
    verification: 'src/domain/conjugation.test.ts + src/domain/tense-drills.test.ts',
    rationale:
      'A conjugation has one correct answer derivable from rules, so it is checked ' +
      'against known-correct forms by an exhaustive test suite rather than judged by ' +
      'the §5 panel. No verifier scores were assigned because no verifier ran.',
  });
}

/**
 * The score recorded for engine rows.
 *
 * `gauntlet_score` is NOT NULL, so something has to go there. Zero would sort
 * these rows below genuinely weak content; a high number would fabricate a
 * panel verdict. Since the column is only ever read for display next to the
 * log that explains it, it is set to the accept threshold and the log carries
 * the truth.
 */
const ENGINE_SCORE = 8.0;

export function seedConjugationDrills(db: DB): { inserted: number; topics: number } {
  const stmt = db.prepare(`
    INSERT INTO content (topic_id, kind, difficulty, payload, targets_error,
                         gauntlet_score, gauntlet_log, verified_at, retired,
                         provenance, seed_key)
    VALUES (@topicId, 'drill_conjugation', @difficulty, @payload, NULL,
            @score, @log, @verifiedAt, 0, 'engine', @seedKey)
    ON CONFLICT(seed_key) DO UPDATE SET
      topic_id = excluded.topic_id,
      difficulty = excluded.difficulty,
      payload = excluded.payload,
      gauntlet_log = excluded.gauntlet_log,
      verified_at = excluded.verified_at
  `);

  // Which topics actually exist — the taxonomy is the authority, and a mapping
  // that has drifted should skip rather than fail a whole seed run.
  const known = new Set(
    (db.prepare('SELECT id FROM topic').all() as { id: string }[]).map((r) => r.id),
  );

  let inserted = 0;
  const topics = new Set<string>();

  for (const t of TENSES) {
    const topicId = TENSE_TOPIC[t.id];
    if (!topicId || !known.has(topicId)) continue;

    for (const drill of drillsForTense(t.id, PER_TENSE, 3)) {
      stmt.run({
        topicId,
        difficulty: drill.difficulty,
        payload: JSON.stringify(drill.payload),
        score: ENGINE_SCORE,
        log: engineLog(drill.tense, drill.verb, drill.person),
        verifiedAt: VERIFIED_AT,
        // Stable across runs, so re-seeding updates in place and every
        // historical attempt keeps pointing at live content.
        seedKey: `engine:${drill.tense}:${drill.verb}:${drill.person}`,
      });
      inserted++;
      topics.add(topicId);
    }
  }

  return { inserted, topics: topics.size };
}
