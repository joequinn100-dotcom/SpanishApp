'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { decideFinding, finishReview } from '@/app/actions';

/**
 * The review card stack (SPEC §6).
 *
 * "Nothing auto-applies. Keyboard driven: A / O / R, so 40 findings take three
 * minutes." The keyboard part is the requirement, not the decoration — a review
 * that needs a mouse is a review you stop doing after two classes.
 *
 * Merge (§6's fourth button) is not built: it needs a code picker over the whole
 * error log, and the rules-based analyser proposes existing codes rather than
 * novel ones, so there is nothing to merge yet. See PHASE_3_NOTES.md.
 */

export interface ReviewFinding {
  id: number;
  kind: 'error' | 'positive';
  errorCode: string | null;
  errorLabel: string | null;
  topicId: string | null;
  topicName: string | null;
  quote: string;
  correction: string;
  explanation: string;
  confidence: number;
  systematic: number | null;
  decision: string;
}

export function FindingReview({
  transcriptId,
  findings,
}: {
  transcriptId: number;
  findings: ReviewFinding[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [busy, setBusy] = useState(false);

  const pending = findings.filter((f) => f.decision === 'pending');
  const done = findings.length - pending.length;
  const current = pending[0] ?? null;

  const act = (decision: 'accepted' | 'rejected' | 'one_off') => {
    if (!current || busy) return;
    setBusy(true);
    start(async () => {
      await decideFinding(current.id, decision);
      router.refresh();
      setBusy(false);
    });
  };

  // A / O / R, per §6. Ignored while typing in a field, so the shortcuts never
  // fight a form elsewhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'a') { e.preventDefault(); act('accepted'); }
      if (k === 'o') { e.preventDefault(); act('one_off'); }
      if (k === 'r') { e.preventDefault(); act('rejected'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!current) {
    return (
      <section className="rounded-xl border border-teal-700/40 bg-teal-500/5 p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-teal-400">Review complete</p>
        <p className="mt-2 text-sm text-slate-300">
          {findings.length} findings decided. Everything you accepted is in the error log now;
          everything you rejected left no trace.
        </p>
        <button
          onClick={() => start(() => finishReview(transcriptId).then(() => router.refresh()))}
          className="mt-4 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-teal-400"
        >
          Close review
        </button>
      </section>
    );
  }

  const isError = current.kind === 'error';

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between text-xs text-slate-500">
        <span>
          {done + 1} of {findings.length}
        </span>
        <span>A accept · O one-off · R reject</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-teal-400 transition-[width] duration-300"
          style={{ width: `${(done / findings.length) * 100}%` }}
        />
      </div>

      <article
        className={`mt-5 rounded-xl border p-6 ${
          isError ? 'border-rose-800/50 bg-rose-500/[0.03]' : 'border-teal-800/50 bg-teal-500/[0.03]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 uppercase tracking-wider ${
              isError ? 'bg-rose-500/15 text-rose-300' : 'bg-teal-500/15 text-teal-300'
            }`}
          >
            {isError ? 'Possible error' : 'Went well'}
          </span>
          {current.errorLabel && <span className="text-slate-400">{current.errorLabel}</span>}
          {current.topicName && <span className="text-slate-500">{current.topicName}</span>}
          {current.systematic === 1 && (
            <span className="rounded border border-amber-700/60 px-1.5 text-[10px] text-amber-400">
              looks systematic
            </span>
          )}
          <span className="ml-auto text-slate-600">
            confidence {Math.round(current.confidence * 100)}%
          </span>
        </div>

        <blockquote className="mt-4 border-l-2 border-slate-700 pl-4 font-serif text-lg leading-relaxed text-slate-200">
          {current.quote}
        </blockquote>

        {current.correction && (
          <p className="mt-3 border-l-2 border-teal-600 pl-4 font-serif text-lg leading-relaxed text-teal-300">
            {current.correction}
          </p>
        )}

        {current.explanation.split('\n\n').map((p, i) => (
          <p key={i} className="mt-3 text-sm leading-relaxed text-slate-400">
            {p}
          </p>
        ))}

        <div className="mt-6 flex flex-wrap gap-2">
          <Btn onClick={() => act('accepted')} disabled={busy} tone="teal">
            <b>A</b>ccept
            <span className="ml-1 text-xs opacity-70">
              {isError ? 'log it' : 'count as evidence'}
            </span>
          </Btn>
          {isError && (
            <Btn onClick={() => act('one_off')} disabled={busy} tone="slate">
              <b>O</b>ne-off
              <span className="ml-1 text-xs opacity-70">record it, don&rsquo;t escalate</span>
            </Btn>
          )}
          <Btn onClick={() => act('rejected')} disabled={busy} tone="slate">
            <b>R</b>eject
            <span className="ml-1 text-xs opacity-70">analysis is wrong</span>
          </Btn>
        </div>
      </article>
    </section>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  tone: 'teal' | 'slate';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm transition disabled:opacity-40 ${
        tone === 'teal'
          ? 'bg-teal-500 font-medium text-slate-950 hover:bg-teal-400'
          : 'border border-slate-700 text-slate-300 hover:border-slate-500'
      }`}
    >
      {children}
    </button>
  );
}
