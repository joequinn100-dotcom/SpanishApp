/**
 * The gauntlet loop (SPEC §5).
 *
 *   GENERATOR ──> VERIFIER PANEL (3 independent, parallel) ──> ARBITER
 *        ▲                                                       │
 *        └─────────────── REVISER (with critiques) <─────────────┘
 *                          max 3 rounds, then quarantine
 *
 * Everything here is pure over plain records. The model calls arrive as an
 * injected `GauntletClient`, which is what makes the loop testable without an
 * API key — and, more usefully, testable against a client that returns *bad*
 * content on purpose. The rules in `arbitrate` are the thing most worth getting
 * right, because they are the only barrier between a confidently wrong
 * conjugation and the learner.
 *
 * Two design points that are not obvious:
 *
 * 1. The verifiers are run with `Promise.all` rather than in sequence. That is
 *    not for speed. §5 requires that no verifier sees another's output, and
 *    running them concurrently over the same immutable draft makes it
 *    structurally impossible to thread one's verdict into another's prompt by
 *    accident later.
 *
 * 2. The reviser is handed one consolidated critique, not three reports. Three
 *    rounds of running this panel over the authored seed content showed why:
 *    the same defect gets reported by two or three verifiers in different
 *    words, and a reviser working from the raw reports edits the same line
 *    repeatedly, each time to satisfy a different phrasing of the same
 *    complaint. Deduplicating first is what stops the churn.
 */

import type { DrillKind, DrillPayload } from './grading';

/* ------------------------------------------------------------------ *
 * Reports
 * ------------------------------------------------------------------ */

export type Severity = 'critical' | 'major' | 'minor';

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
};

export interface VerifierIssue {
  severity: Severity;
  /** The exact text complained about. Used to deduplicate across verifiers. */
  quote: string;
  problem: string;
  /** The concrete replacement, when the verifier offered one. */
  fix?: string;
  /** Which item in the batch, when the verifier localised it. */
  itemIndex?: number;
}

export interface VerifierReport {
  pass: boolean;
  /** 0–10. */
  score: number;
  issues: VerifierIssue[];
}

export type VerifierId = 'linguistic' | 'register' | 'pedagogy';

export const VERIFIER_IDS: VerifierId[] = ['linguistic', 'register', 'pedagogy'];

export type PanelReports = Record<VerifierId, VerifierReport>;

/* ------------------------------------------------------------------ *
 * Arbiter
 * ------------------------------------------------------------------ */

/** §5: "ACCEPT if all three pass AND mean score ≥ 8.0 AND no critical issues". */
export const ACCEPT_MEAN = 8.0;

/** §5: "QUARANTINE if rounds_used = 3 and still failing". */
export const MAX_ROUNDS = 3;

export type Decision = 'accept' | 'revise' | 'quarantine';

export interface ConsolidatedIssue extends VerifierIssue {
  /** Which verifiers raised it. Length > 1 means independent corroboration. */
  raisedBy: VerifierId[];
}

export interface ArbiterDecision {
  decision: Decision;
  /** Mean of the three verifier scores. */
  mean: number;
  /**
   * True when verifier 1 raised a critical issue. §5 gives it veto power:
   * "Content with a critical linguistic issue can never be accepted regardless
   * of the other two scores."
   */
  vetoed: boolean;
  /** Deduplicated and prioritised. Empty on accept. */
  critique: ConsolidatedIssue[];
  /** Why, in one line, for the audit log and the admin view. */
  reason: string;
}

export function meanScore(reports: PanelReports): number {
  const total = VERIFIER_IDS.reduce((sum, id) => sum + reports[id].score, 0);
  return total / VERIFIER_IDS.length;
}

/**
 * Merge the three reports into one prioritised list.
 *
 * Issues are matched on the normalised quote, so the same line flagged by the
 * linguistic and register verifiers becomes one entry crediting both. When two
 * verifiers disagree on severity the higher one wins — a defect one reviewer
 * calls minor and another calls critical is a critical defect that one reviewer
 * underrated, and treating it the other way round is how bad content ships.
 *
 * Corroborated issues sort above uncorroborated ones at the same severity: three
 * rounds against the seed content showed single-verifier findings were the ones
 * most likely to be wrong, and acting on them literally introduced regressions.
 */
export function consolidate(reports: PanelReports): ConsolidatedIssue[] {
  const byQuote = new Map<string, ConsolidatedIssue>();

  for (const id of VERIFIER_IDS) {
    for (const issue of reports[id].issues) {
      const key = issue.quote.trim().toLowerCase();
      const existing = byQuote.get(key);
      if (!existing) {
        byQuote.set(key, { ...issue, raisedBy: [id] });
        continue;
      }
      existing.raisedBy.push(id);
      if (SEVERITY_RANK[issue.severity] < SEVERITY_RANK[existing.severity]) {
        existing.severity = issue.severity;
      }
      // Keep both readings — the reviser needs the union, not the first one in.
      if (!existing.problem.includes(issue.problem)) {
        existing.problem = `${existing.problem}\n${issue.problem}`;
      }
      if (issue.fix && !existing.fix) existing.fix = issue.fix;
      if (existing.itemIndex === undefined) existing.itemIndex = issue.itemIndex;
    }
  }

  return [...byQuote.values()].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    const byCorroboration = b.raisedBy.length - a.raisedBy.length;
    if (byCorroboration !== 0) return byCorroboration;
    return (a.itemIndex ?? 0) - (b.itemIndex ?? 0);
  });
}

/**
 * §5's arbiter, exactly as specified.
 *
 * `roundsUsed` is the number of verification rounds completed *including* the
 * one that produced these reports. So the first call gets 1, and quarantine
 * becomes reachable at 3.
 */
