export type ErrorCategory =
  | 'grammar'
  | 'tense'
  | 'vocab'
  | 'pronunciation'
  | 'false-friend'
  | 'collocation';

export type Priority = 'HIGH' | 'MED' | 'LOW';
export type ErrorStatus = 'active' | 'improving' | 'resolved';

/** One graded rep of an error pattern, from any part of the app. */
export interface Attempt {
  date: string; // ISO date-time
  sessionId: string;
  correct: boolean;
  source: 'drill' | 'written' | 'transcript' | 'roleplay' | 'quiz';
  detail?: string;
}

export interface ErrorEntry {
  id: string;
  category: ErrorCategory;
  title: string;
  wrong: string;
  right: string;
  rule: string; // thorough explanation — depth over brevity
  firstSeen: string;
  frequency: number;
  priority: Priority;
  status: ErrorStatus;
  attempts: Attempt[];
  /** ids of detector rules that fire for this error */
  detectors: string[];
  archived?: boolean;
  notes?: string;
  drills: DrillItem[];
  upgradePair?: UpgradePair;
}

export interface DrillItem {
  id: string;
  prompt: string; // the sentence, with ___ or the flawed version
  options: string[];
  answer: number;
  explanation: string;
  speak?: string; // what TTS should read after answering
}

export interface UpgradePair {
  b1: string;
  b2: string;
  note: string;
}

export type FluencyLayer = 'accuracy' | 'speed' | 'naturalness' | 'confidence';

export interface Topic {
  id: string;
  name: string;
  level: 'Foundations (A1–A2)' | 'Breakthrough (B1–B2)' | 'Mastery (C1–C2)';
  order: number;
  status: 'covered' | 'next' | 'queued';
  confidence: 1 | 2 | 3 | 4 | 5;
  layer: FluencyLayer;
  summary: string;
  lesson?: Lesson;
}

export interface Lesson {
  sections: { heading: string; body: string; examples?: UpgradePair[] }[];
  contrasts?: { left: string; right: string; why: string }[];
  quiz: DrillItem[];
}

export type VocabSection =
  | 'Connectors & discourse markers'
  | 'Work & project nouns (gender marked)'
  | 'Collocations'
  | 'Verb patterns'
  | 'Negotiation & hedging'
  | 'Site & technical'
  | 'Sentence builders';

export interface VocabItem {
  id: string;
  section: VocabSection;
  term: string;
  gender?: 'm' | 'f';
  gloss: string;
  example: string;
  /** SRS */
  ease: number;
  intervalDays: number;
  due: string; // ISO date
  reps: number;
  lapses: number;
  lastCorrect?: string;
}

export interface WrittenSubmission {
  id: string;
  sessionId: string;
  date: string;
  prompt: string;
  text: string;
  revision?: string;
  findings: Finding[];
  revisionFindings?: Finding[];
}

export interface Finding {
  detectorId: string;
  errorId?: string;
  excerpt: string;
  suggestion: string;
  rule: string;
  category: ErrorCategory;
  index: number;
}

export interface SessionRecord {
  id: string;
  date: string;
  completedParts: string[];
  topicId?: string;
  drillsCorrect: number;
  drillsTotal: number;
  vocabReviewed: number;
  writtenId?: string;
  notes?: string;
  durationMin?: number;
}

export interface WeeklyGoal {
  week: string; // ISO week key e.g. 2026-W31
  errorIds: string[];
  topicId: string;
  createdAt: string;
  done: string[]; // goal keys ticked
}

export interface TranscriptRecord {
  id: string;
  date: string;
  title: string;
  text: string;
  accepted: number;
}

export interface AppState {
  version: number;
  errors: ErrorEntry[];
  topics: Topic[];
  vocab: VocabItem[];
  sessions: SessionRecord[];
  written: WrittenSubmission[];
  weeklyGoals: WeeklyGoal[];
  transcripts: TranscriptRecord[];
  roleplayLogs: RoleplayLog[];
  settings: Settings;
}

export interface Settings {
  voiceURI?: string;
  rate: number;
  examDate: string;
  autoSpeak: boolean;
}

export interface RoleplayLog {
  id: string;
  date: string;
  scenarioId: string;
  turns: { counterpart: string; user: string; findings: Finding[] }[];
}
