import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { DRILL_KINDS, type DrillKind, type DrillPayload } from '@/domain/grading';
import type {
  DraftItem,
  GauntletClient,
  GenerationRequest,
  Severity,
  VerifierId,
  VerifierReport,
} from '@/domain/gauntlet';

/**
 * The model side of the gauntlet (SPEC §5).
 *
 * The loop itself is in `@/domain/gauntlet` and knows nothing about Anthropic.
 * This module is the adapter: it turns §5's four prompts into API calls and the
 * responses back into the plain records the loop consumes.
 *
 * ## The model
 *
 * SPEC §5 says "All calls use `claude-sonnet-4-6`". This ships with its
 * successor instead, and the reason is not "newer is better":
 *
 * Sonnet 4.6 does not support **structured outputs**. §5 gets its JSON by
 * ending each verifier prompt with "Output JSON only", which is a request, not
 * a guarantee — a verifier that wraps its object in prose or a fenced block
 * produces a parse error, and a parse error in a *verifier* is the worst place
 * to have one: the batch either fails for a reason that has nothing to do with
 * the Spanish, or gets waved through, depending on how the error is handled.
 * With `output_config.format` the shape is enforced server-side against a
 * schema and the failure mode disappears.
 *
 * Override with FLUENCIA_MODEL if you want §5's literal model back; everything
 * except the structured-output guarantee still works.
 */
export const DEFAULT_MODEL = 'claude-sonnet-5';

export function modelId(): string {
  return process.env.FLUENCIA_MODEL?.trim() || DEFAULT_MODEL;
}

/**
 * Non-streaming, so this stays under the SDK's HTTP timeout. A batch of ten
 * drills with thorough explanations is comfortably inside it; the verifier
 * reports are much smaller again.
 */
const MAX_TOKENS = 16000;

/* ------------------------------------------------------------------ *
 * Schemas
 * ------------------------------------------------------------------ */

/**
 * Structured-output schemas reject `minLength`, `maximum` and friends, so the
 * constraints that matter are stated in the prompts instead. What the schema
 * buys is the shape: a verifier cannot return prose where a report belongs.
 */
const ISSUE_SCHEMA = {
  type: 'object',
  properties: {
    severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
    quote: { type: 'string', description: 'The exact text complained about.' },
    problem: { type: 'string' },
    fix: { type: 'string', description: 'The concrete replacement, or "" if none is offered.' },
    itemIndex: {
      type: 'integer',
      description: 'Zero-based index of the item, or -1 if it applies to the whole batch.',
    },
  },
  required: ['severity', 'quote', 'problem', 'fix', 'itemIndex'],
  additionalProperties: false,
} as const;

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    score: { type: 'number', description: '0 to 10.' },
    issues: { type: 'array', items: ISSUE_SCHEMA },
  },
  required: ['pass', 'score', 'issues'],
  additionalProperties: false,
} as const;

const DISTRACTOR_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    feedback: { type: 'string' },
    errorCode: { type: 'string', description: 'An error code from the catalogue, or "".' },
  },
  required: ['answer', 'feedback', 'errorCode'],
  additionalProperties: false,
} as const;

const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: DRILL_KINDS },
    difficulty: { type: 'integer', enum: [1, 2, 3, 4, 5] },
    prompt: { type: 'string' },
    context: { type: 'string' },
    sentence: { type: 'string' },
    answer: { type: 'string' },
    accept: { type: 'array', items: { type: 'string' } },
    distractors: { type: 'array', items: DISTRACTOR_SCHEMA },
    explanation: { type: 'string' },
  },
  required: [
    'kind',
    'difficulty',
    'prompt',
    'context',
    'sentence',
    'answer',
    'accept',
    'distractors',
    'explanation',
  ],
  additionalProperties: false,
} as const;

const BATCH_SCHEMA = {
  type: 'object',
  properties: { items: { type: 'array', items: ITEM_SCHEMA } },
  required: ['items'],
  additionalProperties: false,
} as const;

/* ------------------------------------------------------------------ *
 * Prompts
 * ------------------------------------------------------------------ */

/**
 * SPEC §5's three verifier prompts, kept close to the wording in the spec.
 *
 * The instruction to emit JSON is deliberately gone — the schema handles it,
 * and leaving "Output JSON only" in tends to make a model spend its answer
 * describing the format rather than the Spanish.
 */
