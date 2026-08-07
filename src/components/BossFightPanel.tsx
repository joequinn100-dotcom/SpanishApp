'use client';

import { useTransition } from 'react';
import { beginBossFight } from '@/app/actions';
import type { BossAvailability } from '@/lib/challenge';

/**
 * The boss fight's entry point on a topic page (SPEC §8 item 4).
 *
 * When it is not available the panel says *why*, in the spec's own terms. The
 * gate is the interesting part of the mechanic: "two clean spaced reviews and
 * one spontaneous use, then twelve unaided" is the thing that makes `mastered`
 * mean something, and a greyed-out button with no explanation would throw that
 * away.
 */
export function BossFightPanel({
  topicId,
  availability,
  attempts,
  cleared,
}: {
  topicId: string;
  availability: BossAvailability;
  attempts: number;
  cleared: boolean;
}) {
  const [pending, start] = useTransition();

  if (cleared) {
    return (
      <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-teal-300">
          Boss fight cleared
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Twelve items unaided, {attempts === 1 ? 'first time' : `after ${attempts} attempts`}.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        availability.ready ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-800 bg-slate-900/50'
      }`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Boss fight</h2>

      {availability.ready ? (
        <>
          <p className="mt-2 text-sm text-slate-300">
            Twelve items, no hints, no retries. Ten clears it and masters the topic. Falling short
            sends the topic back to studying.
          </p>
          <button
            onClick={() => start(() => beginBossFight(topicId))}
            disabled={pending}
            className="mt-3 w-full rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-rose-400 disabled:opacity-50"
          >
            {pending ? 'Starting…' : 'Face it'}
          </button>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{availability.reason}</p>
      )}

      {attempts > 0 && (
        <p className="mt-2 text-xs text-slate-600">
          {attempts} previous {attempts === 1 ? 'attempt' : 'attempts'}.
        </p>
      )}
    </div>
  );
}
