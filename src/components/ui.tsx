import { useEffect, useRef, useState } from 'react';
import type { ErrorEntry, Finding, UpgradePair } from '../types';
import { speak, speechAvailable, trapsIn } from '../engine/speech';
import { useStore, trend } from '../engine/store';

export function Speak({ text, label }: { text: string; label?: string }) {
  const { state } = useStore();
  if (!speechAvailable()) return null;
  return (
    <button
      className="speak-btn"
      title="Escuchar (voz latinoamericana)"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, { voiceURI: state.settings.voiceURI, rate: state.settings.rate });
      }}
    >
      ▸ {label ?? 'oír'}
    </button>
  );
}

/** "Listen and repeat" for items whose spelling misleads. */
export function Traps({ text }: { text: string }) {
  const traps = trapsIn(text);
  if (!traps.length) return null;
  return (
    <div className="mt">
      {traps.map((t) => (
        <span className="trap" key={t.word}>
          <Speak text={t.word} label={t.word} />
          <span className="tiny">{t.why}</span>
        </span>
      ))}
    </div>
  );
}

export function Upgrade({ pair }: { pair: UpgradePair }) {
  return (
    <div className="upgrade">
      <div className="lvl">
        <span className="tag">B1 — lo que dirías hoy</span>
        {pair.b1} <Speak text={pair.b1} />
      </div>
      <div className="lvl b2">
        <span className="tag">B2 — cómo suena un nativo</span>
        {pair.b2} <Speak text={pair.b2} />
      </div>
      <div className="why">{pair.note}</div>
      <Traps text={pair.b2} />
    </div>
  );
}

export function Badge({
  kind, children,
}: { kind: string; children: React.ReactNode }) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

export function Bar({ value, tone }: { value: number; tone?: 'red' | 'amber' }) {
  return (
    <div className="bar">
      <span className={tone} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

/** Per-error accuracy trend line. */
export function Sparkline({ error, width = 120, height = 28 }: { error: ErrorEntry; width?: number; height?: number }) {
  const pts = trend(error);
  if (pts.length < 2) {
    return <span className="tiny muted">sin datos suficientes</span>;
  }
  const step = width / (pts.length - 1);
  const path = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${((1 - p) * (height - 4) + 2).toFixed(1)}`)
    .join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg className="spark" width={width} height={height} aria-label="tendencia de precisión">
      <line x1="0" y1={height - 2} x2={width} y2={height - 2} stroke="var(--line)" />
      <path d={path} fill="none" stroke={last >= 0.8 ? 'var(--green)' : last >= 0.5 ? 'var(--amber)' : 'var(--red)'} strokeWidth="1.6" />
    </svg>
  );
}

export function CorrectionTable({ findings }: { findings: Finding[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!findings.length) {
    return (
      <div className="feedback">
        Sin errores detectados contra tu registro actual. Eso cuenta como acierto en todos los
        patrones activos que aparecen en el texto.
      </div>
    );
  }
  return (
    <table>
      <thead>
        <tr>
          <th style={{ width: '22%' }}>Error</th>
          <th style={{ width: '22%' }}>Corrección</th>
          <th>Regla</th>
        </tr>
      </thead>
      <tbody>
        {findings.map((f, i) => (
          <tr key={i}>
            <td className="wrong">{f.excerpt}</td>
            <td className="right">
              {f.suggestion} <Speak text={f.suggestion} />
            </td>
            <td className="rule">
              {open === i ? f.rule : f.rule.slice(0, 180) + (f.rule.length > 180 ? '… ' : '')}
              {f.rule.length > 180 && (
                <button className="small ghost" onClick={() => setOpen(open === i ? null : i)}>
                  {open === i ? 'menos' : 'regla completa'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Timed drills — the "speed" fluency layer. */
export function Countdown({
  seconds, running, onExpire, keyReset,
}: { seconds: number; running: boolean; onExpire: () => void; keyReset: string | number }) {
  const [left, setLeft] = useState(seconds);
  const cb = useRef(onExpire);
  cb.current = onExpire;
  useEffect(() => setLeft(seconds), [keyReset, seconds]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id);
          cb.current();
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, keyReset]);
  return <span className={`timer ${left <= 5 ? 'hot' : ''}`}>{left}s</span>;
}

export function PageHead({
  eyebrow, title, children,
}: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {children}
    </div>
  );
}
