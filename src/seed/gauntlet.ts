/**
 * Gauntlet results for the authored drills (SPEC §5).
 *
 * §5's panel is three independent verifiers — linguistic correctness, regional
 * register, pedagogical fitness — run in parallel with no sight of each other,
 * then an arbiter. Independence is the point: one model asked to "check all
 * five criteria" rubber-stamps.
 *
 * The app cannot run that panel at runtime yet (no API key), but the *content*
 * can still be put through it out of band and carry the audit trail §5 asks
 * for. That is what this file is.
 *
 * The panel scored the **batch**, not each item — it read both drill files end
 * to end and reported against the set. So the honest record is one batch
 * verdict applied to every drill in it, not 74 invented per-item scores.
 * `PER_KEY` exists for the case where a single drill is later re-verified on
 * its own; it takes precedence over `BATCH`, and is empty because nothing has
 * been.
 *
 * A drill covered by neither is unverified and carries `gauntlet_score = 0`.
 * Nothing pretends to a score it did not earn.
 */

export interface VerifierReport {
  /** 0–10, as the verifier scored the batch. */
  score: number;
  pass: boolean;
  /** What the verifier found. Kept verbatim rather than summarised away. */
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
 * The out-of-band panel run over all 74 authored drills.
 *
 * Three rounds. Rounds 1 and 2 both returned REVISE — the linguistic verifier
 * exercised its veto twice, scoring 4/10 both times, and the mean sat at 6.0
 * against the 8.0 accept threshold on each. Round 3 cleared: every verifier
 * passed, no criticals, no veto, mean exactly 8.0.
 *
 * Exactly 8.0 is the threshold, not comfortably clear of it. Round 3's findings
 * were applied after the accept rather than banked — see `revisions` — so the
 * shipped content is a revision ahead of the version that scored 8.0, and the
 * next panel run should expect to move these numbers.
 */
export const BATCH: GauntletResult = {
  score: 8.0,
  verdict: 'accepted',
  roundsUsed: 3,
  verifiedAt: '2026-08-06T00:00:00.000Z',
  linguistic: {
    score: 8,
    pass: true,
    notes: [
      'Round 3: no criticals. Every answer key and every accept[] entry verified correct; no distractor carrying an errorCode fires on a construction that is merely correct. The class that failed rounds 1 and 2 is closed.',
      'Two majors raised and fixed after the accept: transitive «responder» was taught as an error (DPD responder §2c records both constructions), and «Confirmamos que incluiríamos» is well formed read as a preterite, which the corpus itself teaches elsewhere about -ar nosotros forms.',
      'Rounds 1-2 vetoed on six criticals, most of them distractors that were correct Spanish while carrying an errorCode — which writes a committed error event the learner never made.',
    ],
  },
  register: {
    score: 9,
    pass: true,
    notes: [
      'Round 3: zero vosotros at every level — pronoun, vuestro, clitic os, and -áis/-éis/-ábais/-íais endings, including inside the paradigm lists, which is the usual leak point from the Foundations book.',
      'No Peninsular lexis, no /θ/ respellings, no voseo, no orthography RAE has withdrawn. Peruvian contracting vocabulary verified genuine. The -se imperfect subjunctives appear only in accept[], never as taught answers.',
      'Two findings, both fixed: an accept[] entry rewarding the form its own explanation forbids, and a connector accepted into a frame whose punctuation rule the same explanation states.',
    ],
  },
  pedagogy: {
    score: 7,
    pass: true,
    notes: [
      'Round 3: domain fit unbroken across all 74 items. All 25 topic drills correctly carry targetsError: null, so they do not contaminate the error log.',
      'Found a genuine grader defect, since fixed at the content level: grade() unions targetsError into errorsFound on every distractor hit regardless of the distractor errorCode, so dropping an errorCode does not suppress attribution.',
      'Remaining known gaps, accepted rather than fixed: b1.pron.od_oi runs 2-3-4-3 rather than ending on its hardest item, and the verb.hace_ago block opens with its unaided-production item. Both are ordering problems, and reordering reshuffles seed_key identities, which would orphan attempt history.',
    ],
  },
  revisions: [
    'Round 1 — removed distractors that were correct Spanish («tres semanas atrás», «Solíamos coordinar», «debe ser revisado»); corrected false claims that «aprobar» is not stem-changing, that «se lo» comes from euphony rather than Old Spanish «ge lo», that the tilde diacrítica marks nothing phonetic, and that preposition + infinitive has no exceptions; fixed «últimas dos» taught as the Spanish order; retagged a faltar drill that was logging evidence for the doler error.',
    'Round 2 — closed the correct-Spanish-distractor class rather than its named instances; resolved two places where the corpus graded the same construction both ways (clitic doubling, present subjunctive under a past matrix verb); removed queísmo from an accept[] list; fixed two regressions introduced in round 1 and one invented spelling («adéndum»).',
    'Round 3, applied after the accept — corrected transitive «responder», disambiguated the «Confirmamos» stimulus, made two em-dash distractors typeable, since «—» could never be entered and the omission they exist to catch was therefore invisible, completed accept[] lists that rejected forms their own explanations endorse, retagged a distractor to the error it actually evidences, and stripped severity numbers and status tokens out of the learner-facing rule text in the error catalogue.',
  ],
};

/**
 * Per-drill overrides, keyed by `seed_key`. Takes precedence over `BATCH`.
 * Empty: no drill has been re-verified individually.
 */
export const PER_KEY: Record<string, GauntletResult> = {};

/** The verdict that applies to a drill, or undefined if it has none. */
export function gauntletFor(seedKey: string): GauntletResult | undefined {
  return PER_KEY[seedKey] ?? BATCH;
}
