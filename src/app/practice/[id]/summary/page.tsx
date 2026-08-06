import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sessionById } from '@/lib/practice';
import { buildHandoff, handoffMarkdown, type Handoff } from '@/lib/handoff';
import { CopyButton } from '@/components/CopyButton';
import { FinishSessionForm } from '@/components/FinishSessionForm';

export const dynamic = 'force-dynamic';

/**
 * End of session: what happened, and the SPEC §7 handoff.
 *
 * If the session is still open the handoff is built but not written — you see a
 * preview and a button that commits it. Nothing is saved to disk by looking at
 * a page.
 */
export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionById(Number(id));
  if (!session) redirect('/');

  const saved = session.ended_at !== null && session.handoff_json !== null;
  const handoff: Handoff = saved
    ? (JSON.parse(session.handoff_json!) as Handoff)
    : buildHandoff(session, new Date().toISOString());
  const markdown = saved ? session.handoff_md! : handoffMarkdown(handoff);

  return (
    <>
      <div className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-slate-300">
          ← Progress
        </Link>
        <div className="flex-1" />
        <span className="text-slate-600">Session {session.id}</span>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-teal-400">
          {saved ? 'Session saved' : 'Session in progress'}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">
          {handoff.duration_min} min · {handoff.xp} XP · streak {handoff.streak}
        </h1>
        {!saved && (
          <p className="mt-2 text-sm text-slate-400">
            Not written to disk yet. Ending the session writes the handoff to{' '}
            <code className="text-slate-300">./handoffs</code>.
          </p>
        )}
        {!saved && <FinishSessionForm sessionId={session.id} />}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Worked on">
          {handoff.worked_on.length === 0 && <Empty>Nothing logged.</Empty>}
          {handoff.worked_on.map((w) => (
            <Row key={w.topic_id}>
              <code className="text-slate-300">{w.topic_id}</code>
              <span className="text-slate-500">
                {Math.round(w.accuracy * 100)}% over {w.attempts} · {w.status}
              </span>
            </Row>
          ))}
        </Panel>

        <Panel title="Errors this session">
          {handoff.errors_committed.length === 0 && handoff.errors_avoided.length === 0 && (
            <Empty>No error evidence recorded.</Empty>
          )}
          {handoff.errors_committed.map((e) => (
            <Row key={e.code}>
              <code className="text-rose-300">{e.code}</code>
              <span className="text-slate-500">committed ×{e.count}</span>
            </Row>
          ))}
          {handoff.errors_avoided.map((e) => (
            <Row key={e.code}>
              <code className="text-teal-300">{e.code}</code>
              <span className="text-slate-500">
                clean streak {e.clean_streak} · {e.status}
              </span>
            </Row>
          ))}
        </Panel>
      </div>

      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xs uppercase tracking-[0.14em] text-slate-500">Next</h2>
        <p className="mt-2 font-serif text-lg text-slate-100">
          {handoff.next_recommendation.primary ?? 'Pick anything unlocked.'}
        </p>
        <p className="mt-1 text-sm text-slate-400">{handoff.next_recommendation.why}</p>
        {handoff.next_recommendation.then.length > 0 && (
          <p className="mt-3 text-sm text-slate-500">
            Then: {handoff.next_recommendation.then.join(', ')}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-600">
          {handoff.next_recommendation.why_that_order}
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Handoff (SPEC §7)
          </h2>
          <div className="flex-1" />
          <CopyButton text={markdown} />
        </div>
        <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-400">
          {markdown}
        </pre>
      </section>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <h2 className="text-xs uppercase tracking-[0.14em] text-slate-500">{title}</h2>
      <div className="mt-3 space-y-2 text-sm">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-baseline justify-between gap-2">{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600">{children}</p>;
}
