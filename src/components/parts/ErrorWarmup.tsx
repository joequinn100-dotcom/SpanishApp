import { useMemo, useState } from 'react';
import type { DrillItem, ErrorEntry } from '../../types';
import { activeErrors, useStore } from '../../engine/store';
import { analyze } from '../../engine/detectors';
import { Badge, CorrectionTable, Countdown, Speak, Traps, Upgrade } from '../ui';

interface Q { item: DrillItem; error: ErrorEntry }

/**
 * Part 2 — error-correction warm-up pulled live from the top active errors,
 * always in construction/consulting sentences, followed by a forced production
 * prompt so recognition never passes for control.
 */
export default function ErrorWarmup({
  sessionId, timed, onDone,
}: { sessionId: string; timed: boolean; onDone: (correct: number, total: number) => void }) {
  const { state, rules, recordAttempt } = useStore();
  const queue = useMemo<Q[]>(() => {
    const top = activeErrors(state).slice(0, 4);
    return top.flatMap((e) => e.drills.slice(0, 2).map((item) => ({ item, error: e })));
  }, []); // frozen for the session so the list doesn't shuffle underfoot

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ c: 0, t: 0 });
  const [produce, setProduce] = useState('');
  const [checkedProduce, setCheckedProduce] = useState(false);

  if (!queue.length) {
    return (
      <div className="card">
        <h2>2 · Corrección de errores</h2>
        <div className="empty">No hay errores activos. Pasa al tema nuevo.</div>
        <button className="primary" onClick={() => onDone(0, 0)}>Siguiente →</button>
      </div>
    );
  }

  const q = queue[Math.min(i, queue.length - 1)];
  const done = i >= queue.length;

  function answer(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === q.item.answer;
    setScore((s) => ({ c: s.c + (ok ? 1 : 0), t: s.t + 1 }));
    recordAttempt(q.error.id, ok, 'drill', sessionId, q.item.prompt);
  }

  function next() {
    setPicked(null);
    setI(i + 1);
  }

  const findings = checkedProduce ? analyze(produce, rules) : [];

  if (done) {
    const err = queue[0].error;
    return (
      <div className="card">
        <div className="card-head">
          <h2>2 · Producción libre</h2>
          <span className="small dim">{score.c}/{score.t} en el calentamiento</span>
        </div>
        <p className="small dim">
          Reconocer no es producir. Escribe <strong>dos frases tuyas</strong> sobre una obra real que
          usen bien el patrón que acabas de drillar: <strong>{err.title}</strong>.
        </p>
        <div className="feedback" style={{ marginBottom: '.75rem' }}>
          Modelo correcto: <em style={{ color: 'var(--green)' }}>{err.right}</em>{' '}
          <Speak text={err.right} />
        </div>
        <textarea
          value={produce}
          onChange={(e) => { setProduce(e.target.value); setCheckedProduce(false); }}
          placeholder="Escribe aquí…"
          style={{ minHeight: 100 }}
        />
        <div className="row mt">
          <button onClick={() => setCheckedProduce(true)} disabled={produce.trim().length < 15}>
            Revisar
          </button>
          <span className="spacer" />
          <button className="primary" onClick={() => onDone(score.c, score.t)} disabled={!checkedProduce}>
            Siguiente →
          </button>
        </div>
        {checkedProduce && (
          <div className="mt">
            <CorrectionTable findings={findings} />
          </div>
        )}
        {err.upgradePair && (
          <>
            <div className="hr" />
            <Upgrade pair={err.upgradePair} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>2 · Corrección de errores</h2>
        <div className="row">
          <Badge kind={q.error.priority.toLowerCase()}>{q.error.priority}</Badge>
          <span className="small dim">{i + 1}/{queue.length}</span>
          {timed && (
            <Countdown
              seconds={15}
              running={picked === null}
              keyReset={i}
              onExpire={() => picked === null && answer(-1)}
            />
          )}
        </div>
      </div>

      <p className="tiny muted">{q.error.title}</p>
      <p className="prose" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{q.item.prompt}</p>

      <div className="options">
        {q.item.options.map((o, idx) => (
          <button
            key={idx}
            className={
              'option' +
              (picked === null ? '' : idx === q.item.answer ? ' correct' : idx === picked ? ' wrong' : '')
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
          <div className={'feedback' + (picked === q.item.answer ? '' : ' bad')}>
            <strong>{picked === q.item.answer ? 'Correcto. ' : picked === -1 ? 'Se acabó el tiempo. ' : 'No. '}</strong>
            {q.item.explanation}
            {q.item.speak && (
              <div className="mt">
                <em style={{ color: 'var(--green)' }}>{q.item.speak}</em> <Speak text={q.item.speak} />
              </div>
            )}
          </div>
          {q.item.speak && <Traps text={q.item.speak} />}
          <div className="row end mt">
            <button className="primary" onClick={next}>
              {i === queue.length - 1 ? 'Producción libre →' : 'Siguiente →'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