export function arbitrate(reports: PanelReports, roundsUsed: number): ArbiterDecision {
  const mean = meanScore(reports);
  const vetoed = reports.linguistic.issues.some((i) => i.severity === 'critical');
  const anyCritical = VERIFIER_IDS.some((id) =>
    reports[id].issues.some((i) => i.severity === 'critical'),
  );
  const allPass = VERIFIER_IDS.every((id) => reports[id].pass);

  if (allPass && mean >= ACCEPT_MEAN && !anyCritical) {
    return { decision: 'accept', mean, vetoed: false, critique: [], reason: acceptReason(mean) };
  }

  const critique = consolidate(reports);
  const why = failureReason({ allPass, mean, anyCritical, vetoed, reports });

  if (roundsUsed >= MAX_ROUNDS) {
    return { decision: 'quarantine', mean, vetoed, critique, reason: `${why} after ${roundsUsed} rounds` };
  }
  return { decision: 'revise', mean, vetoed, critique, reason: why };
}

function acceptReason(mean: number): string {
  return `all three verifiers passed, mean ${mean.toFixed(1)}, no criticals`;
}

function failureReason(f: {
  allPass: boolean;
  mean: number;
  anyCritical: boolean;
  vetoed: boolean;
  reports: PanelReports;
}): string {
  const parts: string[] = [];
  if (f.vetoed) parts.push('linguistic veto (critical issue)');
  else if (f.anyCritical) parts.push('critical issue');
  if (!f.allPass) {
    const failed = VERIFIER_IDS.filter((id) => !f.reports[id].pass);
    parts.push(`failed: ${failed.join(', ')}`);
  }
  if (f.mean < ACCEPT_MEAN) parts.push(`mean ${f.mean.toFixed(1)} < ${ACCEPT_MEAN.toFixed(1)}`);
  return parts.join('; ');
}

/* ------------------------------------------------------------------ *
 * The loop
 * ------------------------------------------------------------------ */

/** What the generator is being asked for. */
export interface GenerationRequest {
  topicId: string;
  /** CEFR level of the topic, interpolated into verifier 3's prompt. */
  level: string;
  /** What the items must isolate, interpolated into verifier 3's prompt. */
  targetStructure: string;
  kinds: DrillKind[];
  /**
   * §5 cost control: "Generate in batches of 10 items per call and verify the
   * batch as a unit; per-item verification is 10× the cost for no gain."
   */
  count: number;
  /** The error code these items probe, when they were requested to probe one. */
  targetsError?: string | null;
}

export interface DraftItem {
  kind: DrillKind;
  difficulty: 1 | 2 | 3 | 4 | 5;
  payload: DrillPayload;
}

export interface GauntletClient {
  generate(request: GenerationRequest): Promise<DraftItem[]>;
  /**
   * One verifier, one call, no sight of the others. The caller runs the three
   * concurrently; an implementation that batches them into a single call would
   * defeat the independence §5 is built on.
   */
  verify(
    id: VerifierId,
    request: GenerationRequest,
    items: DraftItem[],
  ): Promise<VerifierReport>;
  revise(
    request: GenerationRequest,
    items: DraftItem[],
    critique: ConsolidatedIssue[],
  ): Promise<DraftItem[]>;
}

export interface GauntletRound {
  round: number;
  reports: PanelReports;
  decision: ArbiterDecision;
}

export interface GauntletOutcome {
  outcome: 'accepted' | 'quarantined';
  items: DraftItem[];
  /** Mean score of the round that decided it. */
  score: number;
  rounds: GauntletRound[];
  verifiedAt: string;
  /** Set only when quarantined. */
  reason?: string;
}

export interface GauntletDeps {
  client: GauntletClient;
  /** Injected so the audit trail is deterministic under test. */
  now: () => Date;
}

/**
 * Run one batch through generate → verify → arbitrate → revise, up to
 * `MAX_ROUNDS` verification rounds.
 *
 * Returns rather than throws on quarantine: a quarantined batch is a normal
 * outcome that the caller must persist to the `quarantine` table, not an error
 * to swallow. The one thing this must never do is return `accepted` for content
 * the arbiter did not accept.
 */
export async function runGauntlet(
  deps: GauntletDeps,
  request: GenerationRequest,
): Promise<GauntletOutcome> {
  const { client, now } = deps;
  let items = await client.generate(request);
  const rounds: GauntletRound[] = [];

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const [linguistic, register, pedagogy] = await Promise.all([
      client.verify('linguistic', request, items),
      client.verify('register', request, items),
      client.verify('pedagogy', request, items),
    ]);
    const reports: PanelReports = { linguistic, register, pedagogy };
    const decision = arbitrate(reports, round);
    rounds.push({ round, reports, decision });

    if (decision.decision === 'accept') {
      return {
        outcome: 'accepted',
        items,
        score: decision.mean,
        rounds,
        verifiedAt: now().toISOString(),
      };
    }
    if (decision.decision === 'quarantine') {
      return {
        outcome: 'quarantined',
        items,
        score: decision.mean,
        rounds,
        verifiedAt: now().toISOString(),
        reason: decision.reason,
      };
    }
    items = await client.revise(request, items, decision.critique);
  }

  // Unreachable: arbitrate() quarantines at roundsUsed >= MAX_ROUNDS, so the
  // loop always returns. Kept so a future change to MAX_ROUNDS cannot silently
  // fall through into an implicit accept.
  const last = rounds[rounds.length - 1];
  return {
    outcome: 'quarantined',
    items,
    score: last?.decision.mean ?? 0,
    rounds,
    verifiedAt: now().toISOString(),
    reason: 'exhausted rounds without a decision',
  };
}
