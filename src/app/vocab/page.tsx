import Link from 'next/link';
import { allVocab, dueVocab, vocabStats } from '@/lib/vocab';
import { VocabReview, type Card } from '@/components/VocabReview';

export const dynamic = 'force-dynamic';

const STAGE_LABEL: Record<string, string> = {
  new: 'Not started',
  recognizing: 'Recognise it',
  using: 'Use it',
  spontaneous: 'Reach for it',
};

const STAGE_TONE: Record<string, string> = {
  new: 'text-slate-500',
  recognizing: 'text-sky-300',
  using: 'text-amber-300',
  spontaneous: 'text-emerald-300',
};

export default function VocabPage() {
  const stats = vocabStats();
  const cards = dueVocab(12) as Card[];
  const all = allVocab();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-teal-400">Vocabulary</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {stats.spontaneous + stats.using} of {stats.total} words you can use
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Spaced repetition, with the last step withheld. A card can carry a word to{' '}
          <span className="text-amber-300">use it</span> — it cannot carry it to{' '}
          <span className="text-emerald-300">reach for it</span>, because recalling a word when
          asked is not the same as producing it unprompted. That promotion comes from a transcript.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { n: stats.due, l: 'due now', tone: 'text-teal-400' },
          { n: stats.new, l: 'not started', tone: 'text-slate-300' },
          { n: stats.recognizing, l: 'recognise', tone: 'text-sky-300' },
          { n: stats.using, l: 'use', tone: 'text-amber-300' },
          { n: stats.spontaneous, l: 'reach for', tone: 'text-emerald-300' },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
            <div className={`font-serif text-2xl tabular-nums ${s.tone}`}>{s.n}</div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500">{s.l}</div>
          </div>
        ))}
      </div>

      <VocabReview cards={cards} />

      <section>
        <h2 className="mb-3 flex items-center gap-3 border-b border-slate-800 pb-1.5 text-sm font-semibold uppercase tracking-widest text-slate-400">
          All words
          {stats.leaky > 0 && (
            <span className="ml-auto text-[11px] font-normal normal-case tracking-normal text-amber-500">
              {stats.leaky} forgotten at least once
            </span>
          )}
        </h2>
        <ul className="grid gap-1.5 md:grid-cols-2">
          {all.map((v) => (
            <li
              key={v.id}
              className="flex items-baseline gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-sm text-slate-100">{v.term}</span>
                <span className="block truncate text-xs text-slate-500">{v.gloss_en}</span>
              </span>
              <span
                className={`shrink-0 text-[10px] uppercase tracking-wide ${STAGE_TONE[v.stage]}`}
              >
                {STAGE_LABEL[v.stage]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-slate-500">
        Words reach <span className="text-emerald-300">reach for it</span> from the{' '}
        <Link href="/transcripts" className="text-teal-500 hover:text-teal-300">
          transcript review
        </Link>
        , where unprompted use is the evidence.
      </p>
    </div>
  );
}
