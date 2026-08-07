import Link from 'next/link';
import { db } from '@/lib/queries';
import { listQuarantined, quarantineSummary } from '@/lib/gauntlet';
import { POOL_TARGET, pregenerationPlan, recentPregenRuns } from '@/lib/pregenerate';

export const dynamic = 'force-dynamic';

/**
 * The content admin view (SPEC §5).
 *
 * §5 requires two things this page is the only home for. Quarantined content is
 * "never shown to the user, surfaced in an admin view" — a batch that failed
 * the panel three times is evidence about the *generator*, and silently
 * discarding it would hide a systematic fault behind an empty pool. And the
 * overnight job needs somewhere to report, because a job nobody can check on is
 * a job whose failure mode is silence.
 *
 * Not linked from the main navigation. It is a workshop, not a screen the
 * learner needs.
 */
export default function ContentPage() {
  const database = db();
  const runs = recentPregenRuns(database, 8);
  const plan = pregenerationPlan(database, 8);
  const quarantined = listQuarantined(database, 25);
  const reasons = quarantineSummary(database);

  const coverage = database
    .prepare(
      `SELECT count(*) AS topics,
              SUM(CASE WHEN n = 0 THEN 1 ELSE 0 END) AS empty,
              SUM(CASE WHEN n >= ? THEN 1 ELSE 0 END) AS stocked
         FROM (SELECT t.id,
                      (SELECT count(*) FROM content c
                        WHERE c.topic_id = t.id AND c.retired = 0) AS n
                 FROM topic t WHERE t.no_schedule = 0)`,
    )
    .get(POOL_TARGET) as { topics: number; empty: number; stocked: number };

  return (
    <>
      <div className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-slate-300">
          ← Progress
        </Link>
        <div className="flex-1" />
        <span className="text-slate-600">Content workshop</span>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat n={coverage.topics} label="schedulable topics" />
        <Stat n={coverage.stocked} label={`stocked (≥${POOL_TARGET})`} tone="text-teal-400" />
        <Stat n={coverage.empty} label="no drills at all" tone="text-red-400" />
        <Stat n={quarantined.length} label="quarantined" tone="text-amber-400" />
      </section>

      <Panel title="Overnight pre-generation">
        {runs.length === 0 ? (
          <p className="text-sm text-slate-500">
            The job has never run. <code className="text-slate-400">npm run pregenerate</code>, or
            put it in cron — §5 wants the pool filled while you sleep, because a session must never
            wait on generation.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Started</th>
                <th className="pb-2 font-medium">Outcome</th>
                <th className="pb-2 text-right font-medium">Accepted</th>
                <th className="pb-2 text-right font-medium">Quarantined</th>
                <th className="pb-2 text-right font-medium">Batches</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t border-slate-800/70">
                  <td className="py-1.5 text-slate-400">{r.startedAt.replace('T', ' ').slice(0, 16)}</td>
                  <td className="py-1.5">
                    <span
                      className={
                        r.outcome === 'ok'
                          ? 'text-teal-400'
                          : r.outcome === 'failed'
                            ? 'text-red-400'
                            : 'text-slate-500'
                      }
                    >
                      {r.outcome ?? 'interrupted'}
                    </span>
                    {r.error && <span className="ml-2 text-xs text-slate-600">{r.error}</span>}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-300">{r.accepted}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-400">{r.quarantined}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-500">{r.batches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Next in the queue">
        {plan.length === 0 ? (
          <p className="text-sm text-slate-500">
            Every recommended topic already has {POOL_TARGET} or more live drills.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {plan.map((t) => (
              <li key={t.topicId} className="flex items-baseline gap-3">
                <code className="text-slate-300">{t.topicId}</code>
                <span className="text-xs text-slate-600">{t.level}</span>
                <span className="ml-auto text-slate-500">
                  {t.have}/{POOL_TARGET}
                  <span className="ml-2 text-slate-600">needs {t.want}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Quarantine">
        <p className="mb-3 text-xs text-slate-600">
          Batches the panel refused three times. Never served. A cluster of the same reason is a
          generator fault, not bad luck.
        </p>
        {reasons.length > 0 && (
          <ul className="mb-4 space-y-1 text-sm">
            {reasons.map((r) => (
              <li key={r.reason} className="flex items-baseline gap-3">
                <span className="text-slate-400">{r.reason}</span>
                <span className="ml-auto tabular-nums text-slate-500">×{r.n}</span>
              </li>
            ))}
          </ul>
        )}
        {quarantined.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing quarantined.</p>
        ) : (
          <ul className="space-y-2">
            {quarantined.map((q) => (
              <li key={q.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
                  <code className="text-slate-400">{q.topicId ?? '—'}</code>
                  <span className="text-slate-600">{q.kind}</span>
                  <span className="text-amber-400/80">{q.reason}</span>
                  <span className="ml-auto text-slate-600">
                    {q.roundsUsed} rounds · {q.finalScore?.toFixed(1) ?? '—'}
                  </span>
                </div>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-serif text-xs text-slate-500">
                  {q.payload.slice(0, 400)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function Stat({ n, label, tone = 'text-slate-200' }: { n: number; label: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
      <div className={`font-serif text-2xl tabular-nums ${tone}`}>{n}</div>
      <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  );
}
