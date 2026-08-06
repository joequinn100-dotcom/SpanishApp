/**
 * Session assembly (SPEC §4 warm-up algorithm, §9 Phase 2).
 *
 * Pure: no database, no clock, no randomness of its own. The caller supplies
 * `now` and a picker, which is what makes "does this session honour the
 * top-3-severity guarantee" a test rather than an observation.
 *
 * A session is planned in full at the start and stored as JSON, not streamed.
 * That is Build Principle 4: if the process dies at item 7 of 16, the queue and
 * the cursor are both already on disk, so resuming is a read rather than a
 * reconstruction.
 */

import { selectWarmup, type ErrorState } from './mastery';

export interface ContentRef {
  id: number;
  topicId: string;
  kind: string;
  difficulty: number;
  /** `content.targets_error`, when the item was written to probe one. */
  targetsError: string | null;
}

export interface PlannedItem {
  contentId: number;
  /**
   * `warmup` — error work, chosen by §4's weighting.
   * `topic`  — the new material the session is about.
   * `review` — a spaced review of a consolidating topic, due today.
   */
  source: 'warmup' | 'topic' | 'review';
  topicId: string;
  errorCode: string | null;
}

export interface SessionPlan {
  items: PlannedItem[];
  /** The topic the session is *about*. Null for a warm-up-only session. */
  focusTopicId: string | null;
  /** Error codes the warm-up covers, in the order §4's weighting chose them. */
  warmupErrors: string[];
  /** Topics whose spaced review this session is serving. */
  reviewTopics?: string[];
}

/** A consolidating topic whose next spaced review has come due. */
export interface DueReview {
  topicId: string;
  /** ISO date the review became due. Older first — the oldest debt is paid first. */
  dueAt: string;
  content: ContentRef[];
}

export interface PlanInput {
  /** Every non-resolved error, with the state §4's weight formula reads. */
  errors: { code: string; state: ErrorState }[];
  /** Available drills for each error code. */
  contentByError: Map<string, ContentRef[]>;
  /** Available drills for the focus topic, hardest last. */
  topicContent: ContentRef[];
  focusTopicId: string | null;
  now: string;
  /** Consolidating topics due for a spaced review (SPEC §4). */
  due?: DueReview[];
  warmupCount?: number;
  topicCount?: number;
  reviewCount?: number;
  /** Deterministic in tests, rotating in production. Picks one of n. */
  pick?: (n: number, seq: number) => number;
}

/** §4: "Every session opens with 6–10 warm-up items." */
export const WARMUP_MIN = 6;
export const WARMUP_MAX = 10;
export const TOPIC_ITEMS = 10;

/**
 * Items in one spaced review.
 *
 * §4 requires the review be *clean*, so the count is a real decision: too few
 * and a lucky guess promotes a topic to mastered; too many and the gate becomes
 * unreachable because one slip in twelve restarts the sequence. Six is enough
 * that guessing through is implausible and few enough that a good day clears it.
 */
export const REVIEW_ITEMS = 6;

/** Deterministic default: walk the list rather than repeating item 0 forever. */
const rotate = (n: number, seq: number) => (n === 0 ? 0 : seq % n);

/**
 * Build the session queue.
 *
 * Order matters and is not negotiable: warm-up first, always. §4's whole thesis
 * is that the error log drives the session, so an error the learner is actively
 * making is worked before anything new is introduced — including on the days
 * when the new topic is the more interesting thing to do.
 */
