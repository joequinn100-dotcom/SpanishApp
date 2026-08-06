import type { DrillKind, DrillPayload } from '@/domain/grading';

export type LevelId = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type StrandId =
  | 'verb'
  | 'mood'
  | 'pron'
  | 'noun'
  | 'prep'
  | 'syntax'
  | 'discourse'
  | 'lex'
  | 'prof';

export interface SeedTopic {
  id: string; // {level}.{strand}.{name} — must match the prereq graph exactly
  nameEn: string;
  nameEs: string;
  level: LevelId;
  strand: StrandId;
  /** One paragraph: what it is and why it matters to this learner. */
  summary: string;
  /** Real unit reference, or null where no book covers it. Never invented. */
  bookRef: string | null;
  estMinutes?: number;
  /** Pipe-delimited search aliases, including inflected forms a learner types. */
  searchTerms: string;
  /** Seeded and searchable, but never scheduled by the recommender (SPEC §10). */
  noSchedule?: boolean;
}

export interface SeedPrereq {
  topic: string;
  prereq: string;
  strength: 'hard' | 'soft';
}

export interface SeedError {
  code: string;
  labelEn: string;
  wrong: string;
  right: string;
  /** Thorough: the rule, the why, and the exceptions. Never abbreviated. */
  rule: string;
  topicId: string | null;
  severity: 1 | 2 | 3 | 4 | 5;
  status: 'active' | 'improving' | 'consolidating' | 'resolved' | 'regressed';
  /** Real counts, because §4's weight formula multiplies by log(1+occurrences). */
  occurrences: number;
  note?: string;
}

/**
 * An authored drill.
 *
 * SPEC §5 assumes all content arrives through the gauntlet. These do not — they
 * are written by hand so the practice loop has something to run before an API
 * key exists, and every row is marked `provenance = 'authored'` so the gauntlet
 * can re-verify or replace them later. The test suite is the interim gate:
 * register, work context, and answer-key consistency are all enforced there.
 */
export interface SeedDrill {
  topicId: string;
  kind: DrillKind;
  /** 1 = recognition, 5 = unaided production under a twist. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** The error code this item probes, when it was written to probe one. */
  targetsError: string | null;
  payload: DrillPayload;
}

export const LEVELS: { id: LevelId; ordinal: number }[] = [
  { id: 'A1', ordinal: 1 },
  { id: 'A2', ordinal: 2 },
  { id: 'B1', ordinal: 3 },
  { id: 'B2', ordinal: 4 },
  { id: 'C1', ordinal: 5 },
  { id: 'C2', ordinal: 6 },
];

export const STRANDS: { id: StrandId; nameEn: string; nameEs: string }[] = [
  { id: 'verb', nameEn: 'Verb system', nameEs: 'Sistema verbal' },
  { id: 'mood', nameEn: 'Mood & modality', nameEs: 'Modo y modalidad' },
  { id: 'pron', nameEn: 'Pronouns & clitics', nameEs: 'Pronombres y clíticos' },
  { id: 'noun', nameEn: 'Nouns, gender, articles, agreement', nameEs: 'Sustantivos, género, artículos' },
  { id: 'prep', nameEn: 'Prepositions', nameEs: 'Preposiciones' },
  { id: 'syntax', nameEn: 'Clause structure & subordination', nameEs: 'Sintaxis y subordinación' },
  { id: 'discourse', nameEn: 'Connectors, register, flow', nameEs: 'Discurso y conectores' },
  { id: 'lex', nameEn: 'Vocabulary & collocation', nameEs: 'Léxico y colocación' },
  { id: 'prof', nameEn: 'Professional performance', nameEs: 'Desempeño profesional' },
];
