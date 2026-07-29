/**
 * Conjugation engine for the verb-drill part of a session.
 * Covers the seven tenses currently on the syllabus.
 */

export const TENSES = [
  'presente',
  'pretérito',
  'imperfecto',
  'subjuntivo presente',
  'subjuntivo imperfecto',
  'condicional',
  'imperativo',
] as const;

export type Tense = (typeof TENSES)[number];

export const PERSONS = ['yo', 'tú', 'él/ella/usted', 'nosotros', 'ellos/ustedes'] as const;
export type Person = (typeof PERSONS)[number];

type Forms = Record<Tense, string[]>;

/** Irregular verbs held as explicit tables — no guessing on the ones that matter. */
const IRREGULAR: Record<string, Partial<Forms>> = {
  ser: {
    presente: ['soy', 'eres', 'es', 'somos', 'son'],
    'pretérito': ['fui', 'fuiste', 'fue', 'fuimos', 'fueron'],
    imperfecto: ['era', 'eras', 'era', 'éramos', 'eran'],
    'subjuntivo presente': ['sea', 'seas', 'sea', 'seamos', 'sean'],
    'subjuntivo imperfecto': ['fuera', 'fueras', 'fuera', 'fuéramos', 'fueran'],
    condicional: ['sería', 'serías', 'sería', 'seríamos', 'serían'],
    imperativo: ['—', 'sé', 'sea', 'seamos', 'sean'],
  },
  estar: {
    presente: ['estoy', 'estás', 'está', 'estamos', 'están'],
    'pretérito': ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvieron'],
    'subjuntivo presente': ['esté', 'estés', 'esté', 'estemos', 'estén'],
    'subjuntivo imperfecto': ['estuviera', 'estuvieras', 'estuviera', 'estuviéramos', 'estuvieran'],
    imperativo: ['—', 'está', 'esté', 'estemos', 'estén'],
  },
  ir: {
    presente: ['voy', 'vas', 'va', 'vamos', 'van'],
    'pretérito': ['fui', 'fuiste', 'fue', 'fuimos', 'fueron'],
    imperfecto: ['iba', 'ibas', 'iba', 'íbamos', 'iban'],
    'subjuntivo presente': ['vaya', 'vayas', 'vaya', 'vayamos', 'vayan'],
    'subjuntivo imperfecto': ['fuera', 'fueras', 'fuera', 'fuéramos', 'fueran'],
    condicional: ['iría', 'irías', 'iría', 'iríamos', 'irían'],
    imperativo: ['—', 've', 'vaya', 'vayamos', 'vayan'],
  },
  tener: {
    presente: ['tengo', 'tienes', 'tiene', 'tenemos', 'tienen'],
    'pretérito': ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvieron'],
    'subjuntivo presente': ['tenga', 'tengas', 'tenga', 'tengamos', 'tengan'],
    'subjuntivo imperfecto': ['tuviera', 'tuvieras', 'tuviera', 'tuviéramos', 'tuvieran'],
    condicional: ['tendría', 'tendrías', 'tendría', 'tendríamos', 'tendrían'],
    imperativo: ['—', 'ten', 'tenga', 'tengamos', 'tengan'],
  },
  hacer: {
    presente: ['hago', 'haces', 'hace', 'hacemos', 'hacen'],
    'pretérito': ['hice', 'hiciste', 'hizo', 'hicimos', 'hicieron'],
    'subjuntivo presente': ['haga', 'hagas', 'haga', 'hagamos', 'hagan'],
    'subjuntivo imperfecto': ['hiciera', 'hicieras', 'hiciera', 'hiciéramos', 'hicieran'],
    condicional: ['haría', 'harías', 'haría', 'haríamos', 'harían'],
    imperativo: ['—', 'haz', 'haga', 'hagamos', 'hagan'],
  },
  poder: {
    presente: ['puedo', 'puedes', 'puede', 'podemos', 'pueden'],
    'pretérito': ['pude', 'pudiste', 'pudo', 'pudimos', 'pudieron'],
    'subjuntivo presente': ['pueda', 'puedas', 'pueda', 'podamos', 'puedan'],
    'subjuntivo imperfecto': ['pudiera', 'pudieras', 'pudiera', 'pudiéramos', 'pudieran'],
    condicional: ['podría', 'podrías', 'podría', 'podríamos', 'podrían'],
    imperativo: ['—', '—', '—', '—', '—'],
  },
  poner: {
    presente: ['pongo', 'pones', 'pone', 'ponemos', 'ponen'],
    'pretérito': ['puse', 'pusiste', 'puso', 'pusimos', 'pusieron'],
    'subjuntivo presente': ['ponga', 'pongas', 'ponga', 'pongamos', 'pongan'],
    'subjuntivo imperfecto': ['pusiera', 'pusieras', 'pusiera', 'pusiéramos', 'pusieran'],
    condicional: ['pondría', 'pondrías', 'pondría', 'pondríamos', 'pondrían'],
    imperativo: ['—', 'pon', 'ponga', 'pongamos', 'pongan'],
  },
  decir: {
    presente: ['digo', 'dices', 'dice', 'decimos', 'dicen'],
    'pretérito': ['dije', 'dijiste', 'dijo', 'dijimos', 'dijeron'],
    'subjuntivo presente': ['diga', 'digas', 'diga', 'digamos', 'digan'],
    'subjuntivo imperfecto': ['dijera', 'dijeras', 'dijera', 'dijéramos', 'dijeran'],
    condicional: ['diría', 'dirías', 'diría', 'diríamos', 'dirían'],
    imperativo: ['—', 'di', 'diga', 'digamos', 'digan'],
  },
  venir: {
    presente: ['vengo', 'vienes', 'viene', 'venimos', 'vienen'],
    'pretérito': ['vine', 'viniste', 'vino', 'vinimos', 'vinieron'],
    'subjuntivo presente': ['venga', 'vengas', 'venga', 'vengamos', 'vengan'],
    'subjuntivo imperfecto': ['viniera', 'vinieras', 'viniera', 'viniéramos', 'vinieran'],
    condicional: ['vendría', 'vendrías', 'vendría', 'vendríamos', 'vendrían'],
    imperativo: ['—', 'ven', 'venga', 'vengamos', 'vengan'],
  },
  saber: {
    presente: ['sé', 'sabes', 'sabe', 'sabemos', 'saben'],
    'pretérito': ['supe', 'supiste', 'supo', 'supimos', 'supieron'],
    'subjuntivo presente': ['sepa', 'sepas', 'sepa', 'sepamos', 'sepan'],
    'subjuntivo imperfecto': ['supiera', 'supieras', 'supiera', 'supiéramos', 'supieran'],
    condicional: ['sabría', 'sabrías', 'sabría', 'sabríamos', 'sabrían'],
    imperativo: ['—', 'sabe', 'sepa', 'sepamos', 'sepan'],
  },
  querer: {
    presente: ['quiero', 'quieres', 'quiere', 'queremos', 'quieren'],
    'pretérito': ['quise', 'quisiste', 'quiso', 'quisimos', 'quisieron'],
    'subjuntivo presente': ['quiera', 'quieras', 'quiera', 'queramos', 'quieran'],
    'subjuntivo imperfecto': ['quisiera', 'quisieras', 'quisiera', 'quisiéramos', 'quisieran'],
    condicional: ['querría', 'querrías', 'querría', 'querríamos', 'querrían'],
    imperativo: ['—', 'quiere', 'quiera', 'queramos', 'quieran'],
  },
  ver: {
    presente: ['veo', 'ves', 've', 'vemos', 'ven'],
    'pretérito': ['vi', 'viste', 'vio', 'vimos', 'vieron'],
    imperfecto: ['veía', 'veías', 'veía', 'veíamos', 'veían'],
    'subjuntivo presente': ['vea', 'veas', 'vea', 'veamos', 'vean'],
    'subjuntivo imperfecto': ['viera', 'vieras', 'viera', 'viéramos', 'vieran'],
    imperativo: ['—', 've', 'vea', 'veamos', 'vean'],
  },
  dar: {
    presente: ['doy', 'das', 'da', 'damos', 'dan'],
    'pretérito': ['di', 'diste', 'dio', 'dimos', 'dieron'],
    'subjuntivo presente': ['dé', 'des', 'dé', 'demos', 'den'],
    'subjuntivo imperfecto': ['diera', 'dieras', 'diera', 'diéramos', 'dieran'],
    imperativo: ['—', 'da', 'dé', 'demos', 'den'],
  },
  haber: {
    presente: ['he', 'has', 'ha / hay', 'hemos', 'han'],
    'pretérito': ['hube', 'hubiste', 'hubo', 'hubimos', 'hubieron'],
    'subjuntivo presente': ['haya', 'hayas', 'haya', 'hayamos', 'hayan'],
    'subjuntivo imperfecto': ['hubiera', 'hubieras', 'hubiera', 'hubiéramos', 'hubieran'],
    condicional: ['habría', 'habrías', 'habría', 'habríamos', 'habrían'],
    imperativo: ['—', '—', '—', '—', '—'],
  },
  salir: {
    presente: ['salgo', 'sales', 'sale', 'salimos', 'salen'],
    'subjuntivo presente': ['salga', 'salgas', 'salga', 'salgamos', 'salgan'],
    condicional: ['saldría', 'saldrías', 'saldría', 'saldríamos', 'saldrían'],
    imperativo: ['—', 'sal', 'salga', 'salgamos', 'salgan'],
  },
  construir: {
    presente: ['construyo', 'construyes', 'construye', 'construimos', 'construyen'],
    'pretérito': ['construí', 'construiste', 'construyó', 'construimos', 'construyeron'],
    'subjuntivo presente': ['construya', 'construyas', 'construya', 'construyamos', 'construyan'],
    'subjuntivo imperfecto': [
      'construyera', 'construyeras', 'construyera', 'construyéramos', 'construyeran',
    ],
    imperativo: ['—', 'construye', 'construya', 'construyamos', 'construyan'],
  },
};

