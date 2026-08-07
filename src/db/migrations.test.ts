import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readdirSync, copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appliedMigrations, migrate, openDatabase, type DB } from '@/db';

const MIGRATIONS = join(process.cwd(), 'migrations');

/** A directory holding only the migrations up to and including `upTo`. */
function partialDir(upTo: string): string {
  const dir = join(mkdtempSync(join(tmpdir(), 'fluencia-mig-')), 'migrations');
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    if (f > upTo) break;
    copyFileSync(join(MIGRATIONS, f), join(dir, f));
  }
  return dir;
}

describe('the runner: rebuild migrations', () => {
  // A rebuild migration runs with foreign-key enforcement off, so the runner's
  // own `foreign_key_check` is the only thing standing between a botched
  // rebuild and a database full of orphans. It has to actually roll back.
  let db: DB;
  let dir: string;

  beforeEach(() => {
    db = openDatabase(':memory:');
    dir = partialDir('001_init.sql');
  });

  afterEach(() => db.close());

  it('rolls back a rebuild that orphans a row, and does not record it', () => {
    migrate(db, dir);
    db.prepare("INSERT INTO level (id, ordinal) VALUES ('A1', 1)").run();
    db.prepare("INSERT INTO strand (id, name_en, name_es) VALUES ('verb', 'V', 'V')").run();
    db.prepare(
      `INSERT INTO topic (id, slug, name_en, name_es, level_id, strand_id, summary, search_terms)
       VALUES ('t', 't', 'T', 'T', 'A1', 'verb', 's', 't')`,
    ).run();
    db.prepare(
      `INSERT INTO content (id, topic_id, kind, difficulty, payload,
                            gauntlet_score, gauntlet_log, verified_at)
       VALUES (1, 't', 'drill_cloze', 2, '{}', 8.0, '[]', 'x')`,
    ).run();

    // A rebuild that forgets to copy the rows across — the classic mistake.
    writeFileSync(
      join(dir, '999_botched.sql'),
      `-- fluencia:rebuild-tables
       CREATE TABLE topic_new (
         id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name_en TEXT NOT NULL,
         name_es TEXT NOT NULL, level_id TEXT NOT NULL REFERENCES level(id),
         strand_id TEXT NOT NULL REFERENCES strand(id), summary TEXT NOT NULL,
         book_ref TEXT, est_minutes INTEGER DEFAULT 25, search_terms TEXT NOT NULL,
         no_schedule INTEGER NOT NULL DEFAULT 0
       );
       DROP TABLE topic;
       ALTER TABLE topic_new RENAME TO topic;`,
    );

    expect(() => migrate(db, dir)).toThrow(/orphaned/);
    // Rolled back: the topic is still there, and so is the content pointing at it.
    expect(db.prepare('SELECT count(*) AS n FROM topic').get()).toEqual({ n: 1 });
    expect(db.prepare('SELECT count(*) AS n FROM content').get()).toEqual({ n: 1 });
    // And the ledger did not record it, so the next start retries rather than skips.
    expect(appliedMigrations(db).map((m) => m.name)).not.toContain('999_botched.sql');
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  it('leaves ordinary migrations under full enforcement', () => {
    writeFileSync(
      join(dir, '999_plain.sql'),
      `CREATE TABLE thing (id INTEGER PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topic(id));
       INSERT INTO thing (id, topic_id) VALUES (1, 'does-not-exist');`,
    );
    expect(() => migrate(db, dir)).toThrow(/FOREIGN KEY/);
  });
});

describe('007: rebuilding the session table', () => {
  // 007 widens session.kind, which SQLite can only do by rebuilding the table.
  // Running the whole migration set in one go always rebuilds an *empty*
  // table, so it proves nothing about the case that matters: an existing
  // database with sessions in it and four child tables pointing at them.
  let db: DB;

  beforeEach(() => {
    db = openDatabase(':memory:');
    migrate(db, partialDir('006_transcript_dedup.sql'));
  });

  afterEach(() => db.close());

  function seedSession(): number {
    // Migrations create the tables; seeding is a separate step, so the
    // reference rows this fixture needs have to be put there by hand.
    db.prepare("INSERT INTO level (id, ordinal) VALUES ('A1', 1)").run();
    db.prepare("INSERT INTO strand (id, name_en, name_es) VALUES ('verb', 'Verbs', 'Verbos')").run();
    db.prepare(
      `INSERT INTO topic (id, slug, name_en, name_es, level_id, strand_id, summary, search_terms)
       VALUES ('t', 't', 'T', 'T', 'A1', 'verb', 's', 't')`,
    ).run();
    db.prepare(
      `INSERT INTO content (id, topic_id, kind, difficulty, payload,
                            gauntlet_score, gauntlet_log, verified_at)
       VALUES (1, 't', 'drill_cloze', 2, '{}', 8.0, '[]', '2026-07-01T00:00:00.000Z')`,
    ).run();
    const s = db
      .prepare(
        `INSERT INTO session (started_at, kind, topics, xp_earned, plan_json, cursor)
         VALUES ('2026-07-01T09:00:00.000Z', 'self_study', '["t"]', 140, '{"items":[]}', 3)`,
      )
      .run();
    const id = Number(s.lastInsertRowid);
    db.prepare(
      `INSERT INTO attempt (content_id, session_id, user_answer, correct, feedback, attempted_at)
       VALUES (1, ?, 'la obra', 1, 'ok', '2026-07-01T09:05:00.000Z')`,
    ).run(id);
    db.prepare(
      "INSERT INTO xp_event (session_id, amount, reason, occurred_at) VALUES (?, 10, 't', '2026-07-01T09:05:00.000Z')",
    ).run(id);
    return id;
  }

  it('carries existing sessions across the rebuild intact', () => {
    const id = seedSession();
    migrate(db, MIGRATIONS);

    const row = db.prepare('SELECT * FROM session WHERE id = ?').get(id) as Record<string, unknown>;
    expect(row.kind).toBe('self_study');
    expect(row.xp_earned).toBe(140);
    expect(row.cursor).toBe(3);
    expect(row.plan_json).toBe('{"items":[]}');
    expect(row.topics).toBe('["t"]');
    expect(row.started_at).toBe('2026-07-01T09:00:00.000Z');
  });

  it('leaves the child rows still pointing at their session', () => {
    const id = seedSession();
    migrate(db, MIGRATIONS);

    expect(db.pragma('foreign_key_check')).toEqual([]);
    const a = db.prepare('SELECT session_id FROM attempt').get() as { session_id: number };
    expect(a.session_id).toBe(id);
    const x = db.prepare('SELECT session_id FROM xp_event').get() as { session_id: number };
    expect(x.session_id).toBe(id);
  });

  it('keeps the id sequence going rather than restarting it', () => {
    // A restarted AUTOINCREMENT would hand a new session the id of an old one,
    // and every attempt ever logged against the old one would silently join it.
    const id = seedSession();
    migrate(db, MIGRATIONS);
    const next = db
      .prepare("INSERT INTO session (started_at, kind) VALUES ('2026-08-07T09:00:00.000Z','boss')")
      .run();
    expect(Number(next.lastInsertRowid)).toBeGreaterThan(id);
  });

  it('accepts the two new session kinds and still rejects nonsense', () => {
    migrate(db, MIGRATIONS);
    for (const kind of ['self_study', 'transcript_review', 'exam_sim', 'boss', 'sprint']) {
      expect(() =>
        db.prepare('INSERT INTO session (started_at, kind) VALUES (?, ?)').run('2026-08-07T09:00:00.000Z', kind),
      ).not.toThrow();
    }
    expect(() =>
      db.prepare('INSERT INTO session (started_at, kind) VALUES (?, ?)').run('2026-08-07T09:00:00.000Z', 'nonsense'),
    ).toThrow();
  });

  it('restores foreign-key enforcement afterwards', () => {
    // The runner switches enforcement off for a rebuild migration. If it ever
    // failed to switch it back, every REFERENCES in the schema would quietly
    // become decoration for the rest of the process's life.
    migrate(db, MIGRATIONS);
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(() =>
      db
        .prepare("INSERT INTO boss_attempt (session_id, topic_id, started_at) VALUES (999, 'nope', 'x')")
        .run(),
    ).toThrow();
  });

  it('rebuilds the open-session index the rebuild dropped', () => {
    migrate(db, MIGRATIONS);
    const idx = db.pragma('index_list(session)') as { name: string }[];
    expect(idx.map((i) => i.name)).toContain('idx_session_open');
  });
});
