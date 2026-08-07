import type { Verb } from './conjugation';

/**
 * The verb lexicon.
 *
 * Chosen for this learner, not for Spanish: an infrastructure consultant in
 * Lima runs site meetings, chases approvals and argues about deadlines, so
 * `entregar`, `aprobar`, `vencer` and `plantear` earn their place ahead of
 * words a general course would teach first.
 *
 * Irregular forms are written out rather than derived. A rule that produces
 * `sabo` for `saber` is worse than no rule, and the verbs that break the
 * pattern are precisely the ones said most often — which is why they survived
 * irregular for a thousand years.
 */
export const VERBS: Verb[] = [
  /* ---------------------------------------------------------------- *
   * The irregular core. Every one of these is in the first hundred
   * words of any conversation, and all of them fight the rules.
   * ---------------------------------------------------------------- */
  {
    infinitive: 'ser',
    en: 'to be (essence)',
    frequency: 1,
    domain: 'general',
    participle: 'sido',
    gerund: 'siendo',
    irregular: {
      presente: { yo: 'soy', tú: 'eres', él: 'es', nosotros: 'somos', ellos: 'son' },
      preterito: { yo: 'fui', tú: 'fuiste', él: 'fue', nosotros: 'fuimos', ellos: 'fueron' },
      imperfecto: { yo: 'era', tú: 'eras', él: 'era', nosotros: 'éramos', ellos: 'eran' },
      subj_presente: { yo: 'sea', tú: 'seas', él: 'sea', nosotros: 'seamos', ellos: 'sean' },
      imperativo: { tú: 'sé' },
    },
  },
  {
    infinitive: 'estar',
    en: 'to be (state, location)',
    frequency: 1,
    domain: 'general',
    preteriteStem: 'estuv',
    irregular: {
      presente: { yo: 'estoy', tú: 'estás', él: 'está', nosotros: 'estamos', ellos: 'están' },
      subj_presente: { yo: 'esté', tú: 'estés', él: 'esté', nosotros: 'estemos', ellos: 'estén' },
    },
  },
  {
    infinitive: 'ir',
    en: 'to go',
    frequency: 1,
    domain: 'general',
    gerund: 'yendo',
    participle: 'ido',
    irregular: {
      presente: { yo: 'voy', tú: 'vas', él: 'va', nosotros: 'vamos', ellos: 'van' },
      // Identical to `ser` in the preterite. Context is the only disambiguator,
      // and it always suffices.
      preterito: { yo: 'fui', tú: 'fuiste', él: 'fue', nosotros: 'fuimos', ellos: 'fueron' },
      imperfecto: { yo: 'iba', tú: 'ibas', él: 'iba', nosotros: 'íbamos', ellos: 'iban' },
      subj_presente: { yo: 'vaya', tú: 'vayas', él: 'vaya', nosotros: 'vayamos', ellos: 'vayan' },
      imperativo: { tú: 've' },
    },
  },
  {
    infinitive: 'haber',
    en: 'to have (auxiliary) / there to be',
    frequency: 1,
    domain: 'general',
    futureStem: 'habr',
    preteriteStem: 'hub',
    irregular: {
      presente: { yo: 'he', tú: 'has', él: 'ha', nosotros: 'hemos', ellos: 'han' },
      subj_presente: { yo: 'haya', tú: 'hayas', él: 'haya', nosotros: 'hayamos', ellos: 'hayan' },
    },
  },
  {
    infinitive: 'tener',
    en: 'to have',
    frequency: 1,
    domain: 'general',
    stemChange: 'e>ie',
    yo: 'tengo',
    preteriteStem: 'tuv',
    futureStem: 'tendr',
    irregular: { imperativo: { tú: 'ten' } },
  },
  {
    infinitive: 'hacer',
    en: 'to do, to make',
    frequency: 1,
    domain: 'general',
    yo: 'hago',
    preteriteStem: 'hic',
    futureStem: 'har',
    participle: 'hecho',
    irregular: {
      // hice/hizo — the `c` softens to `z` before `o` to keep the /s/ sound.
      preterito: { él: 'hizo' },
      imperativo: { tú: 'haz' },
    },
  },
  {
    infinitive: 'poder',
    en: 'to be able to',
    frequency: 1,
    domain: 'general',
    stemChange: 'o>ue',
    preteriteStem: 'pud',
    futureStem: 'podr',
    gerund: 'pudiendo',
  },
  {
    infinitive: 'decir',
    en: 'to say, to tell',
    frequency: 1,
    domain: 'reunión',
    stemChange: 'e>i',
    yo: 'digo',
    preteriteStem: 'dij',
    futureStem: 'dir',
    participle: 'dicho',
    gerund: 'diciendo',
    irregular: {
      // A `j` stem drops the `i` of `-ieron`: dijeron, not dijieron.
      preterito: { ellos: 'dijeron' },
      imperativo: { tú: 'di' },
    },
  },
  {
    infinitive: 'ver',
    en: 'to see',
    frequency: 1,
    domain: 'general',
    yo: 'veo',
    participle: 'visto',
    irregular: {
      preterito: { yo: 'vi', tú: 'viste', él: 'vio', nosotros: 'vimos', ellos: 'vieron' },
      imperfecto: { yo: 'veía', tú: 'veías', él: 'veía', nosotros: 'veíamos', ellos: 'veían' },
    },
  },
  {
    infinitive: 'dar',
    en: 'to give',
    frequency: 1,
    domain: 'general',
    yo: 'doy',
    irregular: {
      preterito: { yo: 'di', tú: 'diste', él: 'dio', nosotros: 'dimos', ellos: 'dieron' },
      subj_presente: { yo: 'dé', tú: 'des', él: 'dé', nosotros: 'demos', ellos: 'den' },
    },
  },
  {
    infinitive: 'saber',
    en: 'to know (a fact)',
    frequency: 1,
    domain: 'general',
    yo: 'sé',
    preteriteStem: 'sup',
    futureStem: 'sabr',
    irregular: {
      subj_presente: { yo: 'sepa', tú: 'sepas', él: 'sepa', nosotros: 'sepamos', ellos: 'sepan' },
    },
  },
  {
    infinitive: 'querer',
    en: 'to want',
    frequency: 1,
    domain: 'general',
    stemChange: 'e>ie',
    preteriteStem: 'quis',
    futureStem: 'querr',
  },
  {
    infinitive: 'venir',
    en: 'to come',
    frequency: 1,
    domain: 'general',
    stemChange: 'e>ie',
    yo: 'vengo',
    preteriteStem: 'vin',
    futureStem: 'vendr',
    gerund: 'viniendo',
    irregular: { imperativo: { tú: 'ven' } },
  },
  {
    infinitive: 'poner',
    en: 'to put, to place',
    frequency: 2,
    domain: 'obra',
    yo: 'pongo',
    preteriteStem: 'pus',
    futureStem: 'pondr',
    participle: 'puesto',
    irregular: { imperativo: { tú: 'pon' } },
  },
  {
    infinitive: 'salir',
    en: 'to leave, to go out',
    frequency: 2,
    domain: 'general',
    yo: 'salgo',
    futureStem: 'saldr',
    irregular: { imperativo: { tú: 'sal' } },
  },
  {
    infinitive: 'traer',
    en: 'to bring',
    frequency: 2,
    domain: 'obra',
    yo: 'traigo',
    preteriteStem: 'traj',
    participle: 'traído',
    gerund: 'trayendo',
    irregular: { preterito: { ellos: 'trajeron' } },
  },

  /* ---------------------------------------------------------------- *
   * Site and project work.
   * ---------------------------------------------------------------- */
  { infinitive: 'entregar', en: 'to deliver, to hand over', frequency: 1, domain: 'obra' },
  { infinitive: 'revisar', en: 'to check, to review', frequency: 1, domain: 'obra' },
  { infinitive: 'aprobar', en: 'to approve', stemChange: 'o>ue', frequency: 1, domain: 'reunión' },
  { infinitive: 'firmar', en: 'to sign', frequency: 1, domain: 'reunión' },
  { infinitive: 'llegar', en: 'to arrive', frequency: 1, domain: 'general' },
  { infinitive: 'empezar', en: 'to begin', stemChange: 'e>ie', frequency: 1, domain: 'obra' },
  { infinitive: 'terminar', en: 'to finish', frequency: 1, domain: 'obra' },
  { infinitive: 'cumplir', en: 'to meet (a deadline), to comply', frequency: 1, domain: 'obra' },
  { infinitive: 'vencer', en: 'to expire, to fall due', frequency: 2, domain: 'reunión' },
  { infinitive: 'coordinar', en: 'to coordinate', frequency: 1, domain: 'reunión' },
  { infinitive: 'avisar', en: 'to notify, to let know', frequency: 1, domain: 'obra' },
  // «enviar» and «vaciar» stress the i of the stem, which then takes a written
  // accent in every form where the stem is stressed: «envío», not «envio».
  // There is no rule that predicts this from the spelling — «cambiar» and
  // «coordinar» look identical and do not do it — so the forms are listed.
  {
    infinitive: 'enviar',
    en: 'to send',
    frequency: 1,
    domain: 'reunión',
    irregular: {
      presente: { yo: 'envío', tú: 'envías', él: 'envía', nosotros: 'enviamos', ellos: 'envían' },
      subj_presente: { yo: 'envíe', tú: 'envíes', él: 'envíe', nosotros: 'enviemos', ellos: 'envíen' },
      imperativo: { tú: 'envía' },
    },
  },
  { infinitive: 'pagar', en: 'to pay', frequency: 1, domain: 'reunión' },
  { infinitive: 'plantear', en: 'to raise (a point), to put forward', frequency: 2, domain: 'reunión' },
  { infinitive: 'proponer', en: 'to propose', frequency: 2, domain: 'reunión', yo: 'propongo', preteriteStem: 'propus', futureStem: 'propondr', participle: 'propuesto' },
  { infinitive: 'resolver', en: 'to resolve, to settle', stemChange: 'o>ue', participle: 'resuelto', frequency: 2, domain: 'reunión' },
  { infinitive: 'volver', en: 'to return, to go back', stemChange: 'o>ue', participle: 'vuelto', frequency: 2, domain: 'general' },
  { infinitive: 'devolver', en: 'to give back, to return (something)', stemChange: 'o>ue', participle: 'devuelto', frequency: 3, domain: 'obra' },
  { infinitive: 'pedir', en: 'to ask for, to request', stemChange: 'e>i', frequency: 1, domain: 'reunión' },
  { infinitive: 'seguir', en: 'to continue, to follow', stemChange: 'e>i', yo: 'sigo', gerund: 'siguiendo', frequency: 1, domain: 'general' },
  { infinitive: 'conseguir', en: 'to obtain, to manage to', stemChange: 'e>i', yo: 'consigo', gerund: 'consiguiendo', frequency: 2, domain: 'obra' },
  { infinitive: 'entender', en: 'to understand', stemChange: 'e>ie', frequency: 1, domain: 'general' },
  { infinitive: 'perder', en: 'to lose, to miss', stemChange: 'e>ie', frequency: 2, domain: 'general' },
  { infinitive: 'cerrar', en: 'to close', stemChange: 'e>ie', frequency: 2, domain: 'obra' },
  { infinitive: 'contar', en: 'to count, to tell', stemChange: 'o>ue', frequency: 2, domain: 'general' },
  { infinitive: 'encontrar', en: 'to find', stemChange: 'o>ue', frequency: 2, domain: 'general' },
  { infinitive: 'mostrar', en: 'to show', stemChange: 'o>ue', frequency: 2, domain: 'reunión' },
  { infinitive: 'recordar', en: 'to remember, to remind', stemChange: 'o>ue', frequency: 2, domain: 'reunión' },
  { infinitive: 'construir', en: 'to build', yo: 'construyo', frequency: 1, domain: 'obra', irregular: { presente: { tú: 'construyes', él: 'construye', ellos: 'construyen' } } },
  { infinitive: 'incluir', en: 'to include', yo: 'incluyo', frequency: 2, domain: 'reunión', irregular: { presente: { tú: 'incluyes', él: 'incluye', ellos: 'incluyen' } } },
  { infinitive: 'leer', en: 'to read', frequency: 2, domain: 'general' },
  { infinitive: 'trabajar', en: 'to work', frequency: 1, domain: 'general' },
  { infinitive: 'hablar', en: 'to speak', frequency: 1, domain: 'general' },
  { infinitive: 'necesitar', en: 'to need', frequency: 1, domain: 'general' },
  { infinitive: 'buscar', en: 'to look for', frequency: 1, domain: 'general' },
  { infinitive: 'explicar', en: 'to explain', frequency: 1, domain: 'reunión' },
  { infinitive: 'verificar', en: 'to verify', frequency: 2, domain: 'obra' },
  { infinitive: 'ejecutar', en: 'to carry out, to execute', frequency: 2, domain: 'obra' },
  { infinitive: 'instalar', en: 'to install', frequency: 2, domain: 'obra' },
  { infinitive: 'medir', en: 'to measure', stemChange: 'e>i', frequency: 2, domain: 'obra' },
  { infinitive: 'reducir', en: 'to reduce', yo: 'reduzco', preteriteStem: 'reduj', frequency: 2, domain: 'reunión', irregular: { preterito: { ellos: 'redujeron' } } },
  { infinitive: 'producir', en: 'to produce', yo: 'produzco', preteriteStem: 'produj', frequency: 3, domain: 'obra', irregular: { preterito: { ellos: 'produjeron' } } },
  { infinitive: 'conocer', en: 'to know (a person, a place)', yo: 'conozco', frequency: 1, domain: 'general' },
  { infinitive: 'ofrecer', en: 'to offer', yo: 'ofrezco', frequency: 2, domain: 'reunión' },
  { infinitive: 'escribir', en: 'to write', participle: 'escrito', frequency: 2, domain: 'reunión' },
  { infinitive: 'abrir', en: 'to open', participle: 'abierto', frequency: 2, domain: 'obra' },
  { infinitive: 'cubrir', en: 'to cover', participle: 'cubierto', frequency: 3, domain: 'obra' },
  { infinitive: 'romper', en: 'to break', participle: 'roto', frequency: 3, domain: 'obra' },
  { infinitive: 'dormir', en: 'to sleep', stemChange: 'o>ue', frequency: 3, domain: 'general' },
  { infinitive: 'sentir', en: 'to feel, to regret', stemChange: 'e>ie', frequency: 2, domain: 'general' },
  { infinitive: 'preferir', en: 'to prefer', stemChange: 'e>ie', frequency: 2, domain: 'reunión' },
  { infinitive: 'sugerir', en: 'to suggest', stemChange: 'e>ie', frequency: 2, domain: 'reunión' },
  { infinitive: 'exigir', en: 'to demand', yo: 'exijo', frequency: 2, domain: 'reunión' },
  { infinitive: 'dirigir', en: 'to direct, to manage', yo: 'dirijo', frequency: 3, domain: 'reunión' },
  { infinitive: 'llevar', en: 'to carry, to take', frequency: 1, domain: 'general' },
  { infinitive: 'dejar', en: 'to leave (behind), to let', frequency: 1, domain: 'general' },
  { infinitive: 'quedar', en: 'to remain, to be left', frequency: 1, domain: 'general' },
  { infinitive: 'pasar', en: 'to happen, to pass', frequency: 1, domain: 'general' },
  { infinitive: 'esperar', en: 'to wait, to hope', frequency: 1, domain: 'general' },
  { infinitive: 'considerar', en: 'to consider', frequency: 2, domain: 'reunión' },
  { infinitive: 'confirmar', en: 'to confirm', frequency: 1, domain: 'reunión' },
  { infinitive: 'retrasar', en: 'to delay', frequency: 2, domain: 'obra' },
  { infinitive: 'autorizar', en: 'to authorise', frequency: 2, domain: 'reunión' },
  { infinitive: 'presentar', en: 'to present, to submit', frequency: 1, domain: 'reunión' },
  { infinitive: 'contratar', en: 'to hire, to contract', frequency: 2, domain: 'reunión' },
  { infinitive: 'reparar', en: 'to repair', frequency: 2, domain: 'obra' },
  { infinitive: 'colocar', en: 'to place, to lay', frequency: 2, domain: 'obra' },
  {
    infinitive: 'vaciar',
    en: 'to pour (concrete), to empty',
    frequency: 2,
    domain: 'obra',
    irregular: {
      presente: { yo: 'vacío', tú: 'vacías', él: 'vacía', nosotros: 'vaciamos', ellos: 'vacían' },
      subj_presente: { yo: 'vacíe', tú: 'vacíes', él: 'vacíe', nosotros: 'vaciemos', ellos: 'vacíen' },
      imperativo: { tú: 'vacía' },
    },
  },
];

export const VERB_BY_INFINITIVE = new Map(VERBS.map((v) => [v.infinitive, v]));

/** Verbs a learner meets first — used to keep early drills from being obscure. */
export function coreVerbs(maxFrequency: 1 | 2 | 3 = 2): Verb[] {
  return VERBS.filter((v) => v.frequency <= maxFrequency);
}
