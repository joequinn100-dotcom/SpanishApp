import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrate, openDatabase, type DB } from '@/db';
import {
  RestoreRefused,
  backup,
  inspect,
  listBackups,
  planRestore,
  restore,
  summarize,
  verify,
} from './backup';

/**
 * Tests for the one module whose failure mode is losing everything.
 *
 * These use real files on a real temp directory rather than `:memory:`,
 * because every bug this code can have is a file-level bug: an unflushed WAL,
 * a stale sidecar, an overwrite that should have been refused.
 */

let dir: string;
let live: string;

/** Only the migrations up to and including `upTo`, in a scratch directory. */
function migrationsUpTo(upTo: string): string {
  const out = join(mkdtempSync(join(tmpdir(), 'fluencia-mig-')), 'migrations');
  mkdirSync(out, { recursive: true });
  const src = join(process.cwd(), 'migrations');
  for (const f of readdirSync(src).filter((f) => f.endsWith('.sql')).sort()) {
    if (f > upTo) break;
    copyFileSync(join(src, f), join(out, f));
  }
  return out;
}

/** A database with some history in it, at a real path. */
function seededDb(path: string, attempts = 5, upTo?: string): DB {
  const db = openDatabase(path);
  migrate(db, upTo ? migrationsUpTo(upTo) : undefined);
  db.prepare("INSERT INTO level (id, ordinal) VALUES ('A1', 1)").run();
  db.prepare("INSERT INTO strand (id, name_en, name_es) VALUES ('verb','V','V')").run();
  db.prepare(
    `INSERT INTO topic (id, slug, name_en, name_es, level_id, strand_id, summary, search_terms)
     VALUES ('t','t','T','T','A1','verb','s','t')`,
  ).run();
  db.prepare(
    `INSERT INTO content (id, topic_id, kind, difficulty, payload, gauntlet_score,
                          gauntlet_log, verified_at)
     VALUES (1,'t','drill_cloze',2,'{}',8.5,'[]','2026-08-01T00:00:00.000Z')`,
  ).run();
  const s = db
    .prepare("INSERT INTO session (started_at, kind) VALUES ('2026-08-01T09:00:00.000Z','self_study')")
    .run();
  const ins = db.prepare(
    `INSERT INTO attempt (content_id, session_id, user_answer, correct, feedback, attempted_at)
     VALUES (1, ?, 'entregaba', 1, 'ok', '2026-08-01T09:0' || ? || ':00.000Z')`,
  );
  for (let i = 0; i < attempts; i++) ins.run(s.lastInsertRowid, i % 10);
  db.prepare(
    `INSERT INTO streak (id, current, longest, freezes, last_active)
     VALUES (1, 9, 12, 2, '2026-08-01T09:00:00.000Z')`,
  ).run();
  return db;
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'fluencia-backup-'));
  live = join(dir, 'data', 'fluencia.db');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('backing up', () => {
  it('captures writes still sitting in the WAL', () => {
    // The bug this whole module exists to avoid. In WAL mode a plain file copy
    // of fluencia.db leaves the most recent commits behind in fluencia.db-wal,
    // and the result opens cleanly while quietly missing the last sessions.
    const db = seededDb(live, 5);
    const out = join(dir, 'snap.db');
    backup(db, out);

    const naive = join(dir, 'naive.db');
    copyFileSync(live, naive); // what `cp fluencia.db` would give you
    db.close();

    expect(inspect(out).attempts).toBe(5);
    expect(inspect(naive).attempts).toBeLessThan(5);
  });

  it('writes one self-contained file, with no sidecars to forget', () => {
    const db = seededDb(live);
    const out = join(dir, 'snap.db');
    backup(db, out);
    db.close();

    expect(existsSync(`${out}-wal`)).toBe(false);
    expect(existsSync(`${out}-shm`)).toBe(false);
  });

  it('reads the backup back before claiming it worked', () => {
    const db = seededDb(live, 7);
    const r = backup(db, join(dir, 'snap.db'));
    db.close();

    expect(r.summary.attempts).toBe(7);
    expect(r.summary.streak).toBe(9);
    expect(r.summary.migrations.length).toBeGreaterThan(0);
    expect(r.bytes).toBeGreaterThan(0);
  });

  it('refuses to overwrite an existing backup', () => {
    const db = seededDb(live);
    const out = join(dir, 'snap.db');
    backup(db, out);
    expect(() => backup(db, out)).toThrow(/already exists/);
    db.close();
  });

  it('lists backups newest first', () => {
    const db = seededDb(live);
    const bdir = join(dir, 'backups');
    backup(db, join(bdir, 'fluencia-2026-08-01-09-00.db'));
    backup(db, join(bdir, 'fluencia-2026-08-05-09-00.db'));
    db.close();
    expect(listBackups(bdir)).toHaveLength(2);
  });
});

describe('verifying', () => {
  it('rejects a file that is not a database', () => {
    const junk = join(dir, 'notes.txt');
    writeFileSync(junk, 'these are my notes, not a database');
    expect(() => verify(junk)).toThrow();
  });

  it('rejects a database that is not Fluencia', () => {
    const other = join(dir, 'other.db');
    const db = openDatabase(other);
    db.exec('CREATE TABLE whatever (id INTEGER)');
    db.close();
    expect(() => verify(other)).toThrow(/not a Fluencia database/);
  });

  it('rejects a truncated backup', () => {
    const db = seededDb(live);
    const out = join(dir, 'snap.db');
    backup(db, out);
    db.close();
    writeFileSync(out, Buffer.from('SQLite format 3\0truncated rubbish'));
    expect(() => verify(out)).toThrow();
  });
});

