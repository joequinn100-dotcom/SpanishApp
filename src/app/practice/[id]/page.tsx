import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentItem, sessionById } from '@/lib/practice';
import { DrillRunner } from '@/components/DrillRunner';
import { EndSessionButton } from '@/components/EndSessionButton';

export const dynamic = 'force-dynamic';

/**
 * The drill runner.
 *
 * The item shown is derived from the session's stored cursor, not from client
 * state, so a refresh, a crash or a different tab all land on the same item.
 */
export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionById(Number(id));
  if (!session) redirect('/');

  // Every item answered: the session is over, and ending it writes the handoff.
  const item = currentItem(session);
  if (!item) redirect(`/practice/${session.id}/summary`);

  return (
    <>
      <div className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-slate-300">
          ← Progress
        </Link>
        <div className="flex-1" />
        <span className="text-slate-600">Session {session.id}</span>
        <EndSessionButton sessionId={session.id} />
      </div>

      <DrillRunner
        item={{
          sessionId: session.id,
          index: item.index,
          total: item.total,
          source: item.source,
          kind: item.kind,
          difficulty: item.difficulty,
          topicName: item.topicName,
          topicSlug: item.topicSlug,
          errorLabel: item.errorLabel,
          prompt: item.payload.prompt,
          context: item.payload.context,
          sentence: item.payload.sentence,
          hint: item.payload.hint,
        }}
      />
    </>
  );
}
