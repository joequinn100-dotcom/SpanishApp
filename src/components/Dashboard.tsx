import { accuracy, activeErrors, daysToExam, dueVocab, sessionPlan, useStore } from '../engine/store';
import { Badge, Bar, PageHead, Sparkline, Speak, Upgrade } from './ui';
import type { View } from '../App';

export default function Dashboard({ go }: { go: (v: View) => void }) {
  const store = useStore();
  const { state, weeklyGoal, toggleGoal } = store;
  const plan = sessionPlan(state);
  const active = activeErrors(state);
  const resolved = state.errors.filter((e) => e.status === 'resolved');
  const days = daysToExam(state);
  const due = dueVocab(state, 999).length;
  const covered = state.topics.filter((t) => t.status === 'covered').length;
  const breakthrough = state.topics.filter((t) => t.level === 'Breakthrough (B1–B2)');
  const goalTopic = state.topics.find((t) => t.id === weeklyGoal.topicId);

  const lastDate = plan.last ? new Date(plan.last.date).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long',
  }) : null;

  return (
    <>
      <PageHead eyebrow="Sesión del día" title="Continuemos donde lo dejaste">
        <p>
          {plan.last
            ? `Última sesión: ${lastDate} — ${plan.last.completedParts.length}/5 partes, ${plan.last.drillsCorrect}/${plan.last.drillsTotal} en drills.`
            : 'Primera sesión. El registro de errores ya está cargado con tus patrones actuales de las clases con Lorena.'}
        </p>
      </PageHead>

      <div className="grid four">
        <div className="card stat">
          <div className="n red">{active.length}</div>
          <div className="l">errores activos</div>
        </div>
        <div className="card stat">
          <div className="n teal">{resolved.length}</div>
          <div className="l">resueltos</div>
        </div>
        <div className="card stat">
          <div className="n amber">{due}</div>
          <div className="l">vocab por repasar</div>
        </div>
        <div className="card stat">
          <div className="n">{days}</div>
          <div className="l">días al examen B2</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Plan sugerido para hoy</h2>
          <button className="primary" onClick={() => go('session')}>
            Empezar sesión →
          </button>
        </div>
        <ol className="dim" style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.9 }}>
          <li>
            <strong>Verbos:</strong> conjugación completa en los siete tiempos estudiados.
          </li>
          <li>
            <strong>Corrección de errores:</strong>{' '}
            {plan.top.map((e) => e.title.split('—')[0].trim()).join(' · ') || 'nada activo'}
          </li>
          <li>
            <strong>Gramática nueva:</strong> {plan.topic?.name ?? '—'}{' '}
            <Badge kind="layer">{plan.topic?.layer ?? 'accuracy'}</Badge>
          </li>
          <li>
            <strong>Vocabulario B2:</strong> {plan.due} tarjetas pendientes hoy.
          </li>
          <li>
            <strong>Producción escrita:</strong> se corrige en la sesión y alimenta el registro.
          </li>
        </ol>
      </div>

      <div className="grid two">
        <div className="card">
          <div className="card-head">
            <h2>Objetivos de la semana</h2>
            <span className="tiny muted">{weeklyGoal.week}</span>
          </div>
          <ul className="checklist">
            {weeklyGoal.errorIds.map((id) => {
              const e = state.errors.find((x) => x.id === id);
              if (!e) return null;
              const done = weeklyGoal.done.includes(id);
              return (
                <li key={id} className={done ? 'done' : ''}>
                  <input type="checkbox" checked={done} onChange={() => toggleGoal(id)} />
                  <span>
                    Eliminar <strong>{e.title.split('—')[0].trim()}</strong> —{' '}
                    <span className="tiny muted">
                      precisión actual{' '}
                      {accuracy(e) === null ? 'sin datos' : `${Math.round((accuracy(e) as number) * 100)}%`}
                    </span>
                  </span>
                </li>
              );
            })}
            {goalTopic && (
              <li className={weeklyGoal.done.includes('topic') ? 'done' : ''}>
                <input
                  type="checkbox"
                  checked={weeklyGoal.done.includes('topic')}
                  onChange={() => toggleGoal('topic')}
                />
                <span>
                  Cubrir el tema <strong>{goalTopic.name}</strong> y dejarlo en capa{' '}
                  <em>{goalTopic.layer === 'accuracy' ? 'speed' : 'naturalness'}</em>.
                </span>
              </li>
            )}
            <li className={weeklyGoal.done.includes('written') ? 'done' : ''}>
              <input
                type="checkbox"
                checked={weeklyGoal.done.includes('written')}
                onChange={() => toggleGoal('written')}
              />
              <span>Tres producciones escritas corregidas dentro de la app.</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Camino al examen</h2>
            <span className="tiny muted">
              {new Date(state.settings.examDate).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="small dim" style={{ marginBottom: '.4rem' }}>
            Breakthrough (B1–B2): {covered} de {breakthrough.length} temas cubiertos
          </div>
          <Bar value={covered / breakthrough.length} />
          <div className="hr" />
          <div className="small dim" style={{ marginBottom: '.4rem' }}>
            Errores fosilizados eliminados: {resolved.length} de {state.errors.length}
          </div>
          <Bar value={resolved.length / Math.max(1, state.errors.length)} />
          <p className="tiny muted mt">
            Quedan {days} días y {Math.max(0, Math.ceil(days / 7))} semanas de trabajo. A tres sesiones
            por semana son unas {Math.max(0, Math.ceil((days / 7) * 3))} sesiones disponibles.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Errores activos por prioridad</h2>
          <button className="small ghost" onClick={() => go('errors')}>ver registro completo</button>
        </div>
        {active.slice(0, 6).map((e) => {
          const acc = accuracy(e);
          return (
            <div key={e.id} className="row" style={{ padding: '.5rem 0', borderBottom: '1px solid var(--line-soft)' }}>
              <Badge kind={e.priority.toLowerCase()}>{e.priority}</Badge>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="small">{e.title}</div>
                <div className="tiny muted">
                  <s>{e.wrong}</s> → <b style={{ color: 'var(--green)' }}>{e.right}</b>
                </div>
              </div>
              <span className="tiny muted">×{e.frequency}</span>
              <Sparkline error={e} width={90} height={24} />
              <span className="tiny" style={{ width: 42, textAlign: 'right' }}>
                {acc === null ? '—' : `${Math.round(acc * 100)}%`}
              </span>
              <Badge kind={e.status}>{e.status}</Badge>
            </div>
          );
        })}
        {!active.length && <div className="empty">No queda ningún error activo. Revisa el cementerio.</div>}
      </div>

      {plan.top[0]?.upgradePair && (
        <div className="card">
          <div className="card-head">
            <h2>Par de mejora del día</h2>
            <Speak text={plan.top[0].upgradePair.b2} label="escuchar B2" />
          </div>
          <Upgrade pair={plan.top[0].upgradePair} />
        </div>
      )}
    </>
  );
}
