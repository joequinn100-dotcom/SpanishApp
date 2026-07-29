import { useState } from 'react';
import { useStore } from '../engine/store';
import { CorrectionTable, PageHead, Speak } from './ui';

/** Session log + every written submission kept with its correction table. */
export default function History() {
  const { state } = useStore();
  const [tab, setTab] = useState<'sessions' | 'written' | 'roleplay'>('sessions');

  return (
    <>
      <PageHead eyebrow="Historial" title="Lo que ya trabajaste">
        <p>
          Para no volver a explicar el contexto cada vez. Cada sesión, cada texto corregido y cada
          role-play queda aquí con su tabla de correcciones.
        </p>
      </PageHead>

      <div className="row" style={{ marginBottom: '1rem' }}>
        <button className={tab === 'sessions' ? 'primary' : ''} onClick={() => setTab('sessions')}>
          Sesiones ({state.sessions.length})
        </button>
        <button className={tab === 'written' ? 'primary' : ''} onClick={() => setTab('written')}>
          Escritos ({state.written.length})
        </button>
        <button className={tab === 'roleplay' ? 'primary' : ''} onClick={() => setTab('roleplay')}>
          Role-plays ({state.roleplayLogs.length})
        </button>
      </div>

      {tab === 'sessions' && (
        <div className="card">
          {state.sessions.length === 0 && <div className="empty">Todavía sin sesiones registradas.</div>}
          {state.sessions.map((s) => {
            const topic = state.topics.find((t) => t.id === s.topicId);
            return (
              <div key={s.id} className="row" style={{ padding: '.6rem 0', borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ width: 150 }} className="small">
                  {new Date(s.date).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span style={{ flex: 1 }} className="small dim">
                  {topic?.name ?? '—'} · {s.completedParts.join(', ') || 'sin partes'}
                </span>
                <span className="tiny muted">{s.drillsCorrect}/{s.drillsTotal} drills</span>
                <span className="tiny muted">{s.vocabReviewed} vocab</span>
                <span className="tiny muted">{s.durationMin ?? 0} min</span>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'written' && (
        <>
          {state.written.length === 0 && <div className="empty">Sin producciones escritas todavía.</div>}
          {state.written.map((w) => (
            <div className="card" key={w.id}>
              <div className="card-head">
                <h2 style={{ fontSize: '.95rem' }}>
                  {new Date(w.date).toLocaleString('es-PE')}
                </h2>
                <span className="tiny muted">{w.findings.length} correcciones</span>
              </div>
              <p className="tiny muted">{w.prompt}</p>
              <div className="prose" style={{ background: 'var(--bg-inset)', padding: '.8rem', borderRadius: 8, fontSize: '1rem' }}>
                {w.text} <Speak text={w.text} />
              </div>
              <div className="mt">
                <CorrectionTable findings={w.findings} />
              </div>
              {w.revision && (
                <>
                  <h3 className="mt2">Reescritura</h3>
                  <div className="prose" style={{ background: 'var(--bg-inset)', padding: '.8rem', borderRadius: 8, fontSize: '1rem' }}>
                    {w.revision} <Speak text={w.revision} />
                  </div>
                  <div className="mt">
                    <CorrectionTable findings={w.revisionFindings ?? []} />
                  </div>
                </>
              )}
            </div>
          ))}
        </>
      )}

      {tab === 'roleplay' && (
        <>
          {state.roleplayLogs.length === 0 && <div className="empty">Sin role-plays todavía.</div>}
          {state.roleplayLogs.map((r) => (
            <div className="card" key={r.id}>
              <div className="card-head">
                <h2 style={{ fontSize: '.95rem' }}>{new Date(r.date).toLocaleString('es-PE')}</h2>
                <span className="tiny muted">{r.turns.length} turnos</span>
              </div>
              {r.turns.map((t, i) => (
                <div key={i} className="turn">
                  <div className="who">contraparte</div>
                  <div className="bubble">{t.counterpart}</div>
                  <div className="who mt">tú</div>
                  <div className="bubble mine">{t.user}</div>
                  {t.findings.length > 0 && (
                    <div className="mt">
                      <CorrectionTable findings={t.findings} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </>
  );
}