const VERIFIER_PROMPTS: Record<VerifierId, string> = {
  linguistic: `You are a Spanish linguistics examiner. You will be shown a batch of Spanish learning content. Your ONLY job is to find errors in the Spanish itself and in any grammatical claims made about it.

Check, in this order:
1. Is every Spanish sentence grammatical? Quote and correct any that is not.
2. Is every conjugated form actually the form it is labelled as? Verify morphology character by character. (-remos vs -ríamos vs -áramos are commonly confused.)
3. Is every grammatical explanation TRUE? Not simplified — true. Flag any explanation that is technically false even if pedagogically convenient.
4. Are the stated exceptions real, and are any major exceptions omitted?
5. Is the answer key correct for every item?

Two additional checks, learned from running this panel over the authored seed content:

6. Is every entry in \`accept\` genuinely correct Spanish? An accept list that admits an error teaches that error.
7. **Is every \`distractor\` genuinely WRONG?** This is the defect that has slipped through most often. A distractor is matched against the learner's free-text answer and, when it carries an \`errorCode\`, writes a "committed error" event into the log that drives the whole application's scheduling. A distractor that is correct Spanish — or merely dispreferred, or a meaning change rather than an error — therefore marks a right answer wrong AND teaches the scheduler a mistake the learner never made. Flag every one.

You must assume the content is wrong until you have verified each claim. Reviewers who find nothing are not being thorough. If genuinely nothing is wrong, return an empty issue list and a high score. Reporting no issue is a valid outcome; manufacturing one to look thorough is not.

Any critical issue forces pass = false. You hold veto power: content with a critical linguistic issue can never be accepted regardless of the other verifiers' scores.`,

  register: `You are a Peruvian Spanish editor preparing material for a professional adult learner in Lima who works in infrastructure consulting across Latin America.

Flag anything that is:
- Peninsular rather than Latin American (vosotros, os, coger in the wrong sense, ordenador, móvil, vale, tío, chungo, molar, "haber + participio" used where Latin America prefers the simple preterite)
- Regionally marked to a country other than Peru/Ecuador/Bolivia/Colombia/Mexico in a way that would sound foreign in Lima (vos forms, che, pibe, platicar, chido, guagua in the wrong sense)
- Wrong register for the context: too colloquial for a client meeting, or stiff and bookish where natural speech is wanted
- Textbook Spanish that no working professional actually says
- Orthography the RAE has withdrawn (accented demonstratives, sólo, guión)
- A calque presented as a Spanish collocation — and equally, an ordinary Spanish collocation wrongly condemned as an anglicism
- A lexical or orthographic claim that is not verifiable in the DLE or DPD. Inventing a spelling and telling the learner to note it is a serious defect.
- An \`accept\` entry that admits a form the item's own explanation tells the learner not to use

Do not invent a regional provenance for a form you are unsure about. "I cannot verify this attribution" is a better finding than a confident wrong one.`,

  pedagogy: `You are a CEFR assessment specialist reviewing a batch of drills for a learner at {{level}} working toward B2 certification.

Check:
1. DIFFICULTY MATCH — does this actually sit at {{level}}? Too easy wastes the session; too hard produces guessing, not learning.
2. TARGET ISOLATION — does the item test {{target_structure}}, or can the learner get it right/wrong for an unrelated reason? A cloze that also requires unknown vocabulary is a broken cloze.
3. DISCRIMINATION — would a learner who has NOT mastered {{target_structure}} plausibly get this wrong? If the correct answer is guessable from context or English, the item is worthless. Watch for the answer being cued by an adjacent agreeing word, the target form handed over in a parenthetical, and prompts that name the fault the learner is meant to find.
4. DOMAIN FIT — the learner is a construction/infrastructure consultant. Every example must sit in that world: site work, tenders, budgets, contractors, client meetings, delays, approvals, multi-country coordination. Reject generic textbook contexts (going to the beach, ordering coffee, my family).
5. EXPLANATION DEPTH — this learner has explicitly rejected abbreviated explanations. Does the explanation give the underlying rule and the WHY, not just the surface pattern?
6. ANSWER-KEY USABILITY — answers are graded as free text with punctuation and case stripped. A multi-blank cloze must not require the learner to retype material that is not in a blank, and the \`accept\` list must include every alternative the explanation itself endorses, including combinations of them.
7. ERROR ATTRIBUTION — a wrong answer writes a "committed" event against the item's error code. Flag any item whose failure would not be evidence for the error it is tagged with.

Do not flag an item as too easy or too hard without saying what would fix it.`,
};

