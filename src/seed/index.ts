import type { DB } from '@/db';
import { tx } from '@/db';
import { A_TOPICS } from './topics-foundations';
import { B_TOPICS } from './topics-breakthrough';
import { C_TOPICS } from './topics-mastery';
import { PREREQS } from './prereqs';
import { ERRORS } from './errors';
import { ERROR_DRILLS } from './drills-errors';
import { TOPIC_DRILLS } from './drills-topics';
import { LEVELS, STRANDS, type SeedTopic, type SeedDrill } from './types';

export const TOPICS: SeedTopic[] = [...A_TOPICS, ...B_TOPICS, ...C_TOPICS];
export const DRILLS: SeedDrill[] = [...ERROR_DRILLS, ...TOPIC_DRILLS];
export { PREREQS, ERRORS, LEVELS, STRANDS };

export function slugify(id: string): string {
  return id.replace(/\./g, '-');
}

/**
 * Seed is idempotent: re-running replaces curriculum rows and leaves user state
 * (topic_state counters, error counters, attempts) untouched. That matters
 * because the seed will be re-run whenever the topic list grows — for example
 * when the remaining book units are expanded into migration 002.
 */
/**
 * Stable identity for an authored drill.
 *
 * The index is part of the key deliberately. Keying on the sentence alone would
 * mean that editing a typo orphans the old row and its attempt history; keying
 * on position means an edit updates the row in place. The cost is that
 * reordering the arrays reshuffles identities, so drills are appended, never
 * inserted in the middle.
 */
export function drillKey(d: SeedDrill, index: number): string {
  return `${d.topicId}#${d.targetsError ?? 'topic'}#${index}`;
}

export function seed(db: DB): {
  topics: number;
  prereqs: number;
  errors: number;
  drills: number;
} {
  return tx(db, () => {
    const level = db.prepare('INSERT OR REPLACE INTO level (id, ordinal) VALUES (?, ?)');
    for (const l of LEVELS) level.run(l.id, l.ordinal);

    const strand = db.prepare(
      'INSERT OR REPLACE INTO strand (id, name_en, name_es) VALUES (?, ?, ?)',
    );
    for (const s of STRANDS) strand.run(s.id, s.nameEn, s.nameEs);

    const topic = db.prepare(`
      INSERT INTO topic (id, slug, name_en, name_es, level_id, strand_id, summary,
                         book_ref, est_minutes, search_terms, no_schedule)
      VALUES (@id, @slug, @nameEn, @nameEs, @level, @strand, @summary,
              @bookRef, @estMinutes, @searchTerms, @noSchedule)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug, name_en = excluded.name_en, name_es = excluded.name_es,
        level_id = excluded.level_id, strand_id = excluded.strand_id,
        summary = excluded.summary, book_ref = excluded.book_ref,
        est_minutes = excluded.est_minutes, search_terms = excluded.search_terms,
        no_schedule = excluded.no_schedule
    `);
    // topic_state is created once and never overwritten — it holds real progress.
    const state = db.prepare(
      'INSERT OR IGNORE INTO topic_state (topic_id, status) VALUES (?, ?)',
    );

    for (const t of TOPICS) {
      topic.run({
        id: t.id,
        slug: slugify(t.id),
        nameEn: t.nameEn,
        nameEs: t.nameEs,
        level: t.level,
        strand: t.strand,
        summary: t.summary,
        bookRef: t.bookRef,
        estMinutes: t.estMinutes ?? 25,
        searchTerms: t.searchTerms,
        noSchedule: t.noSchedule ? 1 : 0,
      });
      state.run(t.id, 'locked');
    }

    db.prepare('DELETE FROM topic_prereq').run();
    const prereq = db.prepare(
      'INSERT INTO topic_prereq (topic_id, prereq_id, strength) VALUES (?, ?, ?)',
    );
    for (const p of PREREQS) prereq.run(p.topic, p.prereq, p.strength);

    const error = db.prepare(`
      INSERT INTO error (code, label_en, wrong_example, right_example, rule, topic_id,
                         severity, status, first_logged, occurrences, clean_streak,
                         spontaneous_ok, resolved_at)
      VALUES (@code, @labelEn, @wrong, @right, @rule, @topicId, @severity, @status,
              @firstLogged, @occurrences, 0, 0, @resolvedAt)
      ON CONFLICT(code) DO UPDATE SET
        label_en = excluded.label_en, wrong_example = excluded.wrong_example,
        right_example = excluded.right_example, rule = excluded.rule,
        topic_id = excluded.topic_id, severity = excluded.severity
    `);
    const now = new Date().toISOString();
    for (const e of ERRORS) {
      error.run({
        code: e.code,
        labelEn: e.labelEn,
        wrong: e.wrong,
        right: e.right,
        rule: e.rule,
        topicId: e.topicId,
        severity: e.severity,
        status: e.status,
        firstLogged: now,
        occurrences: e.occurrences,
        resolvedAt: e.status === 'resolved' ? now : null,
      });
    }

    // Authored drills (see SeedDrill). `attempt` rows reference content.id, so
    // re-seeding must never delete and reinsert — it updates in place, keyed by
    // seed_key, which keeps every historical attempt pointing at live content.
    const drill = db.prepare(`
      INSERT INTO content (topic_id, kind, difficulty, payload, targets_error,
                           gauntlet_score, gauntlet_log, verified_at, retired,
                           provenance, seed_key)
      VALUES (@topicId, @kind, @difficulty, @payload, @targetsError,
              0, @log, @verifiedAt, 0, 'authored', @seedKey)
      ON CONFLICT(seed_key) DO UPDATE SET
        topic_id = excluded.topic_id, kind = excluded.kind,
        difficulty = excluded.difficulty, payload = excluded.payload,
        targets_error = excluded.targets_error
    `);
    const log = JSON.stringify({
      rounds: [],
      note: 'Authored, not gauntlet-verified. Verified by the seed test suite only.',
    });
    for (const [i, d] of DRILLS.entries()) {
      drill.run({
        topicId: d.topicId,
        kind: d.kind,
        difficulty: d.difficulty,
        payload: JSON.stringify(d.payload),
        targetsError: d.targetsError,
        log,
        verifiedAt: now,
        seedKey: drillKey(d, i),
      });
    }

    recomputeAvailability(db);

    return {
      topics: TOPICS.length,
      prereqs: PREREQS.length,
      errors: ERRORS.length,
      drills: DRILLS.length,
    };
  });
}

/**
 * Unlock every `locked` topic whose hard prerequisites are all mastered.
 * A topic with no hard prerequisites is available from the start — that is what
 * makes the graph produce a starting point rather than a deadlock.
 *
 * Called after seeding and after any mastery change.
 */
export function recomputeAvailability(db: DB): number {
  const rows = db
    .prepare(
      `SELECT t.id AS id
         FROM topic t
         JOIN topic_state s ON s.topic_id = t.id
        WHERE s.status = 'locked'
          AND NOT EXISTS (
            SELECT 1
              FROM topic_prereq p
              JOIN topic_state ps ON ps.topic_id = p.prereq_id
             WHERE p.topic_id = t.id
               AND p.strength = 'hard'
               AND ps.status <> 'mastered'
          )`,
    )
    .all() as { id: string }[];

  const unlock = db.prepare("UPDATE topic_state SET status = 'available' WHERE topic_id = ?");
  for (const r of rows) unlock.run(r.id);
  return rows.length;
}
