import { NextResponse } from 'next/server';
import { readFileSync, rmSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getDb } from '@/db';
import { backup, defaultBackupName } from '@/lib/backup';

export const dynamic = 'force-dynamic';

/**
 * Download a snapshot of the learning database.
 *
 * The file is written to a temp directory rather than `backups/` and streamed
 * from there. A download is a copy leaving the machine, not a local backup, and
 * conflating the two would leave the repo accumulating a file every time the
 * button was pressed out of curiosity.
 *
 * `VACUUM INTO` under the hood, so pressing this mid-session gives a consistent
 * file including the answer submitted a second ago — see `lib/backup.ts` for
 * why a plain file copy would not.
 */
export async function GET() {
  const dir = mkdtempSync(join(tmpdir(), 'fluencia-dl-'));
  const path = join(dir, defaultBackupName());
  try {
    const result = backup(getDb(), path);
    const bytes = readFileSync(result.path);

    return new NextResponse(bytes as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.sqlite3',
        'Content-Disposition': `attachment; filename="${defaultBackupName()}"`,
        'Content-Length': String(result.bytes),
        // The summary rides along in headers so the page can report what was
        // downloaded without a second round trip to recompute it.
        'X-Fluencia-Attempts': String(result.summary.attempts),
        'X-Fluencia-Mastered': String(result.summary.topicsMastered),
        'X-Fluencia-Streak': String(result.summary.streak),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Backup failed.' },
      { status: 500 },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
