import 'server-only';
import { getDb } from '@/db';
import { seed } from '@/seed';
import type { SearchDoc } from './search';

/**
 * Read helpers for the server components. Every one of these reads from SQLite —
 * nothing derives learning state from anywhere else (SPEC §1).
 */

let seeded = false;

/** Migrations run on first connection; seeding runs once if the DB is empty. */
export function db() {
  const database = getDb();
  if (!seeded) {
    const n = database.prepare('SELECT count(*) AS n FROM topic').get() as { n: number };
    if (n.n === 0) seed(database);
    seeded = true;
  }
  return database;
}

export interface TopicRow {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  level_id: string;
  strand_id: string;
  strand_en: string;
  summary: string;
  book_ref: string | null;
  est_minutes: number;
  search_terms: string;
  no_schedule: number;
  status: string;
  accuracy: number;
  attempts: number;
  correct: number;
  spontaneous: number;
  reviews_passed: number;
}

const TOPIC_SELECT = `
  SELECT t.*, s.status, s.accuracy, s.attempts, s.correct, s.spontaneous,
         s.reviews_passed, st.name_en AS strand_en
    FROM topic t
    JOIN topic_state s ON s.topic_id = t.id
    JOIN strand st ON st.id = t.strand_id
`;

export function allTopics(): TopicRow[] {
  return db()
    .prepare(`${TOPIC_SELECT} ORDER BY t.level_id, t.strand_id, t.id`)
    .all() as TopicRow[];
}

export function topicBySlug(slug: string): TopicRow | undefined {
  return db().prepare(`${TOPIC_SELECT} WHERE t.slug = ?`).get(slug) as TopicRow | undefined;
}

export interface RelatedTopic {
  id: string;
  slug: string;
  name_en: string;
  level_id: string;
  status: string;
  strength: string;
}

/** What this topic needs before it unlocks. */
export function prerequisitesOf(topicId: string): RelatedTopic[] {
  return db()
    .prepare(
      `SELECT t.id, t.slug, t.name_en, t.level_id, s.status, p.strength
         FROM topic_prereq p
         JOIN topic t ON t.id = p.prereq_id
         JOIN topic_state s ON s.topic_id = t.id
        WHERE p.topic_id = ?
        ORDER BY p.strength DESC, t.level_id`,
    )
    .all(topicId) as RelatedTopic[];
}

/** What unlocks once this topic is mastered — the "why this matters next" view. */
export function dependentsOf(topicId: string): RelatedTopic[] {
  return db()
    .prepare(
      `SELECT t.id, t.slug, t.name_en, t.level_id, s.status, p.strength
         FROM topic_prereq p
         JOIN topic t ON t.id = p.topic_id
         JOIN topic_state s ON s.topic_id = t.id
        WHERE p.prereq_id = ?
        ORDER BY p.strength DESC, t.level_id`,
    )
    .all(topicId) as RelatedTopic[];
}

export interface ErrorRow {
  id: number;
  code: string;
  label_en: string;
  wrong_example: string;
  right_example: string;
  rule: string;
  topic_id: string | null;
  severity: number;
  status: string;
  occurrences: number;
  clean_streak: number;
  spontaneous_ok: number;
  last_occurred: string | null;
}

export function allErrors(): ErrorRow[] {
  return db()
    .prepare(
      `SELECT * FROM error
        ORDER BY CASE status
                   WHEN 'regressed' THEN 0 WHEN 'active' THEN 1
                   WHEN 'improving' THEN 2 WHEN 'consolidating' THEN 3 ELSE 4 END,
                 severity DESC, occurrences DESC`,
    )
    .all() as ErrorRow[];
}

export function errorsForTopic(topicId: string): ErrorRow[] {
  return db()
    .prepare('SELECT * FROM error WHERE topic_id = ? ORDER BY severity DESC')
    .all(topicId) as ErrorRow[];
}

export function errorByCode(code: string): ErrorRow | undefined {
  return db().prepare('SELECT * FROM error WHERE code = ?').get(code) as ErrorRow | undefined;
}

/** The whole search corpus, small enough to ship to the client in one payload. */
export function searchIndex(): SearchDoc[] {
  const topics = allTopics().map<SearchDoc>((t) => ({
    id: t.id,
    kind: 'topic',
    title: t.name_en,
    subtitle: t.name_es,
    terms: t.search_terms,
    status: t.status,
    href: `/topics/${t.slug}`,
    level: t.level_id,
  }));
  const errors = allErrors().map<SearchDoc>((e) => ({
    id: e.code,
    kind: 'error',
    title: e.label_en,
    subtitle: `${e.wrong_example} → ${e.right_example}`,
    terms: `${e.code}|${e.wrong_example}|${e.right_example}`,
    status: e.status,
    href: `/errors#${e.code}`,
  }));
  return [...topics, ...errors];
}

export interface CurriculumStats {
  byLevel: { level: string; total: number; mastered: number; available: number; locked: number }[];
  errorsActive: number;
  errorsResolved: number;
  topicsTotal: number;
}

export function curriculumStats(): CurriculumStats {
  const byLevel = db()
    .prepare(
      `SELECT t.level_id AS level,
              count(*) AS total,
              sum(CASE WHEN s.status = 'mastered' THEN 1 ELSE 0 END) AS mastered,
              sum(CASE WHEN s.status IN ('available','studying','consolidating') THEN 1 ELSE 0 END) AS available,
              sum(CASE WHEN s.status = 'locked' THEN 1 ELSE 0 END) AS locked
         FROM topic t JOIN topic_state s ON s.topic_id = t.id
        GROUP BY t.level_id
        ORDER BY (SELECT ordinal FROM level WHERE id = t.level_id)`,
    )
    .all() as CurriculumStats['byLevel'];

  const counts = db()
    .prepare(
      `SELECT sum(CASE WHEN status IN ('active','regressed') THEN 1 ELSE 0 END) AS active,
              sum(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
         FROM error`,
    )
    .get() as { active: number; resolved: number };

  return {
    byLevel,
    errorsActive: counts.active,
    errorsResolved: counts.resolved,
    topicsTotal: byLevel.reduce((n, l) => n + l.total, 0),
  };
}
