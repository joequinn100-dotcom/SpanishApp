import { useMemo, useState } from 'react';
import { sessionPlan, useStore } from '../engine/store';
import { PageHead } from './ui';
import VerbDrill from './parts/VerbDrill';
import ErrorWarmup from './parts/ErrorWarmup';
import GrammarTopic from './parts/GrammarTopic';
import VocabDrill from './parts/VocabDrill';
import Written from './parts/Written';
import type { View } from '../App';

const PARTS = [
  'Verbos',
  'Errores',
  'Gramática',
  'Vocabulario',
  'Escritura',
];

/** The 5-part session, in the same shape as a class with Lorena. */
export default function Session({ go }: { go: (v: View) => void }) {
  const { state, saveSession } = useStore();
  const plan = useMemo(() => sessionPlan(state), []);
  const [sessionId] = useState(() => `s-${Date.now()}`);
  const [started] = useState(() => Date.now());
  const [step, setStep] = useState(0);
  const [timed, setTimed] = useState(false);
  const [score, setScore] = useState({ c: 0, t: 0 });
  const [vocabCount, setVocabCount] = useState(0);
  const [writtenId, setWrittenId] = useState<string | undefined>();
  const [finished, setFinished] = useState(false);

  function persist(patch: Partial<{ c: number; t: number; v: number; w: string; parts: number }>) {
    const parts = patch.parts ?? step + 1;
    saveSession({
      id: sessionId,
      date: new Date().toISOString(),
      completedParts: PARTS.slice(0, parts),
      topicId: plan.topic?.id,
      drillsCorrect: patch.c ?? score.c,
      drillsTotal: patch.t ?? score.t,
      vocabReviewed: patch.v ?? vocabCount,
      writtenId: patch.w ?? writtenId,
      durationMin: Math.round((Date.now() - started) / 60000),
    });
  }

  function advance(c = 0, t = 0) {
    const next = { c: score.c + c, t: score.t + t };
    setScore(next);
    persist({ c: next.c, t: next.t });
    setStep(step + 1);
  }

  if (finished) {
    const acc = score.t ? Math.round((score.c / score.t) * 100) : 0;
    return (
      <>
        <PageHead eyebrow="Sesión completa" title="Cerrado y registrado" />
        <div className="card">
          <div className="grid four">
            <div className="stat"><div className="n teal">{score.c}/{score.t}</div><div className="l">drills</div></div>
            <div className="stat"><div className="n">{acc}%</div><div className="l">precisión</div></div>
            <div className="stat"><div className="n">{vocabCount}</div><div className="l">vocab</div></div>
            <div className="stat"><div className="n">{Math.round((Date.now() - started) / 60000)}</div><div className="l">minutos</div></div>
          </div>
          <div className="hr" />
          <p className="dim">
            El registro de errores ya está actualizado con lo de hoy: cada acierto y cada fallo
            entraron en el historial del patrón correspondiente. Lo que veas mañana al abrir la app
            parte de aquí.
          </p>
          <div className="row">
            <button className="primary" onClick={() => go('dashboard')}>Ver el tablero</button>
            <button onClick={() => go('errors')}>Registro de errores</button>
            <button onClick={() => go('roleplay')}>Hacer un role-play</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead eyebrow={`Sesión · ${new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}`} title="Entrenamiento del día">
        <p>
          Tema de hoy: <strong>{plan.topic?.name}</strong>. Calentamiento sobre{' '}
          {plan.top.map((e) => e.title.split('—')[0].trim()).join(', ') || 'nada activo'}.
        </p>
      </PageHead>

      <div className="steps">
        {PARTS.map((p, i) => (
          <button
            key={p}
            className={'step ' + (i === step ? 'on' : i < step ? 'done' : '')}
            onClick={() => i < step && setStep(i)}
          >
            <span className="n">Parte {i + 1}</span>
            {p}
          </button>
        ))}
      </div>

      <div className="row" style={{ marginBottom: '1rem' }}>
        <label className="tiny muted row" style={{ gap: '.35rem' }}>
          <input
            type="checkbox"
            checked={timed}
            onChange={(e) => setTimed(e.target.checked)}
            style={{ width: 'auto', accentColor: 'var(--teal-dim)' }}
          />
          Modo cronometrado (capa de velocidad — 15s por ítem)
        </label>
      </div>

      {step === 0 && <VerbDrill onDone={(c, t) => advance(c, t)} />}
      {step === 1 && <ErrorWarmup sessionId={sessionId} timed={timed} onDone={(c, t) => advance(c, t)} />}
      {step === 2 && plan.topic && <GrammarTopic topic={plan.topic} onDone={(c, t) => advance(c, t)} />}
      {step === 3 && (
        <VocabDrill
          onDone={(n) => {
            setVocabCount(n);
            persist({ v: n });
            setStep(4);
          }}
        />
      )}
      {step === 4 && (
        <Written
          sessionId={sessionId}
          topicId={plan.topic?.id}
          onDone={(wid) => {
            setWrittenId(wid);
            persist({ w: wid, parts: 5 });
            setFinished(true);
          }}
        />
      )}
    </>
  );
}
