/**
 * Gauntlet results for the authored drills (SPEC §5).
 *
 * §5's panel is three independent verifiers — linguistic correctness, regional
 * register, pedagogical fitness — run in parallel with no sight of each other,
 * then an arbiter. Independence is the point: one model asked to "check all
 * five criteria" rubber-stamps.
 *
 * The app cannot run that panel yet (no API key at runtime), but the *content*
 * can still be put through it once, out of band, and carry the audit trail §5
 * asks for. That is what this file is: the verdict for each authored drill,
 * keyed by `seed_key`, applied at seed time.
 *
 * A drill with no entry here is unverified, and `gauntlet_score = 0` says so.
 * Nothing pretends to a score it did not earn.
 */

export interface VerifierReport {
  /** 0–10, as the verifier scored the batch. */
  score: number;
  pass: boolean;
  /** Issues that survived to the final revision, if any. */
  notes: string[];
}

export interface GauntletResult {
  /** Mean of the three verifier scores. §5's arbiter accepts at ≥ 8.0. */
  score: number;
  verdict: 'accepted' | 'quarantined';
  roundsUsed: number;
  verifiedAt: string;
  linguistic: VerifierReport;
  register: VerifierReport;
  pedagogy: VerifierReport;
  /** What changed between the first draft and the accepted version. */
  revisions: string[];
}

/**
 * Populated by the out-of-band panel run. Empty until one has happened, which
 * is the honest default — see CLAUDE.md on never showing unverified content.
 */
export const GAUNTLET: Record<string, GauntletResult> = {};
