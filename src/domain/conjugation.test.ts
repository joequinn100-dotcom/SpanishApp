import { describe, expect, it } from 'vitest';
import {
  NO_FORM,
  PERSONS,
  TENSES,
  conjugate,
  fullTable,
  gerund,
  participle,
  type Tense,
} from './conjugation';
import { VERBS, VERB_BY_INFINITIVE } from './verbs';

/**
 * The engine's correctness is the entire guarantee.
 *
 * Everything else in Fluencia is verified by SPEC §5's panel because it is a
 * judgement call. A conjugation is not: «poder» in the first-person plural
 * present subjunctive is «podamos», full stop. So this suite replaces the
 * panel, and it has to be worth that — every expectation below is a form the
 * learner would be marked wrong for missing in the exam.
 */

const v = (inf: string) => VERB_BY_INFINITIVE.get(inf)!;
const forms = (inf: string, t: Tense) => conjugate(v(inf), t);

/** Assert a whole row at once: yo, tú, él, nosotros, ellos. */
function row(inf: string, t: Tense, expected: [string, string, string, string, string]) {
  const f = forms(inf, t);
  expect(PERSONS.map((p) => f[p]), `${inf} · ${t}`).toEqual(expected);
}

describe('regular verbs, every tense', () => {
  it('-ar: trabajar', () => {
    row('trabajar', 'presente', ['trabajo', 'trabajas', 'trabaja', 'trabajamos', 'trabajan']);
    row('trabajar', 'preterito', ['trabajé', 'trabajaste', 'trabajó', 'trabajamos', 'trabajaron']);
    row('trabajar', 'imperfecto', [
      'trabajaba',
      'trabajabas',
      'trabajaba',
      'trabajábamos',
      'trabajaban',
    ]);
    row('trabajar', 'futuro', [
      'trabajaré',
      'trabajarás',
      'trabajará',
      'trabajaremos',
      'trabajarán',
    ]);
    row('trabajar', 'condicional', [
      'trabajaría',
      'trabajarías',
      'trabajaría',
      'trabajaríamos',
      'trabajarían',
    ]);
    row('trabajar', 'subj_presente', [
      'trabaje',
      'trabajes',
      'trabaje',
      'trabajemos',
      'trabajen',
    ]);
    row('trabajar', 'subj_imperfecto', [
      'trabajara',
      'trabajaras',
      'trabajara',
      'trabajáramos',
      'trabajaran',
    ]);
  });

  it('-er: deber-shaped (romper)', () => {
    row('romper', 'presente', ['rompo', 'rompes', 'rompe', 'rompemos', 'rompen']);
    row('romper', 'preterito', ['rompí', 'rompiste', 'rompió', 'rompimos', 'rompieron']);
    row('romper', 'imperfecto', ['rompía', 'rompías', 'rompía', 'rompíamos', 'rompían']);
    row('romper', 'subj_presente', ['rompa', 'rompas', 'rompa', 'rompamos', 'rompan']);
  });

  it('-ir: cumplir', () => {
    row('cumplir', 'presente', ['cumplo', 'cumples', 'cumple', 'cumplimos', 'cumplen']);
    row('cumplir', 'preterito', ['cumplí', 'cumpliste', 'cumplió', 'cumplimos', 'cumplieron']);
    row('cumplir', 'subj_presente', ['cumpla', 'cumplas', 'cumpla', 'cumplamos', 'cumplan']);
    row('cumplir', 'subj_imperfecto', [
      'cumpliera',
      'cumplieras',
      'cumpliera',
      'cumpliéramos',
      'cumplieran',
    ]);
  });
});

