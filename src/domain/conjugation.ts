/**
 * The Spanish verb, conjugated.
 *
 * Pure, deterministic, and the reason this file is worth its length: conjugation
 * is the one part of the curriculum that is fully rule-governed. Everything else
 * in Fluencia — whether an example sounds natural, whether an explanation
 * teaches — needs SPEC §5's panel of verifiers because it is a judgement call.
 * A conjugation is not a judgement call. «poder» in the first-person plural
 * present subjunctive is «podamos», and a table either says so or is wrong.
 *
 * That matters practically. It means this module can generate unlimited correct
 * drills across every tense with no API key and no model in the loop, verified
 * by a test suite rather than by a panel — which is a stronger guarantee, not a
 * weaker one. The 25 verb topics in the taxonomy stop being empty.
 *
 * Coverage is the whole indicative and subjunctive, both imperatives, and the
 * non-finite forms. Neutral Latin American Spanish throughout: `vosotros` does
 * not exist here, and `ustedes` carries the plural second person, as CLAUDE.md
 * requires.
 */

/* ------------------------------------------------------------------ *
 * Shape
 * ------------------------------------------------------------------ */

/**
 * The persons, in table order.
 *
 * Five, not six. Latin American Spanish has no `vosotros`, and including a
 * column the learner must never produce would teach the Peninsular habit the
 * source books are full of — see CLAUDE.md on the register of the Read2Speak
 * material, which prints `estáis` in a conjugation table.
 */
export const PERSONS = ['yo', 'tú', 'él', 'nosotros', 'ellos'] as const;
export type Person = (typeof PERSONS)[number];

/** Human labels, with the `usted`/`ustedes` overlap spelled out. */
export const PERSON_LABELS: Record<Person, string> = {
  yo: 'yo',
  tú: 'tú',
  él: 'él / ella / usted',
  nosotros: 'nosotros',
  ellos: 'ellos / ellas / ustedes',
};

export type Tense =
  | 'presente'
  | 'preterito'
  | 'imperfecto'
  | 'futuro'
  | 'condicional'
  | 'presente_perfecto'
  | 'pluscuamperfecto'
  | 'futuro_perfecto'
  | 'condicional_compuesto'
  | 'subj_presente'
  | 'subj_imperfecto'
  | 'subj_perfecto'
  | 'subj_pluscuamperfecto'
  | 'imperativo'
  | 'imperativo_negativo';

export interface TenseInfo {
  id: Tense;
  /** What the app calls it in English. */
  en: string;
  /** What Lorena calls it. */
  es: string;
  mood: 'indicativo' | 'subjuntivo' | 'imperativo';
  /** Roughly where it sits on the CEFR ladder. */
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  /** Built from haber + participle. */
  compound: boolean;
  /** One line on when to reach for it, in the learner's own domain. */
  use: string;
}