/** Irregular stems for future/conditional (the -R forms). */
const COND_STEM: Record<string, string> = {
  tener: 'tendr', poner: 'pondr', salir: 'saldr', venir: 'vendr', hacer: 'har',
  decir: 'dir', poder: 'podr', saber: 'sabr', querer: 'querr', haber: 'habr',
  valer: 'valdr', caber: 'cabr',
};

const PRET_STEM: Record<string, string> = {
  andar: 'anduv', estar: 'estuv', tener: 'tuv', poder: 'pud', poner: 'pus',
  saber: 'sup', caber: 'cup', hacer: 'hic', querer: 'quis', venir: 'vin',
  decir: 'dij', traer: 'traj', conducir: 'conduj', producir: 'produj',
};

const PRET_IRREG_ENDINGS = ['e', 'iste', 'o', 'imos', 'ieron'];

function spellFix(stem: string, ending: string, infinitive: string): string {
  // orthographic changes: -car/-gar/-zar before e
  if (ending.startsWith('e') || ending.startsWith('é')) {
    if (infinitive.endsWith('car')) return stem.replace(/c$/, 'qu') + ending;
    if (infinitive.endsWith('gar')) return stem + 'u' + ending;
    if (infinitive.endsWith('zar')) return stem.replace(/z$/, 'c') + ending;
  }
  return stem + ending;
}

