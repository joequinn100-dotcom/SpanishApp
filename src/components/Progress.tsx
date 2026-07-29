import { useState } from 'react';
import { daysToExam, useStore } from '../engine/store';
import type { FluencyLayer, Topic } from '../types';
import { Badge, Bar, PageHead } from './ui';

const LAYERS: { id: FluencyLayer; name: string; what: string }[] = [
  { id: 'accuracy', name: 'Precisión', what: 'La forma correcta, sin presión de tiempo. Nada avanza hasta aquí estar limpio.' },
  { id: 'speed', name: 'Velocidad', what: 'La misma forma, en 15 segundos, sin poder repasar la regla.' },
  { id: 'naturalness', name: 'Naturalidad', what: 'Registro nativo: conectores, matización, colocaciones — no solo "correcto".' },
  { id: 'confidence', name: 'Confianza de trabajo', what: 'Role-play largo sin guion: negociar, defender una posición, reportar avance.' },
];

export default function Progress() {
  const { state, setTopic } = useStore();
  const [edit, setEdit] = useState<string | null>(null);
  const days = daysToExam(state);
  const byLevel = ['Foundations (A1–A2)', 'Breakthrough (B1–B2)', 'Mastery (C1–C2)'] as const;
  const bt = state.topics.filter((t) => t.level === 'Breakthrough (B1–B2)');
  const covered = bt.filter((t) => t.status === 'covered').length;
  const weeks = Math.max(1, Math.ceil(days / 7));
  const remaining = bt.length - covered;

  return (
    <>
      <PageHead eyebrow="Currículo Read2Speak" title="Camino al examen B2">
        <p>
          Faltan <strong>{days} días</strong> ({weeks} semanas) para el examen de{' '}
          {new Date(state.settings.examDate).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}.
          Quedan {remaining} temas de la secuencia Breakthrough: {(remaining / weeks).toFixed(1)} temas
          por semana para llegar con margen de repaso.
        </p>
      </PageHead>

      <div className="card">
        <div className="card-head">
          <h2>Cobertura del temario</h2>
          <span className="small dim">{covered}/{bt.length} temas B1–B2</span>
        </div>
        <Bar value={covered / bt.length} />
      </div>

      <div className="card">
        <h2>Capas de fluidez</h2>
        <p className="small dim">
          Cada tema avanza de capa por evidencia, no por haberse "visto". Se sube al 80% de acierto en
          el ejercicio del tema.
        </p>
        <div className="grid four mt">
          {LAYERS.map((l) => {
            const n = state.topics.filter((t) => t.layer === l.id && t.status === 'covered').length;
            return (
              <div key={l.id} className="card tight" style={{ marginBottom: 0 }}>
                <div className="stat">
                  <div className="n teal">{n}</div>
                  <div className="l">{l.name}</div>
                </div>
                <p className="tiny muted mb0 mt">{l.what}</p>
              </div>
            );
          })}
        </div>
      </div>

      {byLevel.map((level) => {
        const topics = state.topics.filter((t) => t.level === level).sort((a, b) => a.order - b.order);
        if (!topics.length) return null;
        return (
          <div className="card" key={level}>
            <h2>{level}</h2>
            {topics.map((t) => (
              <div key={t.id} style={{ padding: '.55rem 0', borderBottom: '1px solid var(--line-soft)' }}>
                <div className="row">
                  <span style={{ width: 24 }} className="tiny muted">{t.order}</span>
                  <span style={{ flex: 1 }}>{t.name}</span>
                  <Badge kind="layer">{t.layer}</Badge>
                  <Badge kind={t.status === 'covered' ? 'resolved' : t.status === 'next' ? 'improving' : 'low'}>
                    {t.status === 'covered' ? 'cubierto' : t.status === 'next' ? 'siguiente' : 'en cola'}
                  </Badge>
                  <span className="tiny muted" style={{ width: 70 }}>
                    confianza {t.confidence}/5
                  </span>
                  <button className="small ghost" onClick={() => setEdit(edit === t.id ? null : t.id)}>
                    {edit === t.id ? 'cerrar' : 'ajustar'}
                  </button>
                </div>
                {edit === t.id && <Editor t={t} onChange={(p) => setTopic(t.id, p)} />}
                {t.summary && <div className="tiny muted" style={{ paddingLeft: 24 }}>{t.summary}</div>}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function Editor({ t, onChange }: { t: Topic; onChange: (p: Partial<Topic>) => void }) {
  return (
    <div className="row" style={{ padding: '.6rem 0 .6rem 24px' }}>
      <span className="tiny muted">estado:</span>
      {(['covered', 'next', 'queued'] as const).map((s) => (
        <button key={s} className={'small ' + (t.status === s ? 'primary' : 'ghost')} onClick={() => onChange({ status: s })}>
          {s === 'covered' ? 'cubierto' : s === 'next' ? 'siguiente' : 'en cola'}
        </button>
      ))}
      <span className="tiny muted">confianza:</span>
      {[1, 2, 3, 4, 5].map((c) => (
        <button
          key={c}
          className={'small ' + (t.confidence === c ? 'primary' : 'ghost')}
          onClick={() => onChange({ confidence: c as Topic['confidence'] })}
        >
          {c}
        </button>
      ))}
      <span className="tiny muted">capa:</span>
      {LAYERS.map((l) => (
        <button key={l.id} className={'small ' + (t.layer === l.id ? 'primary' : 'ghost')} onClick={() => onChange({ layer: l.id })}>
          {l.name}
        </button>
      ))}
    </div>
  );
}
