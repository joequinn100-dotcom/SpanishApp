'use client';

import { useTransition } from 'react';
import { beginSession } from '@/app/actions';

/**
 * Start a session focused on this topic.
 *
 * The warm-up still comes first — §4's error work is not skippable just because
 * you arrived from a topic page — so this sets the focus, it does not bypass
 * anything.
 */
export function PracticeTopicButton({ topicId }: { topicId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => beginSession(topicId))}
      disabled={pending}
      className="w-full rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-50"
    >
      {pending ? 'Building session…' : 'Practise this topic'}
    </button>
  );
}
