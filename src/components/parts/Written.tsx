import { useMemo, useState } from 'react';
import { analyze } from '../../engine/detectors';
import { activeErrors, useStore } from '../../engine/store';
import { promptFor, wordCount } from '../../data/writing';
import { CorrectionTable, Speak } from '../ui';
import type { WrittenSubmission } from '../../types';

/**
 * Part 5 — written assignment, graded live. Nothing goes home: the text, the
 * correction table and the revision are all stored and stay visible together.
 */
export default function Written({
  sessionId, topicId, onDone,
}: { sessionId: string; topicId?: string; onDone: (writtenId: string) => void }) {
  const { rules, ingestFindings, saveWritten, state } = useStore();
  const prompt = useMemo(() => promptFor(topicId), [topicId]);
  const [text, setText] = useState('');
  const [graded, setGraded] = useState(false);
  const [revision, setRevision] = useState('');
  const [revGraded, setRevGraded] = useState(false);
  const [id] = useState(() => `w-${Date.now()}`);

  const findings = useMemo(() => (graded ? analyze(text, rules) : []), [graded, text, rules]);
  const revFindings = useMemo(
    () => (revGraded ? analyze(revision, rules) : []),
    [revGraded, revision, rules],
  );
  const words = wordCount(text);
  const checks = prompt.mustUse.map((m) => ({ ...m, ok: m.test.test(text) }));
  const watched = activeErrors(state).slice(0, 5);

  function grade() {
    setGraded(true);
    const f = analyze(text, rules);
    ingestFindings(f, 'written', sessionId);
    setRevision(text);
    const rec: WrittenSubmission = {
      id, sessionId, date: new Date().toISOString(), prompt: prompt.brief, text, findings: f,
    };
    saveWritten(rec);
  }

  function gradeRevision() {
    setRevGraded(true);
    const rf = analyze(revision, rules);
    const rec: WrittenSubmission = {
      id, sessionId, date: new Date().toISOString(), prompt: prompt.brief,
      text, findings, revision, revisionFindings: rf,
    };
    saveWritten(rec);
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>5 · Producción escrita</h2>
        <span className="small dim">{words} palabras · mínimo {prompt.minWords}</span>
      </div>

      <p className="prose" style={{ fontSize: '1rem' }}>{prompt.brief}</p>

      <ul className="checklist reqs small" style={{ marginBottom: '1rem' }}>
        {checks.map((c, k) => (
          <li key={k} className={c.ok ? 'done' : ''}>
            <span style={{ color: c.ok ? 'var(--green)' : 'var(--ink-faint)' }}>{c.ok ? '✓' : '○'}</span>
            <span>{c.label}</span>
          </li>
        ))}
      </ul>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={graded}
        placeholder="Escribe aquí. Se corrige dentro de la app y queda guardado junto con la tabla de correcciones."
      />

      <div className="row mt">
        <button className="primary" onClick={grade} disabled={graded || words < prompt.minWords}>
          Corregir y registrar
        </button>
        {!graded && words < prompt.minWords && (
          <span className="tiny muted">faltan {prompt.minWords - words} palabras</span>
        )}
        <span className="spacer" />
        <span className="tiny muted">
          Vigilando: {watched.map((e) => e.title.split('—')[0].trim()).join(', ')}
        </span>
      </div>

      {graded && (
        <>
          <div className="hr" />
          <h3>Tu texto</h3>
          <div className="prose" style={{ background: 'var(--bg-inset)', padding: '.9rem', borderRadius: 8 }}>
            {text} <Speak text={text} />
          </div>

          <h3 className="mt2">Tabla de correcciones</h3>
          <CorrectionTable findings={findings} />

          <div className="hr" />
          <h3>Reescritura obligatoria</h3>
          <p className="small dim">
            {findings.length
              ? 'Corrige el texto aplicando la tabla y vuelve a enviarlo. Una corrección que no se reescribe no se aprende.'
              : 'Sin errores detectados. Súbelo de nivel igualmente: reescríbelo en registro B2 — conectores, matización, nominalización.'}
          </p>
          <textarea value={revision} onChange={(e) => { setRevision(e.target.value); setRevGraded(false); }} />
          <div className="row mt">
            <button onClick={gradeRevision} disabled={revision.trim() === text.trim() && !findings.length ? false : revision.trim().length < 20}>
              Revisar reescritura
            </button>
            <span className="spacer" />
            <button className="primary" onClick={() => onDone(id)} disabled={!revGraded}>
              Cerrar sesión →
            </button>
          </div>

          {revGraded && (
            <div className="mt">
              {revFindings.length === 0 ? (
                <div className="feedback">
                  <strong>Limpio.</strong> Esta reescritura no dispara ningún patrón activo de tu
                  registro. Eso es exactamente lo que mueve un error hacia "resuelto": acierto
                  sostenido en sesiones distintas, no una repetición con suerte.
                </div>
              ) : (
                <>
                  <div className="feedback bad">
                    Quedan {revFindings.length} patrones sin corregir. Míralos y ajusta otra vez.
                  </div>
                  <div className="mt">
                    <CorrectionTable findings={revFindings} />
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
