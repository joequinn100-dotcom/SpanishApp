import { describe, expect, it } from 'vitest';
import { analyze, applyCorrections, makeVocabGenderRule } from './detectors';
import { conjugate, futureSimple, isAccepted } from './conjugator';
import { deriveStatus } from './store';
import type { Attempt } from '../types';

const ids = (text: string) => analyze(text).map((f) => f.detectorId);
const fix = (text: string) => applyCorrections(text, analyze(text));

describe('gender / -ma group', () => {
  it('catches la tema and una problema', () => {
    expect(fix('La tema es una problema para el equipo.')).toBe(
      'El tema es un problema para el equipo.',
    );
  });

  it('catches plurals and quantifiers', () => {
    expect(fix('Revisamos todas las cronogramas.')).toBe('Revisamos todos los cronogramas.');
  });

  it('catches feminine nouns that look masculine', () => {
    expect(fix('El obra avanzó bien.')).toBe('La obra avanzó bien.');
  });

  it('leaves correct agreement alone', () => {
    expect(ids('El tema del cronograma es un problema serio.')).toEqual([]);
  });

  it('uses the vocabulary bank genders', () => {
    const rule = makeVocabGenderRule([
      { term: 'expediente', gender: 'm' },
      { term: 'valorización', gender: 'f' },
    ]);
    const f = analyze('La expediente y el valorización llegaron tarde.', [rule]);
    expect(f.map((x) => x.suggestion)).toEqual(['El expediente', 'la valorización']);
  });
});

describe('preterite person endings', () => {
  it('fixes yo + third-person ending', () => {
    expect(fix('Yo presentó el informe.')).toBe('Yo presenté el informe.');
  });

  it('fixes él + first-person ending', () => {
    expect(fix('El cliente aprobé el adicional.')).toBe('El cliente aprobó el adicional.');
  });

  it('handles -ir verbs for yo', () => {
    expect(fix('Yo escribió el acta.')).toBe('Yo escribí el acta.');
  });

  it('leaves correct persons alone', () => {
    expect(ids('Yo presenté el informe y él lo aprobó.')).toEqual([]);
  });
});

describe('subjunctive in past narration', () => {
  it('flags subjunctive with a past marker and no trigger', () => {
    expect(fix('La semana pasada compremos el material.')).toBe(
      'La semana pasada compramos el material.',
    );
  });

  it('does not flag a licensed subjunctive', () => {
    expect(ids('La semana pasada el cliente pidió que entregáramos el cronograma.')).toEqual([]);
  });

  it('does not flag a hypothetical si-clause', () => {
    expect(ids('Ayer pensé que si tuviéramos más plazo, terminaríamos.')).toEqual([]);
  });

  it('ignores sentences with no past marker', () => {
    expect(ids('Ojalá compremos el material pronto.')).toEqual([]);
  });
});

describe('participio vs finite verb', () => {
  it('fixes haber + finite', () => {
    expect(fix('La obra ha avanzó un 20%.')).toBe('La obra ha avanzado un 20%.');
  });

  it('fixes estar + finite', () => {
    expect(fix('El presupuesto está aprobó.')).toBe('El presupuesto está aprobado.');
  });

  it('fixes a bare participle used as the main verb', () => {
    expect(fix('La obra avanzado un 20%.')).toBe('La obra avanzó un 20%.');
  });

  it('leaves correct perfect and adjectival uses alone', () => {
    expect(ids('La obra ha avanzado y el presupuesto está aprobado.')).toEqual([]);
  });
});

describe('después de', () => {
  it('inserts the missing de before a noun phrase', () => {
    expect(fix('Después la reunión firmamos.')).toBe('Después de la reunión firmamos.');
  });

  it('inserts de before an infinitive', () => {
    expect(fix('Te llamo después revisar el informe.')).toBe(
      'Te llamo después de revisar el informe.',
    );
  });

  it('accepts después de and después del', () => {
    expect(ids('Después del comité y después de revisar, firmamos.')).toEqual([]);
  });

  it('accepts bare adverbial después', () => {
    expect(ids('Revisamos los planos y después firmamos.')).toEqual([]);
  });
});

describe('por vs para for duration', () => {
  it('flags para + duration', () => {
    expect(fix('Trabajamos en el proyecto para tres meses.')).toBe(
      'Trabajamos en el proyecto por tres meses.',
    );
  });

  it('leaves para + deadline alone', () => {
    expect(ids('Necesito el informe para el viernes.')).toEqual([]);
  });
});

describe('reflexive pronouns', () => {
  it('flags a dropped pronoun after a modal', () => {
    expect(fix('Quiero relajar el fin de semana.')).toBe('Quiero relajarme el fin de semana.');
  });

  it('accepts both legal positions', () => {
    expect(ids('Quiero relajarme y me quiero reunir con el cliente.')).toEqual([]);
  });
});

describe('otro / otra', () => {
  it('drops the article', () => {
    expect(fix('El cliente pidió una otra vez el mismo cambio.')).toBe(
      'El cliente pidió otra vez el mismo cambio.',
    );
  });

  it('leaves el otro alone', () => {
    expect(ids('El otro contratista ya firmó.')).toEqual([]);
  });
});

