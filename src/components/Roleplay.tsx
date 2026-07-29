import { useState } from 'react';
import { SCENARIOS, type Scenario } from '../data/roleplay';
import { analyze } from '../engine/detectors';
import { useStore } from '../engine/store';
import type { Finding } from '../types';
import { Badge, CorrectionTable, PageHead, Speak } from './ui';

/**
 * Role-play — the app plays the counterpart and critiques each response against
 * the live error list, plus the structures the turn is meant to force.
 */
export default function Roleplay() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  if (!scenario) return <Picker onPick={setScenario} />;
  return <Run scenario={scenario} onExit={() => setScenario(null)} />;
}

function Picker({ onPick }: { onPick: (s: Scenario) => void }) {
  return (
    <>
      <PageHead eyebrow="Producción oral / escrita" title="Role-play de trabajo">
        <p>
          Escoge un escenario. La contraparte te empuja, tú respondes en español, y cada respuesta se
          critica en tiempo real contra tu registro de errores y contra las estructuras que el turno
          exige. Sin guion cerrado: se evalúa lo que produces, no lo que reconoces.
        </p>
      </PageHead>
      <div className="grid two">
        {SCENARIOS.map((s) => (
          <div className="card" key={s.id}>
            <div className="card-head">
              <h2>{s.title}</h2>
              <Badge kind="layer">{s.layer}</Badge>
            </div>
            <p className="tiny muted">{s.counterpart}</p>
            <p className="small dim">{s.setting}</p>
            <button className="primary" onClick={() => onPick(s)}>Empezar ({s.turns.length} turnos)</button>
          </div>
        ))}
      </div>
    </>
  );
}

function Run({ scenario, onExit }: { scenario: Scenario; onExit: () => void }) {
  const { rules, ingestFindings, saveRoleplay } = useStore();
  const [i, setI] = useState(0);
  const [draft, setDraft] = useState('');
  const [sessionId] = useState(() => `rp-${Date.now()}`);
  const [log, setLog] = useState<{ counterpart: string; user: string; findings: Finding[]; missed: string[] }[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const turn = scenario.turns[Math.min(i, scenario.turns.length - 1)];
  const done = i >= scenario.turns.length;
  const current = log[i];

  function submit() {
    const findings = analyze(draft, rules);
    const missed = turn.expect.filter((e) => !e.test.test(draft)).map((e) => e.label);
    ingestFindings(findings, 'roleplay', sessionId);
    const entry = { counterpart: turn.line, user: draft, findings, missed };
    const next = [...log.slice(0, i), entry];
    setLog(next);
    setSubmitted(true);
    saveRoleplay({
      id: sessionId,
      date: new Date().toISOString(),
      scenarioId: scenario.id,
      turns: next.map(({ counterpart, user, findings: f }) => ({ counterpart, user, findings: f })),
    });
  }

  function next() {
    setDraft('');
    setSubmitted(false);
    setI(i + 1);
  }

  return (
    <>
      <PageHead eyebrow={scenario.counterpart} title={scenario.title}>
        <p>{scenario.setting}</p>
      </PageHead>

      {log.slice(0, i).map((t, k) => (
        <div key={k} className="turn">
          <div className="who">{scenario.counterpart}</div>
          <div className="bubble">{t.counterpart}</div>
          <div className="who mt">Tú</div>
          <div className="bubble mine">{t.user}</div>
        </div>
      ))}

      {!done ? (
        <div className="card">
          <div className="who">{scenario.counterpart}</div>
          <div className="bubble">
            {turn.line} <Speak text={turn.line.replace(/^—/, '')} />
          </div>
          <div className="task-line">{turn.task}</div>

          <textarea
            className="mt"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={submitted}
            placeholder="Responde en español…"
            style={{ minHeight: 110 }}
          />

          <div className="row mt">
            <button className="primary" onClick={submit} disabled={submitted || draft.trim().length < 15}>
              Responder
            </button>
            {submitted && <button onClick={next}>{i === scenario.turns.length - 1 ? 'Terminar' : 'Siguiente turno →'}</button>}
            <span className="spacer" />
            <button className="ghost small" onClick={onExit}>salir</button>
          </div>

          {submitted && current && (
            <div className="mt">
              <h3>Crítica</h3>
              {current.missed.length === 0 ? (
                <div className="feedback">
                  <strong>Estructuras: completo.</strong> Usaste todo lo que el turno pedía.
                </div>
              ) : (
                <div className="feedback bad">
                  <strong>Te faltó:</strong> {current.missed.join(' · ')}. No es un error de gramática,
                  es registro: sin esas piezas la respuesta suena a B1 aunque esté correcta.
                </div>
              )}
              <div className="mt">
                <CorrectionTable findings={current.findings} />
              </div>
              <div className="hr" />
              <h3>Cómo lo diría un nativo en tu puesto</h3>
              <div className="bubble">
                {turn.model} <Speak text={turn.model} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h2>Escenario cerrado</h2>
          <p className="dim">
            {log.reduce((n, t) => n + t.findings.length, 0)} incidencias registradas en el log,{' '}
            {log.reduce((n, t) => n + t.missed.length, 0)} estructuras esperadas sin usar.
          </p>
          <div className="row">
            <button className="primary" onClick={onExit}>Otro escenario</button>
          </div>
        </div>
      )}
    </>
  );
}