export function conjugate(infinitive: string): Forms {
  const v = infinitive.trim().toLowerCase().replace(/(me|te|se|nos)$/, '');
  const stem = v.slice(0, -2);
  const type = v.slice(-2) as 'ar' | 'er' | 'ir';
  const isAr = type === 'ar';
  const e = (a: string[], b: string[]) => (isAr ? a : b);

  const base: Forms = {
    presente: e(
      ['o', 'as', 'a', 'amos', 'an'],
      type === 'er'
        ? ['o', 'es', 'e', 'emos', 'en']
        : ['o', 'es', 'e', 'imos', 'en'],
    ).map((end) => stem + end),
    'pretérito': PRET_STEM[v]
      ? PRET_IRREG_ENDINGS.map(
          (end) =>
            PRET_STEM[v] +
            (['decir', 'traer', 'conducir', 'producir'].includes(v) && end === 'ieron'
              ? 'eron'
              : end),
        )
      : isAr
        ? ['é', 'aste', 'ó', 'amos', 'aron'].map((end) => spellFix(stem, end, v))
        : ['í', 'iste', 'ió', 'imos', 'ieron'].map((end) => stem + end),
    imperfecto: e(
      ['aba', 'abas', 'aba', 'ábamos', 'aban'],
      ['ía', 'ías', 'ía', 'íamos', 'ían'],
    ).map((end) => stem + end),
    'subjuntivo presente': e(
      ['e', 'es', 'e', 'emos', 'en'],
      ['a', 'as', 'a', 'amos', 'an'],
    ).map((end) => spellFix(stem, end, v)),
    'subjuntivo imperfecto': (PRET_STEM[v]
      ? ['iera', 'ieras', 'iera', 'iéramos', 'ieran'].map((end) => PRET_STEM[v] + end)
      : isAr
        ? ['ara', 'aras', 'ara', 'áramos', 'aran'].map((end) => stem + end)
        : ['iera', 'ieras', 'iera', 'iéramos', 'ieran'].map((end) => stem + end)),
    condicional: ['ía', 'ías', 'ía', 'íamos', 'ían'].map(
      (end) => (COND_STEM[v] ?? v) + end,
    ),
    imperativo: [
      '—',
      isAr ? stem + 'a' : stem + 'e',
      spellFix(stem, isAr ? 'e' : 'a', v),
      spellFix(stem, isAr ? 'emos' : 'amos', v),
      spellFix(stem, isAr ? 'en' : 'an', v),
    ],
  };

  const irr = IRREGULAR[v];
  if (irr) {
    for (const t of TENSES) {
      if (irr[t]) base[t] = irr[t] as string[];
    }
  }
  return base;
}

