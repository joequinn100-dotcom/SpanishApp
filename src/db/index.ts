import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * The database is the product; the UI is a window onto it (SPEC §1).
 *
 * One connection per process, opened lazily. Next.js dev-mode hot reload
 * re-evaluates modules, so the handle is parked on globalThis — otherwise every
 * edit leaks a file handle and WAL readers pile up until SQLite refuses.
 */

const DEFAULT_PATH = join(process.cwd(), 'data', 'fluencia.db');
const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

export type DB = Database.Database;

declare global {
  // eslint-disable-next-line no-var
  var __fluencia_db: DB | undefined;
}

export function openDatabase(file: string = DEFAULT_PATH): DB {
  mkdirSync(dirname(file), { recursive: true });
  const db = new Database(file);
  // WAL lets a read (a page render) proceed while a write (an attempt) commits.
  db.pragma('journal_mode = WAL');
  // Off by default in SQLite. Without this every REFERENCES in the schema is
  // decoration, and a drill could point at a topic that no longer exists.
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  return db;
}

export function getDb(): DB {
  if (!globalThis.__fluencia_db) {
    const db = openDatabase();
    migrate(db);
    globalThis.__fluencia_db = db;
  }
  return globalThis.__fluencia_db;
}

/* ------------------------------------------------------------------ *
 * Migrations
 * ------------------------------------------------------------------ */

export interface AppliedMigration {
  name: string;
  applied_at: string;
}

/**
 * Runs every .sql file in ./migrations in lexical order, once each, inside a
 * transaction per file. A migration that throws rolls back and leaves the
 * ledger untouched, so the next start retries it rather than skipping it.
 */
export function migrate(db: DB, dir: string = MIGRATIONS_DIR): string[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  if (!existsSync(dir)) return [];

  const applied = new Set(
    db.prepare('SELECT name FROM schema_migrations').all().map((r) => (r as { name: string }).name),
  );

  const pending = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .filter((f) => !applied.has(f));

  const record = db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)');

  for (const file of pending) {
    const sql = readFileSync(join(dir, file), 'utf8');
    // better-sqlite3 cannot run `exec` inside its own transaction() wrapper when
    // the SQL contains its own BEGIN, so migrations must not declare one.
    if (/^\s*BEGIN\b/im.test(sql)) {
      throw new Error(`Migration ${file} declares its own transaction; the runner owns that.`);
    }
    const run = db.transaction(() => {
      db.exec(sql);
      record.run(file, new Date().toISOString());
    });
    run();
  }

  return pending;
}

export function appliedMigrations(db: DB): AppliedMigration[] {
  return db
    .prepare('SELECT name, applied_at FROM schema_migrations ORDER BY name')
    .all() as AppliedMigration[];
}

/** Wrap a unit of work in a transaction. Every write path goes through this. */
export function tx<T>(db: DB, fn: () => T): T {
  return db.transaction(fn)();
}
