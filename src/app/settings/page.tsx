import Link from 'next/link';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getDb } from '@/db';
import { summarize } from '@/lib/backup';
import { BackupPanel } from '@/components/BackupPanel';

export const dynamic = 'force-dynamic';

/**
 * Settings — in practice, the safety page.
 *
 * `data/` is gitignored on purpose and nothing else backs it up, so this is the
 * only screen standing between a dead laptop and months of attempts, error
 * history and review schedules that cannot be reconstructed from anything.
 * The CLI can do all of this too; the buttons exist because a backup that
 * requires remembering a terminal command is a backup that does not happen.
 */
export default function SettingsPage() {
  const live = join(process.cwd(), 'data', 'fluencia.db');
  const summary = existsSync(live) ? summarize(getDb()) : null;

  return (
    <>
      <div className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-slate-300">
          ← Progress
        </Link>
        <div className="flex-1" />
        <span className="text-slate-600">Settings</span>
      </div>

      <h1 className="text-2xl font-semibold">Your data</h1>
      <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-slate-400">
        Everything Fluencia knows about you is one SQLite file on this machine. There is no
        account and no cloud — which is why closing the laptop mid-question loses nothing, and
        why a lost laptop would lose everything. Download a copy somewhere safe.
      </p>

      <BackupPanel summary={summary} />

      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Moving to a new machine
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-400">
          <li>
            <span className="text-slate-500">1.</span> On the old laptop, press{' '}
            <span className="text-slate-200">Download backup</span>.
          </li>
          <li>
            <span className="text-slate-500">2.</span> On the new one, clone the repo and run{' '}
            <code className="rounded bg-slate-950 px-1.5 py-0.5 text-xs text-slate-300">
              npm install &amp;&amp; npm run dev
            </code>
            .
          </li>
          <li>
            <span className="text-slate-500">3.</span> Come back to this page and{' '}
            <span className="text-slate-200">Restore from a backup</span>.
          </li>
        </ol>
        <p className="mt-3 text-xs text-slate-600">
          A backup from an older version still works — the schema catches up on restore. One from
          a newer version is refused rather than half-understood.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          From the terminal
        </h2>
        <pre className="mt-3 overflow-x-auto text-xs leading-relaxed text-slate-500">
{`npm run backup                    # → ./backups/fluencia-<timestamp>.db
npm run backup -- --list
npm run restore -- <file>         # refuses if it would replace progress
npm run restore -- <file> --force # keeps the replaced db beside it`}
        </pre>
      </section>
    </>
  );
}
