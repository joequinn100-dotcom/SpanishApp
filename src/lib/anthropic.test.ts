import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { ConsolidatedIssue, DraftItem, GenerationRequest } from '@/domain/gauntlet';

/**
 * Tests for the model adapter.
 *
 * The SDK is mocked, so nothing here makes a network call or needs a key — but
 * the request shape *is* asserted, because the things most likely to be wrong
 * are silent: a missing cache breakpoint costs money on every round, a missing
 * schema turns a parse failure into a verifier failure, and a truncated
 * response parses into a report the arbiter would treat as real.
 */

const create = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create };
  },
}));

const REQUEST: GenerationRequest = {
  topicId: 'b1.verb.imperfecto',
  level: 'B1',
  targetStructure: 'the imperfect for habitual past',
  kinds: ['drill_cloze'],
  count: 2,
  targetsError: 'verb.preterito_persona',
};

const ITEMS: DraftItem[] = [
  {
    kind: 'drill_cloze',
    difficulty: 2,
    payload: {
      prompt: 'Complete with the imperfect.',
      context: 'Describing the old delivery routine.',
      sentence: 'Antes el proveedor ___ el material los lunes.',
      answer: 'entregaba',
      accept: ['entregaba el material'],
      distractors: [
        { answer: 'entregó', feedback: 'That is the preterite.', errorCode: 'verb.preterito_persona' },
      ],
      explanation: 'The imperfect carries habitual past.',
    },
  },
];

/** A message the SDK would return. */
function reply(json: unknown, stopReason = 'end_turn') {
  return {
    stop_reason: stopReason,
    content: [{ type: 'text', text: typeof json === 'string' ? json : JSON.stringify(json) }],
  };
}

const CLEAN_REPORT = { pass: true, score: 9, issues: [] };

let env: NodeJS.ProcessEnv;

beforeEach(() => {
  env = { ...process.env };
  process.env.ANTHROPIC_API_KEY = 'sk-test';
  delete process.env.FLUENCIA_MODEL;
  create.mockReset();
  vi.resetModules();
});

afterEach(() => {
  process.env = env;
});

async function lib() {
  return import('./anthropic');
}

/** The single request the SDK was called with. */
function sentRequest() {
  expect(create).toHaveBeenCalledTimes(1);
  return create.mock.calls[0]![0] as Record<string, never> & {
    model: string;
    max_tokens: number;
    system: { type: string; text: string; cache_control?: { type: string } }[];
    output_config: { format: { type: string; schema: Record<string, unknown> } };
    messages: { role: string; content: string }[];
    thinking: { type: string };
  };
}

describe('the API key', () => {
  it('refuses to build a client without one, and says what to do', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { createGauntletClient, MissingApiKeyError } = await lib();

    expect(() => createGauntletClient()).toThrow(MissingApiKeyError);
    expect(() => createGauntletClient()).toThrow(/\.env\.local/);
    // The authored seed content must keep working without a key — that promise
    // is in the error text, so a future reader does not "fix" it by faking one.
    expect(() => createGauntletClient()).toThrow(/without one/);
  });

  it('treats whitespace as absent rather than as a key', async () => {
    process.env.ANTHROPIC_API_KEY = '   ';
    const { createGauntletClient, gauntletAvailable } = await lib();
    expect(gauntletAvailable()).toBe(false);
    expect(() => createGauntletClient()).toThrow();
  });

  it('reports availability without throwing', async () => {
    const { gauntletAvailable } = await lib();
    expect(gauntletAvailable()).toBe(true);
  });
});

describe('the model', () => {
  it('defaults to a model that supports structured outputs', async () => {
    const { modelId, DEFAULT_MODEL } = await lib();
    expect(modelId()).toBe(DEFAULT_MODEL);
  });

  it('honours FLUENCIA_MODEL, so §5 can have its literal model back', async () => {
    process.env.FLUENCIA_MODEL = 'claude-sonnet-4-6';
    const { modelId } = await lib();
    expect(modelId()).toBe('claude-sonnet-4-6');
  });
});

