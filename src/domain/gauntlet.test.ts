import { describe, expect, it, vi } from 'vitest';
import {
  ACCEPT_MEAN,
  MAX_ROUNDS,
  arbitrate,
  consolidate,
  meanScore,
  runGauntlet,
  type DraftItem,
  type GauntletClient,
  type GenerationRequest,
  type PanelReports,
  type VerifierIssue,
  type VerifierReport,
} from './gauntlet';

const report = (score: number, pass: boolean, issues: VerifierIssue[] = []): VerifierReport => ({
  pass,
  score,
  issues,
});

const clean = (score = 9): PanelReports => ({
  linguistic: report(score, true),
  register: report(score, true),
  pedagogy: report(score, true),
});

const issue = (o: Partial<VerifierIssue> = {}): VerifierIssue => ({
  severity: 'major',
  quote: 'los planos fueran tarde',
  problem: 'imperfect subjunctive in a factual report',
  ...o,
});

describe('meanScore', () => {
  it('averages the three verifiers', () => {
    expect(meanScore({ linguistic: report(4, false), register: report(7, true), pedagogy: report(7, true) })).toBeCloseTo(6);
  });
});

describe('arbitrate', () => {
  it('accepts when all three pass, the mean clears 8.0, and nothing is critical', () => {
    const d = arbitrate(clean(9), 1);
    expect(d.decision).toBe('accept');
    expect(d.critique).toEqual([]);
    expect(d.vetoed).toBe(false);
  });

  it('accepts at exactly the threshold, because §5 says ≥ not >', () => {
    const at = arbitrate(
      { linguistic: report(8, true), register: report(9, true), pedagogy: report(7, true) },
      1,
    );
    expect(at.mean).toBeCloseTo(ACCEPT_MEAN);
    expect(at.decision).toBe('accept');
  });

  it('revises when the mean falls a hair under, even with all three passing', () => {
    const d = arbitrate(
      { linguistic: report(8, true), register: report(8, true), pedagogy: report(7.9, true) },
      1,
    );
    expect(d.mean).toBeLessThan(ACCEPT_MEAN);
    expect(d.decision).toBe('revise');
    expect(d.reason).toContain('mean');
  });

  it('revises when one verifier fails despite a high mean', () => {
    const d = arbitrate(
      { linguistic: report(10, true), register: report(10, true), pedagogy: report(6, false) },
      1,
    );
    expect(d.mean).toBeGreaterThan(ACCEPT_MEAN);
    expect(d.decision).toBe('revise');
    expect(d.reason).toContain('pedagogy');
  });

  it('lets verifier 1 veto: a critical linguistic issue can never be accepted', () => {
    // Every other signal says accept — all three pass, mean is 9.3.
    const d = arbitrate(
      {
        linguistic: report(9, true, [issue({ severity: 'critical' })]),
        register: report(10, true),
        pedagogy: report(9, true),
      },
      1,
    );
    expect(d.mean).toBeGreaterThan(ACCEPT_MEAN);
    expect(d.decision).toBe('revise');
    expect(d.vetoed).toBe(true);
    expect(d.reason).toContain('veto');
  });

  it('blocks on a critical from any verifier, but only calls it a veto for verifier 1', () => {
    const d = arbitrate(
      {
        linguistic: report(10, true),
        register: report(9, true, [issue({ severity: 'critical' })]),
        pedagogy: report(9, true),
      },
      1,
    );
    expect(d.decision).toBe('revise');
    expect(d.vetoed).toBe(false);
    expect(d.reason).toContain('critical');
  });

  it('quarantines once the rounds are spent, and not before', () => {
    const failing: PanelReports = {
      linguistic: report(4, false, [issue({ severity: 'critical' })]),
      register: report(7, true),
      pedagogy: report(7, true),
    };
    expect(arbitrate(failing, 1).decision).toBe('revise');
    expect(arbitrate(failing, MAX_ROUNDS - 1).decision).toBe('revise');
    expect(arbitrate(failing, MAX_ROUNDS).decision).toBe('quarantine');
  });

  it('still accepts on the final round if the content earned it', () => {
    // Quarantine is for content that is *still failing* at round 3, not for
    // content that took three rounds to get right.
    expect(arbitrate(clean(9), MAX_ROUNDS).decision).toBe('accept');
  });
});

