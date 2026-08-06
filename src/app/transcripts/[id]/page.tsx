import Link from 'next/link';
import { redirect } from 'next/navigation';
import { findingsFor, forLorena, transcriptById } from '@/lib/transcripts';
import { db } from '@/lib/queries';
import { FindingReview, type ReviewFinding } from '@/components/FindingReview';
import { CopyButton } from '@/components/CopyButton';

export const dynamic = 'force-dynamic';

/**
 * One transcript: the findings to review, and — once reviewed — the three
 * things §6 says to raise with Lorena, because they are the ones the app cannot
 * fix on its own.
 */
export default async function TranscriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = transcriptById(Number(id));
  if (!t) redirect('/transcripts');

  const rows = findingsFor(t.id);
  const database = db();

  const findings: ReviewFinding[] = rows.map((f) => {
    const err = f.error_code
      ? (database.prepare('SELECT label_en FROM error WHERE code = ?').get(f.error_code) as
          | { label_en: string }
          | undefined)
      : undefined;
    const top = f.topic_id
      ? (database.prepare('SELECT name_en FROM topic WHERE id = ?').get(f.topic_id) as
          | { name_en: string }
          | undefined)
      : undefined;
    return {
      id: f.id,
      kind: f.kind,
      errorCode: f.error_code,
      errorLabel: err?.label_en ?? f.proposed_label,
      topicId: f.topic_id,
      topicName: top?.name_en ?? null,
      quote: f.quote,
      correction: f.correction,
      explanation: f.explanation,
      confidence: f.confidence,
      systematic: f.systematic,
      decision: f.decision,
    };
  });

  const meta = t.analysis_json ? (JSON.parse(t.analysis_json) as { learner_words?: number; analyzer?: string }) : {};
  const errors = findings.filter((f) => f.kind === 'error');
  const positives = findings.filter((f) => f.kind === 'positive');
  const accepted = rows.filter((f) => f.decision === 'accepted');
  const lorena = forLorena(t.id);

  return (
    <>
      <div className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/transcripts" className="text-slate-500 transition hover:text-slate-300">
          ← Transcripts
        </Link>
        <div className="flex-1" />
        <span className="text-slate-600">{t.class_date}</span>
      </div>

      <h1 className="text-2xl font-semibold">{t.title || `Class of ${t.class_date}`}</h1>
      <p className="mt-1 text-sm text-slate-400">
        {meta.learner_words ?? 0} words of your own Spanish · {errors.length} possible errors ·{' '}
        {positives.length} things that went well
        {meta.analyzer === 'rules' && (
          <span className="text-slate-600"> · rule-based analysis, not the §5 gauntlet</span>
        )}
      </p>

      <div className="mt-6">
        <FindingReview transcriptId={t.id} findings={findings} />
      </div>

      {lorena.length > 0 && (
        <section className="mt-8 rounded-xl border border-amber-800/40 bg-amber-500/[0.03] p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xs uppercase tracking-[0.14em] text-amber-400">
              Raise with Lorena next class
            </h2>
            <div className="flex-1" />
            <CopyButton
              text={lorena.map((l, i) => `${i + 1}. ${l.label} — ${l.why}`).join('\n')}
            />
          </div>
          <p className="mt-2 text-sm text-slate-400">
            The things the app cannot fix alone, because they need live spoken correction.
          </p>
          <ol className="mt-4 space-y-3">
            {lorena.map((l, i) => (
              <li key={l.code} className="flex gap-3 text-sm">
                <span className="font-serif text-lg text-amber-500">{i + 1}</span>
                <div>
                  <p className="text-slate-200">{l.label}</p>
                  <p className="mt-0.5 text-slate-500">{l.why}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {accepted.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 border-b border-slate-800 pb-1.5 text-sm font-semibold uppercase tracking-widest text-slate-400">
            Applied to your log
          </h2>
          <ul className="space-y-1.5 text-sm">
            {accepted.map((f) => (
              <li key={f.id} className="flex flex-wrap items-baseline gap-2">
                <span className={f.kind === 'error' ? 'text-rose-400' : 'text-teal-400'}>
                  {f.kind === 'error' ? '−' : '+'}
                </span>
                <code className="text-slate-300">{f.error_code ?? f.topic_id}</code>
                <span className="min-w-0 flex-1 truncate text-slate-600">{f.quote}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <summary className="cursor-pointer text-sm text-slate-400">
          Your turns, as the app read them
        </summary>
        <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-400">
          {t.learner_text || '(nothing extracted — check the speaker you picked)'}
        </pre>
      </details>
    </>
  );
}
