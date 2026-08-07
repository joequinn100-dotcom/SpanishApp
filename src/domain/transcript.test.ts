import { describe, it, expect } from 'vitest';
import { segment, speakers, learnerTurns, flatten } from './transcript';
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

describe('speakers', () => {
  it('ranks speakers by how much they said', () => {
    const list = speakers(segment(CLASS));
    expect(list.map((s) => s.name).sort()).toEqual(['Joe', 'Lorena']);
  });

  it('reports turn and character counts so the learner can be picked by eye', () => {
    const joe = speakers(segment(CLASS)).find((s) => s.name === 'Joe')!;
    expect(joe.turns).toBe(4);
    expect(joe.chars).toBeGreaterThan(0);
  });

  it('finds nothing in unlabelled text', () => {
    expect(speakers(segment('Un párrafo sobre la obra, sin etiquetas.'))).toEqual([]);
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

describe('analyze — repeated errors in one sentence', () => {
  it('repairs every instance, not just the first', () => {
    // One finding, two mistakes. A correction that fixed only «una problema»
    // would be presented as the right answer while still carrying «la
    // programa» — worse than no correction at all.
    const f = analyze('Tenemos una problema con la programa de entregas.')[0];
    expect(f.errorCode).toBe('noun.greek_ma');
    expect(f.correction).toContain('un problema');
    expect(f.correction).toContain('el programa');
  });

  it('still reports one finding per sentence per rule', () => {
    const found = analyze('Tenemos una problema con la programa de entregas.');
    expect(found.filter((x) => x.errorCode === 'noun.greek_ma')).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ *
 * ASR exports
 *
 * Every one of these reproduces a defect found by running the segmenter over
 * real class recordings. The sentences are written for the test rather than
 * lifted, so nothing from a real class enters the repository — but the shapes
 * are exactly what an Otter/Zoom-style export produces: a timestamp per
 * utterance, no speaker names anywhere, and no blank lines to segment on.
 * ------------------------------------------------------------------ */

describe('timestamped exports with no speaker labels', () => {
  const ASR = [
    '0:00:15',
    'Hola, ¿cómo estás?',
    '0:01:24 Sí, tenemos un feriado el lunes.',
    '0:02:45 La cuadrilla llegó tarde a la obra',
    'porque el material no estaba listo.',
  ].join('\n');

  it('starts a new turn at each timestamp instead of collapsing the file', () => {
    // Blank-line segmentation gives one turn for the whole export, which makes
    // every per-turn offset useless for quoting a finding in context.
    const turns = segment(ASR);
    expect(turns).toHaveLength(3);
  });

  it('keeps the timestamp out of the text', () => {
    // Otherwise the review screen quotes «0:02:45 La cuadrilla llegó tarde…»
    // and the learner is asked to judge a log line.
    for (const t of segment(ASR)) {
      expect(t.text).not.toMatch(/\d{1,2}:\d{2}/);
    }
    expect(segment(ASR)[1]!.text).toBe('Sí, tenemos un feriado el lunes.');
  });

  it('attaches an unstamped continuation line to the turn before it', () => {
    const last = segment(ASR)[2]!;
    expect(last.text).toContain('La cuadrilla llegó tarde');
    expect(last.text).toContain('porque el material no estaba listo');
  });

  it('points start past the timestamp, so a quote maps back to the Spanish', () => {
    const turns = segment(ASR);
    for (const t of turns) {
      expect(ASR.slice(t.start, t.start + 3)).not.toMatch(/^\d/);
    }
    const second = turns[1]!;
    expect(ASR.slice(second.start, second.end)).toBe('Sí, tenemos un feriado el lunes.');
  });

  it('reports no speakers, because there are none to report', () => {
    // The upload screen has to be able to say "this file names nobody" rather
    // than inventing a name or silently assuming one.
    expect(speakers(segment(ASR))).toEqual([]);
  });

  it('still finds a real speaker label when the export has one', () => {
    const labelled = ['0:00:15 Lorena: ¿Cómo estás?', '0:01:02 Joe: Bien, gracias.'].join('\n');
    const turns = segment(labelled);
    expect(turns.map((t) => t.speaker)).toEqual(['Lorena', 'Joe']);
    expect(turns[0]!.text).toBe('¿Cómo estás?');
  });

  it('does not mistake a time of day inside a sentence for a turn boundary', () => {
    const line = 'La reunión es a las 9:30 y el vaciado empieza después.';
    const turns = segment(line);
    expect(turns).toHaveLength(1);
    expect(turns[0]!.text).toBe(line);
  });
});

describe('single-speaker class recordings', () => {
  /**
   * The learner's teacher speaks through his headset, so her voice never
   * reaches the microphone the ASR transcribes. An unlabelled class export is
   * therefore entirely his — this is a fact about the recording setup, not a
   * guess, and it is what makes these files analysable without labelling.
   */
  const ONE_SIDED = [
    '0:00:15 Hola Lorena, ¿cómo estás?',
    '0:00:48',
    'OK.',
    '0:01:02 Sí, tenemos un feriado el lunes.',
    '0:01:30 Lorena, no tengo audio.',
  ].join('\n');

  it('treats every turn as the learner when nobody is named', () => {
    const turns = segment(ONE_SIDED);
    expect(learnerTurns(turns, null)).toHaveLength(turns.length);
  });

  it('keeps the short acknowledgements, which answer speech not in the file', () => {
    // These are the learner responding to the teacher. Dropping them as noise
    // would be wrong: they are his production, and the gaps between them are
    // the only trace the recording keeps of the other half of the conversation.
    const texts = learnerTurns(segment(ONE_SIDED), null).map((t) => t.text);
    expect(texts).toContain('OK.');
  });

  it('still refuses to guess when a file does name speakers', () => {
    // A labelled export is a different situation, and picking the wrong name
    // there would put someone else's Spanish in the error log.
    const labelled = 'Lorena: ¿Cómo estás?\nJoe: Bien, gracias.';
    expect(learnerTurns(segment(labelled), null)).toEqual([]);
    expect(learnerTurns(segment(labelled), 'Joe')).toHaveLength(1);
  });
});
