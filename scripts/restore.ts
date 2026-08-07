/**
 * `npm run restore -- <backup.db> [--force] [--dry-run]`
 *
 * Replaces the learning database with a backup. This is the new-laptop path:
 * clone the repo, `npm install`, drop the backup file somewhere, run this.
 *
 * Refuses by default if the database it would replace has any history in it,
 * and copies that database aside even when forced — a restore of the wrong
 * file has to be undoable, because losing the learning record is the one
 * failure this app cannot come back from.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { humanBytes, listBackups, planRestore, restore, type BackupSummary } from '../src/lib/backup';

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');

const target = join(process.cwd(), 'data', 'fluencia.db');

function describe(label: string, s: BackupSummary) {
  console.log(`${label}:`);
  console.log(`  ${s.attempts} attempts, ${s.sessions} sessions, ${s.xp} XP`);
  console.log(`  ${s.topicsMastered} mastered, ${s.errorsLive} live errors, ${s.transcripts} transcripts`);
  console.log(`  streak ${s.streak}, last activity ${s.lastActivity?.slice(0, 10) ?? 'none'}`);
}

if (positional.length === 0) {
  console.log('Usage: npm run restore -- <backup.db> [--force] [--dry-run]');
  const files = listBackups();
  if (files.length > 0) {
    console.log('\nBackups on this machine:');
    for (const f of files) {
      console.log(`  ${f.path}  (${humanBytes(f.bytes)}, ${f.modified.slice(0, 10)})`);
    }
  }
  process.exit(1);
}

const source = positional[0];
if (!existsSync(source)) {
  console.error(`No such file: ${source}`);
  process.exit(1);
}

try {
  const plan = planRestore(source, target);

  describe(`Backup  ${source}`, plan.sourceSummary);
  if (plan.targetSummary) {
    console.log('');
    describe(`Current ${target}`, plan.targetSummary);
  } else {
    console.log(`\nNo database at ${target} yet — this is a clean install.`);
  }

  if (plan.pendingMigrations.length > 0) {
    console.log(`\n${plan.pendingMigrations.length} migration(s) will be applied after restoring:`);
    for (const m of plan.pendingMigrations) console.log(`  ${m}`);
  }

  if (dryRun) {
    console.log('\n--dry-run: nothing written.');
    process.exit(0);
  }

  if (plan.targetHasProgress && !force) {
    console.error('\nRefusing: the current database has progress in it that this would replace.');
    console.error('Run `npm run backup` first, then re-run with --force.');
    process.exit(1);
  }

  const r = restore(source, target, { force });
  console.log('');
  if (r.safetyCopy) {
    console.log(`The database that was replaced is kept at:\n  ${r.safetyCopy}`);
  }
  describe(`Restored to ${target}`, r.summary);
  console.log('\nStart the app with `npm run dev`.');
} catch (e) {
  console.error(`\n${e instanceof Error ? e.message : e}`);
  process.exit(1);
}
