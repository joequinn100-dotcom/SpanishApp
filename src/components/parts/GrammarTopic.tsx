import { useState } from 'react';
import type { Topic } from '../../types';
import { useStore } from '../../engine/store';
import { Badge, Speak, Traps } from '../ui';

const LAYER_NEXT: Record<Topic['layer'], Topic['layer']> = {
  accuracy: 'speed',
  speed: 'naturalness',
  naturalness: 'confidence',
  confidence: 'confidence',
};

/** Part 3 — new grammar topic, following the Read2Speak Breakthrough sequence. */
export default function GrammarTopic({
  topic, onDone,
}: { topic: Topic; onDone: (correct: number, total: number) => void }) {
  const { setTopic } = useStore();
  const [stage, setStage] = useState<'read' | 'quiz'>('read');
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ c: 0, t: 0 });

  const lesson = topic.lesson;

  if (!lesson) {
    return (
      <div className="card">
        <h2>3 · Gramática nueva</h2>
        <p className="dim">
          <strong>{topic.name}</strong> — {topic.summary}
        </p>
        <p className="small muted">
          Este tema aún no tiene lección cargada. Está en la secuencia Breakthrough en la posición{' '}
          {topic.order}; márcalo como cubierto cuando lo trabajes con Lorena.
        </p>
        <button className="primary" onClick={() => onDone(0, 0)}>Siguiente →</button>
      </div>
    );
  }

  const quiz = lesson.quiz;
  const q = quiz[Math.min(i, quiz.length - 1)];
  const finished = stage === 'quiz' && i >= quiz.length;

  function answer(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    setScore((s) => ({ c: s.c + (idx === q.answer ? 1 : 0), t: s.t + 1 }));
  }

  function finish() {
    const rate = score.t ? score.c / score.t : 0;
    setTopic(topic.id, {
      status: 'covered',
      confidence: Math.min(5, Math.max(topic.confidence, Math.round(rate * 5))) as Topic['confidence'],
      layer: rate >= 0.8 ? LAYER_NEXT[topic.layer] : topic.layer,
    });
    onDone(score.c, score.t);
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>3 · {topic.name}</h2>
        <div className="row">
          <Badge kind="layer">capa: {topic.layer}</Badge>
          <Badge kind="cat">{topic.level}</Badge>
        </div>
      </div>

      {stage === 'read' && (
        <>
          <div className="prose">
            {lesson.sections.map((s, k) => (
              <div key={k}>
                <h3>{s.heading}</h3>
                {s.body.split('\n\n').map((para, j) => (
                  <p key={j}>{para}</p>
                ))}
              </div>
            ))}
          </div>

          {lesson.contrasts && (
            <>
              <div className="hr" />
              <h3>Pares mínimos — las dos son correctas, dicen cosas distintas</h3>
              {lesson.contrasts.map((c, k) => (
                <div key={k} className="upgrade" style={{ marginBottom: '.9rem' }}>
                  <div className="lvl">
                    <span className="tag">A</span>
                    {c.left} <Speak text={c.left} />
                  </div>
                  <div className="lvl b2">
                    <span className="tag">B</span>
                    {c.right} <Speak text={c.right} />
                  </div>
                  <div className="why">{c.why}</div>
                </div>
              ))}
            </>
          )}

          <div className="row end mt2">
            <button className="primary" onClick={() => setStage('quiz')} disabled={!quiz.length}>
              Al ejercicio →
            </button>
            {!quiz.length && <button onClick={finish}>Marcar cubierto →</button>}
          </div>
        </>
      )}

      {stage === 'quiz' && !finished && (
        <>
          <div className="row" style={{ marginBottom: '.75rem' }}>
            <span className="small dim">{i + 1}/{quiz.length}</span>
          </div>
          <p className="prose" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{q.prompt}</p>
          <div className="options">
            {q.options.map((o, idx) => (
              <button
                key={idx}
                className={
                  'option' +
                  (picked === null ? '' : idx === q.answer ? ' correct' : idx === picked ? ' wrong' : '')
                }
                disabled={picked !== null}
                onClick={() => answer(idx)}
              >
                {o}
              </button>
            ))}
          </div>
          {picked !== null && (
            <>
              <div className={'feedback' + (picked === q.answer ? '' : ' bad')}>
                <strong>{picked === q.answer ? 'Correcto. ' : 'No. '}</strong>
                {q.explanation}
                {q.speak && (
                  <div className="mt">
                    <em style={{ color: 'var(--green)' }}>{q.speak}</em> <Speak text={q.speak} />
                  </div>
                )}
              </div>
              {q.speak && <Traps text={q.speak} />}
              <div className="row end mt">
                <button className="primary" onClick={() => { setPicked(null); setI(i + 1); }}>
                  {i === quiz.length - 1 ? 'Terminar tema →' : 'Siguiente →'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {finished && (
        <>
          <div className="feedback">
            <strong>{score.c}/{score.t}.</strong>{' '}
            {score.c / Math.max(1, score.t) >= 0.8
              ? `Suficiente para subir este tema de la capa "${topic.layer}" a "${LAYER_NEXT[topic.layer]}". La próxima vez lo trabajamos con menos apoyo y más presión de tiempo.`
              : `Todavía en capa "${topic.layer}". La precisión va antes que la velocidad: repetimos este tema antes de pasar a producción libre.`}
          </div>
          <div className="row end mt">
            <button className="primary" onClick={finish}>Siguiente →</button>
          </div>
        </>
      )}
    </div>
  );
}
