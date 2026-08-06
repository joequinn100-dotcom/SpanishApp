import { describe, it, expect } from 'vitest';
import { segment, speakers, learnerTurns, flatten, guessLearner } from './transcript';
import { analyze, wordCount } from './detectors';

/**
 * Fixtures are deliberately broken Spanish — the errors from SPEC §10 in the
 * shape a real class transcript would carry them, mixed with correct Spanish
 * from the teacher that must never be scored as the learner's.
 */

const CLASS = `Lorena: Buenos días. ¿Cómo va la obra esta semana?
Joe: Bien. La semana pasada compremos el material en Chile.
Lorena: Compramos, no compremos. Es un hecho, va en indicativo.
Joe: Sí. Tenemos una problema con la programa de entregas.
Joe: Después la reunión enviamos el acta a todos.
Lorena: Muy bien, pero es "después de la reunión".
Joe: Si tuviéramos más plazo, reforzaríamos la cimentación.`;

describe('segment', () => {
  it('splits on speaker labels', () => {
    const turns = segment(CLASS);
    expect(turns).toHaveLength(7);
    expect(turns[0].speaker).toBe('Lorena');
    expect(turns[1].speaker).toBe('Joe');
  });

  it('preserves offsets into the original text', () => {
    const turns = segment(CLASS);
    for (const t of turns) {
      expect(CLASS.slice(t.start, t.end)).toBe(t.text);
    }
  });

  it('handles timestamped exports', () => {
    const turns = segment('[00:12:03] Joe: Hola.\n00:12 Lorena: Buenos días.');
    expect(turns.map((t) => t.speaker)).toEqual(['Joe', 'Lorena']);
  });

  it('attaches wrapped continuation lines to the turn above', () => {
    const turns = segment('Joe: Primera línea\nsegunda línea del mismo turno.');
    expect(turns).toHaveLength(1);
    expect(turns[0].text).toContain('segunda línea');
  });

  it('does not shred unlabelled prose into fake turns', () => {
    // Spanish uses colons mid-sentence; a loose label pattern would split here.
    const raw = 'Revisamos tres puntos: el plazo, el costo y el alcance del proyecto.';
    const turns = segment(raw);
    expect(turns).toHaveLength(1);
    expect(turns[0].speaker).toBeNull();
  });

  it('drops blank lines rather than emitting empty turns', () => {
    expect(segment('Joe: Hola.\n\n\nLorena: Buenos días.')).toHaveLength(2);
  });
});

describe('learnerTurns', () => {
  it('keeps only the learner and discards the teacher', () => {
    const turns = learnerTurns(segment(CLASS), 'Joe');
    expect(turns).toHaveLength(4);
    expect(turns.every((t) => t.speaker === 'Joe')).toBe(true);
    expect(turns.some((t) => t.text.includes('indicativo'))).toBe(false);
  });

  it('treats unlabelled text as the learner’s own', () => {
    const turns = segment('Escribí este párrafo yo mismo sobre la obra.');
    expect(learnerTurns(turns, null)).toHaveLength(1);
  });

  it('returns nothing rather than everything when the learner is unknown', () => {
    // Falling back to "all of it" is how a teacher's correct Spanish ends up
    // resolving errors that were never fixed.
    expect(learnerTurns(segment(CLASS), null)).toEqual([]);
    expect(learnerTurns(segment(CLASS), 'Nadie')).toEqual([]);
  });

  it('matches speaker names case-insensitively', () => {
    expect(learnerTurns(segment(CLASS), 'joe')).toHaveLength(4);
  });
});

describe('speakers and guessLearner', () => {
  it('ranks speakers by how much they said', () => {
    const list = speakers(segment(CLASS));
    expect(list.map((s) => s.name).sort()).toEqual(['Joe', 'Lorena']);
  });

  it('guesses the quieter of two speakers is the learner', () => {
    const list = [
      { name: 'Lorena', chars: 900 },
      { name: 'Joe', chars: 300 },
    ];
    expect(guessLearner(list)).toBe('Joe');
  });

  it('guesses the only speaker when there is one', () => {
    expect(guessLearner([{ name: 'Joe', chars: 100 }])).toBe('Joe');
  });

  it('guesses nothing from nothing', () => {
    expect(guessLearner([])).toBeNull();
  });
});