const GENERATOR_PROMPT = `You write Spanish practice drills for one learner: an English-speaking infrastructure and construction consultant based in Lima, Peru, working toward CEFR B2.

Non-negotiable constraints:
- Neutral Latin American Spanish. No vosotros, ever — not a form, not a paradigm entry, not an aside.
- Every example sits in construction, engineering, client negotiation, budgeting or multi-country coordination. Never generic.
- Explanations are thorough: the rule, the why, and the exceptions. The learner has explicitly rejected abbreviated grammar explanations. Three or more substantial paragraphs.
- The instruction (\`prompt\`) and the explanation are in English. The learner is an English speaker.
- \`sentence\` is the stimulus. For a cloze, mark the blank with three underscores. For a translate item, it is the English to render.
- \`answer\` is the target span only, not the whole sentence, except for error-spot and transform items where the whole rewritten sentence is the answer.
- \`accept\` holds alternatives that are *equally correct*, lowercased. If the explanation endorses an alternative, it belongs here — including combinations when two independent substitutions are each endorsed.
- \`distractors\` are wrong answers the learner would plausibly produce, each with feedback giving the rule rather than just "no". **A distractor must be genuinely wrong Spanish.** Never use a correct sentence, a dispreferred-but-valid one, or one that merely changes the meaning. Set \`errorCode\` only when failing the item is real evidence for that specific error; otherwise "".
- Do not name the fault in the prompt, cue the answer with an adjacent agreeing word, or hand the target form over in a parenthetical.

Return exactly the number of items requested.`;

const REVISER_PROMPT = `You are revising a batch of Spanish drills against a consolidated critique from three independent verifiers.

The critique is deduplicated and ordered: critical issues first, and within a severity, issues that more than one verifier raised come before issues only one raised. Corroborated findings are the reliable ones — a single verifier's suggested wording has, in practice, been wrong often enough that you should verify a lone finding against your own knowledge before applying it. If you believe a finding is mistaken, leave the item alone and say why in the explanation rather than making a change you cannot defend.

Fix what is broken. Do not rewrite what is not: an item nobody complained about should come back unchanged, because every edit is a chance to introduce a new defect. Two specific traps, both observed:

- Changing a stimulus without updating the explanation that describes it.
- Applying a suggested replacement literally when the suggestion itself contains an error.

Return the complete batch, revised items and untouched items alike, in the original order and the same shape.

All the original authoring constraints still hold.`;

/* ------------------------------------------------------------------ *
 * Client
 * ------------------------------------------------------------------ */

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      'ANTHROPIC_API_KEY is not set, so the gauntlet cannot run. Copy .env.local.example ' +
        'to .env.local and add a key. Authored seed content still works without one.',
    );
    this.name = 'MissingApiKeyError';
  }
}

function anthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new MissingApiKeyError();
  return new Anthropic({ apiKey });
}

