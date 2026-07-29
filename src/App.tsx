import { useState } from 'react';
import { activeErrors, daysToExam, dueVocab, useStore } from './engine/store';
import Dashboard from './components/Dashboard';
import Session from './components/Session';
import ErrorLog from './components/ErrorLog';
import VocabBank from './components/VocabBank';
import Roleplay from './components/Roleplay';
import Transcripts from './components/Transcripts';
import Progress from './components/Progress';
import History from './components/History';
import Settings from './components/Settings';

export type View =
  | 'dashboard' | 'session' | 'errors' | 'vocab'
  | 'roleplay' | 'transcripts' | 'progress' | 'history' | 'settings';

export default function App() {
  const { state } = useStore();
  const [view, setView] = useState<View>('dashboard');
  const [sessionKey, setSessionKey] = useState(0);
  const active = activeErrors(state).length;
  const due = dueVocab(state, 999).length;

  function go(v: View) {
    if (v === 'session' && view !== 'session') setSessionKey((k) => k + 1);
    setView(v);
  }

  const main: { id: View; label: string }[] = [
    { id: 'dashboard', label: 'Hoy' },
    { id: 'session', label: 'Sesión' },
    { id: 'roleplay', label: 'Role-play' },
  ];
  const refs: { id: View; label: string; count?: number }[] = [
    { id: 'errors', label: 'Registro de errores', count: active },
    { id: 'vocab', label: 'Banco de vocabulario', count: due },
    { id: 'progress', label: 'Currículo y examen' },
    { id: 'transcripts', label: 'Transcripciones' },
    { id: 'history', label: 'Historial' },
    { id: 'settings', label: 'Ajustes' },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Fluen<span>cia</span></div>
        <div className="brand-sub">B1 → B2 · {daysToExam(state)} días</div>
        <nav className="nav">
          {main.map((n) => (
            <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => go(n.id)}>
              {n.label}
            </button>
          ))}
          <div className="nav-sep">Referencia</div>
          {refs.map((n) => (
            <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => go(n.id)}>
              {n.label}
              {n.count ? <span className="count">{n.count}</span> : null}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        {view === 'dashboard' && <Dashboard go={go} />}
        {view === 'session' && <Session key={sessionKey} go={go} />}
        {view === 'errors' && <ErrorLog />}
        {view === 'vocab' && <VocabBank />}
        {view === 'roleplay' && <Roleplay />}
        {view === 'transcripts' && <Transcripts />}
        {view === 'progress' && <Progress />}
        {view === 'history' && <History />}
        {view === 'settings' && <Settings />}
      </main>
    </div>
  );
}