export const TENSES: TenseInfo[] = [
  {
    id: 'presente',
    en: 'Present',
    es: 'Presente de indicativo',
    mood: 'indicativo',
    level: 'A1',
    compound: false,
    use: 'What is true now or habitually — «superviso tres obras», «el plazo vence el viernes». Also the near-certain future in speech: «mañana firmamos».',
  },
  {
    id: 'preterito',
    en: 'Preterite',
    es: 'Pretérito indefinido',
    mood: 'indicativo',
    level: 'A2',
    compound: false,
    use: 'A finished event with its own boundaries — «ayer vaciamos la losa», «el cliente aprobó el adicional». The tense of what happened.',
  },
  {
    id: 'imperfecto',
    en: 'Imperfect',
    es: 'Pretérito imperfecto',
    mood: 'indicativo',
    level: 'A2',
    compound: false,
    use: 'The background: what used to happen, what was going on, how things were. «Antes entregaban los lunes», «llovía cuando llegué».',
  },
  {
    id: 'futuro',
    en: 'Future',
    es: 'Futuro simple',
    mood: 'indicativo',
    level: 'A2',
    compound: false,
    use: 'Commitments and predictions — «entregaremos el 30». Also present probability, which surprises English speakers: «¿dónde estará el supervisor?» means "where can he be?", not "where will he be?".',
  },
  {
    id: 'condicional',
    en: 'Conditional',
    es: 'Condicional simple',
    mood: 'indicativo',
    level: 'A2',
    compound: false,
    use: 'The polite register of professional Spanish, and the one that most changes how you land in a meeting — «¿podría revisarlo?», «sería mejor esperar». Also the consequence half of a hypothesis.',
  },
  {
    id: 'presente_perfecto',
    en: 'Present perfect',
    es: 'Pretérito perfecto',
    mood: 'indicativo',
    level: 'A2',
    compound: true,
    use: 'A past event inside a period that has not closed — «esta semana hemos avanzado», «todavía no ha llegado el material».',
  },
  {
    id: 'pluscuamperfecto',
    en: 'Past perfect',
    es: 'Pretérito pluscuamperfecto',
    mood: 'indicativo',
    level: 'B1',
    compound: true,
    use: 'Earlier than another past moment — «cuando llegué, ya habían desencofrado». Orders two past events without a date.',
  },
  {
    id: 'futuro_perfecto',
    en: 'Future perfect',
    es: 'Futuro compuesto',
    mood: 'indicativo',
    level: 'B2',
    compound: true,
    use: 'Done before a deadline — «para el viernes habremos terminado». Also probability about the recent past: «ya habrá llegado».',
  },
  {
    id: 'condicional_compuesto',
    en: 'Conditional perfect',
    es: 'Condicional compuesto',
    mood: 'indicativo',
    level: 'B2',
    compound: true,
    use: 'What would have happened — «habríamos entregado a tiempo si el acero hubiera llegado». The consequence half of a past hypothesis.',
  },
  {
    id: 'subj_presente',
    en: 'Present subjunctive',
    es: 'Presente de subjuntivo',
    mood: 'subjuntivo',
    level: 'B1',
    compound: false,
    use: 'After wish, influence, doubt, emotion, and after «cuando» pointing at an unrealised future — «espero que apruebe», «cuando llegue el plano». The single biggest B2 gate.',
  },
  {
    id: 'subj_imperfecto',
    en: 'Imperfect subjunctive',
    es: 'Imperfecto de subjuntivo',
    mood: 'subjuntivo',
    level: 'B2',
    compound: false,
    use: 'Hypotheses and softened requests — «si tuviéramos más plazo, reforzaríamos», «quisiera plantear un punto». Formed from the third-person plural preterite, with no exceptions anywhere in the language.',
  },
  {
    id: 'subj_perfecto',
    en: 'Present perfect subjunctive',
    es: 'Pretérito perfecto de subjuntivo',
    mood: 'subjuntivo',
    level: 'B2',
    compound: true,
    use: 'A completed action under a trigger — «espero que hayan revisado el expediente», «no creo que haya llegado».',
  },
  {
    id: 'subj_pluscuamperfecto',
    en: 'Past perfect subjunctive',
    es: 'Pluscuamperfecto de subjuntivo',
    mood: 'subjuntivo',
    level: 'C1',
    compound: true,
    use: 'The unreal past — «si hubiéramos avisado antes…», «ojalá hubiera sabido». Pairs with the conditional perfect.',
  },
  {
    id: 'imperativo',
    en: 'Imperative',
    es: 'Imperativo afirmativo',
    mood: 'imperativo',
    level: 'A2',
    compound: false,
    use: 'Direct instruction — «revisa el encofrado», «revisen el expediente». On site it is normal and not rude; in an email, soften it to the conditional.',
  },
  {
    id: 'imperativo_negativo',
    en: 'Negative imperative',
    es: 'Imperativo negativo',
    mood: 'imperativo',
    level: 'B1',
    compound: false,
    use: 'Telling someone not to — «no firmes todavía», «no vacíen sin la aprobación». Always the subjunctive, which is why it is harder than the affirmative.',
  },
];

