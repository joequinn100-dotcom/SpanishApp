import 'server-only';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import Database from 'better-sqlite3';
import { migrate, openDatabase, type DB } from '@/db';

/**
 * Backup and restore.
 *
 * SPEC §1 says the database is the product. It is also, on a single-user local
 * app, the only copy — `data/` is gitignored on purpose, because a learning
 * record full of the user's own transcripts has no business on GitHub. The
 * consequence is that nothing else backs it up, and by exam day the file holds
 * months of attempts, error history and spaced-review schedules that cannot be
 * reconstructed from anything.
 *
 * Two rules shape everything here:
 *
 * 1. A backup taken while the app is running must be *consistent*. Copying
 *    `fluencia.db` with `cp` does not do that — the database runs in WAL mode,
 *    so recent commits live in `fluencia.db-wal` and a naive copy silently
 *    loses them. `VACUUM INTO` writes a fully checkpointed, single-file
 *    snapshot with no sidecars, which is also what makes it safe to hand to
 *    another machine.
 *
 * 2. A restore must never be able to destroy progress. It refuses to overwrite
 *    a database that has history unless told twice, and it always copies the
 *    current file aside first — so even the forced path is undoable.
 */

export const BACKUP_DIR = join(process.cwd(), 'backups');

/* ------------------------------------------------------------------ *
 * What is in there
 * ------------------------------------------------------------------ */

export interface BackupSummary {
  /** Migrations the file has had applied — its schema version. */
  migrations: string[];
  attempts: number;
  sessions: number;
  topicsMastered: number;
  topicsStudied: number;
  errorsLive: number;
  errorsResolved: number;
  transcripts: number;
  vocabReviews: number;
  xp: number;
  streak: number;
  lastActivity: string | null;
}

/** Count a table that may not exist yet in an older backup. */
function count(db: DB, sql: string): number {
  try {
    return (db.prepare(sql).get() as { n: number }).n;
  } catch {
    return 0;
  }
}

export function summarize(db: DB): BackupSummary {
  const migrations = (() => {
    try {
      return (db.prepare('SELECT name FROM schema_migrations ORDER BY name').all() as {
        name: string;
      }[]).map((r) => r.name);
    } catch {
      return [];
    }
  })();

  const streakRow = (() => {
    try {
      return db.prepare('SELECT current, last_active FROM streak WHERE id = 1').get() as
        | { current: number; last_active: string | null }
        | undefined;
    } catch {
      return undefined;
    }
  })();

  const lastAttempt = (() => {
    try {
      return (
        db.prepare('SELECT max(attempted_at) AS t FROM attempt').get() as { t: string | null }
      ).t;
    } catch {
      return null;
    }
  })();

  return {
    migrations,
    attempts: count(db, 'SELECT count(*) AS n FROM attempt'),
    sessions: count(db, 'SELECT count(*) AS n FROM session'),
    topicsMastered: count(db, "SELECT count(*) AS n FROM topic_state WHERE status = 'mastered'"),
    topicsStudied: count(db, 'SELECT count(*) AS n FROM topic_state WHERE attempts > 0'),
    errorsLive: count(db, "SELECT count(*) AS n FROM error WHERE status <> 'resolved'"),
    errorsResolved: count(db, "SELECT count(*) AS n FROM error WHERE status = 'resolved'"),
    transcripts: count(db, 'SELECT count(*) AS n FROM transcript'),
    vocabReviews: count(db, 'SELECT count(*) AS n FROM vocab_review'),
    xp: count(db, 'SELECT COALESCE(sum(amount), 0) AS n FROM xp_event'),
    streak: streakRow?.current ?? 0,
    lastActivity: lastAttempt ?? streakRow?.last_active ?? null,
  };
}

/** Open a backup file read-only and describe it, without touching it. */
export function inspect(file: string): BackupSummary {
  const db = new Database(file, { readonly: true, fileMustExist: true });
  try {
    return summarize(db as unknown as DB);
  } finally {
    db.close();
  }
}

/* ------------------------------------------------------------------ *
 * Backing up
 * ------------------------------------------------------------------ */

