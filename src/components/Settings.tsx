import { useEffect, useState } from 'react';
import { useStore } from '../engine/store';
import { onVoicesReady, pickVoice, speak, speechAvailable, voices } from '../engine/speech';
import { detectKind, type SeedKind } from '../engine/seedImport';
import { PageHead } from './ui';

const SAMPLE =
  'Después del comité, el residente confirmó que la obra avanzó un veinte por ciento y que el cronograma sigue vigente.';

export default function Settings() {
  const { state, setSettings, reset } = useStore();
  const [, force] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    onVoicesReady(() => force((n) => n + 1));
  }, []);

  const list = voices();
  const chosen = pickVoice(state.settings.voiceURI);

  function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fluencia-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageHead eyebrow="Ajustes" title="Voz, examen y datos" />

      <div className="card">
        <h2>Voz (español latinoamericano)</h2>
        {!speechAvailable() && (
          <p className="small" style={{ color: 'var(--amber)' }}>
            Este navegador no expone Web Speech API. El resto de la app funciona igual, pero sin audio.
          </p>
        )}
        <p className="small dim">
          Se prioriza es-PE, luego es-MX y es-419. Nunca es-ES: el objetivo es registro neutro
          latinoamericano, no peninsular.
        </p>
        <div className="row">
          <select
            value={state.settings.voiceURI ?? ''}
            onChange={(e) => setSettings({ voiceURI: e.target.value || undefined })}
            style={{ maxWidth: 400 }}
          >
            <option value="">Automática ({chosen ? `${chosen.name} · ${chosen.lang}` : 'ninguna disponible'})</option>
            {list.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} · {v.lang}
              </option>
            ))}
          </select>
          <button onClick={() => speak(SAMPLE, { voiceURI: state.settings.voiceURI, rate: state.settings.rate })}>
            Probar
          </button>
        </div>
        <div className="row mt">
          <span className="small dim">Velocidad: {state.settings.rate.toFixed(2)}×</span>
          <input
            type="range"
            min="0.6"
            max="1.3"
            step="0.05"
            value={state.settings.rate}
            onChange={(e) => setSettings({ rate: Number(e.target.value) })}
            style={{ width: 200, accentColor: 'var(--teal-dim)' }}
          />
        </div>
      </div>

      <div className="card">
        <h2>Examen B2</h2>
        <div className="row">
          <span className="small dim">Fecha objetivo:</span>
          <input
            type="date"
            value={state.settings.examDate}
            onChange={(e) => setSettings({ examDate: e.target.value })}
            className="inline"
          />
        </div>
      </div>

      <SeedImport />

      <div className="card">
        <h2>Datos</h2>
        <p className="small dim">
          Todo vive en el almacenamiento local de este navegador: registro de errores, banco de
          vocabulario, sesiones, escritos y role-plays. Exporta si vas a cambiar de equipo.
        </p>
        <div className="row">
          <button onClick={exportState}>Exportar JSON</button>
          {!confirmReset ? (
            <button className="danger" onClick={() => setConfirmReset(true)}>
              Reiniciar a los datos semilla
            </button>
          ) : (
            <>
              <span className="small" style={{ color: 'var(--red)' }}>
                Esto borra tu historial y vuelve al estado de origen. ¿Seguro?
              </span>
              <button className="danger" onClick={() => { reset(); setConfirmReset(false); }}>
                Sí, borrar
              </button>
              <button onClick={() => setConfirmReset(false)}>Cancelar</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}


const KIND_LABEL: Record<SeedKind, string> = {
  errors: 'My_Spanish_Error_Log.md',
  syllabus: 'My_Spanish_Syllabus.md',
  vocab: 'My_Vocabulary_Bank.md',
};

/**
 * Re-import any of the three source files. The app ships seeded with their
 * current contents; this is for when your own copy moves ahead of the app.
 */
function SeedImport() {
  const { importSeed } = useStore();
  const [md, setMd] = useState('');
  const [kind, setKind] = useState<SeedKind | ''>('');
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [result, setResult] = useState('');

  const guessed = md.trim() ? detectKind(md) : null;
  const chosen = (kind || guessed || '') as SeedKind | '';

  function run() {
    if (!chosen) return;
    const n = importSeed(chosen, md, mode);
    setResult(
      n
        ? `${n} entradas importadas de ${KIND_LABEL[chosen]} (${mode === 'merge' ? 'fusionado' : 'reemplazado'}). El historial de intentos de los errores que ya existían se conservó.`
        : 'No se reconoció ninguna entrada. Revisa el formato contra los archivos de /seed en el repositorio.',
    );
  }

  return (
    <div className="card">
      <h2>Reimportar archivos semilla</h2>
      <p className="small dim">
        La app ya viene cargada con tu registro de errores, tu temario y tu banco de vocabulario. Usa
        esto solo si tu copia de alguno de los tres archivos avanzó por fuera. El formato esperado
        está documentado en la carpeta <span className="mono">/seed</span> del repositorio.
      </p>
      <textarea
        value={md}
        onChange={(e) => { setMd(e.target.value); setResult(''); }}
        placeholder="Pega aquí el contenido del archivo .md…"
        style={{ minHeight: 130 }}
      />
      <div className="row mt">
        <span className="tiny muted">archivo:</span>
        {(['errors', 'syllabus', 'vocab'] as SeedKind[]).map((k) => (
          <button key={k} className={'small ' + (chosen === k ? 'primary' : 'ghost')} onClick={() => setKind(k)}>
            {KIND_LABEL[k]}
          </button>
        ))}
        {guessed && !kind && <span className="tiny" style={{ color: 'var(--teal)' }}>detectado automáticamente</span>}
      </div>
      <div className="row mt">
        <span className="tiny muted">modo:</span>
        <button className={'small ' + (mode === 'merge' ? 'primary' : 'ghost')} onClick={() => setMode('merge')}>
          fusionar
        </button>
        <button className={'small ' + (mode === 'replace' ? 'primary' : 'ghost')} onClick={() => setMode('replace')}>
          reemplazar
        </button>
        <span className="spacer" />
        <button className="primary" onClick={run} disabled={!chosen || md.trim().length < 20}>
          Importar
        </button>
      </div>
      {result && <div className="feedback">{result}</div>}
    </div>
  );
}
