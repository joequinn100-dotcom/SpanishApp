'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  conjugationTable,
  gradeTenseItem,
  tenseRound,
  type ConjugationTable,
  type TrainerItem,
  type TrainerResult,
} from '@/app/tense-actions';
import type { TenseInfo } from '@/domain/conjugation';

type Moods = { indicativo: TenseInfo[]; subjuntivo: TenseInfo[]; imperativo: TenseInfo[] };

const ROUND = 10;

/**
 * Pick a tense, drill it, or read the whole table.
 *
 * Two modes because they answer different questions. Drilling answers "can I
 * produce this under time pressure"; the table answers "what is the shape of
 * this tense" — and a learner who has just been beaten by «durmamos» wants the
 * second one immediately, without leaving the page and losing their round.
 */
export function TenseTrainer({
  moods,
  verbs,
}: {
  moods: Moods;
  verbs: { infinitive: string; en: string }[];
}) {
  const [tense, setTense] = useState<TenseInfo | null>(null);
  const [items, setItems] = useState<TrainerItem[]>([]);
  const [cursor, setCursor] = useState(0);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<TrainerResult | null>(null);
  const [scores, setScores] = useState<boolean[]>([]);
  const [hard, setHard] = useState(false);
  const [table, setTable] = useState<ConjugationTable | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const item = items[cursor];
  const done = items.length > 0 && cursor >= items.length;

  useEffect(() => {
    if (item && !result) inputRef.current?.focus();
  }, [item, result]);

  function begin(t: TenseInfo, difficulty = hard) {
    setTense(t);
    setResult(null);
    setValue('');
    setScores([]);
    setCursor(0);
    setTable(null);
    start(async () => setItems(await tenseRound(t.id, ROUND, difficulty ? 3 : 2)));
  }

  function submit() {
    if (!tense || !item || result || pending) return;
    start(async () => {
      const r = await gradeTenseItem(tense.id, item.index, value, ROUND, hard ? 3 : 2);
      setResult(r);
      setScores((s) => [...s, r.correct]);
    });
  }

  function next() {
    setResult(null);
    setValue('');
    setCursor((c) => c + 1);
  }

  function openTable(infinitive: string) {
    start(async () => setTable(await conjugationTable(infinitive)));
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (result) next();
    else submit();
  }

  /* ------------------------------------------------------------ picker */
  if (!tense) {
    return (
      <>
        <Picker moods={moods} onPick={(t) => begin(t)} hard={hard} setHard={setHard} />
        <Reference verbs={verbs} table={table} onOpen={openTable} pending={pending} />
      </>
    );
  }

  /* ------------------------------------------------------------ result */
  if (done) {
    const right = scores.filter(Boolean).length;
    return (
      <section className="mx-auto max-w-2xl">
        <div
          className={`rounded-xl border p-6 ${
            right >= 8 ? 'border-teal-500/40 bg-teal-500/5' : 'border-slate-800 bg-slate-900/40'
          }`}
        >
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{tense.es}</p>
          <h2 className="mt-1 text-2xl font-semibold">
            {right}/{items.length}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {right === items.length
              ? 'Clean round. Try it with the harder verbs, or move to a tense that fights back.'
              : right >= 8
                ? 'Solid. The misses are the interesting part — the table below shows the shape.'
                : 'Worth another round. Every form here is generated from the rules, so the next ten will not be the same ten.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <button
              onClick={() => begin(tense)}
              className="rounded-lg bg-teal-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-teal-400"
            >
              Another ten
            </button>
            <button
              onClick={() => setTense(null)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 transition hover:border-slate-500"
            >
              Pick another tense
            </button>
          </div>
        </div>
        <div className="mt-6">
          <Reference verbs={verbs} table={table} onOpen={openTable} pending={pending} />
        </div>
      </section>
    );
  }

  /* ------------------------------------------------------------- drill */
  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3 text-xs">
        <button
          onClick={() => setTense(null)}
          className="text-slate-500 transition hover:text-slate-300"
        >
          ← tenses
        </button>
        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 uppercase tracking-wider text-violet-300">
          {tense.es}
        </span>
        <div className="flex-1" />
        <span className="flex gap-1">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-4 rounded-full ${
                i >= scores.length
                  ? 'bg-slate-800'
                  : scores[i]
                    ? 'bg-teal-400'
                    : 'bg-rose-400'
              }`}
            />
          ))}
        </span>
      </div>

      {item && (
        <>
          <p className="text-sm italic text-slate-500">{item.context}</p>
          <p className="mt-1 text-sm text-slate-400">
            {item.prompt} <span className="text-slate-600">— {item.verbEn}</span>
          </p>
          <p className="mt-4 font-serif text-2xl leading-relaxed text-slate-100">{item.sentence}</p>

          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            disabled={!!result || pending}
            placeholder="the conjugated form…"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            className="mt-5 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 font-serif text-lg text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-60"
          />

          {!result && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={submit}
                disabled={pending}
                className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-violet-400 disabled:opacity-50"
              >
                {pending ? 'Checking…' : 'Check'}
              </button>
              <span className="ml-auto text-xs text-slate-600">Enter to check</span>
            </div>
          )}

          {result && (
            <div
              className={`mt-5 rounded-lg border px-5 py-4 ${
                result.correct
                  ? 'border-teal-500/40 bg-teal-500/5'
                  : 'border-rose-500/40 bg-rose-500/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-medium ${
                    result.correct ? 'text-teal-300' : 'text-rose-300'
                  }`}
                >
                  {result.correct
                    ? result.verdict === 'accent'
                      ? 'Right form, wrong accent'
                      : 'Correct'
                    : 'Not quite'}
                </span>
                {!result.correct && (
                  <span className="font-serif text-lg text-slate-100">{result.answer}</span>
                )}
                <button
                  onClick={() => openTable(item.verb)}
                  className="ml-auto text-xs text-slate-500 underline underline-offset-4 transition hover:text-slate-300"
                >
                  see the whole verb
                </button>
              </div>

              {result.explanation.split('\n\n').map((para, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-slate-300">
                  {para}
                </p>
              ))}

              <button
                onClick={next}
                className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-600"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {table && (
        <div className="mt-6">
          <TableView table={table} onClose={() => setTable(null)} />
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Picking
 * ------------------------------------------------------------------ */

function Picker({
  moods,
  onPick,
  hard,
  setHard,
}: {
  moods: Moods;
  onPick: (t: TenseInfo) => void;
  hard: boolean;
  setHard: (v: boolean) => void;
}) {
  const groups: [string, string, TenseInfo[]][] = [
    ['Indicative', 'What is, was and will be.', moods.indicativo],
    ['Subjunctive', 'What is wanted, doubted, or not yet real. The B2 gate.', moods.subjuntivo],
    ['Imperative', 'Telling someone to, and telling them not to.', moods.imperativo],
  ];

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-2 text-sm text-slate-400">
        <input
          type="checkbox"
          checked={hard}
          onChange={(e) => setHard(e.target.checked)}
          className="h-4 w-4 rounded border-slate-700 bg-slate-900"
        />
        Include the rarer verbs
      </label>

      {groups.map(([title, blurb, list]) => (
        <section key={title}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {title}
          </h2>
          <p className="mt-1 text-xs text-slate-600">{blurb}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => (
              <button
                key={t.id}
                onClick={() => onPick(t)}
                className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-left transition hover:border-violet-500/50 hover:bg-violet-500/[0.04]"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-slate-100">{t.en}</span>
                  <span className="rounded border border-slate-800 px-1 text-[10px] text-slate-500">
                    {t.level}
                  </span>
                </div>
                <div className="font-serif text-xs text-slate-500">{t.es}</div>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">{t.use}</p>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Reference
 * ------------------------------------------------------------------ */

function Reference({
  verbs,
  table,
  onOpen,
  pending,
}: {
  verbs: { infinitive: string; en: string }[];
  table: ConjugationTable | null;
  onOpen: (inf: string) => void;
  pending: boolean;
}) {
  const [q, setQ] = useState('');
  const matches = q
    ? verbs.filter(
        (v) => v.infinitive.startsWith(q.toLowerCase()) || v.en.includes(q.toLowerCase()),
      )
    : [];

  return (
    <section className="mt-10">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        Full conjugation
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Any of the {verbs.length} verbs, every tense at once.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="entregar, to approve, tener…"
        spellCheck={false}
        className="mt-3 w-full max-w-sm rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500/60"
      />

      {matches.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {matches.slice(0, 12).map((v) => (
            <button
              key={v.infinitive}
              onClick={() => {
                onOpen(v.infinitive);
                setQ('');
              }}
              className="rounded-lg border border-slate-800 px-2.5 py-1 text-xs text-slate-300 transition hover:border-violet-500/50"
            >
              {v.infinitive}
              <span className="ml-1.5 text-slate-600">{v.en}</span>
            </button>
          ))}
        </div>
      )}

      {pending && !table && <p className="mt-3 text-sm text-slate-500">Loading…</p>}
      {table && (
        <div className="mt-4">
          <TableView table={table} onClose={() => onOpen('')} />
        </div>
      )}
    </section>
  );
}

function TableView({ table, onClose }: { table: ConjugationTable; onClose: () => void }) {
  const moodTone: Record<string, string> = {
    indicativo: 'text-teal-300',
    subjuntivo: 'text-violet-300',
    imperativo: 'text-amber-300',
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-baseline gap-3">
        <h3 className="font-serif text-xl text-slate-100">{table.infinitive}</h3>
        <span className="text-sm text-slate-500">{table.en}</span>
        <button
          onClick={onClose}
          className="ml-auto text-xs text-slate-500 transition hover:text-slate-300"
        >
          close
        </button>
      </div>

      {/* Wide on purpose, so it scrolls inside its own box rather than
          pushing the page sideways on a phone. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4 font-medium">Tense</th>
              {table.persons.map((p) => (
                <th key={p} className="pb-2 pr-3 font-medium">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.tense} className="border-t border-slate-800/70">
                <td className="py-1.5 pr-4">
                  <span className={moodTone[r.mood]}>{r.en}</span>
                  <span className="block font-serif text-[11px] text-slate-600">{r.es}</span>
                </td>
                {table.persons.map((p) => (
                  <td key={p} className="py-1.5 pr-3 font-serif text-slate-200">
                    {r.forms[p]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