describe('orthographic changes — the spelling protects the sound', () => {
  it('-gar hardens to -gu before e', () => {
    expect(forms('llegar', 'preterito').yo).toBe('llegué');
    row('llegar', 'subj_presente', ['llegue', 'llegues', 'llegue', 'lleguemos', 'lleguen']);
    expect(forms('pagar', 'preterito').yo).toBe('pagué');
    expect(forms('entregar', 'subj_presente').él).toBe('entregue');
  });

  it('-car hardens to -qu before e', () => {
    expect(forms('buscar', 'preterito').yo).toBe('busqué');
    row('buscar', 'subj_presente', ['busque', 'busques', 'busque', 'busquemos', 'busquen']);
    expect(forms('explicar', 'preterito').yo).toBe('expliqué');
    expect(forms('verificar', 'subj_presente').ellos).toBe('verifiquen');
  });

  it('-zar softens to -c before e', () => {
    expect(forms('empezar', 'preterito').yo).toBe('empecé');
    expect(forms('autorizar', 'subj_presente').él).toBe('autorice');
  });

  it('-ger and -gir soften to -j before a', () => {
    expect(forms('exigir', 'presente').yo).toBe('exijo');
    expect(forms('exigir', 'subj_presente').él).toBe('exija');
    expect(forms('dirigir', 'subj_presente').nosotros).toBe('dirijamos');
  });

  it('-cer after a consonant softens to -z before a', () => {
    expect(forms('vencer', 'presente').yo).toBe('venzo');
    expect(forms('vencer', 'subj_presente').él).toBe('venza');
  });

  it('-guir drops the u before a', () => {
    expect(forms('seguir', 'presente').yo).toBe('sigo');
    row('seguir', 'subj_presente', ['siga', 'sigas', 'siga', 'sigamos', 'sigan']);
  });

  it('i becomes y only where it is unstressed', () => {
    // «leyó» and «leyeron», but «leíste» — the y and the accent are two
    // different rules and an earlier version of this engine ran them together,
    // producing «leyste» and «construyste».
    row('leer', 'preterito', ['leí', 'leíste', 'leyó', 'leímos', 'leyeron']);
    expect(forms('leer', 'subj_imperfecto').yo).toBe('leyera');
    expect(gerund(v('leer'))).toBe('leyendo');
  });

  it('accents the hiatus after a strong vowel, but not after u', () => {
    // «leíste» has a hiatus and takes the accent; «construiste» is a diphthong
    // and does not. The difference is audible and both are marked wrong if
    // swapped.
    row('construir', 'preterito', [
      'construí',
      'construiste',
      'construyó',
      'construimos',
      'construyeron',
    ]);
  });

  it('treats gu and qu as digraphs, not as a stem ending in a vowel', () => {
    // The u is silent and spells the hard g. Reading it as a vowel turns
    // «consiguieron» into «consiguyeron», and then the whole imperfect
    // subjunctive of the verb goes with it.
    row('conseguir', 'preterito', [
      'conseguí',
      'conseguiste',
      'consiguió',
      'conseguimos',
      'consiguieron',
    ]);
    expect(forms('conseguir', 'subj_imperfecto').tú).toBe('consiguieras');
    expect(forms('seguir', 'preterito').ellos).toBe('siguieron');
    expect(forms('seguir', 'subj_imperfecto').nosotros).toBe('siguiéramos');
  });

  it('accents -iar verbs that stress the stem i', () => {
    // No rule predicts this: «cambiar» and «coordinar» look identical and do
    // not do it, so these are listed in the lexicon rather than derived.
    row('enviar', 'presente', ['envío', 'envías', 'envía', 'enviamos', 'envían']);
    row('vaciar', 'presente', ['vacío', 'vacías', 'vacía', 'vaciamos', 'vacían']);
    expect(forms('enviar', 'subj_presente').él).toBe('envíe');
  });
});

