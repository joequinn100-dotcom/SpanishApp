import { describe, it, expect } from 'vitest';
import {
  normalize,
  foldAccents,
  grade,
  errorOutcome,
  rollingAccuracy,
  type DrillPayload,
} from './grading';

/**
 * Fixtures are deliberately broken Spanish — the errors from SPEC §10 that this
 * learner actually makes. A grader that only ever sees correct input is
 * untested where it matters.
 */
const item: DrillPayload = {
  prompt: 'Put the verb in the correct form.',
  context: 'Explaining a budget constraint to the client.',
  sentence: 'Si ___ (tener) más presupuesto, reforzaríamos la cimentación.',
  answer: 'tuviéramos',
  accept: ['tuviésemos'],
  distractors: [
    {
      answer: 'tendríamos',
      feedback:
        'The conditional cannot appear in the si-clause. Spanish puts the hypothesis in the imperfect subjunctive and the consequence in the conditional; English lets "would" drift into both halves, which is where this comes from.',
      errorCode: 'verb.futuro_vs_condicional',
    },
    { answer: 'tenemos', feedback: 'The present indicative makes this a real condition, not a hypothetical one.' },
  ],
  explanation:
    'Si + imperfect subjunctive + conditional is the fixed frame for an unreal present condition.',
};

describe('normalize', () => {
  it('strips case, surrounding punctuation and doubled spaces', () => {
    expect(normalize('  ¿Cuándo   LLEGÓ el ingeniero? ')).toBe('cuándo llegó el ingeniero');
  });

  it('keeps accents', () => {
    expect(normalize('tuviéramos')).toBe('tuviéramos');
  });
});

describe('foldAccents', () => {
  it('folds the five stress vowels', () => {
    expect(foldAccents('tuviéramos')).toBe('tuvieramos');
  });

  it('does not fold ñ — it is a letter, not an accent', () => {
    expect(foldAccents('año')).toBe('año');
    expect(foldAccents('ano')).not.toBe(foldAccents('año'));
  });

  it('does not fold ü — bilingüe and bilingue are different words', () => {
    expect(foldAccents('bilingüe')).toBe('bilingüe');
  });
});

describe('grade', () => {
  it('accepts the key', () => {
    const g = grade(item, 'tuviéramos');
    expect(g.verdict).toBe('correct');
    expect(g.correct).toBe(true);
    expect(g.partial).toBe(1);
  });

  it('accepts the -se alternative as fully correct, not partially', () => {
    const g = grade(item, 'tuviésemos');
    expect(g.verdict).toBe('correct');
    expect(g.partial).toBe(1);
  });

  it('ignores case and stray punctuation', () => {
    expect(grade(item, ' Tuviéramos, ').verdict).toBe('correct');
  });

  it('flags an accent-only miss but still counts it correct', () => {
    const g = grade(item, 'tuvieramos');
    expect(g.verdict).toBe('accent');
    expect(g.correct).toBe(true);
    expect(g.partial).toBe(0.8);
    expect(g.feedback).toContain('tuviéramos');
  });

  it('names the specific confusion for a known wrong answer', () => {
    const g = grade(item, 'tendríamos');
    expect(g.verdict).toBe('distractor');
    expect(g.correct).toBe(false);
    expect(g.feedback).toContain('conditional cannot appear in the si-clause');
    expect(g.errorsFound).toContain('verb.futuro_vs_condicional');
  });

  it('still explains an unanticipated wrong answer', () => {
    const g = grade(item, 'tuviera');
    expect(g.verdict).toBe('incorrect');
    expect(g.feedback).toContain('tuviéramos');
    expect(g.feedback).toContain(item.explanation);
  });

  it('never returns bare feedback', () => {
    for (const answer of ['tuviéramos', 'tuvieramos', 'tendríamos', 'tenemos', 'xyz']) {
      expect(grade(item, answer).feedback.length).toBeGreaterThan(40);
    }
  });

  it('treats blank as its own verdict, not a wrong answer', () => {
    const g = grade(item, '   ');
    expect(g.verdict).toBe('blank');
    expect(g.errorsFound).toEqual([]);
  });

  it('attributes the targeted error on both success and failure', () => {
    expect(grade(item, 'tuviéramos', 'verb.futuro_vs_condicional').errorsFound).toEqual([
      'verb.futuro_vs_condicional',
    ]);
    expect(grade(item, 'xyz', 'verb.futuro_vs_condicional').errorsFound).toEqual([
      'verb.futuro_vs_condicional',
    ]);
  });

  it('does not duplicate a code found by both the distractor and the item', () => {
    const g = grade(item, 'tendríamos', 'verb.futuro_vs_condicional');
    expect(g.errorsFound).toEqual(['verb.futuro_vs_condicional']);
  });
});

describe('errorOutcome', () => {
  it('maps a correct answer to avoided and a wrong one to committed', () => {
    expect(errorOutcome(grade(item, 'tuviéramos'))).toBe('avoided');
    expect(errorOutcome(grade(item, 'tendríamos'))).toBe('committed');
  });

  it('counts an accent slip as avoiding the grammatical error being probed', () => {
    expect(errorOutcome(grade(item, 'tuvieramos'))).toBe('avoided');
  });

  it('writes no event for a blank', () => {
    expect(errorOutcome(grade(item, ''))).toBeNull();
  });
});

describe('rollingAccuracy', () => {
  it('is 0 with no history rather than NaN', () => {
    expect(rollingAccuracy([])).toBe(0);
  });

  it('ignores everything before the window', () => {
    // Twenty perfect answers preceded by a hundred failures reads as 1.0.
    const partials = [...Array(20).fill(1), ...Array(100).fill(0)];
    expect(rollingAccuracy(partials)).toBe(1);
  });

  it('averages partials rather than counting booleans', () => {
    expect(rollingAccuracy([1, 0.8, 0, 1])).toBeCloseTo(0.7);
  });

  it('is not correct/attempts — recent work dominates', () => {
    const history = [...Array(10).fill(1), ...Array(10).fill(0), ...Array(50).fill(0)];
    expect(rollingAccuracy(history)).toBe(0.5);
  });
});
