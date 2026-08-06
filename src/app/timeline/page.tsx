import Link from 'next/link';
import { timeline } from '@/lib/timeline';
import { positionOn, spread, LEVEL_ORDER } from '@/domain/timeline';
import { StrandIcon, strandStyle } from '@/components/StrandIcon';

export const dynamic = 'force-dynamic';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const BAND_TINT: Record<string, string> = {
  A1: 'bg-slate-700/30', A2: 'bg-slate-600/30', B1: 'bg-sky-800/30',
  B2: 'bg-teal-800/35', C1: 'bg-violet-900/30', C2: 'bg-violet-800/30',
};

/**
 * The Timeline — SPEC §8's centrepiece.
 *
 * A track from today to the exam, carrying the one number §8 says matters most:
 * where the current pace lands relative to 1 December. The page is built so
 * that number can be absent, because a projection with no evidence behind it is
 * worse than none — see domain/timeline.ts.
 */
export default function TimelinePage() {
  const t = timeline();
  const p = t.projection;
  // Nodes cluster hard at a healthy pace, so nudge them apart to stay legible.
  const nodeAt = spread(t.nodes.map((n) => n.position), 0.055);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-teal-400">Timeline</p>
        {p.date ? (
          <h1 className="mt-1 max-w-3xl text-2xl font-semibold leading-snug">
            At your current pace you reach the B2 threshold on{' '}
            <span className={p.onTrack ? 'text-teal-300' : 'text-rose-300'}>{fmt(p.date)}</span>
            {p.daysBeforeExam !== null && (
              <span className="text-slate-400">
                {' '}
                — {Math.abs(p.daysBeforeExam)} days{' '}
                {p.daysBeforeExam >= 0 ? 'before' : 'after'} your exam.
              </span>
            )}
          </h1>
        ) : (
          <h1 className="mt-1 max-w-3xl text-2xl font-semibold leading-snug text-slate-300">
            No projection yet.
          </h1>
        )}
        {p.reason && <p className="mt-2 max-w-2xl text-sm text-amber-300">{p.reason}</p>}
      </div>

      {/* The track */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="mb-6 flex items-baseline justify-between text-xs text-slate-500">
          <span>today · {fmt(t.now)}</span>
          <span>exam · {fmt(t.examDate)}</span>
        </div>

        <div className="relative h-40">
          {/* Level bands as background zones */}
          <div className="absolute inset-x-0 top-14 flex h-8 overflow-hidden rounded-md">
            {LEVEL_ORDER.map((l) => {
              const b = t.byLevel.find((x) => x.level === l)!;
              return (
                <div key={l} className={`relative flex-1 ${BAND_TINT[l]} border-r border-slate-950/60 last:border-0`}>
                  <span className="absolute inset-0 grid place-items-center text-[10px] font-medium tracking-widest text-slate-400">
                    {l}
                  </span>
                  <div
                    className="absolute inset-y-0 left-0 bg-teal-500/25"
                    style={{ width: `${b.total ? (b.mastered / b.total) * 100 : 0}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Where the system estimates you sit */}
          <div
            className="absolute top-8 -translate-x-1/2 text-center"
            style={{
              left: `${((LEVEL_ORDER.indexOf(t.level.band) + (t.level.plus ? 0.85 : 0.5)) / 6) * 100}%`,
            }}
          >
            <span className="whitespace-nowrap rounded-md border border-teal-600/60 bg-slate-950 px-2 py-0.5 text-[11px] text-teal-300">
              production · {t.level.band}{t.level.plus ? '+' : ''}
            </span>
            <div className="mx-auto mt-1 h-3 w-px bg-teal-600/60" />
          </div>

          {/* Time track */}
          <div className="absolute inset-x-0 bottom-6 h-px bg-slate-700" />
          <div
            className="absolute bottom-4 h-3 w-px bg-slate-500"
            style={{ left: '0%' }}
            title="today"
          />
          <div className="absolute bottom-4 right-0 h-3 w-px bg-rose-500" title="exam" />

          {/* Projection marker */}
          {p.date && (
            <div
              className="absolute bottom-2 -translate-x-1/2"
              style={{ left: `${positionOn(p.date, t.now, t.examDate) * 100}%` }}
            >
              <div
                className={`mx-auto h-6 w-px ${p.onTrack ? 'bg-teal-400' : 'bg-rose-400'}`}
              />
              <span
                className={`mt-1 block whitespace-nowrap rounded px-1.5 text-[10px] ${
                  p.onTrack ? 'bg-teal-500/15 text-teal-300' : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                B2 · {fmt(p.date)}
              </span>
            </div>
          )}

          {/* Topic nodes at their projected mastery date */}
          {t.nodes.slice(0, 10).map((n, i) => (
            <div
              key={n.id}
              className="group absolute bottom-8 -translate-x-1/2"
              style={{ left: `${nodeAt[i] * 100}%` }}
              title={`${n.name} · projected ${fmt(n.at)}`}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full border border-slate-700 bg-slate-950 ${strandStyle(n.strand).fg}`}
                style={{ opacity: 1 - i * 0.06 }}
              >
                <StrandIcon strand={n.strand} className="h-3 w-3" />
              </span>
              <span className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-300 group-hover:block">
                {n.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* The numbers behind it */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { n: `${t.target.mastered}/${t.target.total}`, l: 'B2 threshold topics', tone: 'text-teal-400' },
          { n: t.velocityPerWeek.toFixed(1), l: 'topics/week now', tone: 'text-slate-200' },
          {
            n: t.requiredPerWeek === null ? '—' : t.requiredPerWeek.toFixed(1),
            l: 'topics/week needed',
            tone:
              t.requiredPerWeek !== null && t.velocityPerWeek >= t.requiredPerWeek
                ? 'text-teal-400'
                : 'text-amber-400',
          },
          { n: t.daysToExam, l: 'days left', tone: 'text-slate-200' },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
            <div className={`font-serif text-2xl tabular-nums ${s.tone}`}>{s.n}</div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500">{s.l}</div>
          </div>
        ))}
      </div>

      {t.requiredPerWeek !== null && t.velocityPerWeek < t.requiredPerWeek && (
        <p className="rounded-lg border-l-2 border-amber-600 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
          {t.velocityPerWeek === 0
            ? `Nothing mastered in the last four weeks. Clearing the B2 threshold by 1 December needs ${t.requiredPerWeek.toFixed(1)} topics a week from here.`
            : `You are mastering ${t.velocityPerWeek.toFixed(1)} topics a week; the exam date needs ${t.requiredPerWeek.toFixed(1)}. ${
                t.sessionsPerWeek > 0
                  ? `At ${t.sessionsPerWeek.toFixed(1)} sessions a week, that gap closes with roughly ${Math.ceil((t.requiredPerWeek / Math.max(t.velocityPerWeek, 0.1)) * t.sessionsPerWeek)} sessions a week — or by narrowing what counts as the target.`
                  : 'Start with one session; the projection recomputes from real evidence.'
              }`}
        </p>
      )}

      {/* Errors falling off the timeline */}
      <section>
        <h2 className="mb-1 border-b border-slate-800 pb-1.5 text-sm font-semibold uppercase tracking-widest text-slate-400">
          Errors falling off
        </h2>
        <p className="mb-4 mt-2 max-w-2xl text-sm text-slate-500">
          §4 will not let one of these go on a clean streak alone — a streak is capped at half the
          bar. The rest is spontaneous evidence from a transcript, then 21 silent days.
        </p>
        <ul className="space-y-1.5">
          {t.errors.map((e) => (
            <li
              key={e.code}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                e.status === 'resolved'
                  ? 'border-emerald-900/50 bg-emerald-500/[0.04] opacity-60'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm ${e.status === 'resolved' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {e.label}
                </span>
                <span className="mt-1 block h-1 overflow-hidden rounded bg-slate-800">
                  <span
                    className={`block h-full rounded ${e.status === 'resolved' ? 'bg-emerald-500' : 'bg-teal-500'}`}
                    style={{ width: `${e.progress * 100}%` }}
                  />
                </span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-slate-500">
                {e.status === 'resolved' ? 'gone' : `${Math.round(e.progress * 100)}%`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-slate-500">
        The projection recomputes from real evidence after every session.{' '}
        <Link href="/" className="text-teal-500 hover:text-teal-300">Back to progress</Link>
      </p>
    </div>
  );
}
