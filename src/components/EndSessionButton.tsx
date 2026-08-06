'use client';

import { useTransition } from 'react';
import { endSession } from '@/app/actions';

/**
 * Ending always writes a handoff (SPEC §7), so there is no "abandon" — leaving
 * early still produces the document the next session reads.
 */
export function EndSessionButton({ sessionId }: { sessionId: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => endSession(sessionId))}
      disabled={pending}
      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-200 disabled:opacity-50"
    >
      {pending ? 'Ending…' : 'End & save'}
    </button>
  );
}
