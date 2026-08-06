import Link from 'next/link';
import { nextUp, progress, topErrors } from '@/lib/progress';
import { dueReviewCount, firstTopicWithContent, openSession, planOf, streak } from '@/lib/practice';
import { latestHandoff } from '@/lib/handoff';
import { SeverityDots, StatusPill } from '@/components/StatusPill';
import { StrandIcon, strandStyle } from '@/components/StrandIcon';
import { SessionCta } from '@/components/SessionCta';
import { HomeSearch } from '@/components/HomeSearch';
import { allTopics, searchIndex } from '@/lib/queries';

export const dynamic = 'force-dynamic';

function Ring({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : done / total;
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="9"
              className="text-slate-800" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="9"
              strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
              className="text-teal-400 transition-[stroke-dashoffset] duration-700" />
    </svg>
  );
}

export default function Home() {
  const p = progress();
  const next = nextUp(4);
  const errors = topErrors(4);
  const pct = Math.round((p.masteredTopics / p.totalTopics) * 100);

  // Resume state (Build Principle 4). Both of these read from SQLite, so
  // "where you left off" survives a restart, a crash and a closed laptop.
  const open = openSession();
  const openPlan = open ? planOf(open) : null;
  const last = latestHandoff();
  // Search deeper than the four shown: content coverage is partial, and the
  // best topic with drills written for it is often below the visible fold.
  const candidates = nextUp(15);
  const focusId = firstTopicWithContent(candidates.map((t) => t.id));
  const focus = candidates.find((t) => t.id === focusId) ?? null;

  // The search corpus is a few hundred rows, small enough to ship whole and
  // match in the browser — which is what makes it feel instant (SPEC §8).
  const index = searchIndex();
  const strands = Object.fromEntries(allTopics().map((t) => [t.id, t.strand_id]));

  return (
    <>
      <div className="mb-6 space-y-4">
        <HomeSearch index={index} strands={strands} />
        <SessionCta
          openSessionId={open?.id ?? null}
          answered={open?.cursor ?? 0}
          total={openPlan?.items.length ?? 0}
          focusTopicId={focus?.id ?? null}
          focusTopicName={focus?.name_en ?? null}
          streak={streak().current}
          reviewsDue={dueReviewCount()}
        />
        {!open && last && (
          <p className="mt-2 text-xs text-slate-500">
            Last session: {last.handoff.duration_min} min, {last.handoff.xp} XP.{' '}
            {last.handoff.next_recommendation.why}{' '}
            <Link
              href={`/practice/${last.sessionId}/summary`}
              className="text-teal-500 hover:text-teal-300"
            >
              handoff →
            </Link>
          </p>
        )}
      </div>

      {/* Headline: completion, and time against the exam. SPEC §8 — visible
          convergence on a target is the mechanic that works for an adult with
          a certification date. */}
      <section className="mb-8 grid gap-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="relative grid place-items-center">
          <Ring done={p.masteredTopics} total={p.totalTopics} />
          <div className="absolute text-center">
            <div className="font-serif text-3xl tabular-nums leading-none">
              {p.masteredTopics}
              <span className="text-slate-600">/{p.totalTopics}</span>
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-widest text-slate-500">
              modules
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.14em] text-teal-400">Progress</p>
          <h1 className="mt-1 text-2xl font-semibold">
            {p.masteredTopics} of {p.totalTopics} modules completed
            <span className="ml-2 text-slate-500">({pct}%)</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            {p.daysToExam} days to the B2 exam — {p.weeksToExam} weeks. {p.errorsLive} errors
            still live, {p.errorsResolved} cleared.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { n: p.masteredTopics, l: 'mastered', tone: 'text-teal-400' },
              { n: p.errorsLive, l: 'live errors', tone: 'text-red-400' },
              { n: p.daysToExam, l: 'days left', tone: 'text-slate-200' },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
                <div className={`font-serif text-2xl tabular-nums ${s.tone}`}>{s.n}</div>
                <div className="text-[11px] uppercase tracking-widest text-slate-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per-level breakdown */}
      <section className="mb-8">
        <div className="mb-3 flex items-baseline justify-between border-b border-slate-800 pb-1.5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            By level
          </h2>
          <Link href="/curriculum" className="text-xs text-teal-500 hover:text-teal-300">
            full curriculum →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {p.byLevel.map((l) => (
            <div key={l.level} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-lg">{l.level}</span>
                <span className="tabular-nums text-sm text-slate-400">
                  {l.mastered}<span className="text-slate-600">/{l.total}</span>
                </span>
              </div>
              <div className="mt-2 flex h-1.5 overflow-hidden rounded bg-slate-800">
                <div className="bg-teal-500" style={{ width: `${(l.mastered / l.total) * 100}%` }} />
                <div className="bg-amber-500" style={{ width: `${(l.inProgress / l.total) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {l.inProgress} in progress · {l.available} open · {l.locked} locked
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Resume: what to do next, ranked by leverage in the graph */}
        <section>
          <h2 className="mb-3 border-b border-slate-800 pb-1.5 text-sm font-semibold uppercase tracking-widest text-slate-400">
            Pick up here
          </h2>
          {next.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nothing open yet. Mark what you already know on the{' '}
              <Link href="/curriculum" className="text-teal-500 hover:text-teal-300">
                curriculum page
              </Link>{' '}
              and the graph will open the next layer.
            </p>
          ) : (
            <ul className="space-y-2">
              {next.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/topics/${t.slug}`}
                    className="block rounded-lg border border-slate-800 bg-slate-900/40 p-3 transition hover:border-teal-700/60 hover:bg-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <span className={strandStyle(t.strand_id).fg}>
                        <StrandIcon strand={t.strand_id} className="h-4 w-4" />
                      </span>
                      <span className="text-[10px] text-slate-500">{t.level_id}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-100">
                        {t.name_en}
                      </span>
                      {t.unlocks > 0 && (
                        <span className="shrink-0 rounded border border-slate-700 px-1.5 text-[10px] text-slate-500">
                          unlocks {t.unlocks}
                        </span>
                      )}
                      <StatusPill status={t.status} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {t.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* The errors a session would warm up on */}
        <section>
          <div className="mb-3 flex items-baseline justify-between border-b border-slate-800 pb-1.5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Warm-up targets
            </h2>
            <Link href="/errors" className="text-xs text-teal-500 hover:text-teal-300">
              error log →
            </Link>
          </div>
          <ul className="space-y-2">
            {errors.map((e) => (
              <li
                key={e.code}
                className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <SeverityDots severity={e.severity} />
                  <span className="min-w-0 flex-1 truncate text-sm">{e.label_en}</span>
                  <span className="shrink-0 text-xs text-slate-500">×{e.occurrences}</span>
                  <StatusPill status={e.status} />
                </div>
                <p className="mt-1 truncate font-serif text-xs">
                  <span className="text-red-400 line-through">{e.wrong_example}</span>
                  <span className="mx-1.5 text-slate-600">→</span>
                  <span className="text-emerald-400">{e.right_example}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
