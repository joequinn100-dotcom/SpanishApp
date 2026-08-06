'use client';

import { useTransition } from 'react';
import { setLevelStatus, setTopicStatus } from '@/app/actions';

const OPTIONS: { value: string; label: string }[] = [
  { value: 'locked', label: 'Not yet' },
  { value: 'available', label: 'Open' },
  { value: 'studying', label: 'Studying' },
  { value: 'mastered', label: 'I own this' },
];

export function TopicPlacement({ topicId, status }: { topicId: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <div className={pending ? 'opacity-50' : ''}>
      <div className="flex flex-wrap gap-1">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            disabled={pending}
            onClick={() => start(() => void setTopicStatus(topicId, o.value))}
            className={`rounded border px-2 py-1 text-xs transition ${
              status === o.value
                ? 'border-teal-600 bg-teal-500/15 text-teal-300'
                : 'border-slate-700 text-slate-400 hover:border-teal-700 hover:text-slate-200'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Placement records knowledge you brought with you. It unlocks what depends on this
        topic, but it is stored separately from mastery earned through evidence — so the
        timeline can always tell the two apart.
      </p>
    </div>
  );
}

export function LevelPlacement({ level }: { level: string }) {
  const [pending, start] = useTransition();
  return (
    <span className={`flex gap-1 ${pending ? 'opacity-50' : ''}`}>
      <button
        disabled={pending}
        onClick={() => start(() => void setLevelStatus(level, 'mastered'))}
        className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 transition hover:border-teal-700 hover:text-teal-300"
        title={`Mark every ${level} topic as already known`}
      >
        own all
      </button>
      <button
        disabled={pending}
        onClick={() => start(() => void setLevelStatus(level, 'locked'))}
        className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 transition hover:border-slate-500 hover:text-slate-300"
        title={`Clear placement for ${level}`}
      >
        clear
      </button>
    </span>
  );
}
