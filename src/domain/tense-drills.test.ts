import { describe, expect, it } from 'vitest';
import { PERSONS, TENSES, conjugate, type Tense } from './conjugation';
import { VERBS, VERB_BY_INFINITIVE } from './verbs';
import { difficultyOf, drillFor, drillsForTense } from './tense-drills';
import { grade } from './grading';

/**
 * The generator has one job the engine cannot check for it: producing a drill
 * whose stated answer is the form the sentence actually calls for, in a
 * sentence a consultant in Lima would recognise.
 */

const v = (inf: string) => VERB_BY_INFINITIVE.get(inf)!;

describe('every generated drill is answerable and correct', () => {
  it('states the answer the engine gives for that cell', () => {
    for (const verb of VERBS) {
      for (const t of TENSES) {
        for (const p of PERSONS) {
          const d = drillFor(verb, t.id, p);
          if (d === null) continue;
          expect(d.payload.answer, `${verb.infinitive} ${t.id} ${p}`).toBe(
            conjugate(verb, t.id)[p],
          );
        }
      }
    }
  });

  it('grades its own answer as correct', () => {
    // The loop closes: what the generator claims is right must be what the
    // grader accepts, or the learner is marked wrong for being right.
    for (const t of TENSES) {
      for (const d of drillsForTense(t.id, 8, 3)) {
        const g = grade(d.payload, d.payload.answer, null);
        expect(g.correct, `${d.verb} ${d.tense} ${d.person} → ${d.payload.answer}`).toBe(true);
      }
    }
  });

  it('never asks for a form that does not exist', () => {
    // The first-person imperative. Asking for it would be unanswerable.
    for (const verb of VERBS) {
      expect(drillFor(verb, 'imperativo', 'yo')).toBeNull();
      expect(drillFor(verb, 'imperativo_negativo', 'yo')).toBeNull();
    }
  });

  it('leaves exactly one gap, and names the verb in it', () => {
    for (const t of TENSES) {
      for (const d of drillsForTense(t.id, 6, 3)) {
        const gaps = d.payload.sentence.match(/___/g) ?? [];
        expect(gaps, `${d.verb} ${d.tense}`).toHaveLength(1);
        expect(d.payload.sentence).toContain(`(${d.verb})`);
      }
    }
  });

  it('does not give the answer away in the sentence', () => {
    for (const t of TENSES) {
      for (const d of drillsForTense(t.id, 10, 3)) {
        const withoutCue = d.payload.sentence.replace(`(${d.verb})`, '');
        // As a whole word: «va» is legitimately inside «avance», and a
        // substring check would fail on a sentence that gives nothing away.
        const asWord = new RegExp(
          `(^|[^a-záéíóúñü])${d.payload.answer.toLowerCase()}([^a-záéíóúñü]|$)`,
          'i',
        );
        expect(withoutCue.toLowerCase(), `${d.verb} ${d.tense}`).not.toMatch(asWord);
      }
    }
  });
});

describe('the sentences', () => {
  it('stay in the construction and consulting world', () => {
    // CLAUDE.md: every Spanish example lives in that context.
    const domain =
      /obra|encofrado|vaciado|acta|expediente|valorización|cliente|supervis|contratista|proveedor|plazo|material|acero|cronograma|presupuesto|partida|acabado|informe|replanteo|cimentación|frente|guía|cuadrilla|avance|adicional|aprobación|proyecto|etapa|trabajo|reunión|retraso|entrega|supervisión|obra/i;
    for (const t of TENSES) {
      for (const d of drillsForTense(t.id, 10, 3)) {
        expect(d.payload.sentence, `${d.verb} ${d.tense}: ${d.payload.sentence}`).toMatch(domain);
      }
    }
  });

  it('never uses vosotros', () => {
    for (const t of TENSES) {
      for (const d of drillsForTense(t.id, 12, 3)) {
        expect(d.payload.sentence.toLowerCase()).not.toContain('vosotros');
        expect(d.payload.answer).not.toMatch(/áis$|éis$/);
      }
    }
  });

  it('motivates the tense rather than leaving it arbitrary', () => {
    // A frame that worked in any tense would teach the form while teaching
    // nothing about when to reach for it, so each carries its own trigger.
    const triggers: Partial<Record<Tense, RegExp>> = {
      preterito: /ayer|la semana pasada/i,
      imperfecto: /antes|cuando llegué/i,
      subj_presente: /espero que|cuando|no creo que/i,
      subj_imperfecto: /^si |pidió que/i,
      pluscuamperfecto: /cuando llegó/i,
      futuro_perfecto: /para el viernes/i,
    };
    for (const [tense, re] of Object.entries(triggers)) {
      for (const d of drillsForTense(tense as Tense, 6, 3)) {
        expect(d.payload.sentence, `${tense}: ${d.payload.sentence}`).toMatch(re!);
      }
    }
  });
});

