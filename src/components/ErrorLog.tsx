import { useState } from 'react';
import type { ErrorEntry, Priority } from '../types';
import { accuracy, activeErrors, useStore } from '../engine/store';
import { Badge, PageHead, Sparkline, Speak, Upgrade } from './ui';

export default function ErrorLog() {
  const { state, updateError } = useStore();
  const [tab, setTab] = useState<'active' | 'graveyard'>('active');
  const [open, setOpen] = useState<string | null>(null);

  const active = activeErrors(state);
  const graveyard = state.errors.filter((e) => e.status === 'resolved');
  const list = tab === 'active' ? active : graveyard;

  return (
    <>
      <PageHead eyebrow="Registro de errores" title="Lo que todavía se rompe">
        <p>
          Un error solo pasa a "resuelto" con acierto sostenido en sesiones distintas — cuatro
          repeticiones limpias repartidas en al menos tres sesiones. Una sola falla nueva lo devuelve
          a circulación.
        </p>
      </PageHead>

      <div className="row" style={{ marginBottom: '1rem' }}>
        <button className={tab === 'active' ? 'primary' : ''} onClick={() => setTab('active')}>
          Activos ({active.length})
        </button>
        <button className={tab === 'graveyard' ? 'primary' : ''} onClick={() => setTab('graveyard')}>
          Cementerio ({graveyard.length})
        </button>
      </div>

      {tab === 'graveyard' && (
        <div className="card tight">
          <p className="small dim mb0">
            Estos ya no se drillan como errores, solo como mantenimiento. Es la prueba visible de lo
            que se arregló desde enero.
          </p>
        </div>
      )}

      {list.map((e) => (
        <Row
          key={e.id}
          e={e}
          open={open === e.id}
          toggle={() => setOpen(open === e.id ? null : e.id)}
          onPriority={(p) => updateError(e.id, { priority: p })}
          onArchive={() => updateError(e.id, { archived: !e.archived })}
        />
      ))}

      {!list.length && (
        <div className="empty">
          {tab === 'active' ? 'Ningún error activo.' : 'Todavía nada en el cementerio.'}
        </div>
      )}
    </>
  );
}

function Row({
  e, open, toggle, onPriority, onArchive,
}: {
  e: ErrorEntry;
  open: boolean;
  toggle: () => void;
  onPriority: (p: Priority) => void;
  onArchive: () => void;
}) {
  const acc = accuracy(e);
  const recent = [...e.attempts].reverse().slice(0, 8);
  return (
    <div className="err-row">
      <div className="err-head" onClick={toggle}>
        <Badge kind={e.priority.toLowerCase()}>{e.priority}</Badge>
        <div className="err-title">
          <div className="t">{e.title}</div>
          <div className="ex">
            <s>{e.wrong}</s> → <b>{e.right}</b>
          </div>
        </div>
        <Sparkline error={e} width={80} height={22} />
        <span className="tiny muted" style={{ width: 70, textAlign: 'right' }}>
          ×{e.frequency} · {acc === null ? '—' : `${Math.round(acc * 100)}%`}
        </span>
        <Badge kind={e.status}>{e.status}</Badge>
        <span className="muted">{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <div className="err-body">
          <div className="row mt" style={{ marginBottom: '.75rem' }}>
            <Badge kind="cat">{e.category}</Badge>
            <span className="tiny muted">visto por primera vez: {e.firstSeen}</span>
            <span className="spacer" />
            <span className="tiny muted">prioridad:</span>
            {(['HIGH', 'MED', 'LOW'] as Priority[]).map((p) => (
              <button
                key={p}
                className={'small ' + (e.priority === p ? 'primary' : 'ghost')}
                onClick={() => onPriority(p)}
              >
                {p}
              </button>
            ))}
            <button className="small ghost" onClick={onArchive}>
              {e.archived ? 'desarchivar' : 'archivar'}
            </button>
          </div>

          {e.notes && <p className="small" style={{ color: 'var(--amber)' }}>{e.notes}</p>}

          <h3>Regla</h3>
          <div className="prose" style={{ fontSize: '.98rem' }}>
            {e.rule.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
          </div>

          {e.upgradePair && (
            <>
              <h3>B1 → B2</h3>
              <Upgrade pair={e.upgradePair} />
            </>
          )}

          <h3>Ejemplos de drill</h3>
          {e.drills.map((d) => (
            <div key={d.id} className="small dim" style={{ padding: '.25rem 0' }}>
              <span className="prose" style={{ fontSize: '.95rem' }}>
                {d.speak ?? d.prompt}
              </span>{' '}
              {d.speak && <Speak text={d.speak} />}
            </div>
          ))}

          <h3>Historial ({e.attempts.length} intentos registrados)</h3>
          {recent.length ? (
            <table>
              <thead>
                <tr><th>Fecha</th><th>Origen</th><th>Resultado</th><th>Detalle</th></tr>
              </thead>
              <tbody>
                {recent.map((a, i) => (
                  <tr key={i}>
                    <td className="tiny">{new Date(a.date).toLocaleString('es-PE')}</td>
                    <td className="tiny">{a.source}</td>
                    <td className={a.correct ? 'right' : 'wrong'}>{a.correct ? 'correcto' : 'fallo'}</td>
                    <td className="rule tiny">{a.detail ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="small muted">
              Sin intentos todavía en la app — la frecuencia inicial viene de las transcripciones de clase.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