describe('stem changes — stressed syllables only', () => {
  it('e>ie everywhere but nosotros', () => {
    row('entender', 'presente', [
      'entiendo',
      'entiendes',
      'entiende',
      'entendemos',
      'entienden',
    ]);
    row('empezar', 'presente', ['empiezo', 'empiezas', 'empieza', 'empezamos', 'empiezan']);
  });

  it('o>ue everywhere but nosotros', () => {
    row('poder', 'presente', ['puedo', 'puedes', 'puede', 'podemos', 'pueden']);
    row('aprobar', 'presente', ['apruebo', 'apruebas', 'aprueba', 'aprobamos', 'aprueban']);
    row('volver', 'presente', ['vuelvo', 'vuelves', 'vuelve', 'volvemos', 'vuelven']);
  });

  it('lands on the last candidate vowel, so prefixes work', () => {
    // «encontrar» → «encuentro», not «uencontro». Working from the right is
    // what makes devolver and encontrar come out without a prefix special case.
    expect(forms('encontrar', 'presente').yo).toBe('encuentro');
    expect(forms('devolver', 'presente').yo).toBe('devuelvo');
    expect(forms('resolver', 'presente').ellos).toBe('resuelven');
  });

  it('does not touch the imperfect, which is regular for every verb but three', () => {
    row('poder', 'imperfecto', ['podía', 'podías', 'podía', 'podíamos', 'podían']);
    row('empezar', 'imperfecto', [
      'empezaba',
      'empezabas',
      'empezaba',
      'empezábamos',
      'empezaban',
    ]);
  });

  it('-ir stem-changers raise in the third-person preterite only', () => {
    row('pedir', 'preterito', ['pedí', 'pediste', 'pidió', 'pedimos', 'pidieron']);
    row('dormir', 'preterito', ['dormí', 'dormiste', 'durmió', 'dormimos', 'durmieron']);
    row('sentir', 'preterito', ['sentí', 'sentiste', 'sintió', 'sentimos', 'sintieron']);
  });

  it('-ir stem-changers raise in the nosotros subjunctive, where -ar and -er do not', () => {
    // The contrast that catches everyone: «podamos» keeps its o, «pidamos» does not.
    expect(forms('poder', 'subj_presente').nosotros).toBe('podamos');
    expect(forms('pedir', 'subj_presente').nosotros).toBe('pidamos');
    expect(forms('dormir', 'subj_presente').nosotros).toBe('durmamos');
    expect(forms('sentir', 'subj_presente').nosotros).toBe('sintamos');
  });

  it('raises the -ir gerund', () => {
    expect(gerund(v('pedir'))).toBe('pidiendo');
    expect(gerund(v('decir'))).toBe('diciendo');
    expect(gerund(v('seguir'))).toBe('siguiendo');
  });
});