describe('the explanations', () => {
  it('are thorough, never abbreviated', () => {
    // CLAUDE.md records that the user has explicitly rejected short grammar
    // notes: the rule, the why, and the exceptions, every time.
    for (const t of TENSES) {
      for (const d of drillsForTense(t.id, 5, 3)) {
        expect(d.payload.explanation.length, `${d.verb} ${d.tense}`).toBeGreaterThan(200);
      }
    }
  });

  it('name the form being taught', () => {
    for (const t of TENSES) {
      for (const d of drillsForTense(t.id, 5, 3)) {
        expect(d.payload.explanation).toContain(d.payload.answer);
      }
    }
  });

  it('give the derivation for the imperfect subjunctive, which is fully mechanical', () => {
    const d = drillFor(v('tener'), 'subj_imperfecto', 'nosotros')!;
    expect(d.payload.answer).toBe('tuviéramos');
    expect(d.payload.explanation).toContain('tuvieron');
    expect(d.payload.explanation).toMatch(/no exceptions/i);
  });

  it('warn that the participle never agrees, in compound tenses', () => {
    const d = drillFor(v('revisar'), 'presente_perfecto', 'nosotros')!;
    expect(d.payload.explanation).toMatch(/never agrees|frozen/i);
  });
});

describe('difficulty', () => {
  it('rises with the level of the tense', () => {
    const pres = difficultyOf(v('trabajar'), 'presente', 'yo');
    const subj = difficultyOf(v('trabajar'), 'subj_imperfecto', 'yo');
    expect(subj).toBeGreaterThan(pres);
  });

  it('rises for an irregular verb over a regular one in the same cell', () => {
    expect(difficultyOf(v('tener'), 'preterito', 'yo')).toBeGreaterThan(
      difficultyOf(v('trabajar'), 'preterito', 'yo'),
    );
  });

  it('marks the nosotros subjunctive of a stem-changer as the hardest cell', () => {
    // Where -ir verbs raise and -ar/-er verbs do not — the most-missed cell.
    expect(difficultyOf(v('dormir'), 'subj_presente', 'nosotros')).toBeGreaterThan(
      difficultyOf(v('dormir'), 'subj_presente', 'tú'),
    );
  });

  it('stays inside 1–5', () => {
    for (const verb of VERBS) {
      for (const t of TENSES) {
        for (const p of PERSONS) {
          const d = difficultyOf(verb, t.id, p);
          expect(d).toBeGreaterThanOrEqual(1);
          expect(d).toBeLessThanOrEqual(5);
        }
      }
    }
  });
});

describe('a generated set', () => {
  it('returns the number asked for', () => {
    expect(drillsForTense('presente', 12)).toHaveLength(12);
    expect(drillsForTense('subj_presente', 20, 3)).toHaveLength(20);
  });

  it('is ordered easiest first', () => {
    const set = drillsForTense('preterito', 15, 3);
    const d = set.map((x) => x.difficulty);
    expect([...d].sort((a, b) => a - b)).toEqual(d);
  });

  it('spreads across verbs rather than hammering one', () => {
    const set = drillsForTense('presente', 12);
    expect(new Set(set.map((d) => d.verb)).size).toBeGreaterThan(6);
  });

  it('covers more than one person', () => {
    const set = drillsForTense('futuro', 12);
    expect(new Set(set.map((d) => d.person)).size).toBeGreaterThan(2);
  });

  it('is deterministic — the same call gives the same set', () => {
    expect(drillsForTense('condicional', 10)).toEqual(drillsForTense('condicional', 10));
  });
});