describe('consolidate', () => {
  it('merges the same quote raised by two verifiers into one corroborated issue', () => {
    const merged = consolidate({
      linguistic: report(6, false, [issue({ quote: '«aprobo»', problem: 'not a preterite form' })]),
      register: report(7, true, [issue({ quote: ' «APROBO» ', problem: 'reads as a typo' })]),
      pedagogy: report(8, true),
    });
    expect(merged).toHaveLength(1);
    expect(merged[0].raisedBy).toEqual(['linguistic', 'register']);
    // The reviser needs both readings, not whichever arrived first.
    expect(merged[0].problem).toContain('not a preterite form');
    expect(merged[0].problem).toContain('reads as a typo');
  });

  it('takes the highest severity when verifiers disagree about it', () => {
    const merged = consolidate({
      linguistic: report(5, false, [issue({ quote: 'x', severity: 'critical' })]),
      register: report(9, true, [issue({ quote: 'x', severity: 'minor' })]),
      pedagogy: report(9, true),
    });
    expect(merged[0].severity).toBe('critical');
  });

  it('keeps a fix when only one verifier offered one', () => {
    const merged = consolidate({
      linguistic: report(6, false, [issue({ quote: 'x' })]),
      register: report(8, true, [issue({ quote: 'x', fix: 'use «llegaron»' })]),
      pedagogy: report(9, true),
    });
    expect(merged[0].fix).toBe('use «llegaron»');
  });

  it('orders critical before major before minor', () => {
    const merged = consolidate({
      linguistic: report(5, false, [
        issue({ quote: 'c', severity: 'minor' }),
        issue({ quote: 'a', severity: 'critical' }),
        issue({ quote: 'b', severity: 'major' }),
      ]),
      register: report(9, true),
      pedagogy: report(9, true),
    });
    expect(merged.map((i) => i.quote)).toEqual(['a', 'b', 'c']);
  });

  it('ranks corroborated issues above lone ones of the same severity', () => {
    // Findings only one verifier raised were the ones most often wrong when this
    // panel was run against the seed content, so they sort last.
    const merged = consolidate({
      linguistic: report(6, false, [issue({ quote: 'solo' }), issue({ quote: 'both' })]),
      register: report(7, true, [issue({ quote: 'both' })]),
      pedagogy: report(8, true),
    });
    expect(merged.map((i) => i.quote)).toEqual(['both', 'solo']);
  });
});

/* ------------------------------------------------------------------ *
 * The loop
 * ------------------------------------------------------------------ */

const REQUEST: GenerationRequest = {
  topicId: 'b1.verb.imperfecto',
  level: 'B1',
  targetStructure: 'the imperfect for habitual past',
  kinds: ['drill_cloze'],
  count: 10,
};

const item = (answer: string): DraftItem => ({
  kind: 'drill_cloze',
  difficulty: 2,
  payload: {
    prompt: 'Complete with the imperfect.',
    sentence: 'Antes el proveedor ___ el material los lunes.',
    answer,
    explanation: 'The imperfect carries habitual past.',
  },
});

/** A client scripted with one panel verdict per round. */
function scriptedClient(rounds: PanelReports[]): GauntletClient & { calls: string[] } {
  let round = 0;
  const calls: string[] = [];
  return {
    calls,
    async generate() {
      calls.push('generate');
      return [item('entregaba')];
    },
    async verify(id) {
      calls.push(`verify:${id}:${round}`);
      return rounds[Math.min(round, rounds.length - 1)][id];
    },
    async revise(_r, items) {
      calls.push('revise');
      round++;
      return items.map(() => item(`revised-${round}`));
    },
  };
}

const deps = (client: GauntletClient) => ({ client, now: () => new Date('2026-08-06T09:00:00Z') });