export const TENSE_BY_ID: Record<Tense, TenseInfo> = Object.fromEntries(
  TENSES.map((t) => [t.id, t]),
) as Record<Tense, TenseInfo>;

/* ------------------------------------------------------------------ *
 * The verb
 * ------------------------------------------------------------------ */

export interface Verb {
  infinitive: string;
  en: string;
  /**
   * Stem change in the *stressed* syllable: present indicative and subjunctive
   * everywhere except `nosotros`, which is unstressed on the stem.
   */
  stemChange?: 'e>ie' | 'o>ue' | 'e>i' | 'u>ue' | 'i>ie';
  /** Irregular first-person singular present, e.g. tener → tengo. */
  yo?: string;
  /** Irregular preterite stem + the endings that go with it, e.g. tuv-. */
  preteriteStem?: string;
  /** Irregular future/conditional stem, e.g. tendr-. */
  futureStem?: string;
  participle?: string;
  gerund?: string;
  /** Fully irregular forms that no rule produces. */
  irregular?: Partial<Record<Tense, Partial<Record<Person, string>>>>;
  /** Ranked for the domain: 1 = you will say this today. */
  frequency: 1 | 2 | 3;
  /** Where the learner is likely to meet it. */
  domain: 'obra' | 'reunión' | 'general';
}

/** Printed where a person has no form at all, e.g. the `yo` imperative. */
export const NO_FORM = '—';

const ACCENTS: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };

/** Strip an accent from a vowel. Needed when an ending adds its own stress. */
export function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function ending(inf: string): 'ar' | 'er' | 'ir' {
  const e = inf.slice(-2);
  if (e === 'ar' || e === 'er' || e === 'ir') return e;
  throw new Error(`Not an infinitive: ${inf}`);
}

function stemOf(inf: string): string {
  return inf.slice(0, -2);
}

/**
 * Apply a stem change to the last stressed vowel.
 *
 * The change lands on the *last* candidate vowel, not the first: «encontrar»
 * gives «encuentro», not «uencontro». Working from the right is what makes a
 * prefixed verb like «convertir» or «devolver» come out correctly without a
 * special case for every prefix.
 */
function applyStemChange(stem: string, change: NonNullable<Verb['stemChange']>): string {
  const [from, to] = change.split('>');
  const i = stem.lastIndexOf(from);
  if (i === -1) return stem;
  return stem.slice(0, i) + to + stem.slice(i + from.length);
}

/* ------------------------------------------------------------------ *
 * Orthography
 * ------------------------------------------------------------------ */

/**
 * Spanish spelling protects the *sound* of the stem, not its letters.
 *
 * `llegar` → `llegue`, because `llege` would be pronounced with a /x/. These are
 * not irregularities — the verb is regular and the spelling is doing its job —
 * but a generator that ignores them produces confident nonsense, and it is the
 * single most likely thing to be wrong in a naive conjugator.
 */
function hardenBeforeE(stem: string): string {
  if (stem.endsWith('g')) return `${stem}u`; // llegar  → llegue
  if (stem.endsWith('c')) return `${stem.slice(0, -1)}qu`; // marcar → marque
  if (stem.endsWith('z')) return `${stem.slice(0, -1)}c`; // empezar → empiece
  if (stem.endsWith('gu')) return `${stem.slice(0, -2)}gü`; // averiguar → averigüe
  return stem;
}

function softenBeforeA(stem: string): string {
  if (stem.endsWith('g') && !stem.endsWith('ng')) return `${stem.slice(0, -1)}j`; // proteger → proteja
  if (stem.endsWith('gu')) return `${stem.slice(0, -2)}g`; // seguir → siga
  if (stem.endsWith('qu')) return `${stem.slice(0, -2)}c`; // delinquir → delinca
  if (stem.endsWith('c') && !stem.endsWith('sc')) return `${stem.slice(0, -1)}z`; // vencer → venza
  return stem;
}

