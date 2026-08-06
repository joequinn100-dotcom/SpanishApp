import Link from 'next/link';
import { allErrors } from '@/lib/queries';
import { SeverityDots, StatusPill } from '@/components/StatusPill';

export const dynamic = 'force-dynamic';

export default function ErrorsPage() {
  const errors = allErrors();
  const live = errors.filter((e) => e.status !== 'resolved');
  const resolved = errors.filter((e) => e.status === 'resolved');

  return (
    <>
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.14em] text-teal-400">Error log</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {live.length} live · {resolved.length} resolved
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          The engine. Topic recommendation, drill selection and the timeline all read from
          here. An error resolves only after 21 silent days following a clean streak of 12
          and two spontaneous correct uses — never because a drill came back right once.
        </p>
      </header>

      {[
        { title: 'Live', list: live },
        { title: 'Resolved', list: resolved },
      ].map(({ title, list }) => (
        <section key={title} className="mb-10">
          <h2 className="mb-3 border-b border-slate-800 pb-1.5 text-sm font-semibold uppercase tracking-widest text-slate-400">
            {title}
          </h2>
          <ul className="space-y-2">
            {list.map((e) => (
              <li
                key={e.code}
                id={e.code}
                className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 target:border-teal-600"
              >
                <div className="flex items-center gap-3">
                  <SeverityDots severity={e.severity} />
                  <h3 className="min-w-0 flex-1 truncate text-sm font-medium">{e.label_en}</h3>
                  <span className="shrink-0 font-mono text-[11px] text-slate-600">{e.code}</span>
                  <span className="shrink-0 text-xs text-slate-500">×{e.occurrences}</span>
                  <StatusPill status={e.status} />
                </div>
                <p className="mt-1.5 font-serif text-sm">
                  <span className="text-red-400 line-through">{e.wrong_example}</span>
                  <span className="mx-2 text-slate-600">→</span>
                  <span className="text-emerald-400">{e.right_example}</span>
                </p>
                <details className="mt-2 group">
                  <summary className="cursor-pointer text-xs text-slate-500 transition hover:text-teal-400">
                    Rule
                  </summary>
                  <div className="mt-2 max-w-[68ch] space-y-3 font-serif text-[0.95rem] leading-[1.7] text-slate-300">
                    {e.rule.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </details>
                {e.topic_id && (
                  <Link
                    href={`/topics/${e.topic_id.replace(/\./g, '-')}`}
                    className="mt-2 inline-block text-xs text-teal-500 hover:text-teal-300"
                  >
                    {e.topic_id} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