/** Future simple — kept separate because it is on the "resolved" list as maintenance. */
export function futureSimple(infinitive: string): string[] {
  const v = infinitive.trim().toLowerCase();
  const stem = COND_STEM[v] ?? v;
  return ['é', 'ás', 'á', 'emos', 'án'].map((end) => stem + end);
}

/** Verbs drawn from the user's professional world. */
export const DRILL_VERBS = [
  'coordinar', 'supervisar', 'ejecutar', 'presupuestar', 'licitar', 'negociar',
  'entregar', 'avanzar', 'construir', 'aprobar', 'revisar', 'cumplir',
  'tener', 'ser', 'estar', 'hacer', 'poder', 'poner', 'decir', 'venir',
  'saber', 'querer', 'ir', 'ver', 'dar', 'salir', 'exigir', 'incumplir',
  'subcontratar', 'valorizar', 'replantear', 'sustentar',
];

export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isAccepted(given: string, expected: string): boolean {
  if (!given.trim()) return false;
  const g = normalizeAnswer(given);
  return expected
    .split('/')
    .map((x) => normalizeAnswer(x))
    .some((x) => x === g);
}

/** Was the answer right except for the written accent? Worth telling the user. */
export function accentOnly(given: string, expected: string): boolean {
  return (
    isAccepted(given, expected) &&
    !expected.split('/').map((s) => s.trim()).includes(given.trim().toLowerCase())
  );
}
