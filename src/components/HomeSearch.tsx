'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { beginSession } from '@/app/actions';
import { search, groupHits, type SearchDoc, type SearchHit } from '@/lib/search';
import { StrandIcon, strandStyle } from '@/components/StrandIcon';
import { StatusPill } from '@/components/StatusPill';

/**
 * Search on the home page.
 *
 * The Cmd-K palette in the header does the same job, but a shortcut you have to
 * know about is invisible — and "I want to study the pluperfect subjunctive
 * today" is the most direct thing anyone will ever ask this app. So the box is
 * on the page, and every result carries a Practise button: finding the topic
 * and starting on it should not be two separate journeys.
 *
 * Matching is fuzzy and alias-aware (SPEC §8): typing «hubiera» lands on
 * pluperfect subjunctive, «cuyo» on relative pronouns, and a half-remembered
 * spelling still finds its topic.
 */
export function HomeSearch({
  index,
  strands,
}: {
  index: SearchDoc[];
  /** topic id → strand, so a result can carry its strand colour. */
  strands: Record<string, string>;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(() => (q.trim() ? search(index, q, 8) : []), [q, index]);
  const groups = useMemo(() => groupHits(hits), [hits]);
  const flat = useMemo(() => groups.flatMap((g) => g.hits), [groups]);

  function open(hit: SearchHit) {
    router.push(hit.href);
  }

  function practise(hit: SearchHit) {
    // Only a topic can be the focus of a session; an error is already covered
    // by the warm-up, which every session runs regardless.
    if (hit.kind !== 'topic') return open(hit);
    start(() => beginSession(hit.id));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flat[active]) {
      e.preventDefault();
      // Enter opens; Cmd/Ctrl+Enter starts practising it straight away.
      if (e.metaKey || e.ctrlKey) practise(flat[active]);
      else open(flat[active]);
    } else if (e.key === 'Escape') {
      setQ('');
    }
  }

  return (
    <section className="relative">
      <label className="sr-only" htmlFor="home-search">
        Search topics, errors and vocabulary
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 transition focus-within:border-teal-600/60">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-500" fill="none"
             stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          id="home-search"
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="What do you want to study? Try «pluperfect subjunctive», «hubiera», «cuyo»…"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
        />
        {q && (
          <button
            onClick={() => {
              setQ('');
              inputRef.current?.focus();
            }}
            className="shrink-0 text-xs text-slate-500 transition hover:text-slate-300"
          >
            clear
          </button>
        )}
      </div>

      {q.trim() !== '' && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur">
          {flat.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">
              Nothing matches «{q}». Search covers topic names in English and Spanish, grammatical
              forms, and your error log.
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.kind}>
                <p className="border-b border-slate-800/70 bg-slate-900/40 px-4 py-1.5 text-[10px] uppercase tracking-widest text-slate-500">
                  {g.label}
                </p>
                <ul>
                  {g.hits.map((h) => {
                    const i = flat.indexOf(h);
                    const strand = strands[h.id];
                    return (
                      <li key={h.kind + h.id}>
                        <div
                          onMouseEnter={() => setActive(i)}
                          className={`flex items-center gap-3 px-4 py-2.5 transition ${
                            i === active ? 'bg-slate-900' : ''
                          }`}
                        >
                          <button
                            onClick={() => open(h)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            {strand ? (
                              <span className={`shrink-0 ${strandStyle(strand).fg}`}>
                                <StrandIcon strand={strand} className="h-4 w-4" />
                              </span>
                            ) : (
                              <span className="w-4 shrink-0" />
                            )}
                            {h.level && (
                              <span className="shrink-0 text-[10px] text-slate-500">{h.level}</span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-slate-100">{h.title}</span>
                              <span className="block truncate font-serif text-xs text-slate-500">
                                {h.subtitle}
                              </span>
                            </span>
                            <StatusPill status={h.status} />
                          </button>
                          {h.kind === 'topic' && (
                            <button
                              onClick={() => practise(h)}
                              disabled={pending}
                              className="shrink-0 rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition hover:border-teal-600 hover:text-teal-300 disabled:opacity-40"
                            >
                              {pending ? '…' : 'Practise'}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
          <p className="border-t border-slate-800/70 px-4 py-1.5 text-[10px] text-slate-600">
            ↑↓ to move · Enter to open · ⌘Enter to start practising
          </p>
        </div>
      )}
    </section>
  );
}