export function defaultBackupName(now = new Date()): string {
  return `fluencia-${stamp(now)}.db`;
}

export interface BackupResult {
  path: string;
  bytes: number;
  summary: BackupSummary;
}

/**
 * Write a consistent snapshot.
 *
 * `VACUUM INTO` rather than a file copy or `db.backup()`: it checkpoints the
 * WAL into the output, compacts free pages, and produces one self-contained
 * file with no `-wal` or `-shm` sidecar to forget. That last part is what makes
 * the result safe to AirDrop to a new laptop — a copied `fluencia.db` without
 * its `-wal` is a database missing its most recent sessions, and it will open
 * without complaint.
 */
export function backup(db: DB, outPath?: string): BackupResult {
  const path = outPath ?? join(BACKUP_DIR, defaultBackupName());
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) {
    throw new Error(`${path} already exists. Refusing to overwrite a backup.`);
  }

  // SQLite will not VACUUM INTO a path it cannot create, and it will not
  // overwrite. Both are the behaviour we want, so the error is passed through.
  db.prepare('VACUUM INTO ?').run(path);

  // Verify what was just written rather than trusting that it worked. A backup
  // is only worth having if it has been read back at least once.
  const summary = verify(path);
  return { path, bytes: statSync(path).size, summary };
}

/**
 * Read a backup back and check it is sound.
 *
 * Called on every backup as it is taken. An unverified backup is a guess, and
 * the moment you find out is the moment you needed it.
 */
export function verify(file: string): BackupSummary {
  if (!existsSync(file)) throw new Error(`No such backup: ${file}`);
  const db = new Database(file, { readonly: true, fileMustExist: true });
  try {
    const check = db.pragma('integrity_check', { simple: true });
    if (check !== 'ok') throw new Error(`Backup failed its integrity check: ${String(check)}`);
    const summary = summarize(db as unknown as DB);
    if (summary.migrations.length === 0) {
      throw new Error('That file has no schema_migrations table — it is not a Fluencia database.');
    }
    return summary;
  } finally {
    db.close();
  }
}

export interface BackupFile {
  path: string;
  name: string;
  bytes: number;
  modified: string;
}

export function listBackups(dir = BACKUP_DIR): BackupFile[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.db'))
    .map((name) => {
      const path = join(dir, name);
      const st = statSync(path);
      return { path, name, bytes: st.size, modified: st.mtime.toISOString() };
    })
    .sort((a, b) => b.modified.localeCompare(a.modified));
}

/* ------------------------------------------------------------------ *
 * Restoring
 * ------------------------------------------------------------------ */

/** Migration filenames this build of the app knows how to apply. */
export function knownMigrations(dir = join(process.cwd(), 'migrations')): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
}

export interface RestorePlan {
  source: string;
  target: string;
  sourceSummary: BackupSummary;
  /** Null when the target does not exist yet — the new-laptop case. */
  targetSummary: BackupSummary | null;
  /** Migrations in the backup that this build does not have. */
  unknownMigrations: string[];
  /** Migrations this build will apply to the backup after restoring. */
  pendingMigrations: string[];
  /** True when the target holds work that a restore would replace. */
  targetHasProgress: boolean;
}

export function planRestore(source: string, target: string): RestorePlan {
  const sourceSummary = verify(source);
  const known = knownMigrations();

  // A backup from a *newer* build carries migrations this code cannot
  // understand. Restoring it would leave the app reading a schema it does not
  // know, which fails later and further from the cause. Refusing is the whole
  // point of recording the migration ledger inside the database.
  const unknownMigrations = sourceSummary.migrations.filter((m) => !known.includes(m));
  const pendingMigrations = known.filter((m) => !sourceSummary.migrations.includes(m));

  let targetSummary: BackupSummary | null = null;
  if (existsSync(target)) {
    const db = new Database(target, { readonly: true, fileMustExist: true });
    try {
      targetSummary = summarize(db as unknown as DB);
    } finally {
      db.close();
    }
  }

  return {
    source,
    target,
    sourceSummary,
    targetSummary,
    unknownMigrations,
    pendingMigrations,
    targetHasProgress:
      targetSummary !== null &&
      (targetSummary.attempts > 0 ||
        targetSummary.transcripts > 0 ||
        targetSummary.vocabReviews > 0),
  };
}

