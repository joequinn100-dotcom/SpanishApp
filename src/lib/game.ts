import 'server-only';
import { db } from './queries';
import { streak, todayActivity } from './practice';
import { achievements, dailyQuest, type Achievement, type QuestStep } from '@/domain/achievements';

/** The §8 game layer's data, assembled from real history. */
export interface GameState {
  streak: { current: number; longest: number; freezes: number };
  quest: { steps: QuestStep[]; complete: boolean };
  achievements: Achievement[];
  earned: number;
  xp: number;
}

export function gameState(now: string = new Date().toISOString()): GameState {
  const database = db();

  const errors = (
    database
      .prepare(
        'SELECT code, status, clean_streak, spontaneous_ok, resolved_at FROM error',
      )
      .all() as {
      code: string;
      status: string;
      clean_streak: number;
      spontaneous_ok: number;
      resolved_at: string | null;
    }[]
  ).map((e) => ({
    code: e.code,
    status: e.status,
    cleanStreak: e.clean_streak,
    spontaneousOk: e.spontaneous_ok,
    resolvedAt: e.resolved_at,
  }));

  const topics = (
    database
      .prepare(
        `SELECT t.id, t.level_id AS level, t.strand_id AS strand, s.status, t.no_schedule
           FROM topic t JOIN topic_state s ON s.topic_id = t.id`,
      )
      .all() as {
      id: string;
      level: string;
      strand: string;
      status: string;
      no_schedule: number;
    }[]
  ).map((t) => ({ ...t, noSchedule: t.no_schedule === 1 }));

  const vocab = database.prepare('SELECT stage FROM vocab').all() as { stage: string }[];
  const n = (sql: string) => (database.prepare(sql).get() as { n: number }).n;

  const s = streak();
  const list = achievements({
    now,
    errors,
    topics,
    vocab,
    streakCurrent: s.current,
    streakLongest: s.longest,
    sessions: n('SELECT count(*) AS n FROM session'),
    transcripts: n('SELECT count(*) AS n FROM transcript WHERE reviewed_at IS NOT NULL'),
    attempts: n('SELECT count(*) AS n FROM attempt'),
  });

  return {
    streak: { current: s.current, longest: s.longest, freezes: s.freezes },
    quest: dailyQuest(todayActivity(now)),
    achievements: list,
    earned: list.filter((a) => a.earned).length,
    xp: n('SELECT COALESCE(sum(amount), 0) AS n FROM xp_event'),
  };
}
