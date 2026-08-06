'use client';

import { useTransition } from 'react';
import { endSession } from '@/app/actions';

export function FinishSessionForm({ sessionId }: { sessionId: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => endSession(sessionId))}
      disabled={pending}
      className="mt-4 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-50"
    >
      {pending ? 'Writing handoff…' : 'End session & write handoff'}
    </button>
  );
}
