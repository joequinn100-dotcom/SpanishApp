import 'server-only';
import type { DB } from '@/db';
import { runGauntlet, type GauntletDeps, type GenerationRequest } from '@/domain/gauntlet';
import { DRILL_KINDS } from '@/domain/grading';
import { persistOutcome, poolSize, retireOverFamiliar } from './gauntlet';

/**
 * The overnight pre-generation job (SPEC §5, cost control).
 *
 * §5: "Pre-generate overnight. A background job fills the content pool for the
 * next 3 recommended topics while you sleep. Sessions should never wait on
 * generation."
 *
 * That last sentence is the design constraint, and it is why this is a script
 * run by cron rather than something a page triggers. A gauntlet run is five API
 * calls with three verification rounds behind it; a learner who opens the app
 * and waits for that has been given a loading spinner instead of a lesson.
 * Nothing in the request path calls into this file.
 */

/**
 * How many live drills a topic should have before the job leaves it alone.
 *
 * Fourteen, not ten. A session's topic block is ten items (`TOPIC_ITEMS`) and
 * §8's boss fight is twelve unaided ones, so a pool of ten means the boss
 * fight is either impossible or a rerun of the session the learner just did.
 * Fourteen leaves the challenge something to draw on that the practice block
 * did not already use up.
 */
export const POOL_TARGET = 14;

/**
 * §5: "Generate in batches of 10 items per call and verify the batch as a unit;
 * per-item verification is 10× the cost for no gain."
 */
export const BATCH_SIZE = 10;

/** §5: "the next 3 recommended topics". */
export const TOPICS_PER_RUN = 3;

export interface PregenTarget {
  topicId: string;
  level: string;
  targetStructure: string;
  have: number;
  want: number;
}

/**
 * What tonight's run should fill.
 *
 * The ordering is the recommendation order the home page uses, not "emptiest
 * first": the job exists so the *next* thing the learner does is ready, and a
 * bare topic thirty places down the graph is not that. Topics excluded from
 * scheduling (§10's `no_schedule`) are excluded here too — generating for a
 * topic the app will never recommend is the purest form of the waste §5 warns
 * about.
 */
export function pregenerationPlan(
  db: DB,
  limit = TOPICS_PER_RUN,
  target = POOL_TARGET,
): PregenTarget[] {
  const rows = db
    .prepare(
      `SELECT t.id AS topicId, t.level_id AS level, t.summary AS targetStructure,
              (SELECT count(*) FROM topic_prereq p WHERE p.prereq_id = t.id) AS unlocks
         FROM topic t
         JOIN topic_state s ON s.topic_id = t.id
        WHERE s.status IN ('available','studying','consolidating')
          AND t.no_schedule = 0
        ORDER BY CASE s.status WHEN 'consolidating' THEN 0 WHEN 'studying' THEN 1 ELSE 2 END,
                 unlocks DESC,
                 (SELECT ordinal FROM level WHERE id = t.level_id) DESC`,
    )
    .all() as { topicId: string; level: string; targetStructure: string; unlocks: number }[];

  const out: PregenTarget[] = [];
  for (const r of rows) {
    if (out.length >= limit) break;
    const have = poolSize(db, r.topicId);
    if (have >= target) continue;
    out.push({
      topicId: r.topicId,
      level: r.level,
      targetStructure: r.targetStructure,
      have,
      want: target - have,
    });
  }
  return out;
}

export type PregenOutcome = 'ok' | 'nothing_to_do' | 'no_api_key' | 'failed';

export interface PregenReport {
  outcome: PregenOutcome;
  targets: PregenTarget[];
  accepted: number;
  quarantined: number;
  batches: number;
  error: string | null;
  /** Per topic, so a run that half-worked says which half. */
  perTopic: { topicId: string; accepted: number; quarantined: number; error: string | null }[];
}

export interface PregenOptions {
  limit?: number;
  target?: number;
  /** Cap on API calls per run. A runaway loop overnight is an expensive bug. */
  maxBatches?: number;
  now?: () => Date;
}

/**
 * Fill the pool.
 *
 * Every batch is persisted the moment it is decided rather than at the end, so
 * a run that dies on its fourth topic keeps the three it already verified.
 * Content that has passed the gauntlet is expensive and permanent (§5: "cache
 * forever"); throwing it away because a later, unrelated call failed would be
 * the one unforced error this job can make.
 */
