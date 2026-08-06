'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { beginSession } from '@/app/actions';

/**
 * The single button the app is for.
 *
 * When a session is already open this resumes it rather than starting a new
 * one — the whole point of storing the cursor is that closing the laptop is not
 * a decision you have to undo.
 */
export function SessionCta({
  openSessionId,
  answered,
  total,
  focusTopicId,
  focusTopicName,
  streak,
  reviewsDue,
}: {
  openSessionId: number | null;
  answered: number;
  total: number;
  focusTopicId: string | null;
  focusTopicName: string | null;
  streak: number;
  /** Consolidating topics whose spaced review has come due (SPEC §4). */
  reviewsDue: number;
}) {
  const [pending, start] = useTransition();

  if (openSessionId) {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-700/40 bg-amber-500/5 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.14em] text-amber-400">Session in progress</p>
          <p className="mt-1 text-sm text-slate-300">
            You are on item {Math.min(answered + 1, total)} of {total}. Nothing was lost.
          </p>
        </div>
        <Link
          href={`/practice/${openSessionId}`}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-300"
        >
          Resume
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-[0.14em] text-teal-400">Today</p>
        <p className="mt-1 text-sm text-slate-300">
          Warm-up on your live errors
          {reviewsDue > 0 ? <>, a spaced review</> : null}
          {focusTopicName ? <>, then {focusTopicName}</> : null}.
          {streak > 0 && <span className="ml-2 text-slate-500">Streak {streak}.</span>}
        </p>
        {reviewsDue > 0 && (
          <p className="mt-1 text-xs text-violet-300">
            {reviewsDue} {reviewsDue === 1 ? 'topic is' : 'topics are'} due for review — clearing
            one unaided is half of what mastery needs.
          </p>
        )}
      </div>
      <button
        onClick={() => start(() => beginSession(focusTopicId))}
        disabled={pending}
        className="rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-50"
      >
        {pending ? 'Building session…' : 'Start session'}
      </button>
    </div>
  );
}