describe('the strong preterite — stress on the stem, not the ending', () => {
  it('takes unaccented -e and -o', () => {
    // «tuve», not «tuvé». This single detail is most of what separates a
    // native-sounding preterite from a textbook one.
    row('tener', 'preterito', ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvieron']);
    row('estar', 'preterito', ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvieron']);
    row('poder', 'preterito', ['pude', 'pudiste', 'pudo', 'pudimos', 'pudieron']);
    row('poner', 'preterito', ['puse', 'pusiste', 'puso', 'pusimos', 'pusieron']);
    row('saber', 'preterito', ['supe', 'supiste', 'supo', 'supimos', 'supieron']);
    row('querer', 'preterito', ['quise', 'quisiste', 'quiso', 'quisimos', 'quisieron']);
    row('venir', 'preterito', ['vine', 'viniste', 'vino', 'vinimos', 'vinieron']);
  });

  it('drops the i of -ieron after a j stem', () => {
    // dijeron, not dijieron. Same for traer, decir, reducir, producir.
    expect(forms('decir', 'preterito').ellos).toBe('dijeron');
    expect(forms('traer', 'preterito').ellos).toBe('trajeron');
    expect(forms('reducir', 'preterito').ellos).toBe('redujeron');
    expect(forms('producir', 'preterito').ellos).toBe('produjeron');
  });

  it('handles hacer’s c→z before o', () => {
    row('hacer', 'preterito', ['hice', 'hiciste', 'hizo', 'hicimos', 'hicieron']);
  });
});

describe('the wholly irregular core', () => {
  it('ser', () => {
    row('ser', 'presente', ['soy', 'eres', 'es', 'somos', 'son']);
    row('ser', 'preterito', ['fui', 'fuiste', 'fue', 'fuimos', 'fueron']);
    row('ser', 'imperfecto', ['era', 'eras', 'era', 'éramos', 'eran']);
    row('ser', 'subj_presente', ['sea', 'seas', 'sea', 'seamos', 'sean']);
    row('ser', 'subj_imperfecto', ['fuera', 'fueras', 'fuera', 'fuéramos', 'fueran']);
  });

  it('ir — identical to ser in the preterite and past subjunctive', () => {
    row('ir', 'presente', ['voy', 'vas', 'va', 'vamos', 'van']);
    row('ir', 'preterito', ['fui', 'fuiste', 'fue', 'fuimos', 'fueron']);
    row('ir', 'imperfecto', ['iba', 'ibas', 'iba', 'íbamos', 'iban']);
    row('ir', 'subj_presente', ['vaya', 'vayas', 'vaya', 'vayamos', 'vayan']);
    expect(forms('ir', 'subj_imperfecto').nosotros).toBe('fuéramos');
  });

  it('estar carries its accents', () => {
    row('estar', 'presente', ['estoy', 'estás', 'está', 'estamos', 'están']);
    row('estar', 'subj_presente', ['esté', 'estés', 'esté', 'estemos', 'estén']);
  });

  it('ver keeps the e of its imperfect', () => {
    row('ver', 'imperfecto', ['veía', 'veías', 'veía', 'veíamos', 'veían']);
    row('ver', 'preterito', ['vi', 'viste', 'vio', 'vimos', 'vieron']);
  });

  it('dar and saber, whose subjunctives no rule derives', () => {
    row('dar', 'subj_presente', ['dé', 'des', 'dé', 'demos', 'den']);
    row('saber', 'subj_presente', ['sepa', 'sepas', 'sepa', 'sepamos', 'sepan']);
  });

  it('irregular future and conditional stems', () => {
    row('tener', 'futuro', ['tendré', 'tendrás', 'tendrá', 'tendremos', 'tendrán']);
    row('hacer', 'futuro', ['haré', 'harás', 'hará', 'haremos', 'harán']);
    row('poder', 'condicional', ['podría', 'podrías', 'podría', 'podríamos', 'podrían']);
    row('decir', 'futuro', ['diré', 'dirás', 'dirá', 'diremos', 'dirán']);
    row('salir', 'condicional', ['saldría', 'saldrías', 'saldría', 'saldríamos', 'saldrían']);
    row('venir', 'futuro', ['vendré', 'vendrás', 'vendrá', 'vendremos', 'vendrán']);
  });
});

describe('the imperfect subjunctive comes from the third-person plural preterite', () => {
  it.each([
    ['tener', 'tuvieran', 'tuviéramos'],
    ['poder', 'pudieran', 'pudiéramos'],
    ['hacer', 'hicieran', 'hiciéramos'],
    ['decir', 'dijeran', 'dijéramos'],
    ['pedir', 'pidieran', 'pidiéramos'],
    ['ser', 'fueran', 'fuéramos'],
    ['entregar', 'entregaran', 'entregáramos'],
  ])('%s', (inf, ellos, nosotros) => {
    const f = forms(inf, 'subj_imperfecto');
    expect(f.ellos).toBe(ellos);
    expect(f.nosotros).toBe(nosotros);
  });

  it('holds for every verb in the lexicon, with no exceptions anywhere', () => {
    // The claim the explanation makes to the learner, asserted rather than
    // asserted-in-prose: derive the stem mechanically and it always matches.
    for (const verb of VERBS) {
      const stem = conjugate(verb, 'preterito').ellos.replace(/ron$/, '');
      expect(conjugate(verb, 'subj_imperfecto').yo, verb.infinitive).toBe(`${stem}ra`);
    }
  });
});

describe('participles and compound tenses', () => {
  it('knows the irregular participles', () => {
    const cases: [string, string][] = [
      ['hacer', 'hecho'],
      ['decir', 'dicho'],
      ['ver', 'visto'],
      ['poner', 'puesto'],
      ['volver', 'vuelto'],
      ['resolver', 'resuelto'],
      ['devolver', 'devuelto'],
      ['escribir', 'escrito'],
      ['abrir', 'abierto'],
      ['cubrir', 'cubierto'],
      ['romper', 'roto'],
      ['proponer', 'propuesto'],
    ];
    for (const [inf, p] of cases) expect(participle(v(inf)), inf).toBe(p);
  });

  it('accents a participle whose stem ends in a vowel', () => {
    expect(participle(v('leer'))).toBe('leído');
    expect(participle(v('traer'))).toBe('traído');
  });

  it('builds every compound tense from haber plus the participle', () => {
    expect(forms('entregar', 'presente_perfecto').nosotros).toBe('hemos entregado');
    expect(forms('entregar', 'pluscuamperfecto').ellos).toBe('habían entregado');
    expect(forms('entregar', 'futuro_perfecto').nosotros).toBe('habremos entregado');
    expect(forms('entregar', 'condicional_compuesto').yo).toBe('habría entregado');
    expect(forms('entregar', 'subj_perfecto').ellos).toBe('hayan entregado');
    expect(forms('entregar', 'subj_pluscuamperfecto').nosotros).toBe('hubiéramos entregado');
  });

  it('uses the irregular participle in compounds too', () => {
    expect(forms('hacer', 'presente_perfecto').yo).toBe('he hecho');
    expect(forms('ver', 'pluscuamperfecto').nosotros).toBe('habíamos visto');
    expect(forms('escribir', 'subj_perfecto').él).toBe('haya escrito');
  });

  it('never agrees the participle after haber', () => {
    // «hemos revisado la valorización», never «revisada» — the error log has
    // this one, so the engine must not become a source of it. Asserted as
    // "the participle is byte-identical in every person" rather than by
    // looking at the final letter, because plenty of participles legitimately
    // end in -o («sido», «ido») and a suffix check would flag those.
    for (const verb of VERBS) {
      const p = participle(verb);
      const forms = conjugate(verb, 'presente_perfecto');
      for (const person of PERSONS) {
        expect(forms[person], `${verb.infinitive} ${person}`).toMatch(
          new RegExp(`^h\\S+ ${p}$`),
        );
      }
    }
  });
});

describe('the imperative', () => {
  it('tú affirmative is the bare third-person present', () => {
    expect(forms('revisar', 'imperativo').tú).toBe('revisa');
    expect(forms('entregar', 'imperativo').tú).toBe('entrega');
    expect(forms('cumplir', 'imperativo').tú).toBe('cumple');
  });

  it('knows the eight irregular tú imperatives', () => {
    const cases: [string, string][] = [
      ['tener', 'ten'],
      ['venir', 'ven'],
      ['poner', 'pon'],
      ['salir', 'sal'],
      ['hacer', 'haz'],
      ['decir', 'di'],
      ['ir', 've'],
      ['ser', 'sé'],
    ];
    for (const [inf, imp] of cases) expect(forms(inf, 'imperativo').tú, inf).toBe(imp);
  });

  it('usted and ustedes are the subjunctive', () => {
    expect(forms('revisar', 'imperativo').él).toBe('revise');
    expect(forms('revisar', 'imperativo').ellos).toBe('revisen');
    expect(forms('seguir', 'imperativo').ellos).toBe('sigan');
  });

  it('has no first-person form, and does not invent one', () => {
    // You cannot order yourself. Printing the subjunctive in that slot would
    // invent a form, and the drill generator would then ask for it.
    expect(forms('coordinar', 'imperativo').yo).toBe(NO_FORM);
    expect(forms('coordinar', 'imperativo_negativo').yo).toBe(NO_FORM);
  });

  it('the negative imperative is always the subjunctive, even for tú', () => {
    // «no firmes», not «no firma» — the affirmative/negative asymmetry.
    expect(forms('firmar', 'imperativo').tú).toBe('firma');
    expect(forms('firmar', 'imperativo_negativo').tú).toBe('no firmes');
    expect(forms('hacer', 'imperativo_negativo').tú).toBe('no hagas');
    expect(forms('ir', 'imperativo_negativo').ellos).toBe('no vayan');
  });
});

describe('the whole lexicon, sanity', () => {
  it('produces a form for every verb in every tense and person', () => {
    for (const verb of VERBS) {
      const table = fullTable(verb);
      for (const t of TENSES) {
        for (const p of PERSONS) {
          const form = table[t.id][p];
          expect(form, `${verb.infinitive} ${t.id} ${p}`).toBeTruthy();
          expect(form, `${verb.infinitive} ${t.id} ${p}`).not.toMatch(/undefined|NaN/);
          // NO_FORM is legitimate only for the first-person imperative.
          if (form === NO_FORM) {
            expect(t.mood, `${verb.infinitive} ${t.id}`).toBe('imperativo');
            expect(p).toBe('yo');
          }
        }
      }
    }
  });

  it('never emits a vosotros form', () => {
    // CLAUDE.md: neutral Latin American Spanish, no vosotros, ever.
    for (const verb of VERBS) {
      const table = fullTable(verb);
      for (const t of TENSES) {
        for (const p of PERSONS) {
          expect(table[t.id][p], `${verb.infinitive} ${t.id}`).not.toMatch(/áis$|éis$|ís$|aos$/);
        }
      }
    }
  });

  it('has no duplicate infinitives', () => {
    const seen = new Set(VERBS.map((x) => x.infinitive));
    expect(seen.size).toBe(VERBS.length);
  });

  it('gives every verb an English gloss', () => {
    for (const verb of VERBS) expect(verb.en.length, verb.infinitive).toBeGreaterThan(2);
  });
});
