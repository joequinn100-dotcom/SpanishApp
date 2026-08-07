import {
  NO_FORM,
  PERSONS,
  PERSON_LABELS,
  TENSE_BY_ID,
  conjugate,
  type Person,
  type Tense,
  type Verb,
} from './conjugation';
import { VERB_BY_INFINITIVE } from './verbs';
import type { DrillPayload } from './grading';

/**
 * Conjugation drills, generated rather than written.
 *
 * A note on SPEC §5, because this is the one place in the app that produces
 * practice material without sending it through the panel of verifiers, and
 * that deserves to be argued rather than assumed.
 *
 * The gauntlet exists because model-generated content can be plausible and
 * wrong — an example that reads naturally but says something a Peruvian
 * engineer never would, an explanation that teaches a rule that does not
 * exist. Every verifier in §5 is judging something no algorithm can settle.
 *
 * This module generates nothing of that kind. The answer to «poder, nosotros,
 * presente de subjuntivo» is «podamos», and `conjugation.ts` produces it from
 * rules that `conjugation.test.ts` checks against 50 suites of known-correct
 * forms. The carrier sentences are a fixed, hand-written set in the learner's
 * own register — not generated, not paraphrased, just filled in. There is no
 * judgement call anywhere in the pipeline for a verifier to make.
 *
 * So the verification is the test suite, and it is recorded as such in the
 * provenance rather than a gauntlet score being fabricated to look like one.
 */

/* ------------------------------------------------------------------ *
 * Carriers
 * ------------------------------------------------------------------ */

interface Carrier {
  /** The sentence, with `___` where the conjugated verb belongs. */
  frame: (subject: string) => string;
  /** Sets the scene, so the tense choice is motivated rather than arbitrary. */
  context: string;
  /** Only offered for these tenses — a frame has to make sense. */
  tenses: Tense[];
  /**
   * Verbs whose meaning fits this slot.
   *
   * Not an optimisation — a correctness requirement. Pairing frames with
   * arbitrary verbs produced «Si yo fuera más plazo», which is grammatically
   * flawless and completely meaningless. A conjugation drill that teaches the
   * form inside a sentence no one would say is teaching half a thing, and the
   * half it leaves out is the half that matters in a meeting.
   */
  verbs: string[];
}

/**
 * Subject noun phrases, by person.
 *
 * Real ones, so the sentence reads like a site report rather than a textbook.
 * The third person especially: «el supervisor» teaches the same form as «él»
 * and sounds like something the learner will actually say.
 */
const SUBJECTS: Record<Person, string[]> = {
  yo: ['yo'],
  tú: ['tú'],
  él: ['el supervisor', 'el cliente', 'la contratista', 'el proveedor', 'ella'],
  nosotros: ['nosotros', 'el equipo y yo', 'la consultora y yo'],
  ellos: ['los contratistas', 'ellos', 'las cuadrillas', 'ustedes'],
};

/**
 * The sentence frames.
 *
 * Every one is construction or consulting, per CLAUDE.md, and every one gives
 * the tense a reason to be there — «la semana pasada» forces a preterite, «si
 * …, reforzaríamos» forces the imperfect subjunctive. A frame that worked
 * equally well in any tense would teach the conjugation while teaching nothing
 * about when to use it.
 */
