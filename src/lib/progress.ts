import 'server-only';
import { db } from './queries';

/**
 * Aggregates for the home page.
 *
 * SPEC §8: the motivating mechanic for an adult with a certification date is
 * "visible convergence on a target", not streak anxiety. So the headline is
 * completion against the whole curriculum and time remaining against the exam —
 * the two numbers that actually move.
 */

/** SPEC header: CEFR B2 certification, Nov–Dec 2026. */
export const EXAM_DATE = '2026-12-01';

export interface Progress {
  masteredTopics: number;
  totalTopics: number;
  scheduledTotal: number;
  errorsLive: number;
  errorsResolved: number;
  errorsTotal: number;
  daysToExam: number;
  weeksToExam: number;
  byLevel: {
    level: string;
    total: number;
    mastered: number;
    inProgress: number;
    available: number;
    locked: number;
  }[];
}

export function progress(): Progress {
  const database = db();

  const topics = database
    .prepare(
      `SELECT count(*) AS total,
              sum(CASE WHEN s.status = 'mastered' THEN 1 ELSE 0 END) AS mastered,
              sum(CASE WHEN t.no_schedule = 0 THEN 1 ELSE 0 END) AS scheduled
         FROM topic t JOIN topic_state s ON s.topic_id = t.id`,
    )
    .get() as { total: number; mastered: number; scheduled: number };

  const errors = database
    .prepare(
      `SELECT count(*) AS total,
              sum(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
         FROM error`,
    )
    .get() as { total: number; resolved: number };

  const byLevel = database
    .prepare(
      `SELECT t.level_id AS level,
              count(*) AS total,
              sum(CASE WHEN s.status = 'mastered' THEN 1 ELSE 0 END) AS mastered,
              sum(CASE WHEN s.status IN ('studying','consolidating') THEN 1 ELSE 0 END) AS inProgress,
              sum(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) AS available,
              sum(CASE WHEN s.status = 'locked' THEN 1 ELSE 0 END) AS locked
         FROM topic t JOIN topic_state s ON s.topic_id = t.id
        GROUP BY t.level_id
        ORDER BY (SELECT ordinal FROM level WHERE id = t.level_id)`,
    )
    .all() as Progress['byLevel'];

  const days = Math.max(
    0,
    Math.ceil((new Date(EXAM_DATE).getTime() - Date.now()) / 86_400_000),
  );

  return {
    masteredTopics: topics.mastered,
    totalTopics: topics.total,
    scheduledTotal: topics.scheduled,
    errorsLive: errors.total - errors.resolved,
    errorsResolved: errors.resolved,
    errorsTotal: errors.total,
    daysToExam: days,
    weeksToExam: Math.ceil(days / 7),
    byLevel,
  };
}

export interface NextTopic {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  level_id: string;
  strand_en: string;
  strand_id: string;
  status: string;
  unlocks: number;
  summary: string;
}

/**
 * What to work on next.
 *
 * Ordered by leverage rather than by book order: an available topic that
 * unlocks four others is worth more than one that unlocks nothing, which is the
 * whole reason SPEC §3 specifies a graph instead of a list. Topics already in
 * progress come first — finishing beats starting. `no_schedule` topics are
 * excluded entirely (SPEC §10).
 */
export function nextUp(limit = 5): NextTopic[] {
  return db()
    .prepare(
      `SELECT t.id, t.slug, t.name_en, t.name_es, t.level_id, t.summary,
              st.name_en AS strand_en, t.strand_id, s.status,
              (SELECT count(*) FROM topic_prereq p WHERE p.prereq_id = t.id) AS unlocks
         FROM topic t
         JOIN topic_state s ON s.topic_id = t.id
         JOIN strand st ON st.id = t.strand_id
        WHERE s.status IN ('available','studying','consolidating')
          AND t.no_schedule = 0
        ORDER BY CASE s.status WHEN 'consolidating' THEN 0 WHEN 'studying' THEN 1 ELSE 2 END,
                 unlocks DESC,
                 (SELECT ordinal FROM level WHERE id = t.level_id) DESC
        LIMIT ?`,
    )
    .all(limit) as NextTopic[];
}

export interface TopError {
  code: string;
  label_en: string;
  wrong_example: string;
  right_example: string;
  severity: number;
  status: string;
  occurrences: number;
  clean_streak: number;
}

/** The errors a session would open on — §4's warm-up guarantee, surfaced. */
export function topErrors(limit = 5): TopError[] {
  return db()
    .prepare(
      `SELECT code, label_en, wrong_example, right_example, severity, status,
              occurrences, clean_streak
         FROM error
        WHERE status IN ('active','regressed')
        ORDER BY CASE status WHEN 'regressed' THEN 0 ELSE 1 END,
                 severity DESC, occurrences DESC
        LIMIT ?`,
    )
    .all(limit) as TopError[];
}