/**
 * What happens to `-i-` after a stem that ends in a vowel.
 *
 * Two different things, and conflating them is why an earlier version of this
 * produced «construyste». The `i` only becomes `y` when it is *unstressed* and
 * caught between vowels — that is `ió`, `ieron` and `iendo`, and nothing else.
 *
 * When the `i` is stressed it stays, and after a strong vowel (a, e, o) it
 * takes a written accent because the two vowels form a hiatus rather than a
 * diphthong: «leíste», «leímos». After `u` there is no hiatus and no accent:
 * «construiste», «construimos». The difference is audible, and both spellings
 * are marked wrong if swapped.
 */
function afterVowelStem(stem: string, suffix: string): string {
  // `gu` and `qu` are digraphs: the u is silent and spells the hard consonant,
  // so the stem does not end in a vowel at all. Without this, «conseguir»
  // becomes «consiguyeron» and «consiguyeras» — the u gets read as a vowel and
  // drags the following i into a y that has no business being there.
  if (/[gq]u$/.test(stem)) return suffix;
  if (!/[aeiouáéíóú]$/.test(stem)) return suffix;

  // Unstressed i between vowels → y.
  if (suffix.startsWith('ió') || suffix.startsWith('ie')) return `y${suffix.slice(1)}`;

  // Stressed i after a strong vowel takes the accent that marks the hiatus.
  if (suffix.startsWith('i') && /[aeo]$/.test(stem)) return `í${suffix.slice(1)}`;

  return suffix;
}

/* ------------------------------------------------------------------ *
 * Non-finite forms
 * ------------------------------------------------------------------ */

export function participle(v: Verb): string {
  if (v.participle) return v.participle;
  const stem = stemOf(v.infinitive);
  if (ending(v.infinitive) === 'ar') return `${stem}ado`;
  // A stem ending in a vowel takes an accent: leer → leído, caer → caído.
  if (/[aeo]$/.test(stem)) return `${stem}ído`;
  return `${stem}ido`;
}

export function gerund(v: Verb): string {
  if (v.gerund) return v.gerund;
  const stem = stemOf(v.infinitive);
  const e = ending(v.infinitive);
  if (e === 'ar') return `${stem}ando`;
  // -ir stem-changers raise the vowel in the gerund: pedir → pidiendo.
  const s = e === 'ir' && v.stemChange ? applyStemChange(stem, 'e>i' as const) : stem;
  const raised = e === 'ir' && v.stemChange === 'o>ue' ? applyStemChange(stem, 'o>u' as never) : s;
  const suffix = afterVowelStem(raised, 'iendo');
  return `${raised}${suffix}`;
}

/* ------------------------------------------------------------------ *
 * haber, which every compound tense is built on
 * ------------------------------------------------------------------ */

const HABER: Record<
  'presente' | 'imperfecto' | 'futuro' | 'condicional' | 'subj_presente' | 'subj_imperfecto',
  Record<Person, string>
> = {
  presente: { yo: 'he', tú: 'has', él: 'ha', nosotros: 'hemos', ellos: 'han' },
  imperfecto: {
    yo: 'había',
    tú: 'habías',
    él: 'había',
    nosotros: 'habíamos',
    ellos: 'habían',
  },
  futuro: { yo: 'habré', tú: 'habrás', él: 'habrá', nosotros: 'habremos', ellos: 'habrán' },
  condicional: {
    yo: 'habría',
    tú: 'habrías',
    él: 'habría',
    nosotros: 'habríamos',
    ellos: 'habrían',
  },
  subj_presente: { yo: 'haya', tú: 'hayas', él: 'haya', nosotros: 'hayamos', ellos: 'hayan' },
  subj_imperfecto: {
    yo: 'hubiera',
    tú: 'hubieras',
    él: 'hubiera',
    nosotros: 'hubiéramos',
    ellos: 'hubieran',
  },
};