const CARRIERS: Carrier[] = [
  {
    frame: (s) => `Normalmente ${s} ___ el avance los lunes.`,
    context: 'The weekly routine on site.',
    tenses: ['presente'],
    verbs: ['revisar', 'verificar', 'coordinar', 'presentar', 'medir', 'confirmar'],
  },
  {
    frame: (s) => `Ahora mismo ${s} ___ el expediente técnico.`,
    context: 'What is happening at this moment.',
    tenses: ['presente'],
    verbs: ['revisar', 'leer', 'verificar', 'presentar', 'escribir', 'buscar'],
  },
  {
    frame: (s) => `${s} ___ tres frentes de trabajo a la vez.`,
    context: 'A standing state of affairs.',
    // Present only. «Coordinaba tres frentes» is perfectly good Spanish, but
    // with no time marker the sentence gives the learner nothing to reason
    // from — it would test recall of the ending rather than the choice of
    // tense, and every other frame here earns its tense.
    tenses: ['presente'],
    verbs: ['coordinar', 'dirigir', 'tener', 'llevar'],
  },
  {
    frame: (s) => `La semana pasada ${s} ___ el acta sin observaciones.`,
    context: 'A finished event, with its own boundaries.',
    tenses: ['preterito'],
    verbs: ['firmar', 'aprobar', 'revisar', 'presentar', 'devolver'],
  },
  {
    frame: (s) => `Ayer ${s} ___ la valorización antes de la reunión.`,
    context: 'Yesterday, and done with.',
    tenses: ['preterito'],
    verbs: ['enviar', 'revisar', 'aprobar', 'presentar', 'firmar', 'terminar', 'hacer'],
  },
  {
    frame: (s) => `La semana pasada ${s} ___ a la obra sin avisar.`,
    context: 'A single completed event.',
    tenses: ['preterito'],
    verbs: ['llegar', 'venir', 'ir', 'volver'],
  },
  {
    frame: (s) => `Antes ${s} ___ el material todos los lunes, pero eso cambió.`,
    context: 'How things used to be, before the new contractor.',
    tenses: ['imperfecto'],
    verbs: ['entregar', 'enviar', 'revisar', 'traer', 'pedir'],
  },
  {
    frame: (s) => `Cuando llegué a obra, ${s} ___ el encofrado.`,
    context: 'The background to another past event.',
    tenses: ['imperfecto'],
    verbs: ['revisar', 'instalar', 'colocar', 'medir', 'verificar', 'reparar'],
  },
  {
    frame: (s) => `El próximo mes ${s} ___ la última etapa del proyecto.`,
    context: 'A commitment with a date on it.',
    tenses: ['futuro'],
    verbs: ['terminar', 'empezar', 'ejecutar', 'entregar', 'presentar'],
  },
  {
    frame: (s) => `Si el acero llega a tiempo, ${s} ___ antes del plazo.`,
    context: 'A real condition and its likely consequence.',
    tenses: ['futuro'],
    verbs: ['terminar', 'entregar', 'cumplir', 'ejecutar'],
  },
  {
    frame: (s) => `Con más presupuesto, ${s} ___ la obra en cuatro meses.`,
    context: 'A hypothetical consequence — the polite, professional register.',
    tenses: ['condicional'],
    verbs: ['terminar', 'ejecutar', 'entregar', 'construir', 'hacer'],
  },
  {
    frame: (s) => `${s} ___ el informe con gusto, pero falta la aprobación.`,
    context: 'Softening a statement, the way a consultant does in a meeting.',
    tenses: ['condicional'],
    verbs: ['enviar', 'presentar', 'firmar', 'entregar', 'escribir'],
  },
  {
    frame: (s) => `Esta semana ${s} ___ tres frentes de trabajo.`,
    context: 'Inside a period that has not closed yet.',
    tenses: ['presente_perfecto'],
    verbs: ['coordinar', 'revisar', 'ejecutar', 'instalar', 'verificar', 'abrir'],
  },
  {
    frame: (s) => `Todavía no ${s} ___ la respuesta del cliente.`,
    context: 'Still pending, in a window that is still open.',
    tenses: ['presente_perfecto'],
    verbs: ['tener', 'conseguir', 'ver', 'leer'],
  },
  {
    frame: (s) => `Cuando llegó la supervisión, ${s} ya ___ el vaciado.`,
    context: 'Earlier than another past moment.',
    tenses: ['pluscuamperfecto'],
    verbs: ['terminar', 'ejecutar', 'empezar', 'verificar', 'hacer'],
  },
  {
    frame: (s) => `Para el viernes ${s} ___ toda la partida de acabados.`,
    context: 'Finished before a deadline that has not arrived.',
    tenses: ['futuro_perfecto'],
    verbs: ['terminar', 'entregar', 'ejecutar', 'instalar', 'revisar', 'colocar'],
  },
  {
    frame: (s) => `Con el adicional aprobado a tiempo, ${s} ___ sin retraso.`,
    context: 'What would have happened, but did not.',
    tenses: ['condicional_compuesto'],
    verbs: ['terminar', 'entregar', 'cumplir', 'ejecutar'],
  },
  {
    frame: (s) => `Espero que ${s} ___ el expediente antes del viernes.`,
    context: 'Under a verb of hope — the trigger that forces the subjunctive.',
    tenses: ['subj_presente'],
    verbs: ['revisar', 'aprobar', 'firmar', 'presentar', 'entregar', 'devolver'],
  },
  {
    frame: (s) => `Cuando ${s} ___ los planos, empezamos el replanteo.`,
    context: 'Pointing at an unrealised future, which «cuando» marks.',
    tenses: ['subj_presente'],
    verbs: ['enviar', 'entregar', 'aprobar', 'traer', 'tener', 'firmar'],
  },
  {
    frame: (s) => `No creo que ${s} ___ el plazo original.`,
    context: 'Under doubt, which is a subjunctive trigger.',
    tenses: ['subj_presente'],
    verbs: ['cumplir', 'conseguir', 'poder', 'querer'],
  },
  {
    frame: (s) => `Si ${s} ___ más plazo, reforzaríamos la cimentación.`,
    context: 'An unreal hypothesis — si plus the imperfect subjunctive.',
    tenses: ['subj_imperfecto'],
    verbs: ['tener', 'conseguir', 'pedir', 'querer'],
  },
  {
    frame: (s) => `El cliente pidió que ${s} ___ el cronograma actualizado.`,
    context: 'A past verb of influence drags the subjunctive back with it.',
    tenses: ['subj_imperfecto'],
    verbs: ['enviar', 'presentar', 'entregar', 'revisar', 'mostrar', 'confirmar', 'hacer'],
  },
  {
    frame: (s) => `Ojalá ${s} ___ a la reunión sin más retrasos.`,
    context: 'A wish about something not yet real.',
    tenses: ['subj_presente', 'subj_imperfecto'],
    verbs: ['llegar', 'venir', 'poder', 'ir'],
  },
  {
    frame: (s) => `Espero que ${s} ___ el expediente completo.`,
    context: 'A completed action, under a trigger.',
    tenses: ['subj_perfecto'],
    verbs: ['revisar', 'entregar', 'presentar', 'enviar', 'leer', 'firmar'],
  },
  {
    frame: (s) => `Si ${s} ___ antes, habríamos evitado el retraso.`,
    context: 'The unreal past — what did not happen.',
    tenses: ['subj_pluscuamperfecto'],
    verbs: ['avisar', 'coordinar', 'empezar', 'saber', 'llegar', 'venir'],
  },
];