describe('restoring — the new-laptop case', () => {
  it('restores onto a machine with no database at all', () => {
    const old = seededDb(join(dir, 'old.db'), 11);
    const snap = join(dir, 'snap.db');
    backup(old, snap);
    old.close();

    expect(existsSync(live)).toBe(false);
    const r = restore(snap, live);

    expect(r.summary.attempts).toBe(11);
    expect(r.summary.streak).toBe(9);
    expect(r.safetyCopy).toBeNull();

    // And the restored file is a working database, not just bytes on disk.
    const db = openDatabase(live);
    expect(summarize(db).attempts).toBe(11);
    db.close();
  });

  it('brings an older backup up to the current schema', () => {
    // A backup taken months ago must still open on today's build. Built by
    // migrating against only the migrations that existed then, so the file is
    // genuinely old rather than a current one with its ledger edited — the
    // schema and the ledger have to disagree in the same direction they would
    // in real life.
    const old = seededDb(join(dir, 'old.db'), 5, '006_transcript_dedup.sql');
    const snap = join(dir, 'snap.db');
    backup(old, snap);
    old.close();

    const plan = planRestore(snap, live);
    expect(plan.pendingMigrations.length).toBeGreaterThan(0);
    expect(plan.unknownMigrations).toEqual([]);

    const r = restore(snap, live);
    // The migrations that were missing have now been applied.
    expect(r.summary.migrations).toEqual(expect.arrayContaining(plan.pendingMigrations));
  });

  it('refuses a backup from a newer build of the app', () => {
    // The opposite direction, and the dangerous one: a schema this code does
    // not understand would fail later and further from the cause.
    const old = seededDb(join(dir, 'old.db'));
    old
      .prepare("INSERT INTO schema_migrations (name, applied_at) VALUES ('099_from_the_future.sql', 'x')")
      .run();
    const snap = join(dir, 'snap.db');
    backup(old, snap);
    old.close();

    expect(() => restore(snap, live)).toThrow(RestoreRefused);
    expect(() => restore(snap, live)).toThrow(/newer version/);
  });
});

describe('restoring — not destroying progress', () => {
  it('refuses to overwrite a database that has history', () => {
    const source = seededDb(join(dir, 'old.db'), 3);
    const snap = join(dir, 'snap.db');
    backup(source, snap);
    source.close();

    const current = seededDb(live, 40);
    current.close();

    expect(() => restore(snap, live)).toThrow(RestoreRefused);
    expect(() => restore(snap, live)).toThrow(/40 attempts/);

    // And it really did not touch it.
    const db = openDatabase(live);
    expect(summarize(db).attempts).toBe(40);
    db.close();
  });

  it('keeps the replaced database when forced, so a mistake is undoable', () => {
    const source = seededDb(join(dir, 'old.db'), 3);
    const snap = join(dir, 'snap.db');
    backup(source, snap);
    source.close();

    const current = seededDb(live, 40);
    current.close();

    const r = restore(snap, live, { force: true });
    expect(r.summary.attempts).toBe(3);
    expect(r.safetyCopy).not.toBeNull();
    // The 40 attempts that were replaced are still on disk, in full.
    expect(inspect(r.safetyCopy!).attempts).toBe(40);
  });

  it('does not leave the replaced database’s WAL beside the restored one', () => {
    // A stale -wal belongs to the file that was replaced. Leaving it would let
    // SQLite replay another database's pages into this one.
    const source = seededDb(join(dir, 'old.db'), 3);
    const snap = join(dir, 'snap.db');
    backup(source, snap);
    source.close();

    // Left open on purpose: the -wal only exists while something holds the
    // database, which is precisely when a restore is most likely to go wrong —
    // the dev server still running, or a previous run that crashed.
    const current = seededDb(live, 40);
    expect(readdirSync(join(dir, 'data')).some((f) => f.endsWith('-wal'))).toBe(true);
    restore(snap, live, { force: true });
    current.close();

    const db = openDatabase(live);
    expect(summarize(db).attempts).toBe(3); // not 40, and not a mixture
    db.close();
  });

  it('allows an unforced restore over an untouched database', () => {
    // A fresh install that has been opened once has tables but no history, and
    // making the user pass --force there would be noise.
    const source = seededDb(join(dir, 'old.db'), 6);
    const snap = join(dir, 'snap.db');
    backup(source, snap);
    source.close();

    const fresh = openDatabase(live);
    migrate(fresh);
    fresh.close();

    expect(planRestore(snap, live).targetHasProgress).toBe(false);
    expect(restore(snap, live).summary.attempts).toBe(6);
  });
});

describe('the round trip', () => {
  it('survives backup → restore with every counter intact', () => {
    const original = seededDb(join(dir, 'old.db'), 23);
    const before = summarize(original);
    const snap = join(dir, 'snap.db');
    backup(original, snap);
    original.close();

    const after = restore(snap, live).summary;

    expect(after.attempts).toBe(before.attempts);
    expect(after.sessions).toBe(before.sessions);
    expect(after.streak).toBe(before.streak);
    expect(after.topicsStudied).toBe(before.topicsStudied);
    expect(after.lastActivity).toBe(before.lastActivity);
  });
});
