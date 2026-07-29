import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import type {
  AppState, Attempt, ErrorEntry, ErrorStatus, Finding, RoleplayLog,
  SessionRecord, Topic, VocabItem, WeeklyGoal, WrittenSubmission,
} from '../types';
import { SEED_ERRORS, SEED_RESOLVED } from '../data/errors';
import { SEED_TOPICS } from '../data/syllabus';
import { addDays, genderNouns, seedVocab } from '../data/vocab';
import { makeVocabGenderRule, type Rule } from './detectors';
import { parseErrorLog, parseSyllabus, parseVocab, type SeedKind } from './seedImport';

const KEY = 'fluencia.state.v1';
const VERSION = 1;

export const today = () => new Date().toISOString().slice(0, 10);
export const nowISO = () => new Date().toISOString();

export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function initialState(): AppState {
  return {
    version: VERSION,
    errors: [...SEED_ERRORS, ...SEED_RESOLVED],
    topics: SEED_TOPICS,
    vocab: seedVocab(today()),
    sessions: [],
    written: [],
    weeklyGoals: [],
    transcripts: [],
    roleplayLogs: [],
    settings: {
      rate: 0.95,
      examDate: '2026-12-01',
      autoSpeak: false,
    },
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== VERSION) return initialState();
    // merge in any seed content added since the state was saved
    const known = new Set(parsed.errors.map((e) => e.id));
    const merged = [...SEED_ERRORS, ...SEED_RESOLVED].filter((e) => !known.has(e.id));
    const knownTopics = new Set(parsed.topics.map((t) => t.id));
    return {
      ...initialState(),
      ...parsed,
      errors: [...parsed.errors, ...merged],
      topics: [
        ...parsed.topics.map((t) => ({
          ...SEED_TOPICS.find((s) => s.id === t.id),
          ...t,
        })) as Topic[],
        ...SEED_TOPICS.filter((t) => !knownTopics.has(t.id)),
      ],
    };
  } catch {
    return initialState();
  }
}

/* ------------------------------------------------------------------ *
 * Status derivation — an error is only "resolved" on sustained evidence
 * ------------------------------------------------------------------ */

export const RESOLVE_WINDOW = 6;
export const RESOLVE_MIN_SESSIONS = 3;

export function deriveStatus(attempts: Attempt[], current: ErrorStatus): ErrorStatus {
  const recent = attempts.slice(-RESOLVE_WINDOW);
  if (recent.length === 0) return current === 'resolved' ? 'resolved' : current;
  const correct = recent.filter((a) => a.correct).length;
  const sessions = new Set(recent.filter((a) => a.correct).map((a) => a.sessionId)).size;
  const lastWrong = [...attempts].reverse().findIndex((a) => !a.correct);

  // one fresh mistake pulls a resolved error back into circulation
  if (lastWrong === 0) return recent.length >= 3 && correct / recent.length >= 0.6 ? 'improving' : 'active';
  if (recent.length >= 4 && correct === recent.length && sessions >= RESOLVE_MIN_SESSIONS) {
    return 'resolved';
  }
  if (recent.length >= 3 && correct / recent.length >= 0.7) return 'improving';
  return 'active';
}

export function accuracy(e: ErrorEntry, window = 10): number | null {
  const a = e.attempts.slice(-window);
  if (!a.length) return null;
  return a.filter((x) => x.correct).length / a.length;
}

/** Rolling accuracy series for the per-error trend line. */
export function trend(e: ErrorEntry, bucket = 3): number[] {
  const out: number[] = [];
  for (let i = 0; i < e.attempts.length; i += bucket) {
    const slice = e.attempts.slice(i, i + bucket);
    out.push(slice.filter((a) => a.correct).length / slice.length);
  }
  return out;
}

export function priorityScore(e: ErrorEntry): number {
  const w = { HIGH: 3, MED: 2, LOW: 1 }[e.priority];
  const acc = accuracy(e) ?? 0;
  return w * 100 + e.frequency - acc * 60;
}

export function activeErrors(state: AppState): ErrorEntry[] {
  return state.errors
    .filter((e) => e.status !== 'resolved' && !e.archived)
    .sort((a, b) => priorityScore(b) - priorityScore(a));
}

/* ------------------------------------------------------------------ *
 * Spaced repetition (SM-2, lightly simplified)
 * ------------------------------------------------------------------ */

