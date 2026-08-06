import 'server-only';
import { db } from './queries';
import { EXAM_DATE } from './progress';
import {
  errorProgress,
  levelEstimate,
  positionOn,
  project,
  requiredPace,
  velocity,
  LEVEL_ORDER,
  type LevelId,
  type Projection,
} from '@/domain/timeline';

/**
 * The Timeline's data (SPEC §8).
 *
 * The B2 threshold is defined as every scheduled topic at B2 and below — the
 * C-levels are beyond the exam and would make the projection meaningless. And
 * `placed_manually` topics are excluded from the *velocity* sample though not
 * from the target: declaring you already knew A1 tells the app where you start,
 * not how fast you learn, and letting it drive the pace would produce a wildly
 * optimistic date on day one.
 */

export interface TimelineData {
  now: string;
  examDate: string;
  daysToExam: number;
  level: { band: LevelId; plus: boolean; fraction: number };
  byLevel: { level: LevelId; total: number; mastered: number }[];
  target: { total: number; mastered: number; remaining: number };
  projection: Projection;
  requiredPerWeek: number | null;
  velocityPerWeek: number;
  /** Upcoming topics with a projected date, ordered by when they land. */
  nodes: { id: string; name: string; level: LevelId; strand: string; at: string; position: number }[];
  errors: {
    code: string;
    label: string;
    severity: number;
    status: string;
    progress: number;
    resolvedAt: string | null;
  }[];
  /** Sessions per week over the trailing month — the input the learner controls. */
  sessionsPerWeek: number;
}

const TARGET_LEVELS: LevelId[] = ['A1', 'A2', 'B1', 'B2'];

export function timeline(now: string = new Date().toISOString()): TimelineData {
  const database = db();

  const byLevel = LEVEL_ORDER.map((level) => {
    const r = database
      .prepare(
        `SELECT count(*) AS total,
                sum(CASE WHEN s.status = 'mastered' THEN 1 ELSE 0 END) AS mastered
           FROM topic t JOIN topic_state s ON s.topic_id = t.id
          WHERE t.level_id = ? AND t.no_schedule = 0`,
      )
      .get(level) as { total: number; mastered: number };
    return { level, total: r.total, mastered: r.mastered ?? 0 };
  });

  const target = byLevel
    .filter((b) => TARGET_LEVELS.includes(b.level))
    .reduce(
      (acc, b) => ({ total: acc.total + b.total, mastered: acc.mastered + b.mastered }),
      { total: 0, mastered: 0 },
    );
  const remaining = Math.max(0, target.total - target.mastered);

  // Earned mastery only — see the note above on placement.
  const earned = (
    database
      .prepare(
        `SELECT mastered_at FROM topic_state
          WHERE status = 'mastered' AND mastered_at IS NOT NULL AND placed_manually = 0`,
      )
      .all() as { mastered_at: string }[]
  ).map((r) => r.mastered_at);

  const projection = project({ remaining, masteredAt: earned, now, examDate: EXAM_DATE });

  // Projected dates for what comes next, spread evenly at the current pace.
  const upcoming = database
    .prepare(
      `SELECT t.id, t.name_en AS name, t.level_id AS level, t.strand_id AS strand
         FROM topic t JOIN topic_state s ON s.topic_id = t.id
        WHERE s.status IN ('available','studying','consolidating')
          AND t.no_schedule = 0 AND t.level_id IN ('A1','A2','B1','B2')
        ORDER BY (SELECT ordinal FROM level WHERE id = t.level_id), t.id
        LIMIT 12`,
    )
    .all() as { id: string; name: string; level: LevelId; strand: string }[];

  const perWeek = velocity(earned, now);
  const nodes = upcoming.map((t, i) => {
    const weeks = perWeek > 0 ? (i + 1) / perWeek : (i + 1) * 2;
    const at = new Date(new Date(now).getTime() + weeks * 7 * 86_400_000).toISOString();
    return { ...t, at, position: positionOn(at, now, EXAM_DATE) };
  });

  const errors = (
    database
      .prepare(
        `SELECT code, label_en AS label, severity, status, clean_streak, spontaneous_ok,
                consolidating_since, resolved_at
           FROM error
          ORDER BY severity DESC, occurrences DESC`,
      )
      .all() as {
      code: string;
      label: string;
      severity: number;
      status: string;
      clean_streak: number;
      spontaneous_ok: number;
      consolidating_since: string | null;
      resolved_at: string | null;
    }[]
  ).map((e) => ({
    code: e.code,
    label: e.label,
    severity: e.severity,
    status: e.status,
    resolvedAt: e.resolved_at,
    progress: errorProgress({
      status: e.status,
      cleanStreak: e.clean_streak,
      spontaneousOk: e.spontaneous_ok,
      consolidatingSince: e.consolidating_since,
      now,
    }),
  }));

  const sessions = database
    .prepare(
      `SELECT count(*) AS n FROM session WHERE started_at >= ?`,
    )
    .get(new Date(new Date(now).getTime() - 28 * 86_400_000).toISOString()) as { n: number };

  return {
    now,
    examDate: EXAM_DATE,
    daysToExam: Math.max(
      0,
      Math.ceil((new Date(EXAM_DATE).getTime() - new Date(now).getTime()) / 86_400_000),
    ),
    level: levelEstimate(byLevel),
    byLevel,
    target: { ...target, remaining },
    projection,
    requiredPerWeek: requiredPace(remaining, now, EXAM_DATE),
    velocityPerWeek: perWeek,
    nodes,
    errors,
    sessionsPerWeek: (sessions.n / 28) * 7,
  };
}
