'use server';

import { revalidatePath } from 'next/cache';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { closeDatabase } from '@/db';
import { RestoreRefused, planRestore, restore, type BackupSummary } from '@/lib/backup';

const TARGET = join(process.cwd(), 'data', 'fluencia.db');

export interface RestorePreview {
  ok: boolean;
  error?: string;
  source?: BackupSummary;
  current?: BackupSummary | null;
  pendingMigrations?: string[];
  wouldReplaceProgress?: boolean;
}

/** Write an uploaded file to a temp path so SQLite can open it as a file. */
function stash(bytes: ArrayBuffer): { dir: string; path: string } {
  const dir = mkdtempSync(join(tmpdir(), 'fluencia-up-'));
  const path = join(dir, 'uploaded.db');
  writeFileSync(path, Buffer.from(bytes));
  return { dir, path };
}

/**
 * Inspect an uploaded backup without touching anything.
 *
 * Always run before `applyRestore`, because a restore is the one action in this
 * app that can destroy months of work and the user deserves to see what they
 * are about to overwrite, and with what, before it happens.
 */
export async function inspectUpload(form: FormData): Promise<RestorePreview> {
  const file = form.get('backup');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose a .db backup file first.' };
  }

  const { dir, path } = stash(await file.arrayBuffer());
  try {
    const plan = planRestore(path, TARGET);
    if (plan.unknownMigrations.length > 0) {
      return {
        ok: false,
        error:
          `That backup is from a newer version of Fluencia (${plan.unknownMigrations.join(', ')}). ` +
          `Update the app, then restore.`,
      };
    }
    return {
      ok: true,
      source: plan.sourceSummary,
      current: plan.targetSummary,
      pendingMigrations: plan.pendingMigrations,
      wouldReplaceProgress: plan.targetHasProgress,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not read that file.' };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export interface RestoreOutcome {
  ok: boolean;
  error?: string;
  summary?: BackupSummary;
  safetyCopy?: string | null;
}

/**
 * Replace the live database with an uploaded backup.
 *
 * The cached connection is closed first. Without that, the process would go on
 * holding a handle to the file that was just replaced — on Linux the unlink
 * succeeds and the handle keeps working against the deleted inode, so the
 * restore would report success and then quietly discard everything the user
 * did next.
 */
export async function applyRestore(form: FormData): Promise<RestoreOutcome> {
  const file = form.get('backup');
  const force = form.get('force') === 'true';
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose a .db backup file first.' };
  }

  const { dir, path } = stash(await file.arrayBuffer());
  try {
    closeDatabase();
    const r = restore(path, TARGET, { force });
    revalidatePath('/', 'layout');
    return { ok: true, summary: r.summary, safetyCopy: r.safetyCopy };
  } catch (e) {
    if (e instanceof RestoreRefused) return { ok: false, error: e.message };
    return { ok: false, error: e instanceof Error ? e.message : 'Restore failed.' };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
