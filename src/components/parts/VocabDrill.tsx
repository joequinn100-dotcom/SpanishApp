import { useMemo, useState } from 'react';
import { dueVocab, useStore } from '../../engine/store';
import { Speak, Traps } from '../ui';

/** Part 4 — B2 vocabulary from the bank, spaced-repetition style. */
export default function VocabDrill({ onDone }: { onDone: (reviewed: number) => void }) {
  const { state, reviewVocab } = useStore();
  const queue = useMemo(() => dueVocab(state, 12), []);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  if (!queue.length) {
    return (
      <div className="card">
        <h2>4 · Vocabulario B2</h2>
        <div className="empty">Nada vencido hoy. El banco está al día.</div>
        <button className="primary" onClick={() => onDone(0)}>Siguiente →</button>
      </div>
    );
  }

  const done = i >= queue.length;
  const card = queue[Math.min(i, queue.length - 1)];

  function grade(g: 0 | 1 | 2) {
    reviewVocab(card.id, g);
    setReviewed(reviewed + 1);
    setShown(false);
    setI(i + 1);
  }

  if (done) {
    return (
      <div className="card">
        <h2>4 · Vocabulario B2</h2>
        <div className="feedback">
          {reviewed} tarjetas repasadas. Las que fallaste vuelven mañana; las que dominas se
          alejan en el calendario.
        </div>
        <div className="row end mt">
          <button className="primary" onClick={() => onDone(reviewed)}>Siguiente →</button>
        </div>
      </div>
    );
  }

  const article = card.gender === 'm' ? 'el' : card.gender === 'f' ? 'la' : null;

  return (
    <div className="card">
      <div className="card-head">
        <h2>4 · Vocabulario B2</h2>
        <span className="small dim">{i + 1}/{queue.length} · {card.section}</span>
      </div>

      <div className="prose center" style={{ fontSize: '1.5rem', margin: '1.5rem 0 1rem' }}>
        {card.gender && !/^(el|la)\s/i.test(card.term) ? (
          <span>
            <span style={{ color: 'var(--ink-faint)' }}>{shown ? article : '___'}</span> {card.term}
          </span>
        ) : (
          card.term
        )}{' '}
        <Speak text={card.example} />
      </div>

      {!shown ? (
        <div className="row center" style={{ justifyContent: 'center' }}>
          <button onClick={() => setShown(true)}>Mostrar</button>
        </div>
      ) : (
        <>
          <div className="feedback">
            <div className="dim">{card.gloss}</div>
            <div className="mt prose" style={{ fontSize: '1.02rem' }}>
              {card.example} <Speak text={card.example} />
            </div>
            {card.gender && (
              <div className="tiny muted mt">
                Género: {card.gender === 'm' ? 'masculino' : 'femenino'} — apréndelo con artículo,
                porque todo el sintagma lo hereda.
              </div>
            )}
          </div>
          <Traps text={card.example} />
          <div className="row mt">
            <button className="danger" onClick={() => grade(0)}>No la tenía</button>
            <button onClick={() => grade(1)}>Con esfuerzo</button>
            <button className="primary" onClick={() => grade(2)}>La uso sin pensar</button>
            <span className="spacer" />
            <span className="tiny muted">
              intervalo actual: {card.intervalDays}d · fallos: {card.lapses}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