describe('analyze — errors', () => {
  const text = flatten(learnerTurns(segment(CLASS), 'Joe')).text;
  const findings = analyze(text);
  const codes = findings.filter((f) => f.kind === 'error').map((f) => f.errorCode);

  it('finds the Greek -ma gender errors', () => {
    expect(codes).toContain('noun.greek_ma');
  });

  it('finds bare después', () => {
    expect(codes).toContain('prep.despues_de');
  });

  it('never reports the teacher’s correct Spanish', () => {
    // "Compramos, no compremos" is Lorena's correction; segmenting it out is
    // the whole point of §6's learner-only rule.
    for (const f of findings) {
      expect(f.quote).not.toContain('indicativo');
    }
  });

  it('proposes a correction, not just a complaint', () => {
    const ma = findings.find((f) => f.errorCode === 'noun.greek_ma')!;
    expect(ma.correction).toMatch(/un problema/);
  });

  it('never claims certainty', () => {
    for (const f of findings) {
      expect(f.confidence).toBeLessThan(1);
      expect(f.confidence).toBeGreaterThan(0);
    }
  });

  it('gives a thorough explanation on every finding', () => {
    for (const f of findings) {
      expect(f.explanation.length, f.errorCode ?? f.topicId ?? '?').toBeGreaterThan(300);
    }
  });

  it('quotes text that actually appears in the source', () => {
    for (const f of findings) {
      expect(text.slice(f.start, f.end).trim()).toBe(f.quote);
    }
  });
});

describe('analyze — specific rules', () => {
  const codesIn = (s: string) => analyze(s).map((f) => f.errorCode);

  it('catches «hacen tres semanas»', () => {
    expect(codesIn('Enviamos la consulta hacen tres semanas.')).toContain('verb.hace_ago');
  });

  it('leaves «hace tres semanas» alone', () => {
    expect(codesIn('Enviamos la consulta hace tres semanas.')).not.toContain('verb.hace_ago');
  });

  it('catches a gerund after haber', () => {
    expect(codesIn('Hemos revisando las tres valorizaciones.')).toContain(
      'verb.perfecto_gerundio',
    );
    const f = analyze('Hemos revisando las tres valorizaciones.')[0];
    expect(f.correction).toContain('revisado');
  });

  it('leaves a correct participle after haber alone', () => {
    expect(codesIn('Hemos revisado las tres valorizaciones.')).not.toContain(
      'verb.perfecto_gerundio',
    );
  });

  it('catches «una otra vez»', () => {
    const f = analyze('El proveedor incumplió el plazo una otra vez.')[0];
    expect(f.errorCode).toBe('lex.una_otra_vez');
    expect(f.correction).toContain('otra vez');
  });

  it('catches an English particle carried onto buscar', () => {
    expect(codesIn('Estamos buscando para un proveedor local.')).toContain('prep.buscar_para');
  });

  it('catches «se duele» but not «me duele»', () => {
    expect(codesIn('Al ingeniero se duele la espalda.')).toContain('pron.doler_le');
    expect(codesIn('Me duele la espalda después de la inspección.')).not.toContain(
      'pron.doler_le',
    );
  });

  it('survives accented words at a word boundary', () => {
    // The trap: \b does not work after ó, so a naive rule silently never fires.
    expect(() => analyze('El supervisor aprobó el cambio de especificación.')).not.toThrow();
  });

  it('reports nothing on clean Spanish', () => {
    const clean =
      'El supervisor aprobó el cambio y enviamos el acta después de la reunión. ' +
      'Hemos revisado el presupuesto y el cronograma está actualizado.';
    const errs = analyze(clean).filter((f) => f.kind === 'error');
    expect(errs).toEqual([]);
  });
});

describe('analyze — positives (SPEC §6’s other half)', () => {
  it('finds an unprompted imperfect subjunctive in a si-clause', () => {
    const f = analyze('Si tuviéramos más plazo, reforzaríamos la cimentación.');
    const pos = f.filter((x) => x.kind === 'positive');
    expect(pos.map((x) => x.topicId)).toContain('b2.mood.subj_imperfecto');
  });

  it('finds B2 connectors', () => {
    const pos = analyze(
      'Avanzamos con la estructura; sin embargo, el acabado sigue retrasado.',
    ).filter((x) => x.kind === 'positive');
    expect(pos.map((x) => x.topicId)).toContain('b2.discourse.conectores_2');
  });

  it('finds «cuyo», which most speakers at this level avoid', () => {
    const pos = analyze(
      'Trabajamos con un contratista cuyas certificaciones vencieron.',
    ).filter((x) => x.kind === 'positive');
    expect(pos.map((x) => x.topicId)).toContain('b1.syntax.relativos');
  });

  it('never proposes a correction on a positive finding', () => {
    const pos = analyze('Si tuviéramos más plazo, avanzaríamos.').filter(
      (x) => x.kind === 'positive',
    );
    expect(pos.every((p) => p.correction === '')).toBe(true);
  });
});

describe('wordCount', () => {
  it('counts words, not punctuation', () => {
    expect(wordCount('Hola, ¿cómo va la obra?')).toBe(5);
  });

  it('is 0 on empty input', () => {
    expect(wordCount('')).toBe(0);
  });
});
