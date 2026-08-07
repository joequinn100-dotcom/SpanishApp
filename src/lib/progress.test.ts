import { describe, expect, it } from 'vitest';
import { migrate, openDatabase } from '@/db';
import { seed, recomputeAvailability, TOPICS } from '@/seed';
import type { DB } from '@/db';

/**
 * The home page's numbers. These matter because they are the app's headline
 * claim about where the learner stands — a wrong denominator or a no_schedule
 * topic counted as work would misreport progress toward the exam.
 */
function fresh(): DB {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);
  return db;
}

const agg = (db: DB) =>
  db
    .prepare(
      `SELECT count(*) AS total,
              sum(CASE WHEN s.status='mastered' THEN 1 ELSE 0 END) AS mastered,
              sum(CASE WHEN t.no_schedule=0 THEN 1 ELSE 0 END) AS scheduled
         FROM topic t JOIN topic_state s ON s.topic_id=t.id`,
    )
    .get() as { total: number; mastered: number; scheduled: number };

const nextUp = (db: DB, limit = 5) =>
  db
    .prepare(
      `SELECT t.id, s.status,
              (SELECT count(*) FROM topic_prereq p WHERE p.prereq_id = t.id) AS unlocks
         FROM topic t JOIN topic_state s ON s.topic_id = t.id
        WHERE s.status IN ('available','studying','consolidating') AND t.no_schedule = 0
        ORDER BY CASE s.status WHEN 'consolidating' THEN 0 WHEN 'studying' THEN 1 ELSE 2 END,
                 unlocks DESC, (SELECT ordinal FROM level WHERE id=t.level_id) DESC
        LIMIT ?`,
    )
    .all(limit) as { id: string; status: string; unlocks: number }[];

describe('progress aggregates', () => {
  it('starts at zero mastered out of the full curriculum', () => {
    // Derived, not hard-coded: the curriculum grows whenever a book unit that
    // had no topic gets one, and a literal here would fail that as a
    // regression rather than reporting the real defect, which would be the
    // denominator drifting away from what was seeded.
    const db = fresh();
    const a = agg(db);
    expect(a.mastered).toBe(0);
    expect(a.total).toBe(TOPICS.length);
    db.close();
  });

  it('counts placed topics toward completion', () => {
    const db = fresh();
    const a1 = TOPICS.filter((t) => t.id.startsWith('a1.')).length;
    expect(a1).toBeGreaterThan(0);
    db.prepare("UPDATE topic_state SET status='mastered' WHERE topic_id LIKE 'a1.%'").run();
    expect(agg(db).mastered).toBe(a1);
    db.close();
  });

  it('excludes no_schedule topics from the schedulable total', () => {
    const db = fresh();
    const a = agg(db);
    expect(a.scheduled).toBeLessThan(a.total);
    db.close();
  });
});

describe('next-up recommendation', () => {
  it('never proposes a no_schedule topic', () => {
    const db = fresh();
    // Open everything so por/para would otherwise be a candidate.
    db.prepare("UPDATE topic_state SET status='available'").run();
    const ids = nextUp(db, 99).map((r) => r.id);
    expect(ids.filter((id) => id.includes('por_para'))).toEqual([]);
    db.close();
  });

  it('ranks higher-leverage topics first', () => {
    const db = fresh();
    const picks = nextUp(db, 5);
    expect(picks.length).toBeGreaterThan(0);
    // unlocks is non-increasing across the returned list
    const unlocks = picks.map((p) => p.unlocks);
    expect([...unlocks].sort((a, b) => b - a)).toEqual(unlocks);
    db.close();
  });

  it('puts work already in progress ahead of anything new', () => {
    const db = fresh();
    db.prepare("UPDATE topic_state SET status='studying' WHERE topic_id=?").run('a1.lex.rutina');
    // a1.lex.rutina unlocks nothing, so only the status ordering can surface it.
    expect(nextUp(db, 1)[0].id).toBe('a1.lex.rutina');
    db.close();
  });

  it('offers nothing once every open topic is mastered', () => {
    const db = fresh();
    db.prepare("UPDATE topic_state SET status='mastered'").run();
    recomputeAvailability(db);
    expect(nextUp(db)).toEqual([]);
    db.close();
  });
});