describe('verify', () => {
  it('sends a cached system prompt and a schema, and parses the report', async () => {
    create.mockResolvedValue(reply({ pass: true, score: 8.5, issues: [] }));
    const { createGauntletClient } = await lib();

    const report = await createGauntletClient().verify('linguistic', REQUEST, ITEMS);
    expect(report).toEqual({ pass: true, score: 8.5, issues: [] });

    const sent = sentRequest();
    // The four prompts are long and static and five calls a round share them.
    expect(sent.system[0]!.cache_control).toEqual({ type: 'ephemeral' });
    expect(sent.output_config.format.type).toBe('json_schema');
    expect(sent.thinking.type).toBe('adaptive');
    expect(sent.system[0]!.text).toContain('Spanish linguistics examiner');
  });

  it('interpolates the level and target structure into verifier 3', async () => {
    create.mockResolvedValue(reply(CLEAN_REPORT));
    const { createGauntletClient } = await lib();
    await createGauntletClient().verify('pedagogy', REQUEST, ITEMS);

    const text = sentRequest().system[0]!.text;
    expect(text).toContain('a learner at B1');
    expect(text).toContain('the imperfect for habitual past');
    // No placeholder survives — a literal {{level}} reaching the model is the
    // kind of thing that degrades a verifier silently.
    expect(text).not.toContain('{{');
  });

  it('tells the verifier which error the batch probes, when it probes one', async () => {
    create.mockResolvedValue(reply(CLEAN_REPORT));
    const { createGauntletClient } = await lib();
    await createGauntletClient().verify('linguistic', REQUEST, ITEMS);

    expect(sentRequest().messages[0]!.content).toContain('verb.preterito_persona');
  });

  it('renders each item with a stable index so issues can point at one', async () => {
    create.mockResolvedValue(reply(CLEAN_REPORT));
    const { createGauntletClient, renderItems } = await lib();
    await createGauntletClient().verify('register', REQUEST, ITEMS);

    const body = sentRequest().messages[0]!.content;
    expect(body).toContain('### Item 0 — drill_cloze, difficulty 2');
    expect(body).toContain('Antes el proveedor ___ el material los lunes.');
    // The distractor and its error code must be visible — they are the thing
    // the linguistic verifier is being asked to check hardest.
    expect(body).toContain('distractor: entregó');
    expect(body).toContain('errorCode: verb.preterito_persona');
    expect(renderItems(ITEMS)).toContain('accept: entregaba el material');
  });

  it('clamps a score outside 0–10 instead of letting it skew the arbiter mean', async () => {
    // The accept decision turns on the mean of three scores. A verifier that
    // returns 95 for "95%" would drag a failing batch over the line.
    create.mockResolvedValue(reply({ pass: true, score: 95, issues: [] }));
    const { createGauntletClient } = await lib();
    expect((await createGauntletClient().verify('linguistic', REQUEST, ITEMS)).score).toBe(10);

    create.mockResolvedValue(reply({ pass: false, score: -3, issues: [] }));
    vi.resetModules();
    const again = await lib();
    expect((await again.createGauntletClient().verify('linguistic', REQUEST, ITEMS)).score).toBe(0);
  });

  it('treats a missing or unrecognised severity as minor, never as critical', async () => {
    // Guessing high here would hand a batch a veto nobody cast.
    create.mockResolvedValue(
      reply({
        pass: false,
        score: 5,
        issues: [
          { severity: 'catastrophic', quote: 'x', problem: 'p', fix: '', itemIndex: -1 },
          { quote: 'y', problem: 'q' },
        ],
      }),
    );
    const { createGauntletClient } = await lib();
    const report = await createGauntletClient().verify('linguistic', REQUEST, ITEMS);

    expect(report.issues.map((i) => i.severity)).toEqual(['minor', 'minor']);
    // itemIndex -1 means "the whole batch", which the domain layer represents
    // as absent rather than as a negative index.
    expect(report.issues[0]!.itemIndex).toBeUndefined();
    expect(report.issues[0]!.fix).toBeUndefined();
  });

  it('keeps a real itemIndex and fix', async () => {
    create.mockResolvedValue(
      reply({
        pass: false,
        score: 4,
        issues: [
          { severity: 'critical', quote: 'entregó', problem: 'wrong', fix: 'entregaba', itemIndex: 0 },
        ],
      }),
    );
    const { createGauntletClient } = await lib();
    const report = await createGauntletClient().verify('linguistic', REQUEST, ITEMS);

    expect(report.issues[0]).toEqual({
      severity: 'critical',
      quote: 'entregó',
      problem: 'wrong',
      fix: 'entregaba',
      itemIndex: 0,
    });
  });

  it('anything other than an explicit true is a fail', async () => {
    create.mockResolvedValue(reply({ score: 9, issues: [] }));
    const { createGauntletClient } = await lib();
    expect((await createGauntletClient().verify('linguistic', REQUEST, ITEMS)).pass).toBe(false);
  });

  it('tolerates a fenced JSON block', async () => {
    create.mockResolvedValue(reply('```json\n{"pass":true,"score":9,"issues":[]}\n```'));
    const { createGauntletClient } = await lib();
    expect((await createGauntletClient().verify('register', REQUEST, ITEMS)).score).toBe(9);
  });

  it('throws on a truncated response rather than reporting a partial verdict', async () => {
    // A half-read report would look like a real one to the arbiter.
    create.mockResolvedValue(reply(CLEAN_REPORT, 'max_tokens'));
    const { createGauntletClient } = await lib();
    await expect(createGauntletClient().verify('linguistic', REQUEST, ITEMS)).rejects.toThrow(
      /max_tokens/,
    );
  });
});