export function planSession(input: PlanInput): SessionPlan {
  const {
    errors,
    contentByError,
    topicContent,
    focusTopicId,
    now,
    due = [],
    warmupCount = WARMUP_MAX,
    topicCount = TOPIC_ITEMS,
    reviewCount = REVIEW_ITEMS,
    pick = rotate,
  } = input;

  const target = Math.max(WARMUP_MIN, Math.min(WARMUP_MAX, warmupCount));

  // Ask §4 for more than we need: an error can be highly weighted and still
  // have no drill written for it yet, and dropping it must not shrink the
  // warm-up below the floor.
  const ranked = selectWarmup(
    errors.map((e) => ({ item: e.code, state: e.state })),
    errors.length,
    now,
  );

  const items: PlannedItem[] = [];
  const warmupErrors: string[] = [];
  const reviewTopics: string[] = [];
  const used = new Set<number>();

  // Round-robin over the ranked errors: one item each per pass, highest weight
  // first, repeating until the warm-up is full or the drills run out. Breadth
  // before depth — six errors touched once beats one error drilled six times,
  // because §4's clean_streak counts productions spread across sessions.
  //
  // The floor of 6 is a floor on *error work*, so a warm-up that comes up short
  // is topped up by revisiting the errors that matter most rather than being
  // padded with topic items.
  for (let pass = 0; items.length < target; pass++) {
    let placed = 0;
    for (const w of ranked) {
      if (items.length >= target) break;
      const pool = (contentByError.get(w.item) ?? []).filter((c) => !used.has(c.id));
      if (pool.length === 0) continue;
      const chosen = pool[pick(pool.length, items.length)];
      used.add(chosen.id);
      placed++;
      if (!warmupErrors.includes(w.item)) warmupErrors.push(w.item);
      items.push({
        contentId: chosen.id,
        source: 'warmup',
        topicId: chosen.topicId,
        errorCode: w.item,
      });
    }
    // No error had an unused drill left — the pool is exhausted, not the target.
    if (placed === 0) break;
  }

  // Review block, between the warm-up and the new material.
  //
  // Position is the argument: a review must be *unaided*, so it cannot follow
  // the topic block that just re-taught the same material — the answer would
  // still be on screen. Putting it before new material also means a session cut
  // short still pays the review debt, which is the half of §4's mastery gate
  // that time can otherwise run out on.
  //
  // Oldest debt first, and only one topic per session: two reviews in one
  // sitting is not "spaced".
  const oldest = [...due].sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  if (oldest) {
    const pool = oldest.content.filter((c) => !used.has(c.id));
    // A review with too few items cannot be clean in any meaningful sense, so
    // it is not offered at all rather than offered as a formality.
    if (pool.length >= Math.min(3, reviewCount)) {
      reviewTopics.push(oldest.topicId);
      for (const c of pool.slice(0, reviewCount)) {
        used.add(c.id);
        items.push({
          contentId: c.id,
          source: 'review',
          topicId: oldest.topicId,
          errorCode: c.targetsError,
        });
      }
    }
  }

  // Topic block: easiest first, so the explanation lands before the hard case.
  const topicItems = topicContent
    .filter((c) => !used.has(c.id))
    .sort((a, b) => a.difficulty - b.difficulty)
    .slice(0, topicCount);

  for (const c of topicItems) {
    used.add(c.id);
    items.push({
      contentId: c.id,
      source: 'topic',
      topicId: c.topicId,
      errorCode: c.targetsError,
    });
  }

  return { items, focusTopicId, warmupErrors, reviewTopics };
}

/**
 * Whether §4's guarantee held: "at least 2 items from the top-3 highest-severity
 * active errors every single session."
 *
 * Exported rather than inlined because it is also the assertion the session
 * writer runs before committing a plan — a guarantee that is only checked in
 * tests is a guarantee that silently stops holding in production.
 */
export function warmupGuaranteeHeld(
  plan: SessionPlan,
  errors: { code: string; state: ErrorState }[],
): boolean {
  const topThree = errors
    .filter((e) => e.state.status === 'active')
    .sort((a, b) => b.state.severity - a.state.severity)
    .slice(0, 3)
    .map((e) => e.code);

  if (topThree.length === 0) return true;

  const covered = new Set(
    plan.items.filter((i) => i.source === 'warmup' && i.errorCode).map((i) => i.errorCode!),
  );
  const hits = topThree.filter((c) => covered.has(c)).length;
  return hits >= Math.min(2, topThree.length);
}

/**
 * Did the spaced review pass?
 *
 * §4 says "2 *clean* spaced reviews". Clean means no wrong answers — not "80%",
 * which is the studying gate and a lower bar on purpose. A blank counts as
 * unclean: skipping an item you cannot answer is not evidence you can.
 *
 * An accent slip is graded correct upstream (see grading.ts) and so passes
 * here too. That is deliberate: the review is asking whether the grammar is
 * installed, and a missing written accent does not show that it is not.
 *
 * Returns null when the review is not finished yet, so the caller knows the
 * difference between "not yet" and "failed".
 */
export function reviewOutcome(
  answers: { source: string; topicId: string; correct: boolean }[],
  plan: SessionPlan,
  topicId: string,
): boolean | null {
  const planned = plan.items.filter((i) => i.source === 'review' && i.topicId === topicId).length;
  if (planned === 0) return null;
  const given = answers.filter((a) => a.source === 'review' && a.topicId === topicId);
  if (given.length < planned) return null;
  return given.every((a) => a.correct);
}

/* ------------------------------------------------------------------ *
 * Progress through a planned session
 * ------------------------------------------------------------------ */

export interface SessionProgress {
  total: number;
  answered: number;
  remaining: number;
  done: boolean;
  /** The item to show now, or null when the session is complete. */
  current: PlannedItem | null;
  /** 0..1, for the progress bar. */
  fraction: number;
}

export function sessionProgress(plan: SessionPlan, cursor: number): SessionProgress {
  const total = plan.items.length;
  const answered = Math.max(0, Math.min(cursor, total));
  return {
    total,
    answered,
    remaining: total - answered,
    done: answered >= total,
    current: answered < total ? plan.items[answered] : null,
    fraction: total === 0 ? 1 : answered / total,
  };
}