export async function pregenerate(
  db: DB,
  deps: GauntletDeps,
  opts: PregenOptions = {},
): Promise<PregenReport> {
  const {
    limit = TOPICS_PER_RUN,
    target = POOL_TARGET,
    maxBatches = TOPICS_PER_RUN * 2,
    now = () => new Date(),
  } = opts;

  // Retiring first, then measuring: an over-familiar drill is not pool depth,
  // and counting it would leave a topic looking stocked with material the
  // learner has memorised the answer to.
  retireOverFamiliar(db);

  const targets = pregenerationPlan(db, limit, target);
  const runId = Number(
    db
      .prepare('INSERT INTO pregeneration_run (started_at, topics) VALUES (?, ?)')
      .run(now().toISOString(), JSON.stringify(targets.map((t) => t.topicId))).lastInsertRowid,
  );

  const report: PregenReport = {
    outcome: 'ok',
    targets,
    accepted: 0,
    quarantined: 0,
    batches: 0,
    error: null,
    perTopic: [],
  };

  if (targets.length === 0) {
    report.outcome = 'nothing_to_do';
    finish(db, runId, report, now);
    return report;
  }

  for (const t of targets) {
    let accepted = 0;
    let quarantined = 0;
    let error: string | null = null;

    try {
      // One batch per topic per run, even when the gap is wider than ten. §5
      // prices a gauntlet run at five API calls; emptying a 14-item hole in one
      // night across three topics would be six batches and thirty calls. The
      // job runs nightly — the pool fills over a few nights, and no single run
      // can surprise anyone with its bill.
      const count = Math.min(BATCH_SIZE, t.want);
      if (report.batches >= maxBatches) break;

      const request: GenerationRequest = {
        topicId: t.topicId,
        level: t.level,
        targetStructure: t.targetStructure,
        kinds: DRILL_KINDS,
        count,
        targetsError: null,
      };

      const outcome = await runGauntlet(deps, request);
      report.batches++;
      const written = persistOutcome(db, request, outcome);
      accepted = written.accepted;
      quarantined = written.quarantined;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      // A missing key is the whole run's answer, not one topic's: every
      // remaining topic would fail identically, and three copies of the same
      // message is noise rather than information.
      if (e instanceof Error && e.name === 'MissingApiKeyError') {
        report.outcome = 'no_api_key';
        report.error = error;
        report.perTopic.push({ topicId: t.topicId, accepted, quarantined, error });
        finish(db, runId, report, now);
        return report;
      }
    }

    report.accepted += accepted;
    report.quarantined += quarantined;
    report.perTopic.push({ topicId: t.topicId, accepted, quarantined, error });
  }

  const failures = report.perTopic.filter((p) => p.error !== null);
  if (failures.length === report.perTopic.length && failures.length > 0) {
    report.outcome = 'failed';
    report.error = failures[0].error;
  }

  finish(db, runId, report, now);
  return report;
}

function finish(db: DB, runId: number, report: PregenReport, now: () => Date) {
  db.prepare(
    `UPDATE pregeneration_run
        SET ended_at = ?, outcome = ?, accepted = ?, quarantined = ?, batches = ?, error = ?
      WHERE id = ?`,
  ).run(
    now().toISOString(),
    report.outcome,
    report.accepted,
    report.quarantined,
    report.batches,
    report.error,
    runId,
  );
}

export interface PregenRunRow {
  id: number;
  startedAt: string;
  endedAt: string | null;
  outcome: PregenOutcome | null;
  topics: string[];
  accepted: number;
  quarantined: number;
  batches: number;
  error: string | null;
}

/** Recent runs, newest first — the answer to "did it run last night?". */
export function recentPregenRuns(db: DB, limit = 10): PregenRunRow[] {
  return (
    db
      .prepare(
        `SELECT id, started_at AS startedAt, ended_at AS endedAt, outcome, topics,
                accepted, quarantined, batches, error
           FROM pregeneration_run ORDER BY started_at DESC LIMIT ?`,
      )
      .all(limit) as (Omit<PregenRunRow, 'topics'> & { topics: string | null })[]
  ).map((r) => ({ ...r, topics: r.topics ? (JSON.parse(r.topics) as string[]) : [] }));
}
