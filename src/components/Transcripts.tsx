import { useMemo, useState } from 'react';
import type { ErrorEntry, Finding, Priority } from '../types';
import { analyze } from '../engine/detectors';
import { nowISO, useStore } from '../engine/store';
import { PageHead, Speak } from './ui';

/**
 * Only the student's own lines should be mined for errors — the tutor's Spanish
 * is the model, not the evidence. Lines are attributed by speaker label.
 */
function studentLines(text: string, me: string): string {
  const lines = text.split('\n');
  const labelled = lines.filter((l) => /^\s*[\wÁÉÍÓÚÑáéíóúñ .]{1,24}:/.test(l));
  if (labelled.length < 3) return text; // unlabelled transcript — analyse everything
  const mine = me.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return lines
    .filter((l) => {
      const m = l.match(/^\s*([\wÁÉÍÓÚÑáéíóúñ .]{1,24}):/);
      if (!m) return false;
      return mine.some((n) => m[1].trim().toLowerCase().startsWith(n));
    })
    .map((l) => l.replace(/^\s*[\wÁÉÍÓÚÑáéíóúñ .]{1,24}:/, ''))
    .join('\n');
}

export default function Transcripts() {
  const { state, rules, ingestFindings, addError, addTranscript } = useStore();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [me, setMe] = useState('Joe, Yo, Alumno, Student, J');
  const [analysed, setAnalysed] = useState(false);
  const [rejected, setRejected] = useState<number[]>([]);
  const [saved, setSaved] = useState(0);
  const [draft, setDraft] = useState<null | { wrong: string; right: string; title: string; rule: string; priority: Priority }>(null);

  const mine = useMemo(() => studentLines(text, me), [text, me]);
  const findings = useMemo(() => (analysed ? analyze(mine, rules) : []), [analysed, mine, rules]);
  const grouped = useMemo(() => {
    const map = new Map<string, Finding[]>();
    findings.forEach((f, i) => {
      if (rejected.includes(i)) return;
      map.set(f.errorId ?? 'nuevo', [...(map.get(f.errorId ?? 'nuevo') ?? []), f]);
    });
    return map;
  }, [findings, rejected]);

  function confirm() {
    const accepted = findings.filter((_, i) => !rejected.includes(i));
    ingestFindings(accepted, 'transcript', `tr-${Date.now()}`);
    addTranscript(title || `Clase con Lorena — ${new Date().toLocaleDateString('es-PE')}`, text, accepted.length);
    setSaved(accepted.length);
    setAnalysed(false);
    setText('');
    setRejected([]);
  }

  function saveDraft() {
    if (!draft) return;
    const e: ErrorEntry = {
      id: `err-custom-${Date.now()}`,
      category: 'grammar',
      title: draft.title || draft.wrong,
      wrong: draft.wrong,
      right: draft.right,
      rule: draft.rule,
      firstSeen: nowISO().slice(0, 10),
      frequency: 1,
      priority: draft.priority,
      status: 'active',
      attempts: [{ date: nowISO(), sessionId: `tr-${Date.now()}`, correct: false, source: 'transcript', detail: `${draft.wrong} → ${draft.right}` }],
      detectors: [],
      drills: [
        {
          id: 'd1',
          prompt: `Corrige: "${draft.wrong}"`,
          options: [draft.wrong, draft.right, `${draft.right} (con matiz)`],
          answer: 1,
          explanation: draft.rule,
          speak: draft.right,
        },
      ],
    };
    addError(e);
    setDraft(null);
  }

  return (
    <>
      <PageHead eyebrow="Ingesta" title="Nueva transcripción de clase">
        <p>
          Pega la transcripción de la clase con Lorena. La app analiza solo tus intervenciones contra
          los patrones conocidos, sube el contador de frecuencia de los que ya están en el registro y
          te propone entradas nuevas para que las confirmes. Nada se agrega sin tu visto bueno.
        </p>
      </PageHead>

      {saved > 0 && (
        <div className="card tight">
          <p className="mb0" style={{ color: 'var(--green)' }}>
            Transcripción guardada. {saved} incidencias registradas en el log de errores.
          </p>
        </div>
      )}

      <div className="card">
        <div className="row" style={{ marginBottom: '.75rem' }}>
          <input
            type="text"
            className="inline"
            placeholder="Título (ej. Clase 24 — pretérito)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="text"
            className="inline"
            placeholder="Cómo apareces etiquetado"
            value={me}
            onChange={(e) => setMe(e.target.value)}
          />
        </div>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setAnalysed(false); }}
          placeholder={'Lorena: ¿Cómo va la obra?\nJoe: La semana pasada compremos el material, pero después la reunión el cliente pidió una otra vez el mismo cambio…'}
          style={{ minHeight: 220 }}
        />
        <div className="row mt">
          <button className="primary" onClick={() => setAnalysed(true)} disabled={text.trim().length < 30}>
            Analizar
          </button>
          <span className="tiny muted">
            {mine.trim().split(/\s+/).filter(Boolean).length} palabras tuyas detectadas
          </span>
          <span className="spacer" />
          <button className="ghost small" onClick={() => setDraft({ wrong: '', right: '', title: '', rule: '', priority: 'MED' })}>
            + entrada manual
          </button>
        </div>
      </div>

      {draft && (
        <div className="card">
          <h2>Nueva entrada del registro</h2>
          <div className="grid two">
            <div>
              <label className="tiny muted">Lo que dijiste</label>
              <input type="text" value={draft.wrong} onChange={(e) => setDraft({ ...draft, wrong: e.target.value })} />
            </div>
            <div>
              <label className="tiny muted">Lo correcto</label>
              <input type="text" value={draft.right} onChange={(e) => setDraft({ ...draft, right: e.target.value })} />
            </div>
          </div>
          <div className="mt">
            <label className="tiny muted">Título</label>
            <input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div className="mt">
            <label className="tiny muted">Regla — escríbela completa, no abreviada</label>
            <textarea value={draft.rule} onChange={(e) => setDraft({ ...draft, rule: e.target.value })} style={{ minHeight: 110 }} />
          </div>
          <div className="row mt">
            {(['HIGH', 'MED', 'LOW'] as Priority[]).map((p) => (
              <button key={p} className={'small ' + (draft.priority === p ? 'primary' : '')} onClick={() => setDraft({ ...draft, priority: p })}>
                {p}
              </button>
            ))}
            <span className="spacer" />
            <button onClick={() => setDraft(null)}>Cancelar</button>
            <button className="primary" onClick={saveDraft} disabled={!draft.wrong || !draft.right}>
              Guardar en el registro
            </button>
          </div>
        </div>
      )}

      {analysed && (
        <div className="card">
          <div className="card-head">
            <h2>{findings.length} incidencias detectadas</h2>
            <button
              className="primary"
              onClick={confirm}
              disabled={findings.length === 0 && text.trim().length < 30}
            >
              Confirmar y registrar
            </button>
          </div>

          {!findings.length && (
            <div className="empty">
              Ninguno de tus patrones conocidos aparece en esta transcripción. Eso es una buena
              señal — guárdala igual para dejar constancia de la sesión.
            </div>
          )}

          {[...grouped.entries()].map(([errId, fs]) => {
            const err = state.errors.find((e) => e.id === errId);
            return (
              <div key={errId} style={{ marginBottom: '1rem' }}>
                <div className="row" style={{ marginBottom: '.35rem' }}>
                  <strong>{err?.title ?? 'Sin clasificar'}</strong>
                  <span className="tiny muted">
                    frecuencia actual {err?.frequency ?? 0} → {(err?.frequency ?? 0) + fs.length}
                  </span>
                </div>
                <table>
                  <tbody>
                    {fs.map((f) => {
                      const idx = findings.indexOf(f);
                      return (
                        <tr key={idx}>
                          <td className="wrong">{f.excerpt}</td>
                          <td className="right">{f.suggestion} <Speak text={f.suggestion} /></td>
                          <td style={{ width: 90, textAlign: 'right' }}>
                            <button className="small ghost" onClick={() => setRejected([...rejected, idx])}>
                              descartar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {state.transcripts.length > 0 && (
        <div className="card">
          <h2>Transcripciones cargadas</h2>
          {state.transcripts.map((t) => (
            <div key={t.id} className="row" style={{ padding: '.4rem 0', borderBottom: '1px solid var(--line-soft)' }}>
              <span style={{ flex: 1 }}>{t.title}</span>
              <span className="tiny muted">{new Date(t.date).toLocaleDateString('es-PE')}</span>
              <span className="tiny muted">{t.accepted} incidencias</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
