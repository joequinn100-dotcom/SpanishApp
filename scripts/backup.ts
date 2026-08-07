/**
 * `npm run backup [-- --out <path>] [-- --list]`
 *
 * Writes a verified snapshot of the learning database. Safe to run while the
 * app is open — `VACUUM INTO` takes a consistent picture including anything
 * still in the write-ahead log.
 *
 * The output is a single file with no sidecars, so copying it to iCloud Drive,
 * a USB stick or a new laptop is the whole of the job.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getDb } from '../src/db';
import { BACKUP_DIR, backup, humanBytes, listBackups } from '../src/lib/backup';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : (args[i + 1] ?? '');
};

if (args.includes('--list')) {
  const files = listBackups();
  if (files.length === 0) {
    console.log(`No backups in ${BACKUP_DIR}. Run \`npm run backup\` to make one.`);
  } else {
    for (const f of files) {
      console.log(`${f.modified.slice(0, 16).replace('T', ' ')}  ${humanBytes(f.bytes).padStart(8)}  ${f.name}`);
    }
  }
  process.exit(0);
}

const live = join(process.cwd(), 'data', 'fluencia.db');
if (!existsSync(live)) {
  console.log('No database at data/fluencia.db yet — nothing to back up.');
  process.exit(0);
}

try {
  const out = flag('out');
  const r = backup(getDb(), out || undefined);
  const s = r.summary;

  console.log(`Wrote ${r.path}  (${humanBytes(r.bytes)})`);
  console.log('Verified. It contains:');
  console.log(`  ${s.attempts} attempts across ${s.sessions} sessions, ${s.xp} XP`);
  console.log(`  ${s.topicsMastered} topics mastered, ${s.topicsStudied} in progress`);
  console.log(`  ${s.errorsLive} live errors, ${s.errorsResolved} resolved`);
  console.log(`  ${s.transcripts} transcripts, ${s.vocabReviews} vocab reviews`);
  console.log(`  streak ${s.streak}, last activity ${s.lastActivity?.slice(0, 10) ?? 'none'}`);
  console.log('');
  console.log('Copy that file somewhere off this machine — iCloud Drive, a USB stick,');
  console.log('anywhere that survives the laptop. It is the only copy of your progress.');
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
