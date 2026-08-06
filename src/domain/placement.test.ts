import { describe, expect, it } from 'vitest';
import { migrate, openDatabase, tx } from '@/db';
import { recomputeAvailability, seed } from '@/seed';
import type { DB } from '@/db';

/**
 * Placement writes mastery state directly, bypassing SPEC §4's evidence gate.
 * These tests pin the two properties that keeps honest: it unlocks correctly,
 * and it stays distinguishable from mastery that was actually earned.
 */
function fresh(): DB {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);
  return db;
}

const place = (db: DB, ids: string[], status: string) =>
  tx(db, () => {
    const now = '2026-08-06T12:00:00.000Z';
    const mastered = status === 'mastered' ? 1 : 0;
    const stmt = db.prepare(
      `UPDATE topic_state
          SET status = ?, mastered_at = CASE WHEN ? = 1 THEN COALESCE(mastered_at, ?) ELSE NULL END,
              placed_manually = ?, placed_at = CASE WHEN ? = 1 THEN ? ELSE placed_at END
        WHERE topic_id = ?`,
    );
    for (const id of ids) stmt.run(status, mastered, now, mastered, mastered, now, id);
    recomputeAvailability(db);
  });

const statusOf = (db: DB, id: string) =>
  (db.prepare('SELECT status FROM topic_state WHERE topic_id = ?').get(id) as { status: string })
    .status;

describe('placement', () => {
  it('unlocks the chain behind a placed topic', () => {
    const db = fresh();
    expect(statusOf(db, 'b2.mood.subj_imperfecto')).toBe('locked');

    place(db, [
      'a2.verb.preterito_regular', 'b1.verb.preterito',
      'a1.verb.presente_regular', 'b1.mood.subj_presente',
    ], 'mastered');

    expect(statusOf(db, 'b2.mood.subj_imperfecto')).toBe('available');
    // But not the topic two steps out — si_hipotetico still needs the imperfect
    // subjunctive itself.
    expect(statusOf(db, 'b2.mood.si_hipotetico')).toBe('locked');
    db.close();
  });

  it('cascades a whole level without unlocking beyond the graph', () => {
    const db = fresh();
    const a1 = (db.prepare("SELECT id FROM topic WHERE level_id='A1'").all() as { id: string }[])
      .map((r) => r.id);
    place(db, a1, 'mastered');
    // A2 topics gated only on A1 open up...
    expect(statusOf(db, 'a2.verb.preterito_regular')).toBe('available');
    // ...C-level stays shut.
    expect(statusOf(db, 'c2.prof.registro_legal')).toBe('locked');
    db.close();
  });

  it('keeps placed mastery distinguishable from earned mastery', () => {
    const db = fresh();
    place(db, ['a1.noun.genero'], 'mastered');
    // Earned mastery, written the way the drill runner will write it.
    db.prepare(
      "UPDATE topic_state SET status='mastered', mastered_at=? WHERE topic_id=?",
    ).run('2026-08-06T12:00:00.000Z', 'a1.noun.plurales');

    const rows = db
      .prepare(
        "SELECT topic_id, placed_manually FROM topic_state WHERE topic_id IN ('a1.noun.genero','a1.noun.plurales')",
      )
      .all() as { topic_id: string; placed_manually: number }[];
    const flags = Object.fromEntries(rows.map((r) => [r.topic_id, r.placed_manually]));
    expect(flags['a1.noun.genero']).toBe(1);
    expect(flags['a1.noun.plurales']).toBe(0);
    db.close();
  });

  it('clearing placement relocks what depended on it', () => {
    const db = fresh();
    place(db, [
      'a2.verb.preterito_regular', 'b1.verb.preterito',
      'a1.verb.presente_regular', 'b1.mood.subj_presente',
    ], 'mastered');
    expect(statusOf(db, 'b2.mood.subj_imperfecto')).toBe('available');

    // Reset everything, then recompute — the graph decides again.
    tx(db, () => {
      db.prepare(
        "UPDATE topic_state SET status='locked', mastered_at=NULL, placed_manually=0",
      ).run();
      recomputeAvailability(db);
    });
    expect(statusOf(db, 'b2.mood.subj_imperfecto')).toBe('locked');
    db.close();
  });

  it('migration 002 is applied and idempotent', () => {
    const db = openDatabase(':memory:');
    const first = migrate(db);
    expect(first).toContain('002_placement.sql');
    expect(migrate(db)).toEqual([]); // nothing pending on a second run
    db.close();
  });
});