export class RestoreRefused extends Error {}

export interface RestoreResult {
  plan: RestorePlan;
  /** Where the replaced database was moved, when there was one. */
  safetyCopy: string | null;
  summary: BackupSummary;
}

/**
 * Replace the live database with a backup.
 *
 * Deliberately awkward when it would destroy something. `force` is required to
 * overwrite a database that already holds attempts, and even then the current
 * file is copied aside first — a restore that turns out to have been the wrong
 * file is recoverable, because the one thing this app cannot do is lose the
 * learning record.
 */
export function restore(
  source: string,
  target: string,
  opts: { force?: boolean; now?: () => Date } = {},
): RestoreResult {
  const { force = false, now = () => new Date() } = opts;
  const plan = planRestore(source, target);

  if (plan.unknownMigrations.length > 0) {
    throw new RestoreRefused(
      `That backup is from a newer version of Fluencia. It has migrations this build does not know: ` +
        `${plan.unknownMigrations.join(', ')}. Update the app first, then restore.`,
    );
  }

  if (plan.targetHasProgress && !force) {
    const t = plan.targetSummary!;
    throw new RestoreRefused(
      `${target} already holds ${t.attempts} attempts and ${t.transcripts} transcripts. ` +
        `Restoring would replace them. Back it up first, then pass --force if you are sure.`,
    );
  }

  mkdirSync(dirname(target), { recursive: true });

  // The safety copy goes through VACUUM INTO too, so it is a real snapshot of
  // the target rather than a WAL-less fragment of it.
  //
  // It lands beside the database it replaced, not in a global backups
  // directory. Two reasons: it belongs to that database and should travel with
  // it, and a fixed path derived from the working directory means anything
  // restoring a database elsewhere — a test, a second profile, a copy on an
  // external disk — quietly writes into the main one.
  let safetyCopy: string | null = null;
  if (existsSync(target)) {
    safetyCopy = uniquePath(join(dirname(target), `replaced-${stamp(now())}.db`));
    const current = openDatabase(target);
    try {
      current.prepare('VACUUM INTO ?').run(safetyCopy);
    } finally {
      current.close();
    }
  }

  // Sidecars belong to the file being replaced. Leaving a stale `-wal` next to
  // a restored database would let SQLite replay another database's pages into
  // it — silent, and catastrophic.
  for (const suffix of ['', '-wal', '-shm']) {
    const f = `${target}${suffix}`;
    if (existsSync(f)) unlinkSync(f);
  }

  copyFileSync(source, target);

  // Bring an older backup up to the current schema. This is what makes a
  // backup taken months ago still usable on a laptop running today's build.
  const db = openDatabase(target);
  let summary: BackupSummary;
  try {
    migrate(db);
    summary = summarize(db);
  } finally {
    db.close();
  }

  return { plan, safetyCopy, summary };
}

/** Timestamp for a filename: sortable, second-resolution, no colons. */
function stamp(d: Date): string {
  return d.toISOString().replace(/[:T]/g, '-').replace(/\..+$/, '');
}

/**
 * A path nothing occupies.
 *
 * `VACUUM INTO` refuses to overwrite, which is the behaviour we want — but it
 * means two restores in the same second would abort the second one *after* the
 * live database had already been assessed. Suffixing is better than failing:
 * the point of the safety copy is that it always exists.
 */
function uniquePath(path: string): string {
  if (!existsSync(path)) return path;
  const stem = path.replace(/\.db$/, '');
  for (let i = 2; ; i++) {
    const candidate = `${stem}-${i}.db`;
    if (!existsSync(candidate)) return candidate;
  }
}

/** Human-readable size, for a CLI that reports what it wrote. */
export function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Read a file's first bytes to check it is SQLite before opening it. */
export function looksLikeSqlite(file: string): boolean {
  if (!existsSync(file)) return false;
  const fd = readFileSync(file);
  return fd.subarray(0, 15).toString('utf8') === 'SQLite format 3';
}

export { basename };