const COMPOUND_AUX: Record<string, keyof typeof HABER> = {
  presente_perfecto: 'presente',
  pluscuamperfecto: 'imperfecto',
  futuro_perfecto: 'futuro',
  condicional_compuesto: 'condicional',
  subj_perfecto: 'subj_presente',
  subj_pluscuamperfecto: 'subj_imperfecto',
};

/* ------------------------------------------------------------------ *
 * Endings
 * ------------------------------------------------------------------ */

type Endings = Record<Person, string>;

const PRESENT: Record<'ar' | 'er' | 'ir', Endings> = {
  ar: { yo: 'o', tú: 'as', él: 'a', nosotros: 'amos', ellos: 'an' },
  er: { yo: 'o', tú: 'es', él: 'e', nosotros: 'emos', ellos: 'en' },
  ir: { yo: 'o', tú: 'es', él: 'e', nosotros: 'imos', ellos: 'en' },
};

const PRETERITE: Record<'ar' | 'er' | 'ir', Endings> = {
  ar: { yo: 'é', tú: 'aste', él: 'ó', nosotros: 'amos', ellos: 'aron' },
  er: { yo: 'í', tú: 'iste', él: 'ió', nosotros: 'imos', ellos: 'ieron' },
  ir: { yo: 'í', tú: 'iste', él: 'ió', nosotros: 'imos', ellos: 'ieron' },
};

/**
 * The strong preterite: a stressed stem with its own endings.
 *
 * Note `e` and `o` rather than `í` and `ió` — the stress falls on the stem, so
 * the ending loses its accent. «tuve», not «tuvé». This is the detail that
 * makes «estuve/estuvo» sound native and «estuví» sound like a textbook.
 */
const STRONG_PRETERITE: Endings = {
  yo: 'e',
  tú: 'iste',
  él: 'o',
  nosotros: 'imos',
  ellos: 'ieron',
};

const IMPERFECT: Record<'ar' | 'er' | 'ir', Endings> = {
  ar: { yo: 'aba', tú: 'abas', él: 'aba', nosotros: 'ábamos', ellos: 'aban' },
  er: { yo: 'ía', tú: 'ías', él: 'ía', nosotros: 'íamos', ellos: 'ían' },
  ir: { yo: 'ía', tú: 'ías', él: 'ía', nosotros: 'íamos', ellos: 'ían' },
};

const FUTURE: Endings = { yo: 'é', tú: 'ás', él: 'á', nosotros: 'emos', ellos: 'án' };
const CONDITIONAL: Endings = {
  yo: 'ía',
  tú: 'ías',
  él: 'ía',
  nosotros: 'íamos',
  ellos: 'ían',
};

const SUBJ_PRESENT: Record<'ar' | 'er' | 'ir', Endings> = {
  ar: { yo: 'e', tú: 'es', él: 'e', nosotros: 'emos', ellos: 'en' },
  er: { yo: 'a', tú: 'as', él: 'a', nosotros: 'amos', ellos: 'an' },
  ir: { yo: 'a', tú: 'as', él: 'a', nosotros: 'amos', ellos: 'an' },
};

/**
 * Imperfect-subjunctive endings.
 *
 * `-ra`, not `-iera`: the stem they attach to is the third-person plural
 * preterite with `-ron` removed, which already carries the theme vowel.
 * «cumplieron» → «cumplie-» → «cumpliera». Spelling the endings as `-iera`
 * would double it and produce «cumplieyera», and there is no verb anywhere in
 * the language for which that is right.
 */
const SUBJ_IMPERFECT: Endings = {
  yo: 'ra',
  tú: 'ras',
  él: 'ra',
  nosotros: 'ramos',
  ellos: 'ran',
};

/* ------------------------------------------------------------------ *
 * Conjugating
 * ------------------------------------------------------------------ */

