'use client';

import { useState, useTransition } from 'react';
import { abandonRun } from '@/app/actions';

/**
 * Walking out of a challenge.
 *
 * Confirmed rather than instant, and only for the boss fight: §8 gives it no
 * retries, so leaving is a loss and the topic drops back to studying. Saying so
 * before the click is the difference between a stake and an ambush. The
 * Gauntlet Run costs nothing to leave, so it does not ask.
 */
export function AbandonRunButton({
  sessionId,
  kind,
}: {
  sessionId: number;
  kind: 'boss' | 'sprint';
}) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const boss = kind === 'boss';

  if (boss && confirming) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <span className="text-amber-200/80">Leaving counts as a loss.</span>
        <button
          onClick={() => start(() => abandonRun(sessionId))}
          disabled={pending}
          className="rounded-lg border border-rose-500/50 px-3 py-1.5 text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
        >
          {pending ? 'Leaving…' : 'Leave anyway'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-slate-500 underline underline-offset-4 transition hover:text-slate-300"
        >
          Keep going
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => (boss ? setConfirming(true) : start(() => abandonRun(sessionId)))}
      disabled={pending}
      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-200 disabled:opacity-50"
    >
      {pending ? 'Leaving…' : boss ? 'Forfeit' : 'Give up'}
    </button>
  );
}