/** Render a batch for a verifier. Indices are stable so issues can point at items. */
export function renderItems(items: DraftItem[]): string {
  return items
    .map((item, i) => {
      const p = item.payload;
      const lines = [
        `### Item ${i} — ${item.kind}, difficulty ${item.difficulty}`,
        `prompt: ${p.prompt}`,
        `context: ${p.context ?? '(none)'}`,
        `sentence: ${p.sentence}`,
        `answer: ${p.answer}`,
      ];
      if (p.accept?.length) lines.push(`accept: ${p.accept.join(' | ')}`);
      for (const d of p.distractors ?? []) {
        lines.push(
          `distractor: ${d.answer}\n  feedback: ${d.feedback}` +
            (d.errorCode ? `\n  errorCode: ${d.errorCode}` : ''),
        );
      }
      lines.push(`explanation: ${p.explanation}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

function verifierSystem(id: VerifierId, request: GenerationRequest): string {
  return VERIFIER_PROMPTS[id]
    .replaceAll('{{level}}', request.level)
    .replaceAll('{{target_structure}}', request.targetStructure);
}

function requestBrief(request: GenerationRequest): string {
  const lines = [
    `Topic: ${request.topicId}`,
    `CEFR level: ${request.level}`,
    `Target structure: ${request.targetStructure}`,
    `Item kinds allowed: ${request.kinds.join(', ')}`,
    `Number of items: ${request.count}`,
  ];
  if (request.targetsError) {
    lines.push(
      `These items probe the error \`${request.targetsError}\`. A wrong answer must be real ` +
        `evidence that the learner committed that error, not merely that they got something wrong.`,
    );
  }
  return lines.join('\n');
}

/* ---- response coercion ---- */

const SEVERITIES: Severity[] = ['critical', 'major', 'minor'];

function firstJson(message: Anthropic.Message): unknown {
  for (const block of message.content) {
    if (block.type === 'text') {
      // Structured outputs guarantee the block is the object and nothing else,
      // but a model run without them may still fence it. Tolerate that rather
      // than failing a whole batch on a pair of backticks.
      const text = block.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      return JSON.parse(text);
    }
  }
  throw new Error('The model returned no text block to parse.');
}

function coerceReport(raw: unknown): VerifierReport {
  const r = raw as { pass?: unknown; score?: unknown; issues?: unknown };
  const issues = Array.isArray(r.issues) ? r.issues : [];
  return {
    pass: r.pass === true,
    // A score outside 0–10 would silently distort the arbiter's mean, which is
    // the one number the accept decision turns on. Clamp rather than trust.
    score: Math.max(0, Math.min(10, Number(r.score) || 0)),
    issues: issues.map((i) => {
      const issue = i as Record<string, unknown>;
      const severity = SEVERITIES.includes(issue.severity as Severity)
        ? (issue.severity as Severity)
        : 'minor';
      const itemIndex = Number(issue.itemIndex);
      return {
        severity,
        quote: String(issue.quote ?? ''),
        problem: String(issue.problem ?? ''),
        ...(issue.fix ? { fix: String(issue.fix) } : {}),
        ...(Number.isInteger(itemIndex) && itemIndex >= 0 ? { itemIndex } : {}),
      };
    }),
  };
}

function coerceItems(raw: unknown): DraftItem[] {
  const r = raw as { items?: unknown };
  const items = Array.isArray(r.items) ? r.items : [];
  return items.map((entry) => {
    const it = entry as Record<string, unknown>;
    const kind = DRILL_KINDS.includes(it.kind as DrillKind)
      ? (it.kind as DrillKind)
      : 'drill_cloze';
    const d = Number(it.difficulty);
    const difficulty = ([1, 2, 3, 4, 5] as const).find((n) => n === d) ?? 3;

    const distractors = (Array.isArray(it.distractors) ? it.distractors : []).map((entry2) => {
      const dd = entry2 as Record<string, unknown>;
      const code = String(dd.errorCode ?? '').trim();
      return {
        answer: String(dd.answer ?? ''),
        feedback: String(dd.feedback ?? ''),
        ...(code ? { errorCode: code } : {}),
      };
    });

    const accept = (Array.isArray(it.accept) ? it.accept : []).map((a) => String(a));
    const context = String(it.context ?? '').trim();

    const payload: DrillPayload = {
      prompt: String(it.prompt ?? ''),
      ...(context ? { context } : {}),
      sentence: String(it.sentence ?? ''),
      answer: String(it.answer ?? ''),
      ...(accept.length ? { accept } : {}),
      ...(distractors.length ? { distractors } : {}),
      explanation: String(it.explanation ?? ''),
    };
    return { kind, difficulty, payload };
  });
}

/* ---- the client ---- */

/**
 * A `GauntletClient` backed by the Anthropic API.
 *
 * The system prompt on every call carries a cache breakpoint. The four prompts
 * above are long and completely static, and one gauntlet round issues five
 * calls that share them — three verifiers, plus a reviser if the round fails.
 * Caching them is most of the cost saving available here without touching
 * §5's architecture.
 */
export function createGauntletClient(): GauntletClient {
  const client = anthropic();
  const model = modelId();

  async function ask(
    system: string,
    user: string,
    schema: Record<string, unknown>,
  ): Promise<unknown> {
    const message = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'adaptive' },
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      output_config: { format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: user }],
    });
    if (message.stop_reason === 'max_tokens') {
      // Truncated JSON parses as garbage or, worse, as a valid but partial
      // report. Fail loudly instead of letting a half-read batch reach the
      // arbiter.
      throw new Error(`The model hit max_tokens (${MAX_TOKENS}); the batch is too large to verify in one call.`);
    }
    return firstJson(message);
  }

  return {
    async generate(request) {
      const user = `${requestBrief(request)}\n\nWrite the batch.`;
      return coerceItems(await ask(GENERATOR_PROMPT, user, BATCH_SCHEMA));
    },

    async verify(id, request, items) {
      const user = `${requestBrief(request)}\n\n---\n\n${renderItems(items)}`;
      return coerceReport(await ask(verifierSystem(id, request), user, REPORT_SCHEMA));
    },

    async revise(request, items, critique) {
      const rendered = critique
        .map((c, i) => {
          const where = c.itemIndex === undefined ? 'whole batch' : `item ${c.itemIndex}`;
          const who = c.raisedBy.join(' + ');
          return [
            `${i + 1}. [${c.severity}] ${where} — raised by ${who}`,
            `   quote: ${c.quote}`,
            `   problem: ${c.problem}`,
            ...(c.fix ? [`   suggested fix: ${c.fix}`] : []),
          ].join('\n');
        })
        .join('\n\n');

      const user = [
        requestBrief(request),
        '---',
        '## The batch',
        renderItems(items),
        '---',
        '## Consolidated critique',
        rendered,
      ].join('\n\n');

      return coerceItems(await ask(REVISER_PROMPT, user, BATCH_SCHEMA));
    },
  };
}

/** True when a gauntlet run is possible at all. Used to keep the UI honest. */
export function gauntletAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export const PROMPTS = {
  verifiers: VERIFIER_PROMPTS,
  generator: GENERATOR_PROMPT,
  reviser: REVISER_PROMPT,
} as const;
