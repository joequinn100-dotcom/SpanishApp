'use client';

import { useTransition } from 'react';
import { beginGauntletRun } from '@/app/actions';
import type { SprintRecord } from '@/domain/challenge';

/**
 * SPEC §8 item 3, "The Gauntlet Run".
 *
 * §8 asks for this to "feel like a game, not a test", so the card leads with
 * the time to beat rather than with what is wrong with the learner — the items
 * come from the error log either way, and the framing is the whole difference
 * between a speed builder and a remedial exercise.
 */
export function GauntletRunCard({
  ready,
  reason,
  best,
  runs,
}: {
  ready: boolean;
  reason: string | null;
  best: SprintRecord | null;
  runs: number;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.04] p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-300">
          Gauntlet Run
        </h2>
        <span className="text-xs text-slate-500">10 items · 3 lives · timed</span>
        {best && (
          <span className="ml-auto text-xs text-slate-400">
            Best <span className="font-medium text-sky-300">{(best.durationMs / 1000).toFixed(1)}s</span>
            {runs > 1 && <span className="text-slate-600"> · {runs} runs</span>}
          </span>
        )}
      </div>

      {ready ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => start(() => beginGauntletRun())}
            disabled={pending}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
          >
            {pending ? 'Starting…' : best ? 'Beat your time' : 'Start a run'}
          </button>
          <span className="text-xs text-slate-500">
            Drawn only from the errors you are still making.
          </span>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{reason}</p>
      )}
    </div>
  );
}
