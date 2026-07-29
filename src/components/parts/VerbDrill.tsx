import { useMemo, useState } from 'react';
import {
  DRILL_VERBS, PERSONS, TENSES, accentOnly, conjugate, isAccepted,
} from '../../engine/conjugator';
import { Speak } from '../ui';

/** Part 1 — conjugate a chosen verb across all studied tenses, with tick-off boxes. */
export default function VerbDrill({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const [verb, setVerb] = useState(() => DRILL_VERBS[Math.floor(Math.random() * 12)]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [ticked, setTicked] = useState<string[]>([]);

  const forms = useMemo(() => conjugate(verb), [verb]);
  const cells = TENSES.flatMap((t) => PERSONS.map((p, i) => ({ key: `${t}|${i}`, t, p, i })));
  const answered = cells.filter((c) => (answers[c.key] ?? '').trim());
  const correct = answered.filter((c) => isAccepted(answers[c.key], forms[c.t][c.i]));

  function reset(v: string) {
    setVerb(v);
    setAnswers({});
    setChecked(false);
    setTicked([]);
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>1 · Drills de verbos</h2>
        <div className="row">
          <select
            className="inline"
            value={verb}
            onChange={(e) => reset(e.target.value)}
            style={{ width: 'auto' }}
          >
            {DRILL_VERBS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <button
            className="small"
            onClick={() => reset(DRILL_VERBS[Math.floor(Math.random() * DRILL_VERBS.length)])}
          >
            otro verbo
          </button>
        </div>
      </div>

      <p className="small dim">
        Conjuga <strong>{verb}</strong> en los siete tiempos estudiados. Deja en blanco lo que no
        quieras practicar hoy; solo cuenta lo que respondas. Los acentos importan, pero si aciertas
        la forma sin tilde te lo digo en vez de contarlo como error.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table className="conj">
          <thead>
            <tr>
              <th style={{ width: 150 }}>Tiempo</th>
              {PERSONS.map((p) => <th key={p}>{p}</th>)}
              <th style={{ width: 40 }}>✓</th>
            </tr>
          </thead>
          <tbody>
            {TENSES.map((t) => (
              <tr key={t}>
                <th className="tense">{t}</th>
                {PERSONS.map((_, i) => {
                  const key = `${t}|${i}`;
                  const val = answers[key] ?? '';
                  const expected = forms[t][i];
                  const ok = isAccepted(val, expected);
                  return (
                    <td key={key}>
                      <input
                        className={checked && val ? (ok ? 'ok' : 'no') : ''}
                        value={val}
                        placeholder={expected === '—' ? '—' : ''}
                        disabled={expected === '—'}
                        onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
                      />
                      {checked && val && !ok && <span className="sol">{expected}</span>}
                      {checked && val && ok && accentOnly(val, expected) && (
                        <span className="sol" style={{ color: 'var(--amber)' }}>
                          tilde: {expected}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td>
                  <input
                    type="checkbox"
                    checked={ticked.includes(t)}
                    onChange={() =>
                      setTicked(ticked.includes(t) ? ticked.filter((x) => x !== t) : [...ticked, t])
                    }
                    style={{ width: 'auto', accentColor: 'var(--teal-dim)' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row mt">
        <button onClick={() => setChecked(true)} disabled={!answered.length}>
          Corregir
        </button>
        {checked && (
          <>
            <span className="small dim">
              {correct.length}/{answered.length} correctas
            </span>
            <Speak
              text={`${verb}. ${PERSONS.map((p, i) => `${p}, ${forms['pretérito'][i]}`).join('. ')}`}
              label="oír pretérito"
            />
          </>
        )}
        <span className="spacer" />
        <button
          className="primary"
          onClick={() => onDone(correct.length, answered.length)}
          disabled={!checked}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