describe('hace + time', () => {
  it('fixes postposed atrás', () => {
    expect(fix('Dos semanas atrás entregamos el expediente.')).toBe(
      'Hace dos semanas entregamos el expediente.',
    );
  });

  it('accepts hace + tiempo', () => {
    expect(ids('Hace dos semanas entregamos el expediente.')).toEqual([]);
  });
});

describe('ojalá / como si', () => {
  it('removes que after ojalá', () => {
    expect(fix('Ojalá que lleguen los materiales.')).toBe('Ojalá lleguen los materiales.');
  });

  it('inserts si after como', () => {
    expect(fix('Habla como fuera el residente.')).toBe('Habla como si fuera el residente.');
  });

  it('accepts the correct forms', () => {
    expect(ids('Ojalá lleguen. Habla como si fuera el residente.')).toEqual([]);
  });
});

describe('collocations', () => {
  it('inserts a after comenzar', () => {
    expect(fix('Comenzamos excavar el terreno.')).toBe('Comenzamos a excavar el terreno.');
  });

  it('turns seguir + infinitivo into a gerund', () => {
    expect(fix('Seguimos trabajar en la partida.')).toBe('Seguimos trabajando en la partida.');
  });

  it('accepts correct patterns', () => {
    expect(ids('Comenzamos a excavar y seguimos trabajando.')).toEqual([]);
  });
});

describe('clean professional text', () => {
  it('produces no findings on a well-formed paragraph', () => {
    const text =
      'Hace tres semanas presentamos el expediente técnico. El municipio lo observó y, después de ' +
      'levantar las observaciones, seguimos esperando la conformidad. El cronograma sigue vigente, ' +
      'aunque el tema del sobrecosto es un problema serio: la obra estuvo paralizada por dos semanas ' +
      'y ojalá el cliente apruebe el adicional antes del comité.';
    expect(ids(text)).toEqual([]);
  });

  it('finds every planted error in a messy paragraph', () => {
    const text =
      'La semana pasada compremos el material. Después la reunión, yo habló con el cliente y él ' +
      'pidé una otra vez el mismo cambio. La obra ha avanzó poco y trabajamos para dos meses en ' +
      'la misma partida. Seguimos trabajar y ojalá que el municipio responda. Dos semanas atrás ' +
      'la tema ya era una problema. Quiero relajar.';
    const found = new Set(ids(text));
    for (const rule of [
      'subj-in-past', 'despues-de', 'preterite-person', 'un-otro', 'participio-form',
      'para-duration', 'collocation', 'ojala-que', 'hace-ago', 'gender-ma', 'reflexive-drop',
    ]) {
      expect(found, `expected ${rule}`).toContain(rule);
    }
  });
});

describe('conjugator', () => {
  it('conjugates regular -ar verbs', () => {
    const c = conjugate('coordinar');
    expect(c['pretérito']).toEqual(['coordiné', 'coordinaste', 'coordinó', 'coordinamos', 'coordinaron']);
    expect(c.imperfecto[0]).toBe('coordinaba');
    expect(c.condicional[0]).toBe('coordinaría');
  });

  it('applies orthographic changes', () => {
    expect(conjugate('avanzar')['pretérito'][0]).toBe('avancé');
    expect(conjugate('entregar')['pretérito'][0]).toBe('entregué');
    expect(conjugate('licitar')['subjuntivo presente'][0]).toBe('licite');
  });

  it('uses irregular tables', () => {
    expect(conjugate('tener')['pretérito']).toEqual(['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvieron']);
    expect(conjugate('ser').imperfecto[3]).toBe('éramos');
    expect(conjugate('hacer')['subjuntivo imperfecto'][2]).toBe('hiciera');
  });

  it('uses contracted stems for the conditional and future', () => {
    expect(conjugate('poner').condicional[0]).toBe('pondría');
    expect(futureSimple('valer')[2]).toBe('valdrá');
    expect(futureSimple('coordinar')[0]).toBe('coordinaré');
  });

  it('accepts answers without accents but not wrong forms', () => {
    expect(isAccepted('coordine', 'coordiné')).toBe(true);
    expect(isAccepted('coordino', 'coordiné')).toBe(false);
    expect(isAccepted('ha', 'ha / hay')).toBe(true);
  });
});

describe('error status derivation', () => {
  const a = (sessionId: string, correct: boolean): Attempt => ({
    date: new Date().toISOString(), sessionId, correct, source: 'drill',
  });

  it('needs sustained accuracy across separate sessions to resolve', () => {
    // four correct, but all in one session — not resolved
    expect(deriveStatus([a('s1', true), a('s1', true), a('s1', true), a('s1', true)], 'active'))
      .not.toBe('resolved');
    expect(deriveStatus([a('s1', true), a('s2', true), a('s3', true), a('s4', true)], 'active'))
      .toBe('resolved');
  });

  it('pulls a resolved error back on a fresh mistake', () => {
    const history = [a('s1', true), a('s2', true), a('s3', true), a('s4', true), a('s5', false)];
    expect(deriveStatus(history, 'resolved')).not.toBe('resolved');
  });

  it('marks partial progress as improving', () => {
    expect(deriveStatus([a('s1', false), a('s2', true), a('s3', true), a('s4', true)], 'active'))
      .toBe('improving');
  });
});