/** Put a written accent on a stem's last vowel: `cumplie` → `cumplié`. */
function accentLastVowel(stem: string): string {
  for (let i = stem.length - 1; i >= 0; i--) {
    const accented = ACCENTS[stem[i]];
    if (accented) return stem.slice(0, i) + accented + stem.slice(i + 1);
  }
  return stem;
}

/**
 * The `nosotros` present-subjunctive stem, which is the awkward one.
 *
 * `nosotros` is unstressed on the stem, so an -ar or -er stem change must be
 * undone: «puedo» but «podamos», «vuelvo» but «volvamos». An -ir verb does the
 * opposite and raises instead — «pedimos» but «pidamos», «dormimos» but
 * «durmamos» — which is the contrast that catches every learner.
 *
 * Verbs with an irregular first person keep it throughout, because their
 * irregularity is in the consonant rather than the stressed vowel: «tengamos»,
 * «digamos», «conozcamos».
 */
function nosotrosSubjunctiveStem(v: Verb, yoStem: string, e: 'ar' | 'er' | 'ir'): string {
  if (v.yo) return yoStem;
  if (!v.stemChange) return yoStem;
  const plain = stemOf(v.infinitive);
  if (e === 'ir') {
    return applyStemChange(plain, v.stemChange === 'o>ue' ? ('o>u' as never) : ('e>i' as const));
  }
  return softenBeforeA(plain);
}

/** The third-person plural preterite, minus `-ron`. Everything else follows. */
function preteriteStem3p(v: Verb): string {
  const forms = conjugate(v, 'preterito');
  return forms.ellos.replace(/ron$/, '');
}

/** Present-subjunctive stem: the `yo` present, minus its `-o`. */
function subjunctiveStem(v: Verb): string | null {
  const yo = v.yo ?? conjugate(v, 'presente').yo;
  if (!yo.endsWith('o')) return null; // ser, ir, haber, saber, dar — all listed
  return yo.slice(0, -1);
}

/**
 * Conjugate one verb in one tense, across all five persons.
 *
 * Order of precedence is deliberate and is the whole correctness story: an
 * explicit irregular form wins over everything, then a listed irregular stem,
 * then the stem change, then the regular pattern with its spelling rules. A
 * generator that applied these the other way round would "regularise" the
 * irregulars and be wrong on exactly the verbs the learner most needs.
 */
export function conjugate(v: Verb, tense: Tense): Record<Person, string> {
  const explicit = v.irregular?.[tense];
  const out = {} as Record<Person, string>;

  // Compound tenses are haber + participle, and haber carries all the irregularity.
  const aux = COMPOUND_AUX[tense];
  if (aux) {
    const p = participle(v);
    for (const person of PERSONS) {
      out[person] = explicit?.[person] ?? `${HABER[aux][person]} ${p}`;
    }
    return out;
  }

  const inf = v.infinitive;
  const e = ending(inf);
  const stem = stemOf(inf);

  for (const person of PERSONS) {
    if (explicit?.[person]) {
      out[person] = explicit[person]!;
      continue;
    }
    out[person] = buildForm(v, tense, person, stem, e);
  }
  return out;
}

