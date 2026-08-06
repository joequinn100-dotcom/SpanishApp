import Link from 'next/link';
import { allTranscripts } from '@/lib/transcripts';
import { TranscriptUpload } from '@/components/TranscriptUpload';

export const dynamic = 'force-dynamic';

export default function TranscriptsPage() {
  const list = allTranscripts();

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Transcripts</h1>
      <p className="mb-6 max-w-2xl text-sm text-slate-400">
        What you actually said in class is better evidence than any drill, because it is unprompted.
        SPEC §4 is explicit about it: an error is only ever marked resolved on the strength of
        spontaneous correct use, and this is where that evidence comes from.
      </p>

      <TranscriptUpload />

      <section className="mt-8">
        <h2 className="mb-3 border-b border-slate-800 pb-1.5 text-sm font-semibold uppercase tracking-widest text-slate-400">
          Uploaded
        </h2>
        {list.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing yet. Paste a class transcript above and the app will tell you what to work on.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/transcripts/${t.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3 transition hover:border-teal-700/60 hover:bg-slate-900"
                >
                  <span className="text-sm text-slate-100">
                    {t.title || `Class of ${t.class_date}`}
                  </span>
                  <span className="text-xs text-slate-500">{t.class_date}</span>
                  <span className="flex-1" />
                  {t.pending > 0 ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                      {t.pending} to review
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                      reviewed
                    </span>
                  )}
                  <span className="text-xs text-slate-600">{t.total} findings</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
