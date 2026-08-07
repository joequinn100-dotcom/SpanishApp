import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentItem, sessionById } from '@/lib/practice';
import { challengeStatus, sprintBoard } from '@/lib/challenge';
import { TOPIC } from '@/domain/mastery';
import { SPRINT } from '@/domain/challenge';
import { DrillRunner } from '@/components/DrillRunner';
import { AbandonRunButton } from '@/components/AbandonRunButton';

export const dynamic = 'force-dynamic';

/**
 * SPEC §8's two challenges: the boss fight and the Gauntlet Run.
 *
 * A separate route from `/practice/[id]` even though both are sessions, because
 * the stakes are the chrome. A boss fight that looked like an ordinary session
 * would be an ordinary session — the learner needs to see, before answering,
 * that there are no hints, no retries, and that failing costs the topic its
 * consolidation.
 *
 * Same runner underneath: the drill mechanic is not what differs.
 */
export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionById(Number(id));
  const status = session ? challengeStatus(session.id) : null;
  if (!session || !status) redirect('/');

  if (status.finished) return <Result status={status} />;

  const item = currentItem(session);
  // A run whose queue is exhausted but which was not closed by the scorer
  // should not offer a blank page.
  if (!item) return <Result status={status} />;

  const boss = status.kind === 'boss';

  return (
    <>
      <div className="mb-6 flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          {boss ? `Boss fight · ${status.topicName}` : 'Gauntlet Run'}
        </span>
        <div className="flex-1" />
        {boss ? (
          <span className="text-slate-500">
            {status.correct} right · {TOPIC.BOSS_PASS} to clear
          </span>
        ) : (
          <Lives left={status.livesLeft ?? SPRINT.LIVES} />
        )}
        <AbandonRunButton sessionId={session.id} kind={status.kind} />
      </div>

      <div className="mx-auto mb-4 max-w-2xl rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs text-amber-200/80">
        {boss
          ? `Unaided: no hints, no retries. ${TOPIC.BOSS_PASS} of ${TOPIC.BOSS_ITEMS} clears the topic. Falling short sends it back to studying.`
          : `Ten items from your active errors. Three lives. The clock is running.`}
      </div>

      <DrillRunner
        key={`${session.id}:${item.index}`}
        item={{
          sessionId: session.id,
          index: item.index,
          total: item.total,
          source: item.source,
          kind: item.kind,
          difficulty: item.difficulty,
          topicName: item.topicName,
          topicSlug: item.topicSlug,
          topicId: item.topicId,
          strandId: item.strandId,
          errorCode: item.errorCode,
          errorLabel: item.errorLabel,
          prompt: item.payload.prompt,
          context: item.payload.context,
          sentence: item.payload.sentence,
          // Deliberately dropped: §8 says the boss fight is unaided, and the
          // Gauntlet Run is timed. Passing the hint through and hiding it in
          // the client would leave it in the page source.
          hint: undefined,
        }}
      />
    </>
  );
}

function Lives({ left }: { left: number }) {
  return (
    <span className="flex items-center gap-1" title={`${left} lives left`}>
      {Array.from({ length: SPRINT.LIVES }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i < left ? 'bg-rose-400' : 'bg-slate-700'}`}
        />
      ))}
    </span>
  );
}

function Result({ status }: { status: NonNullable<ReturnType<typeof challengeStatus>> }) {
  const boss = status.kind === 'boss';
  const won = boss ? status.passed === true : status.outcome === 'cleared';
  const board = boss ? [] : sprintBoard(5);
  const seconds = status.durationMs === undefined ? null : status.durationMs / 1000;
  const best = status.previousBest ?? null;

  return (
    <>
      <div className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-slate-300">
          ← Progress
        </Link>
      </div>

      <section
        className={`rounded-xl border p-6 ${
          won ? 'border-teal-500/40 bg-teal-500/5' : 'border-rose-500/40 bg-rose-500/5'
        }`}
      >
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
          {boss ? `Boss fight · ${status.topicName}` : 'Gauntlet Run'}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">
          {boss
            ? won
              ? `Cleared — ${status.correct}/${TOPIC.BOSS_ITEMS}`
              : `Failed — ${status.correct} right, ${TOPIC.BOSS_PASS} needed`
            : status.outcome === 'cleared'
              ? `Cleared in ${seconds?.toFixed(1)}s`
              : status.outcome === 'abandoned'
                ? 'Abandoned'
                : `Out of lives at item ${status.answered}`}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          {boss
            ? won
              ? 'Two spaced reviews, a spontaneous use in a transcript, and now twelve items unaided. The topic is mastered — that is the strongest claim this app makes about you, and it took all three.'
              : 'The topic goes back to studying. Not a punishment: an unaided run is the only test that distinguishes knowing the rule from recognising the drill, and this one says the consolidation had not held yet.'
            : status.outcome === 'cleared'
              ? best === null
                ? 'First clean run. That is the time to beat.'
                : (status.durationMs ?? 0) < best.durationMs
                  ? `A new personal best, ${(((best.durationMs - (status.durationMs ?? 0))) / 1000).toFixed(1)}s faster than your last.`
                  : `Your best is still ${(best.durationMs / 1000).toFixed(1)}s.`
              : 'Every item in that run came from your own error log, so the ones that ended it are worth a look.'}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link
            href="/"
            className="rounded-lg bg-teal-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-teal-400"
          >
            Back to progress
          </Link>
          {boss && status.topicSlug && (
            <Link
              href={`/topics/${status.topicSlug}`}
              className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 transition hover:border-slate-500"
            >
              Open the topic
            </Link>
          )}
        </div>
      </section>

      {!boss && board.length > 0 && (
        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-sm uppercase tracking-[0.14em] text-slate-400">
            Your fastest clean runs
          </h2>
          <ol className="mt-3 space-y-1 text-sm">
            {board.map((r, i) => (
              <li
                key={r.id}
                className={`flex items-baseline gap-3 ${
                  r.id === status.sessionId ? 'text-teal-300' : 'text-slate-400'
                }`}
              >
                <span className="w-5 text-slate-600">{i + 1}</span>
                <span className="font-medium">{(r.durationMs / 1000).toFixed(1)}s</span>
                <span className="text-slate-600">
                  {r.correct}/{SPRINT.ITEMS} · {r.livesLeft} {r.livesLeft === 1 ? 'life' : 'lives'} left
                </span>
                <span className="ml-auto text-xs text-slate-700">{r.startedAt.slice(0, 10)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
