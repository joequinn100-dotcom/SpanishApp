'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reviewVocabCard } from '@/app/actions';
import type { Recall } from '@/domain/srs';

export interface Card {
  id: number;
  term: string;
  gloss_en: string;
  example_es: string;
  category: string;
  level_id: string;
  stage: string;
  reps: number;
  lapses: number;
  direction: 'es_to_en' | 'en_to_es';
}

/**
 * One vocabulary card.
 *
 * Self-graded, which is unusual for this app and deliberate: a typed answer
 * would be graded on spelling, and the question a flashcard asks is whether the
 * word came to mind — something only the person can honestly report. The three
 * buttons are the three states a person can actually distinguish.
 */
export function VocabReview({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const [, start] = useTransition();

  const card = cards[i];

  const grade = (recall: Recall) => {
    if (!card) return;
    start(async () => {
      const r = await reviewVocabCard(card.id, recall);
      setNote(r.note);
      setDone((n) => n + 1);
      setShown(false);
      if (i + 1 >= cards.length) router.refresh();
      else setI(i + 1);
    });
  };

  // Space reveals, 1/2/3 grade — the pattern every SRS user already knows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === ' ' && !shown) { e.preventDefault(); setShown(true); return; }
      if (!shown) return;
      if (e.key === '1') { e.preventDefault(); grade('again'); }
      if (e.key === '2') { e.preventDefault(); grade('good'); }
      if (e.key === '3') { e.preventDefault(); grade('easy'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!card) {
    return (
      <section className="rounded-xl border border-teal-700/40 bg-teal-500/5 p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-teal-400">Nothing due</p>
        <p className="mt-2 text-sm text-slate-300">
          {done > 0
            ? `${done} ${done === 1 ? 'card' : 'cards'} reviewed. The rest come back on their own schedule.`
            : 'No cards are due right now. They will reappear when their interval elapses.'}
        </p>
      </section>
    );
  }

  const front = card.direction === 'es_to_en' ? card.term : card.gloss_en;
  const back = card.direction === 'es_to_en' ? card.gloss_en : card.term;

  return (
    <section>
      <div className="mb-1 flex items-center gap-3 text-xs text-slate-500">
        <span>{done + 1} of {cards.length}</span>
        <span className="flex-1" />
        <span className="text-slate-600">
          {card.direction === 'es_to_en' ? 'What does this mean?' : 'Say it in Spanish'}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-teal-400 transition-[width] duration-300"
             style={{ width: `${(done / cards.length) * 100}%` }} />
      </div>

      <article className="mt-5 rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
          <span>{card.level_id}</span>
          <span>·</span>
          <span>{card.category.replace('_', ' ')}</span>
          {card.lapses > 0 && <span className="text-amber-500">· forgotten {card.lapses}×</span>}
        </div>

        <p className={`mt-4 font-serif ${card.direction === 'es_to_en' ? 'text-3xl text-slate-100' : 'text-2xl text-slate-300'}`}>
          {front}
        </p>

        {!shown ? (
          <button
            onClick={() => setShown(true)}
            className="mt-8 rounded-lg bg-slate-100 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-white"
          >
            Show answer <span className="ml-1 opacity-60">space</span>
          </button>
        ) : (
          <>
            <p className="mt-4 font-serif text-3xl text-teal-300">{back}</p>
            <p className="mx-auto mt-5 max-w-lg border-t border-slate-800 pt-5 font-serif text-base leading-relaxed text-slate-400">
              {card.example_es}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <button onClick={() => grade('again')}
                className="rounded-lg border border-rose-800/60 px-4 py-2 text-sm text-rose-300 transition hover:border-rose-600">
                Didn&rsquo;t know it <span className="opacity-50">1</span>
              </button>
              <button onClick={() => grade('good')}
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-teal-400">
                Got it <span className="opacity-60">2</span>
              </button>
              <button onClick={() => grade('easy')}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500">
                Instant <span className="opacity-50">3</span>
              </button>
            </div>
          </>
        )}
      </article>

      {note && <p className="mt-3 text-center text-sm text-amber-300">{note}</p>}
    </section>
  );
}
