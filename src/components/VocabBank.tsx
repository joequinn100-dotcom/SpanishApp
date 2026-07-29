import { useMemo, useState } from 'react';
import type { VocabSection } from '../types';
import { today, useStore } from '../engine/store';
import { Badge, Bar, PageHead, Speak } from './ui';

export default function VocabBank() {
  const { state } = useStore();
  const [section, setSection] = useState<VocabSection | 'todas'>('todas');
  const [q, setQ] = useState('');

  const sections = useMemo(
    () => [...new Set(state.vocab.map((v) => v.section))] as VocabSection[],
    [state.vocab],
  );
  const t = today();
  const list = state.vocab.filter(
    (v) =>
      (section === 'todas' || v.section === section) &&
      (!q || (v.term + v.gloss + v.example).toLowerCase().includes(q.toLowerCase())),
  );
  const due = state.vocab.filter((v) => v.due <= t).length;
  const mature = state.vocab.filter((v) => v.intervalDays >= 21).length;

  return (
    <>
      <PageHead eyebrow="Banco de vocabulario" title="Siete secciones, repetición espaciada">
        <p>
          {state.vocab.length} entradas. {due} vencidas hoy, {mature} ya consolidadas. Las palabras que
          llevas tiempo sin usar bien salen antes; los sustantivos van con género marcado porque el
          género alimenta el detector de concordancia.
        </p>
      </PageHead>

      <div className="card tight">
        <div className="row">
          <button className={section === 'todas' ? 'primary small' : 'small'} onClick={() => setSection('todas')}>
            todas
          </button>
          {sections.map((s) => (
            <button key={s} className={section === s ? 'primary small' : 'small'} onClick={() => setSection(s)}>
              {s}
            </button>
          ))}
          <span className="spacer" />
          <input
            type="text"
            className="inline"
            placeholder="buscar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Término</th>
              <th style={{ width: '20%' }}>Significado</th>
              <th>Ejemplo</th>
              <th style={{ width: 110 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id}>
                <td>
                  <span className="prose" style={{ fontSize: '.98rem' }}>
                    {v.gender && !/^(el|la)\s/i.test(v.term) && (
                      <span className="muted">{v.gender === 'm' ? 'el ' : 'la '}</span>
                    )}
                    {v.term}
                  </span>{' '}
                  {v.gender && <Badge kind="cat">{v.gender}</Badge>}
                </td>
                <td className="dim small">{v.gloss}</td>
                <td className="rule">
                  {v.example} <Speak text={v.example} />
                </td>
                <td>
                  <div className="tiny muted">
                    {v.due <= t ? 'vence hoy' : `en ${Math.max(0, Math.ceil((new Date(v.due).getTime() - Date.now()) / 86400000))} d`}
                    {v.lapses > 0 && ` · ${v.lapses} fallos`}
                  </div>
                  <Bar value={Math.min(1, v.intervalDays / 30)} tone={v.lapses > 1 ? 'red' : undefined} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <div className="empty">Nada coincide con la búsqueda.</div>}
      </div>
    </>
  );
}
