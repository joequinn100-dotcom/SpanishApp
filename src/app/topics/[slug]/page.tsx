import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dependentsOf, errorsForTopic, prerequisitesOf, topicBySlug } from '@/lib/queries';
import { SeverityDots, StatusPill } from '@/components/StatusPill';
import { TopicPlacement } from '@/components/PlacementControls';
import { StrandIcon, strandStyle } from '@/components/StrandIcon';
import { Diagram } from '@/components/diagrams';
import { PracticeTopicButton } from '@/components/PracticeTopicButton';
import { BossFightPanel } from '@/components/BossFightPanel';
import { bossAvailability, bossHistory } from '@/lib/challenge';

export const dynamic = 'force-dynamic';

function RelatedList({
  title, empty, items,
}: { title: string; empty: string; items: ReturnType<typeof prerequisitesOf> }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-600">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/topics/${r.slug}`}
                className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/40 px-2.5 py-1.5 transition hover:border-teal-700/60"
              >
                <span className="w-6 shrink-0 text-[10px] text-slate-500">{r.level_id}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{r.name_en}</span>
                {r.strength === 'hard' && (
                  <span className="shrink-0 rounded border border-slate-700 px-1 text-[10px] text-slate-500">
                    blocks
                  </span>
                )}
                <StatusPill status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) notFound();

  const prereqs = prerequisitesOf(topic.id);
  const dependents = dependentsOf(topic.id);
  const errors = errorsForTopic(topic.id);
  const blocking = prereqs.filter((p) => p.strength === 'hard' && p.status !== 'mastered');
  const attempts = bossHistory(topic.id);
  const bossCleared = attempts.some((a) => a.passed === true);
  const style = strandStyle(topic.strand_id);

  return (
    <article className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <div className="flex items-center gap-3">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${style.ring} ${style.bg} ${style.fg}`}
          >
            <StrandIcon strand={topic.strand_id} className="h-6 w-6" />
          </span>
          <div>
            <p className={`text-xs uppercase tracking-[0.14em] ${style.fg}`}>
              {topic.level_id} · {topic.strand_en}
            </p>
            <h1 className="text-2xl font-semibold">{topic.name_en}</h1>
          </div>
        </div>
        <p className="mt-1 font-serif text-lg text-slate-400">{topic.name_es}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <StatusPill status={topic.status} />
          {topic.book_ref && (
            <span className="rounded border border-slate-800 px-1.5 py-0.5">{topic.book_ref}</span>
          )}
          {!topic.book_ref && (
            <span className="rounded border border-slate-800 px-1.5 py-0.5">
              not covered by the books — authored
            </span>
          )}
          <span>{topic.est_minutes} min</span>
          {topic.no_schedule === 1 && (
            <span className="rounded border border-amber-800/60 bg-amber-500/10 px-1.5 py-0.5 text-amber-300">
              never scheduled (SPEC §10)
            </span>
          )}
        </div>

        <p className="mt-6 max-w-[68ch] font-serif text-[1.05rem] leading-[1.75] text-slate-300">
          {topic.summary}
        </p>

        {/* The picture goes above the fold, before the prerequisites and the
            error list — it is the part that makes the shape of the rule stick. */}
        <div className="mt-6 max-w-[68ch]">
          <Diagram topicId={topic.id} strand={topic.strand_id} />
        </div>

        {blocking.length > 0 && (
          <p className="mt-6 rounded-lg border-l-2 border-amber-600 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
            Locked. {blocking.length} hard{' '}
            {blocking.length === 1 ? 'prerequisite is' : 'prerequisites are'} not yet mastered:{' '}
            {blocking.map((b) => b.name_en).join(', ')}.
          </p>
        )}

        {errors.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Errors that trace here
            </h2>
            <ul className="space-y-1.5">
              {errors.map((e) => (
                <li
                  key={e.code}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
                >
                  <SeverityDots severity={e.severity} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{e.label_en}</span>
                    <span className="block truncate font-serif text-xs">
                      <span className="text-red-400 line-through">{e.wrong_example}</span>
                      <span className="mx-1.5 text-slate-600">→</span>
                      <span className="text-emerald-400">{e.right_example}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">×{e.occurrences}</span>
                  <StatusPill status={e.status} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="space-y-6">
        <PracticeTopicButton topicId={topic.id} />

        {/* Only once the topic is in play. A boss fight offered against a
            locked topic is noise on 90 pages out of 97. */}
        {(topic.status === 'consolidating' || bossCleared) && (
          <BossFightPanel
            topicId={topic.id}
            availability={bossAvailability(topic.id)}
            attempts={attempts.length}
            cleared={bossCleared}
          />
        )}

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Placement
          </h2>
          <TopicPlacement topicId={topic.id} status={topic.status} />
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Progress
          </h2>
          <dl className="space-y-1.5 text-sm">
            {[
              ['Attempts', topic.attempts],
              ['Correct', topic.correct],
              ['Rolling accuracy', `${Math.round(topic.accuracy * 100)}%`],
              ['Spontaneous uses', topic.spontaneous],
              ['Clean reviews', `${topic.reviews_passed} / 2`],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between">
                <dt className="text-slate-500">{k}</dt>
                <dd className="tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 border-t border-slate-800 pt-3 text-xs leading-relaxed text-slate-500">
            Mastery needs 80% over 12+ attempts, then two clean spaced reviews (+3d, +10d)
            and at least one spontaneous correct use.
          </p>
        </div>

        <RelatedList
          title="Prerequisites"
          empty="None — this is an entry point."
          items={prereqs}
        />
        <RelatedList
          title="Unlocks"
          empty="Nothing depends on this yet."
          items={dependents}
        />
      </aside>
    </article>
  );
}
