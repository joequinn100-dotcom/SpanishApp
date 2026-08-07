'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { applyRestore, inspectUpload, type RestorePreview } from '@/app/backup-actions';
import type { BackupSummary } from '@/lib/backup';

/**
 * Download and restore, as two buttons.
 *
 * The restore half is deliberately a three-step flow — choose, review, confirm.
 * It is the only control in the app that can destroy months of work, and the
 * dangerous case is not malice but a mis-click on the wrong file in Downloads.
 * Showing what is in the backup next to what it would replace turns that into a
 * decision rather than an accident.
 */
export function BackupPanel({ summary }: { summary: BackupSummary | null }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [done, setDone] = useState<{ attempts: number; safetyCopy: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [downloading, setDownloading] = useState(false);

  function download() {
    setDownloading(true);
    // An anchor click rather than a router navigation or fetch+blob. The route
    // replies with Content-Disposition: attachment, so the browser's own
    // download manager takes it from here — the file lands in Downloads with
    // the right name, and the page is never navigated away from. A
    // `router.push` would try to client-navigate to it and render nothing.
    const a = document.createElement('a');
    a.href = '/api/backup';
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => setDownloading(false), 1500);
  }

  function onChoose() {
    setDone(null);
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) return setPreview(null);
    const form = new FormData();
    form.set('backup', file);
    start(async () => setPreview(await inspectUpload(form)));
  }

  function confirmRestore() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.set('backup', file);
    form.set('force', String(preview?.wouldReplaceProgress ?? false));
    start(async () => {
      const r = await applyRestore(form);
      if (!r.ok) {
        setError(r.error ?? 'Restore failed.');
        return;
      }
      setPreview(null);
      setError(null);
      setDone({ attempts: r.summary?.attempts ?? 0, safetyCopy: r.safetyCopy ?? null });
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    });
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ---------------------------------------------------------- Save */}
      <section className="rounded-xl border border-teal-500/30 bg-teal-500/[0.04] p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-teal-300">
          Save a copy
        </h2>

        {summary ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <Stat label="attempts" value={summary.attempts} />
            <Stat label="XP" value={summary.xp} />
            <Stat label="topics mastered" value={summary.topicsMastered} />
            <Stat label="in progress" value={summary.topicsStudied} />
            <Stat label="live errors" value={summary.errorsLive} />
            <Stat label="resolved" value={summary.errorsResolved} />
            <Stat label="transcripts" value={summary.transcripts} />
            <Stat label="streak" value={summary.streak} />
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            No database yet — answer a drill and there will be something to save.
          </p>
        )}

        <button
          onClick={download}
          disabled={!summary || downloading}
          className="mt-4 w-full rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-50"
        >
          {downloading ? 'Preparing…' : 'Download backup'}
        </button>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          One self-contained file. Safe to press mid-session — it captures the answer you gave a
          second ago. Put it in iCloud Drive or anywhere that outlives this laptop.
        </p>
      </section>

      {/* ------------------------------------------------------- Restore */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Restore from a backup
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Replaces everything on this machine with the contents of the file. You will see what
          changes before anything is written.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".db,application/vnd.sqlite3,application/octet-stream"
          onChange={onChoose}
          className="mt-3 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border file:border-slate-700 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:text-slate-300 hover:file:border-slate-500"
        />

        {pending && <p className="mt-3 text-sm text-slate-500">Reading…</p>}

        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        {preview && !preview.ok && (
          <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-sm text-rose-300">
            {preview.error}
          </p>
        )}

        {preview?.ok && preview.source && (
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <Row label="In the file" s={preview.source} tone="text-teal-300" />
            {preview.current ? (
              <Row label="On this machine" s={preview.current} tone="text-slate-400" />
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Nothing on this machine yet — a clean install.
              </p>
            )}

            {preview.pendingMigrations && preview.pendingMigrations.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {preview.pendingMigrations.length} schema update(s) will be applied after
                restoring, so an older backup still works.
              </p>
            )}

            {preview.wouldReplaceProgress && (
              <p className="mt-2 rounded border border-amber-500/40 bg-amber-500/5 px-2 py-1.5 text-xs text-amber-200/90">
                This replaces work already on this machine. A copy of it is kept in{' '}
                <code className="text-amber-100">data/replaced-…db</code>, so this is undoable.
              </p>
            )}

            <button
              onClick={confirmRestore}
              disabled={pending}
              className="mt-3 w-full rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-rose-400 disabled:opacity-50"
            >
              {pending
                ? 'Restoring…'
                : preview.wouldReplaceProgress
                  ? 'Replace what is here'
                  : 'Restore'}
            </button>
          </div>
        )}

        {done && (
          <div className="mt-3 rounded-lg border border-teal-500/40 bg-teal-500/5 px-3 py-2 text-sm text-teal-300">
            Restored — {done.attempts} attempts are back.
            {done.safetyCopy && (
              <span className="mt-1 block text-xs text-slate-500">
                The database that was replaced is kept at{' '}
                <code className="text-slate-400">{done.safetyCopy.split('/').slice(-2).join('/')}</code>.
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-serif tabular-nums text-slate-200">{value}</dd>
    </div>
  );
}

function Row({ label, s, tone }: { label: string; s: BackupSummary; tone: string }) {
  return (
    <p className="mt-1 text-xs">
      <span className="text-slate-500">{label}: </span>
      <span className={tone}>
        {s.attempts} attempts · {s.topicsMastered} mastered · {s.transcripts} transcripts · streak{' '}
        {s.streak}
      </span>
      {s.lastActivity && (
        <span className="text-slate-600"> · last {s.lastActivity.slice(0, 10)}</span>
      )}
    </p>
  );
}