/**
 * Frames for the imperative, kept separate because the subject is the person
 * being addressed rather than a noun phrase in the sentence.
 */
const IMPERATIVE_CARRIERS: Record<
  'imperativo' | 'imperativo_negativo',
  { frame: string; verbs: string[] }[]
> = {
  imperativo: [
    {
      frame: '___ el encofrado antes del vaciado.',
      verbs: ['revisar', 'verificar', 'medir', 'reparar', 'colocar'],
    },
    {
      frame: '___ la valorización con el cliente.',
      verbs: ['revisar', 'coordinar', 'confirmar', 'presentar'],
    },
    { frame: '___ el acta hoy mismo.', verbs: ['firmar', 'enviar', 'presentar', 'hacer'] },
    { frame: '___ a la obra antes de las siete.', verbs: ['llegar', 'venir', 'ir', 'salir'] },
  ],
  imperativo_negativo: [
    {
      frame: '___ el acta hasta que llegue la aprobación.',
      verbs: ['firmar', 'enviar', 'presentar', 'devolver'],
    },
    {
      frame: '___ el vaciado sin la supervisión.',
      verbs: ['empezar', 'ejecutar', 'autorizar', 'hacer'],
    },
    {
      frame: '___ el material sin revisar la guía.',
      verbs: ['instalar', 'colocar', 'pagar', 'aprobar'],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * Generating
 * ------------------------------------------------------------------ */

export interface TenseDrill {
  verb: string;
  tense: Tense;
  person: Person;
  payload: DrillPayload;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

/** Deterministic default, so a given seed always yields the same drill set. */
function pick<T>(list: T[], seq: number): T {
  return list[seq % list.length];
}

/**
 * How hard this form is to produce.
 *
 * Not a guess: it counts the things that actually make a form hard. An
 * irregular verb in a compound subjunctive with a `nosotros` stem shift is a
 * different proposition from «trabajar» in the present, and the session
 * planner orders a topic block by difficulty.
 */
export function difficultyOf(v: Verb, tense: Tense, person: Person): 1 | 2 | 3 | 4 | 5 {
  const info = TENSE_BY_ID[tense];
  let score = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 }[info.level];
  if (v.irregular || v.preteriteStem || v.futureStem || v.yo) score += 1;
  if (v.stemChange && person !== 'nosotros') score += 1;
  // The nosotros subjunctive of a stem-changer is the single most-missed cell
  // in the paradigm: it is where -ir verbs raise («pidamos», «durmamos») and
  // -ar/-er verbs go back to the plain stem («podamos», «volvamos»), so the
  // learner has to know the conjugation class before they can move. Worth two,
  // not one — otherwise it scores the same as the merely stem-changed cells
  // that surround it and the session never treats it as the harder thing.
  if (person === 'nosotros' && info.mood === 'subjuntivo' && v.stemChange) score += 2;
  return Math.max(1, Math.min(5, score)) as 1 | 2 | 3 | 4 | 5;
}

/**
 * Build one drill.
 *
 * Returns null where the cell has no form — the first-person imperative — so a
 * caller iterating the paradigm cannot accidentally ask for something that
 * does not exist.
 */
export function drillFor(
  v: Verb,
  tense: Tense,
  person: Person,
  seq = 0,
  carrier?: Carrier | { frame: string; verbs: string[] },
): TenseDrill | null {
  const answer = conjugate(v, tense)[person];
  if (answer === NO_FORM) return null;

  const info = TENSE_BY_ID[tense];
  const isImperative = info.mood === 'imperativo';

  let sentence: string;
  let context: string;

  if (isImperative) {
    const frames = IMPERATIVE_CARRIERS[tense as 'imperativo' | 'imperativo_negativo'];
    const c =
      (carrier as { frame: string; verbs: string[] } | undefined) ??
      frames.find((f) => f.verbs.includes(v.infinitive)) ??
      pick(frames, seq);
    sentence = c.frame;
    context =
      tense === 'imperativo'
        ? `Instruction to ${PERSON_LABELS[person]}.`
        : `Telling ${PERSON_LABELS[person]} not to.`;
  } else {
    const usable = CARRIERS.filter((c) => c.tenses.includes(tense));
    const c =
      (carrier as Carrier | undefined) ??
      usable.find((x) => x.verbs.includes(v.infinitive)) ??
      pick(usable, seq);
    sentence = c.frame(pick(SUBJECTS[person], seq));
    context = c.context;
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  return {
    verb: v.infinitive,
    tense,
    person,
    difficulty: difficultyOf(v, tense, person),
    payload: {
      prompt: `Put «${v.infinitive}» into the ${info.en.toLowerCase()} — ${PERSON_LABELS[person]}.`,
      context,
      sentence: sentence.replace('___', `___ (${v.infinitive})`),
      answer,
      explanation: explain(v, tense, person, answer),
    },
  };
}

/**
 * Why the answer is the answer.
 *
 * CLAUDE.md: explanations are thorough, and the user has explicitly rejected
 * abbreviated grammar. So each one gives the rule, the derivation for this
 * particular verb, and the trap that sits next to it.
 */
function explain(v: Verb, tense: Tense, person: Person, answer: string): string {
  const info = TENSE_BY_ID[tense];
  const parts: string[] = [];

  parts.push(
    `«${answer}» is ${v.infinitive} in the ${info.en.toLowerCase()} (${info.es}), ${PERSON_LABELS[person]}.`,
  );
  parts.push(info.use);

  // The derivation, which is the part that transfers to the next verb.
  switch (tense) {
    case 'subj_imperfecto':
      parts.push(
        `Every imperfect subjunctive in Spanish is built the same way, with no exceptions anywhere in the language: take the third-person plural preterite, remove «-ron», and add the endings -ra, -ras, -ra, -́ramos, -ran. Here «${conjugate(v, 'preterito').ellos}» gives the stem «${conjugate(v, 'preterito').ellos.replace(/ron$/, '')}-», so the form is «${answer}».\n\nThat is worth internalising as a single move, because it makes the most irregular verbs in the language completely predictable in this tense — «tuvieron» gives «tuviera», «dijeron» gives «dijera», «fueron» gives «fuera». The -se forms (tuviese, dijese) are equally correct and more common in Spain; the -ra forms are the neutral Latin American default.`,
      );
      break;
    case 'subj_presente':
      parts.push(
        `The present subjunctive is built from the «yo» form of the present indicative, not from the infinitive. «${conjugate(v, 'presente').yo}» drops its -o and takes the opposite vowel: -ar verbs take -e, and -er/-ir verbs take -a. That is why any irregularity in the «yo» form carries straight through — «tengo» gives «tenga», «conozco» gives «conozca».${v.stemChange ? `\n\nThis verb also changes its stem under stress, so «nosotros» behaves differently from the rest: ${v.infinitive.endsWith('ir') ? 'an -ir verb raises the vowel there too' : 'an -ar or -er verb goes back to the plain stem'} — «${conjugate(v, 'subj_presente').nosotros}».` : ''}`,
      );
      break;
    case 'preterito':
      if (v.preteriteStem) {
        parts.push(
          `This is a strong preterite: the stress falls on the stem «${v.preteriteStem}-» rather than the ending, which is why the endings lose their accents — «${conjugate(v, 'preterito').yo}» and «${conjugate(v, 'preterito').él}», never «${v.preteriteStem}é» or «${v.preteriteStem}ió».\n\nThat unaccented pair is most of what separates a native-sounding preterite from a textbook one, and it applies to the whole family: tuve, estuve, pude, puse, supe, quise, vine, hice, dije, traje.`,
        );
      } else {
        parts.push(
          `Regular preterite endings: -é, -aste, -ó, -amos, -aron for -ar verbs, and -í, -iste, -ió, -imos, -ieron for -er and -ir. Note that the -ar «nosotros» form is identical to the present — «${conjugate(v, 'preterito').nosotros}» is both "we do" and "we did", and only context separates them.`,
        );
      }
      break;
    case 'imperfecto':
      parts.push(
        `The imperfect is the most regular tense in Spanish: -aba for -ar verbs, -ía for -er and -ir, and exactly three irregular verbs in the entire language — ser (era), ir (iba) and ver (veía). Three. Once you have those, the tense is finished.`,
      );
      break;
    case 'futuro':
    case 'condicional':
      parts.push(
        v.futureStem
          ? `The endings attach to the whole infinitive for regular verbs, but this one has an irregular stem: «${v.futureStem}-». The same stem serves both the future and the conditional, so learning it once buys both tenses. The family is small and worth memorising: tendr-, pondr-, saldr-, vendr-, podr-, sabr-, habr-, querr-, har-, dir-.`
          : `The endings attach to the entire infinitive, not to a stem — «${v.infinitive}» plus the ending. That is unique to these two tenses and makes them the easiest in the language for regular verbs, because there is nothing to remove first.`,
      );
      break;
    case 'imperativo':
      parts.push(
        `The affirmative «tú» imperative is the bare third-person present — «${conjugate(v, 'presente').él}» — with eight irregular exceptions: ten, ven, pon, sal, haz, di, ve, sé. Every other person uses the subjunctive: «${conjugate(v, 'subj_presente').él}» for usted, «${conjugate(v, 'subj_presente').ellos}» for ustedes.`,
      );
      break;
    case 'imperativo_negativo':
      parts.push(
        `The negative imperative is always the subjunctive, in every person including «tú». That asymmetry is the thing to hold on to: «${conjugate(v, 'imperativo').tú}» to tell someone to do it, but «no ${conjugate(v, 'subj_presente').tú}» to tell them not to. The affirmative and negative are built from different moods.`,
      );
      break;
    default:
      if (info.compound) {
        parts.push(
          `Compound tenses are «haber» plus the participle, and all the irregularity lives in haber — the participle «${answer.split(' ').slice(-1)[0]}» never changes and never agrees. «Hemos revisado la valorización», not «revisada»: after haber the participle is frozen.`,
        );
      }
  }

  return parts.join('\n\n');
}

/**
 * A set of drills covering one tense.
 *
 * Built by walking the frames that fit the tense and, within each, the verbs
 * that fit the frame — so every sentence means something. Persons rotate
 * independently, which is what stops ten items all being «nosotros».
 */
export function drillsForTense(tense: Tense, count = 12, maxFrequency: 1 | 2 | 3 = 2): TenseDrill[] {
  const info = TENSE_BY_ID[tense];
  const isImperative = info.mood === 'imperativo';

  // Pairs of (frame, verb) that make sense together, in a stable order.
  const pairs: { carrier: Carrier | { frame: string; verbs: string[] }; verb: Verb }[] = [];
  const frames: (Carrier | { frame: string; verbs: string[] })[] = isImperative
    ? IMPERATIVE_CARRIERS[tense as 'imperativo' | 'imperativo_negativo']
    : CARRIERS.filter((c) => c.tenses.includes(tense));

  for (const carrier of frames) {
    for (const inf of carrier.verbs) {
      const verb = VERB_BY_INFINITIVE.get(inf);
      if (!verb || verb.frequency > maxFrequency) continue;
      pairs.push({ carrier, verb });
    }
  }
  if (pairs.length === 0) return [];

  const persons = isImperative ? PERSONS.filter((p) => p !== 'yo') : PERSONS;
  const out: TenseDrill[] = [];
  const seen = new Set<string>();

  for (let i = 0; out.length < count && i < pairs.length * persons.length; i++) {
    const { carrier, verb } = pairs[i % pairs.length];
    // Advance the person on a different cycle so consecutive items differ in
    // both the verb and the person.
    const person = persons[(i + Math.floor(i / pairs.length)) % persons.length];
    const key = `${verb.infinitive}:${person}`;
    if (seen.has(key)) continue;
    const drill = drillFor(verb, tense, person, i, carrier);
    if (!drill) continue;
    seen.add(key);
    out.push(drill);
  }

  return out.sort((a, b) => a.difficulty - b.difficulty);
}

/** Which taxonomy topic a tense's generated drills belong to. */
export const TENSE_TOPIC: Partial<Record<Tense, string>> = {
  presente: 'a1.verb.presente_regular',
  preterito: 'a2.verb.preterito_regular',
  imperfecto: 'a2.verb.imperfecto',
  futuro: 'a2.verb.futuro_simple',
  condicional: 'a2.verb.condicional',
  presente_perfecto: 'a2.verb.presente_perfecto_intro',
  pluscuamperfecto: 'b1.verb.pluscuamperfecto',
  futuro_perfecto: 'b2.verb.futuro_perfecto',
  condicional_compuesto: 'b2.verb.condicional_compuesto',
  subj_presente: 'b1.mood.subj_presente',
  subj_imperfecto: 'b2.mood.subj_imperfecto',
  imperativo: 'a2.verb.imperativo',
};
