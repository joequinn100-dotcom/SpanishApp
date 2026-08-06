'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { answer } from '@/app/actions';
import { diagramForError, diagramFor } from '@/components/diagrams';
import { StrandIcon, strandStyle } from '@/components/StrandIcon';
import type { Grade } from '@/domain/grading';

/**
 * One drill, answered.
 *
 * All learning state lives in SQLite (Build Principle 1); this component holds
 * only what is true for the next few seconds — the text in the box, whether the
 * hint is showing, and the graded result waiting to be read. Refreshing the page
 * mid-item loses nothing but the typed draft, because the cursor is on the
 * session row.
 */

export interface RunnerItem {
  sessionId: number;
  index: number;
  total: number;
  source: 'warmup' | 'topic';
  kind: string;
  difficulty: number;
  topicName: string;
  topicSlug: string;
  topicId: string;
  strandId: string;
  errorCode: string | null;
  errorLabel: string | null;
  prompt: string;
  context?: string;
  sentence: string;
  hint?: string;
}

type Result = Grade & { xp: number; notes: string[] };

const VERDICT: Record<string, { label: string; tone: string; ring: string }> = {
  correct: { label: 'Correct', tone: 'text-teal-300', ring: 'border-teal-500/40 bg-teal-500/5' },
  accent: {
    label: 'Right form, wrong accent',
    tone: 'text-amber-300',
    ring: 'border-amber-500/40 bg-amber-500/5',
  },
  distractor: { label: 'Not quite', tone: 'text-rose-300', ring: 'border-rose-500/40 bg-rose-500/5' },
  incorrect: { label: 'Not quite', tone: 'text-rose-300', ring: 'border-rose-500/40 bg-rose-500/5' },
  blank: { label: 'Skipped', tone: 'text-slate-400', ring: 'border-slate-700 bg-slate-900/50' },
};

export function DrillRunner({ item }: { item: RunnerItem }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startedAt = useRef<number>(Date.now());

  // A new item means a new question: clear everything the previous one left.
  useEffect(() => {
    setValue('');
    setHint(false);
    setResult(null);
    startedAt.current = Date.now();
    inputRef.current?.focus();
  }, [item.index, item.sessionId]);

  function submit() {
    if (pending || result) return;
    const latency = Date.now() - startedAt.current;
    start(async () => {
      setResult(await answer(item.sessionId, value, latency));
    });
  }

  function next() {
    setResult(null);
    router.refresh();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // Enter submits; Shift+Enter is a newline, which translation items need.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      result ? next() : submit();
    }
  }

  const v = result ? VERDICT[result.verdict] : null;
  const Diagram =
    (item.errorCode ? diagramForError(item.errorCode) : null) ??
    diagramFor(item.topicId, item.strandId);

  return (
    <div className="mx-auto max-w-2xl">
      <ProgressBar index={item.index} total={item.total} />

      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full px-2 py-0.5 uppercase tracking-wider ${
            item.source === 'warmup'
              ? 'bg-amber-500/15 text-amber-300'
              : 'bg-teal-500/15 text-teal-300'
          }`}
        >
          {item.source === 'warmup' ? 'Warm-up' : 'New material'}
        </span>
        <span className={`inline-flex items-center gap-1.5 ${strandStyle(item.strandId).fg}`}>
          <StrandIcon strand={item.strandId} className="h-3.5 w-3.5" />
          {item.topicName}
        </span>
        {item.errorLabel && (
          <span className="text-slate-600">· targeting: {item.errorLabel}</span>
        )}
        <span className="ml-auto text-slate-600">difficulty {item.difficulty}/5</span>
      </div>

      {item.context && (
        <p className="mt-4 text-sm italic text-slate-500">{item.context}</p>
      )}

      <p className="mt-1 text-sm text-slate-400">{item.prompt}</p>

      <p className="mt-4 font-serif text-2xl leading-relaxed text-slate-100">{item.sentence}</p>

      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        disabled={!!result || pending}
        placeholder="Your answer…"
        spellCheck={false}
        autoComplete="off"
        className="mt-5 w-full resize-none rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 font-serif text-lg text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-teal-500/60 disabled:opacity-60"
      />

      {!result && (
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={submit}
            disabled={pending}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-50"
          >
            {pending ? 'Checking…' : 'Check'}
          </button>
          {item.hint && !hint && (
            <button
              onClick={() => setHint(true)}
              className="text-sm text-slate-500 underline underline-offset-4 transition hover:text-slate-300"
            >
              Hint
            </button>
          )}
          <span className="ml-auto text-xs text-slate-600">Enter to check</span>
        </div>
      )}

      {hint && item.hint && (
        <p className="mt-3 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-400">
          {item.hint}
        </p>
      )}

      {result && v && (
        <div className={`mt-5 rounded-lg border px-5 py-4 ${v.ring}`}>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${v.tone}`}>{v.label}</span>
            {result.xp > 0 && (
              <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-xs text-teal-300">
                +{result.xp} XP
              </span>
            )}
          </div>

          {!result.correct && (
            <p className="mt-3 font-serif text-lg text-slate-100">{result.expected}</p>
          )}

          {/* Thorough, never abbreviated — SPEC §11. */}
          {result.feedback.split('\n\n').map((para, i) => (
            <p key={i} className="mt-3 text-sm leading-relaxed text-slate-300">
              {para}
            </p>
          ))}

          {/* The diagram is shown when the answer was wrong. Getting it right
              means the shape is already there; getting it wrong is exactly when
              a picture of the rule beats another paragraph about it. */}
          {!result.correct && Diagram && (
            <div className="mt-4">
              <Diagram />
            </div>
          )}

          {result.notes.map((n, i) => (
            <p key={i} className="mt-3 text-sm text-amber-300">
              {n}
            </p>
          ))}

          <button
            onClick={next}
            className="mt-5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white"
          >
            {item.index + 1 >= item.total ? 'Finish session' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ index, total }: { index: number; total: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>
          Item {index + 1} of {total}
        </span>
        <span>{Math.round((index / total) * 100)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-teal-400 transition-[width] duration-500"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