describe('runGauntlet', () => {
  it('accepts a clean batch in one round without calling the reviser', async () => {
    const client = scriptedClient([clean(9)]);
    const out = await runGauntlet(deps(client), REQUEST);

    expect(out.outcome).toBe('accepted');
    expect(out.rounds).toHaveLength(1);
    expect(out.score).toBeCloseTo(9);
    expect(out.verifiedAt).toBe('2026-08-06T09:00:00.000Z');
    expect(client.calls).not.toContain('revise');
  });

  it('runs the three verifiers concurrently, so none can see another', async () => {
    // The independence §5 requires is structural: all three are dispatched
    // before any resolves. If one were awaited before the next was called, this
    // would observe 1.
    let inFlight = 0;
    let peak = 0;
    const client: GauntletClient = {
      async generate() {
        return [item('entregaba')];
      },
      async verify(id) {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 1));
        inFlight--;
        return clean(9)[id];
      },
      async revise(_r, items) {
        return items;
      },
    };

    await runGauntlet(deps(client), REQUEST);
    expect(peak).toBe(3);
  });

  it('revises and re-verifies, accepting on a later round', async () => {
    const failing: PanelReports = {
      linguistic: report(4, false, [issue({ severity: 'critical' })]),
      register: report(7, true),
      pedagogy: report(7, true),
    };
    const client = scriptedClient([failing, clean(9)]);
    const out = await runGauntlet(deps(client), REQUEST);

    expect(out.outcome).toBe('accepted');
    expect(out.rounds.map((r) => r.decision.decision)).toEqual(['revise', 'accept']);
    // The accepted items are the reviser's, not the original draft's.
    expect(out.items[0].payload.answer).toBe('revised-1');
  });

  it('feeds the reviser one consolidated critique, not three raw reports', async () => {
    const failing: PanelReports = {
      linguistic: report(4, false, [issue({ quote: 'shared', severity: 'critical' })]),
      register: report(6, false, [issue({ quote: 'shared', severity: 'minor' })]),
      pedagogy: report(7, true, [issue({ quote: 'own' })]),
    };
    const revise = vi.fn<GauntletClient['revise']>(async (_r, items) => items);
    const client: GauntletClient = {
      async generate() {
        return [item('entregaba')];
      },
      async verify(id) {
        return failing[id];
      },
      revise,
    };

    await runGauntlet(deps(client), REQUEST);

    const critique = revise.mock.calls[0]![2];
    expect(critique).toHaveLength(2);
    expect(critique[0]!.quote).toBe('shared');
    expect(critique[0]!.raisedBy).toEqual(['linguistic', 'register']);
    expect(critique[0]!.severity).toBe('critical');
  });

  it('quarantines after three failing rounds and never returns accepted', async () => {
    const failing: PanelReports = {
      linguistic: report(4, false, [issue({ severity: 'critical' })]),
      register: report(7, true),
      pedagogy: report(6, false),
    };
    const client = scriptedClient([failing]);
    const out = await runGauntlet(deps(client), REQUEST);

    expect(out.outcome).toBe('quarantined');
    expect(out.rounds).toHaveLength(MAX_ROUNDS);
    expect(out.reason).toContain('after 3 rounds');
    // Two revisions between three verifications, not three.
    expect(client.calls.filter((c) => c === 'revise')).toHaveLength(MAX_ROUNDS - 1);
  });

  it('keeps the full history of every round for the audit trail', async () => {
    const failing: PanelReports = {
      linguistic: report(4, false, [issue({ severity: 'critical' })]),
      register: report(7, true),
      pedagogy: report(7, true),
    };
    const client = scriptedClient([failing, failing, clean(9)]);
    const out = await runGauntlet(deps(client), REQUEST);

    expect(out.rounds).toHaveLength(3);
    expect(out.rounds.map((r) => r.round)).toEqual([1, 2, 3]);
    // Every round carries all three reports, so a systematic generator fault is
    // visible in the log rather than only the final verdict.
    for (const r of out.rounds) {
      expect(Object.keys(r.reports).sort()).toEqual(['linguistic', 'pedagogy', 'register']);
    }
  });

  it('never accepts content the arbiter vetoed, however high the other scores', async () => {
    const vetoed: PanelReports = {
      linguistic: report(10, true, [issue({ severity: 'critical' })]),
      register: report(10, true),
      pedagogy: report(10, true),
    };
    const client = scriptedClient([vetoed]);
    const out = await runGauntlet(deps(client), REQUEST);

    expect(out.outcome).toBe('quarantined');
    expect(out.score).toBe(10);
    expect(out.rounds.every((r) => r.decision.vetoed)).toBe(true);
  });
});