describe('generate', () => {
  it('coerces the response into drill items', async () => {
    create.mockResolvedValue(
      reply({
        items: [
          {
            kind: 'drill_translate',
            difficulty: 4,
            prompt: 'Translate into Spanish.',
            context: 'A weekly report.',
            sentence: 'We used to deliver on Mondays.',
            answer: 'Entregábamos los lunes.',
            accept: ['entregábamos el material los lunes'],
            distractors: [{ answer: 'Entregamos los lunes.', feedback: 'Present.', errorCode: '' }],
            explanation: 'Long explanation.',
          },
        ],
      }),
    );
    const { createGauntletClient } = await lib();
    const items = await createGauntletClient().generate(REQUEST);

    expect(items).toHaveLength(1);
    expect(items[0]!.kind).toBe('drill_translate');
    expect(items[0]!.difficulty).toBe(4);
    expect(items[0]!.payload.accept).toEqual(['entregábamos el material los lunes']);
    // An empty errorCode is dropped rather than stored — an empty-string code
    // would be written into the error log as a real one.
    expect(items[0]!.payload.distractors![0]!.errorCode).toBeUndefined();
  });

  it('drops empty optional fields instead of storing blanks', async () => {
    create.mockResolvedValue(
      reply({
        items: [
          {
            kind: 'drill_cloze',
            difficulty: 1,
            prompt: 'p',
            context: '',
            sentence: 's',
            answer: 'a',
            accept: [],
            distractors: [],
            explanation: 'e',
          },
        ],
      }),
    );
    const { createGauntletClient } = await lib();
    const [item] = await createGauntletClient().generate(REQUEST);

    expect(item!.payload.context).toBeUndefined();
    expect(item!.payload.accept).toBeUndefined();
    expect(item!.payload.distractors).toBeUndefined();
  });

  it('falls back to a legal kind and difficulty rather than writing an illegal row', async () => {
    // `content` has CHECK constraints on both. A junk value must not reach the
    // insert and abort a whole accepted batch.
    create.mockResolvedValue(
      reply({
        items: [
          { kind: 'drill_haiku', difficulty: 11, prompt: 'p', sentence: 's', answer: 'a', explanation: 'e' },
        ],
      }),
    );
    const { createGauntletClient } = await lib();
    const [item] = await createGauntletClient().generate(REQUEST);

    expect(item!.kind).toBe('drill_cloze');
    expect(item!.difficulty).toBe(3);
  });
});

describe('revise', () => {
  const critique: ConsolidatedIssue[] = [
    {
      severity: 'critical',
      quote: 'entregó',
      problem: 'the distractor is correct Spanish',
      fix: 'replace it',
      itemIndex: 0,
      raisedBy: ['linguistic', 'pedagogy'],
    },
    {
      severity: 'minor',
      quote: 'los lunes',
      problem: 'nit',
      raisedBy: ['register'],
    },
  ];

  it('shows the reviser who raised each issue, and warns about lone findings', async () => {
    create.mockResolvedValue(reply({ items: [] }));
    const { createGauntletClient } = await lib();
    await createGauntletClient().revise(REQUEST, ITEMS, critique);

    const sent = sentRequest();
    const body = sent.messages[0]!.content;

    expect(body).toContain('1. [critical] item 0 — raised by linguistic + pedagogy');
    expect(body).toContain('suggested fix: replace it');
    // An issue with no itemIndex is batch-wide, not item 0.
    expect(body).toContain('2. [minor] whole batch — raised by register');
    expect(body).toContain('## The batch');

    // Three rounds against the seed content showed lone findings were the ones
    // most often wrong, and applying them literally caused regressions.
    expect(sent.system[0]!.text).toContain('verify a lone finding');
  });

  it('asks for the whole batch back, not just the changed items', async () => {
    create.mockResolvedValue(reply({ items: [] }));
    const { createGauntletClient } = await lib();
    await createGauntletClient().revise(REQUEST, ITEMS, critique);

    // The loop replaces `items` wholesale with what comes back; returning only
    // the edits would silently delete every untouched drill.
    expect(sentRequest().system[0]!.text).toContain('Return the complete batch');
  });
});

describe('the prompts', () => {
  it('forbid vosotros and require the work domain in the generator', async () => {
    const { PROMPTS } = await lib();
    expect(PROMPTS.generator).toContain('No vosotros');
    expect(PROMPTS.generator).toMatch(/construction/i);
    expect(PROMPTS.generator).toMatch(/rejected abbreviated/i);
  });

  it('tell verifier 1 that a correct-Spanish distractor is a defect', async () => {
    // This was the class that failed the authored content twice.
    const { PROMPTS } = await lib();
    expect(PROMPTS.verifiers.linguistic).toMatch(/distractor[\s\S]*genuinely WRONG/);
    expect(PROMPTS.verifiers.linguistic).toContain('veto');
  });

  it('tell verifier 2 not to invent a regional provenance', async () => {
    const { PROMPTS } = await lib();
    expect(PROMPTS.verifiers.register).toMatch(/not verifiable in the DLE/i);
    expect(PROMPTS.verifiers.register).toMatch(/do not invent a regional provenance/i);
  });
});
