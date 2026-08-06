'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { groupHits, search, type SearchDoc, type SearchHit } from '@/lib/search';
import { StatusPill } from './StatusPill';

/**
 * Cmd-K palette (SPEC §8). The whole index is a few hundred rows, so it ships
 * with the page and searching never touches the network.
 */
export function CommandPalette({ index }: { index: SearchDoc[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(() => search(index, query, 24), [index, query]);
  const groups = useMemo(() => groupHits(hits), [hits]);
  const flat = useMemo(() => groups.flatMap((g) => g.hits), [groups]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  function go(hit: SearchHit | undefined) {
    if (!hit) return;
    setOpen(false);
    router.push(hit.href);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-400 transition hover:border-teal-600 hover:text-slate-200"
      >
        <span>Search topics, errors…</span>
        <kbd className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, flat.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              go(flat[active]);
            }
          }}
          placeholder="hubiera · cuyo · la tema · reported speech…"
          className="w-full border-b border-slate-800 bg-transparent px-4 py-3.5 text-base text-slate-100 outline-none placeholder:text-slate-600"
        />

        <div className="max-h-[52vh] overflow-y-auto">
          {query && flat.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Nothing matches “{query}”.
            </p>
          )}
          {groups.map((group) => (
            <div key={group.kind}>
              <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </div>
              {group.hits.map((hit) => {
                const i = flat.indexOf(hit);
                return (
                  <button
                    key={`${hit.kind}-${hit.id}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(hit)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                      i === active ? 'bg-teal-500/10' : ''
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-100">{hit.title}</span>
                      <span className="block truncate text-xs text-slate-500">{hit.subtitle}</span>
                    </span>
                    {hit.level && (
                      <span className="rounded border border-slate-700 px-1.5 text-[10px] text-slate-500">
                        {hit.level}
                      </span>
                    )}
                    <StatusPill status={hit.status} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex gap-4 border-t border-slate-800 px-4 py-2 text-[11px] text-slate-600">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