export function schedule(item: VocabItem, grade: 0 | 1 | 2): VocabItem {
  let { ease, intervalDays, reps, lapses } = item;
  if (grade === 0) {
    lapses += 1;
    reps = 0;
    intervalDays = 0;
    ease = Math.max(1.3, ease - 0.25);
  } else {
    const q = grade === 2 ? 5 : 3.5;
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    reps += 1;
    intervalDays = reps === 1 ? 1 : reps === 2 ? 4 : Math.round(intervalDays * ease);
  }
  return {
    ...item,
    ease,
    reps,
    lapses,
    intervalDays,
    due: addDays(today(), Math.max(0, intervalDays)),
    lastCorrect: grade > 0 ? today() : item.lastCorrect,
  };
}

export function dueVocab(state: AppState, n = 12): VocabItem[] {
  const t = today();
  return [...state.vocab]
    .filter((v) => v.due <= t)
    .sort((a, b) => {
      // surface words not used correctly in a while, and past lapses, first
      const la = a.lastCorrect ?? '0000-00-00';
      const lb = b.lastCorrect ?? '0000-00-00';
      if (a.lapses !== b.lapses) return b.lapses - a.lapses;
      return la.localeCompare(lb);
    })
    .slice(0, n);
}

/* ------------------------------------------------------------------ */

