import Link from 'next/link';
import { allTopics, curriculumStats } from '@/lib/queries';
import { StatusPill } from '@/components/StatusPill';

export const dynamic = 'force-dynamic';

const LEVEL_BOOK: Record<string, string> = {
  A1: 'Foundations', A2: 'Foundations',
  B1: 'Breakthrough', B2: 'Breakthrough',
  C1: 'Mastery', C2: 'Mastery',
};

export default function Home() {
  const topics = allTopics();
  const stats = curriculumStats();
  const byLevel = new Map<string, typeof topics>();
  for (const t of topics) {
    byLevel.set(t.level_id, [...(byLevel.get(t.level_id) ?? []), t]);
  }

  return (
    <>
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.14em] text-teal-400">Curriculum</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {stats.topicsTotal} topics · {stats.errorsActive} active errors
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Topic order comes from the prerequisite graph, not from the book order. A topic
          unlocks when every hard prerequisite is mastered — and mastery needs spaced
          reviews plus spontaneous evidence, not one correct drill.
        </p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.byLevel.map((l) => (
          <div key={l.level} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-lg">{l.level}</span>
              <span className="text-xs text-slate-500">{LEVEL_BOOK[l.level]}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-800">
              <div
                className="h-full rounded bg-teal-500"
                style={{ width: `${(l.mastered / l.total) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {l.mastered} mastered · {l.available} open · {l.locked} locked
            </p>
          </div>
        ))}
      </div>

      {[...byLevel.entries()].map(([level, list]) => (
        <section key={level} className="mb-8">
          <h2 className="mb-3 border-b border-slate-800 pb-1.5 text-sm font-semibold uppercase tracking-widest text-slate-400">
            {level} <span className="ml-1 font-normal text-slate-600">{LEVEL_BOOK[level]}</span>
          </h2>
          <ul className="grid gap-1.5 md:grid-cols-2">
            {list.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/topics/${t.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 transition hover:border-teal-700/60 hover:bg-slate-900"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-100">{t.name_en}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {t.strand_en}
                      {t.book_ref ? ` · ${t.book_ref}` : ''}
                      {t.no_schedule ? ' · not scheduled' : ''}
                    </span>
                  </span>
                  <StatusPill status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