function buildForm(
  v: Verb,
  tense: Tense,
  person: Person,
  stem: string,
  e: 'ar' | 'er' | 'ir',
): string {
  // The stem change applies where the stem is stressed — everywhere but
  // `nosotros` — and only in the present-ish tenses.
  const stressed = person !== 'nosotros';
  const changed = v.stemChange && stressed ? applyStemChange(stem, v.stemChange) : stem;

  switch (tense) {
    case 'presente': {
      if (person === 'yo' && v.yo) return v.yo;
      // `-o` is a back vowel, so a stem ending in `c` softens to keep its /s/:
      // «vencer» → «venzo». Verbs whose first person is irregular in some
      // other way (conocer → conozco) carry it explicitly instead.
      if (person === 'yo' && e !== 'ar') return softenBeforeA(changed) + PRESENT[e].yo;
      return changed + PRESENT[e][person];
    }

    case 'imperfecto':
      // The most regular tense in the language: only ser, ir and ver deviate,
      // and all three are listed explicitly.
      return stem + IMPERFECT[e][person];

    case 'futuro':
      return (v.futureStem ?? v.infinitive) + FUTURE[person];

    case 'condicional':
      return (v.futureStem ?? v.infinitive) + CONDITIONAL[person];

    case 'preterito': {
      if (v.preteriteStem) return v.preteriteStem + STRONG_PRETERITE[person];
      if (e === 'ar') {
        // The `yo` ending is `-é`, which forces the same hardening the
        // subjunctive needs: «llegué», not «llegé».
        const s = person === 'yo' ? hardenBeforeE(stem) : stem;
        return s + PRETERITE.ar[person];
      }
      // -ir stem-changers raise in the third persons only: pidió, durmieron.
      const raised =
        e === 'ir' && v.stemChange && (person === 'él' || person === 'ellos')
          ? applyStemChange(stem, v.stemChange === 'o>ue' ? ('o>u' as never) : ('e>i' as const))
          : stem;
      const suffix = afterVowelStem(raised, PRETERITE[e][person]);
      return raised + suffix;
    }

    case 'subj_presente': {
      const base = subjunctiveStem(v);
      if (base === null) {
        // No `-o` first person to derive from; the verb must be listed
        // explicitly (ser, ir, haber, saber, dar — all of them are).
        return changed + SUBJ_PRESENT[e][person];
      }

      // The `yo` form already encodes every consonant irregularity the
      // subjunctive needs — «venzo» → «venza», «sigo» → «siga», «hago» →
      // «haga». Re-applying the softening rule here is what turned «hagas»
      // into «hajas»: the stem had already been corrected once.
      //
      // Hardening before `e` is still required, because `yo` ends in `-o` and
      // an -ar subjunctive ends in `-e`: «llego» → «llegue», not «llege».
      let s = person === 'nosotros' ? nosotrosSubjunctiveStem(v, base, e) : base;
      if (e === 'ar') s = hardenBeforeE(s);
      return s + SUBJ_PRESENT[e][person];
    }

    case 'subj_imperfecto': {
      const base = preteriteStem3p(v);
      // `nosotros` is the only form whose stress moves back onto the stem, so
      // it is the only one that takes a written accent: «cumpliéramos»,
      // «fuéramos», «entregáramos».
      if (person === 'nosotros') return accentLastVowel(base) + SUBJ_IMPERFECT.nosotros;
      return base + SUBJ_IMPERFECT[person];
    }

    case 'imperativo': {
      // `tú` is the bare third-person present; everything else is subjunctive.
      if (person === 'tú') {
        return v.irregular?.imperativo?.tú ?? conjugate(v, 'presente').él;
      }
      const subj = conjugate(v, 'subj_presente');
      if (person === 'él') return subj.él; // usted
      if (person === 'ellos') return subj.ellos; // ustedes
      if (person === 'nosotros') return subj.nosotros; // «revisemos» — let's
      // There is no first-person singular imperative: you cannot order
      // yourself. Printing the subjunctive here would invent a form and, worse,
      // the drill generator would then ask the learner to produce it.
      return NO_FORM;
    }

    case 'imperativo_negativo': {
      if (person === 'yo') return NO_FORM;
      const subj = conjugate(v, 'subj_presente');
      return `no ${subj[person]}`;
    }

    default:
      throw new Error(`Unhandled tense: ${tense}`);
  }
}

/** Every tense of one verb — what the reference table renders. */
export function fullTable(v: Verb): Record<Tense, Record<Person, string>> {
  return Object.fromEntries(TENSES.map((t) => [t.id, conjugate(v, t.id)])) as Record<
    Tense,
    Record<Person, string>
  >;
}

/**
 * Accent a vowel — used by the tests to build expectations readably, and by the
 * UI to highlight where the stress lands.
 */
export function accentuate(vowel: string): string {
  return ACCENTS[vowel] ?? vowel;
}