interface Store {
  state: AppState;
  rules: Rule[];
  recordAttempt: (errorId: string, correct: boolean, source: Attempt['source'], sessionId: string, detail?: string) => void;
  ingestFindings: (findings: Finding[], source: Attempt['source'], sessionId: string) => void;
  addError: (e: ErrorEntry) => void;
  updateError: (id: string, patch: Partial<ErrorEntry>) => void;
  reviewVocab: (id: string, grade: 0 | 1 | 2) => void;
  saveSession: (s: SessionRecord) => void;
  saveWritten: (w: WrittenSubmission) => void;
  saveRoleplay: (r: RoleplayLog) => void;
  addTranscript: (title: string, text: string, accepted: number) => void;
  setTopic: (id: string, patch: Partial<Topic>) => void;
  setSettings: (patch: Partial<AppState['settings']>) => void;
  weeklyGoal: WeeklyGoal;
  toggleGoal: (key: string) => void;
  importSeed: (kind: SeedKind, md: string, mode: 'merge' | 'replace') => number;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — the session still works, it just won't persist */
    }
  }, [state]);

  const rules = useMemo(
    () => [makeVocabGenderRule(genderNouns(state.vocab))],
    [state.vocab],
  );

  const recordAttempt: Store['recordAttempt'] = useCallback(
    (errorId, correct, source, sessionId, detail) => {
      setState((s) => ({
        ...s,
        errors: s.errors.map((e) => {
          if (e.id !== errorId) return e;
          const attempts = [...e.attempts, { date: nowISO(), sessionId, correct, source, detail }];
          return {
            ...e,
            attempts,
            frequency: correct ? e.frequency : e.frequency + 1,
            status: deriveStatus(attempts, e.status),
          };
        }),
      }));
    },
    [],
  );

  const ingestFindings: Store['ingestFindings'] = useCallback(
    (findings, source, sessionId) => {
      if (!findings.length) return;
      setState((s) => {
        const counts = new Map<string, Finding[]>();
        for (const f of findings) {
          if (!f.errorId) continue;
          counts.set(f.errorId, [...(counts.get(f.errorId) ?? []), f]);
        }
        return {
          ...s,
          errors: s.errors.map((e) => {
            const hits = counts.get(e.id);
            if (!hits) return e;
            const attempts = [
              ...e.attempts,
              ...hits.map((h) => ({
                date: nowISO(),
                sessionId,
                correct: false,
                source,
                detail: `${h.excerpt} → ${h.suggestion}`,
              })),
            ];
            return {
              ...e,
              attempts,
              frequency: e.frequency + hits.length,
              archived: false,
              status: deriveStatus(attempts, e.status),
            };
          }),
        };
      });
    },
    [],
  );

  const addError: Store['addError'] = useCallback((e) => {
    setState((s) => (s.errors.some((x) => x.id === e.id) ? s : { ...s, errors: [e, ...s.errors] }));
  }, []);

  const updateError: Store['updateError'] = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      errors: s.errors.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const reviewVocab: Store['reviewVocab'] = useCallback((id, grade) => {
    setState((s) => ({
      ...s,
      vocab: s.vocab.map((v) => (v.id === id ? schedule(v, grade) : v)),
    }));
  }, []);

  const saveSession: Store['saveSession'] = useCallback((rec) => {
    setState((s) => ({
      ...s,
      sessions: [rec, ...s.sessions.filter((x) => x.id !== rec.id)],
    }));
  }, []);

  const saveWritten: Store['saveWritten'] = useCallback((w) => {
    setState((s) => ({
      ...s,
      written: [w, ...s.written.filter((x) => x.id !== w.id)],
    }));
  }, []);

  const saveRoleplay: Store['saveRoleplay'] = useCallback((r) => {
    setState((s) => ({ ...s, roleplayLogs: [r, ...s.roleplayLogs.filter((x) => x.id !== r.id)] }));
  }, []);

  const addTranscript: Store['addTranscript'] = useCallback((title, text, accepted) => {
    setState((s) => ({
      ...s,
      transcripts: [
        { id: `tr-${Date.now()}`, date: nowISO(), title, text, accepted },
        ...s.transcripts,
      ],
    }));
  }, []);

  const setTopic: Store['setTopic'] = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const setSettings: Store['setSettings'] = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  // auto-generate the week's goal from the top active errors + next topic
  const week = isoWeek();
  useEffect(() => {
    setState((s) => {
      if (s.weeklyGoals.some((g) => g.week === week)) return s;
      const top = activeErrors(s).slice(0, 3).map((e) => e.id);
      const next =
        s.topics.find((t) => t.status === 'next') ??
        s.topics.find((t) => t.status === 'queued');
      return {
        ...s,
        weeklyGoals: [
          { week, errorIds: top, topicId: next?.id ?? '', createdAt: nowISO(), done: [] },
          ...s.weeklyGoals,
        ],
      };
    });
  }, [week]);

  const weeklyGoal =
    state.weeklyGoals.find((g) => g.week === week) ??
    { week, errorIds: [], topicId: '', createdAt: nowISO(), done: [] };

  const toggleGoal: Store['toggleGoal'] = useCallback((key) => {
    setState((s) => ({
      ...s,
      weeklyGoals: s.weeklyGoals.map((g) =>
        g.week === isoWeek()
          ? { ...g, done: g.done.includes(key) ? g.done.filter((k) => k !== key) : [...g.done, key] }
          : g,
      ),
    }));
  }, []);

  /**
   * Re-import one of the three source files. `merge` keeps existing history and
   * only adds what isn't already there; `replace` swaps the collection wholesale
   * (attempt history for errors that survive by id is preserved either way).
   */
  const importSeed: Store['importSeed'] = useCallback((kind, md, mode) => {
    let n = 0;
    setState((s) => {
      if (kind === 'errors') {
        const parsed = parseErrorLog(md);
        n = parsed.length;
        if (!n) return s;
        const keepHistory = (e: ErrorEntry) => {
          const prev = s.errors.find((x) => x.id === e.id);
          return prev ? { ...e, attempts: prev.attempts, frequency: Math.max(e.frequency, prev.frequency) } : e;
        };
        const next = parsed.map(keepHistory);
        const ids = new Set(next.map((e) => e.id));
        return {
          ...s,
          errors: mode === 'replace' ? next : [...next, ...s.errors.filter((e) => !ids.has(e.id))],
        };
      }
      if (kind === 'syllabus') {
        const parsed = parseSyllabus(md);
        n = parsed.length;
        if (!n) return s;
        const withLessons = parsed.map((t) => {
          const prev = s.topics.find((x) => x.id === t.id || x.name === t.name);
          return prev?.lesson ? { ...t, lesson: prev.lesson } : t;
        });
        const ids = new Set(withLessons.map((t) => t.id));
        return {
          ...s,
          topics: mode === 'replace' ? withLessons : [...withLessons, ...s.topics.filter((t) => !ids.has(t.id))],
        };
      }
      const parsed = parseVocab(md, today());
      n = parsed.length;
      if (!n) return s;
      const seen = new Set(s.vocab.map((v) => v.term.toLowerCase()));
      return {
        ...s,
        vocab: mode === 'replace' ? parsed : [...s.vocab, ...parsed.filter((v) => !seen.has(v.term.toLowerCase()))],
      };
    });
    return n;
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setState(initialState());
  }, []);

  const value: Store = {
    state, rules, recordAttempt, ingestFindings, addError, updateError, reviewVocab,
    saveSession, saveWritten, saveRoleplay, addTranscript, setTopic, setSettings,
    weeklyGoal, toggleGoal, importSeed, reset,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}

/** What the app proposes when you open it — "resume the course, don't restart it". */
export function sessionPlan(state: AppState) {
  const top = activeErrors(state).slice(0, 3);
  const topic =
    state.topics.find((t) => t.status === 'next') ??
    state.topics.find((t) => t.status === 'queued') ??
    state.topics[0];
  const last = state.sessions[0];
  const due = dueVocab(state).length;
  return { top, topic, last, due };
}

export function daysToExam(state: AppState): number {
  const diff = new Date(state.settings.examDate).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}
