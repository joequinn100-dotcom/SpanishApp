'use client';

import { useState, useTransition, useRef } from 'react';
import { extractPdf, previewTranscript, uploadTranscript } from '@/app/actions';

/**
 * The upload box (SPEC §6: "paste or upload").
 *
 * The speaker step is not a nicety. §6 says "Lorena's speech is context, not
 * evidence" — if the teacher's turns were analysed as yours, her corrections
 * would be logged as your errors and her correct Spanish would resolve errors
 * you never fixed. So the app asks who you are and refuses to guess silently.
 */
export function TranscriptUpload() {
  const [raw, setRaw] = useState('');
  const [speakers, setSpeakers] = useState<{ name: string; turns: number; chars: number }[]>([]);
  const [learner, setLearner] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [classDate, setClassDate] = useState(new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState<'lorena' | 'self_recording' | 'other'>('lorena');
  const [title, setTitle] = useState('');
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNotice(null);
    setChecked(false);
    setSpeakers([]);
    setTitle((t) => t || file.name.replace(/\.[^.]+$/, ''));

    if (!/\.pdf$/i.test(file.name)) {
      setRaw(await file.text());
      return;
    }

    // PDFs are read on the server: the extractor is large, and shipping it to
    // the browser would cost every visitor who never uploads one.
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    start(async () => {
      const r = await extractPdf(btoa(binary));
      setRaw(r.text);
      setNotice(
        r.looksScanned
          ? `Read ${r.pages} ${r.pages === 1 ? 'page' : 'pages'} but found almost no text. This is probably a scan rather than a text PDF — it would need OCR, which the app does not do. Paste the text instead if you have it.`
          : `Read ${r.pages} ${r.pages === 1 ? 'page' : 'pages'}. Check the speaker labels survived before analysing.`,
      );
    });
  }

  function check() {
    start(async () => {
      const p = await previewTranscript(raw);
      setSpeakers(p.speakers);
      // Deliberately no default. Turn counts are shown so the choice is easy,
      // but nothing is preselected: a wrong guess nobody notices would analyse
      // your teacher's Spanish as yours, which is the one outcome §6 exists to
      // prevent.
      setLearner(null);
      setChecked(true);
    });
  }

  function submit() {
    start(() => uploadTranscript({ raw, learner, source, classDate, title: title || undefined }));
  }

  const words = raw.trim() === '' ? 0 : raw.trim().split(/\s+/).length;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-xs uppercase tracking-[0.14em] text-teal-400">Add a class transcript</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Paste the transcript or choose a <code className="text-slate-300">.pdf</code>,{' '}
        <code className="text-slate-300">.txt</code>, <code className="text-slate-300">.md</code> or{' '}
        <code className="text-slate-300">.vtt</code> file. The app pulls out your turns only, proposes what it thinks went wrong and what went
        right, and waits for you to confirm each one. Nothing touches your error log until you say so.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-teal-600 hover:text-teal-300"
        >
          Choose a file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.vtt,.srt,.pdf,text/plain,application/pdf"
          onChange={onFile}
          className="hidden"
        />
        <span className="text-xs text-slate-600">
          {pending ? 'Reading the file…' : `or paste below · ${words} words`}
        </span>
      </div>

      {notice && (
        <p className="mt-3 rounded-lg border-l-2 border-amber-600 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
          {notice}
        </p>
      )}

      <textarea
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setChecked(false);
        }}
        rows={10}
        spellCheck={false}
        placeholder={'Lorena: ¿Cómo va la obra esta semana?\nJoe: La semana pasada compremos el material…'}
        className="mt-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 font-mono text-xs leading-relaxed text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-teal-500/60"
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs text-slate-500">
          Class date
          <input
            type="date"
            value={classDate}
            onChange={(e) => setClassDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-500/60"
          />
        </label>
        <label className="text-xs text-slate-500">
          Source
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as typeof source)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-500/60"
          >
            <option value="lorena">Class with Lorena</option>
            <option value="self_recording">My own recording</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Label (optional)
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. claim meeting practice"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-teal-500/60"
          />
        </label>
      </div>

      {!checked ? (
        <button
          onClick={check}
          disabled={pending || raw.trim().length < 20}
          className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white disabled:opacity-40"
        >
          {pending ? 'Reading…' : 'Read speakers'}
        </button>
      ) : (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          {speakers.length === 0 ? (
            <p className="text-sm text-slate-400">
              No speaker labels found, so the whole text is treated as yours. That is right for
              pasted writing of your own, and wrong for a class transcript — if this is a class, add{' '}
              <code className="text-slate-300">Name:</code> at the start of each turn and read again.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-300">Which of these is you?</p>
              <p className="mt-1 text-xs text-slate-500">
                Only your turns are analysed. Your teacher&rsquo;s Spanish is context — if it were
                scored as yours, her corrections would land in your error log as your mistakes.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {speakers.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setLearner(s.name)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      learner === s.name
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {s.name}
                    <span className="ml-2 text-xs text-slate-600">{s.turns} turns</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={submit}
            disabled={pending || (speakers.length > 0 && !learner)}
            className="mt-4 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-40"
          >
            {pending ? 'Analysing…' : 'Analyse transcript'}
          </button>
        </div>
      )}
    </section>
  );
}
