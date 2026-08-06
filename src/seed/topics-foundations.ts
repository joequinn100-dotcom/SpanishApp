import type { SeedTopic } from './types';

/**
 * A1–A2. Unit references are real: mapped against Read2Speak Foundations,
 * 15 units, verified by section index. Where the spine names a topic the book
 * does not cover, bookRef is null rather than a guess.
 *
 * These are below the learner's working level and seed as reference/maintenance
 * material — they exist so the prerequisite graph is complete and so search can
 * reach a foundation topic when a B2 error traces back to one.
 */
export const A_TOPICS: SeedTopic[] = [
  /* ---------------- A1 ---------------- */
  {
    id: 'a1.noun.genero',
    nameEn: 'Noun gender: basics',
    nameEs: 'El género del sustantivo',
    level: 'A1',
    strand: 'noun',
    summary:
      'Every Spanish noun is masculine or feminine, and that gender propagates to every article, adjective and pronoun that touches it. The -o/-a pattern covers most of the vocabulary but is a tendency, not a law: la mano, el día and the whole Greek -ma group break it. Learn each noun as article + noun, one unit, because gender is the single highest-volume error in this learner\'s log.',
    bookRef: 'Foundations U2',
    searchTerms: 'gender|género|masculine|feminine|el|la|masculino|femenino|noun gender',
  },
  {
    id: 'a1.noun.plurales',
    nameEn: 'Plurals',
    nameEs: 'El plural',
    level: 'A1',
    strand: 'noun',
    summary:
      'Nouns ending in a vowel add -s; nouns ending in a consonant add -es; nouns ending in -z change to -ces (el avance → los avances, la vez → las veces). Plural does not rescue a wrong gender — los problemas stays masculine.',
    bookRef: 'Foundations U2',
    searchTerms: 'plural|plurales|-s|-es|-ces',
  },
  {
    id: 'a1.noun.articulos',
    nameEn: 'Definite and indefinite articles',
    nameEs: 'Artículos definidos e indefinidos',
    level: 'A1',
    strand: 'noun',
    summary:
      'el/la/los/las mark something already identified; un/una/unos/unas introduce something new. Two contractions are obligatory: a + el = al, de + el = del. Spanish uses the definite article in places English drops it, notably with body parts and with abstract nouns.',
    bookRef: 'Foundations U2',
    searchTerms: 'article|artículo|el|la|un|una|del|al|definite|indefinite',
  },
  {
    id: 'a1.verb.presente_regular',
    nameEn: 'Present tense: regular -ar/-er/-ir',
    nameEs: 'Presente de indicativo regular',
    level: 'A1',
    strand: 'verb',
    summary:
      'Three conjugation families, one ending set each. The person is carried entirely by the ending, which is why Spanish drops subject pronouns freely — and why an ending slip changes who did the action rather than merely sounding wrong.',
    bookRef: 'Foundations U3',
    searchTerms: 'present|presente|-ar|-er|-ir|hablo|como|vivo|conjugation',
  },
  {
    id: 'a1.verb.ser_estar',
    nameEn: 'Ser vs. estar',
    nameEs: 'Ser y estar',
    level: 'A1',
    strand: 'verb',
    summary:
      'SER identifies, classifies and locates events; ESTAR gives a state, a position, or the result of a process. The "permanent vs. temporary" shortcut fails constantly at professional level — the workable split is category versus condition. With participles it becomes a live distinction on site: la obra está paralizada (current state) against la obra fue paralizada por el municipio (someone did it).',
    bookRef: 'Foundations U2',
    searchTerms: 'ser|estar|soy|estoy|es|está|to be|ser vs estar',
  },
  {
    id: 'a1.verb.hay',
    nameEn: 'Hay — existence',
    nameEs: 'Hay',
    level: 'A1',
    strand: 'verb',
    summary:
      'HAY states that something exists and is invariable: hay un problema, hay tres problemas. It is a form of haber, which is the same verb that builds the perfect tenses — keeping those two jobs apart is a B1 topic and a live error in this log.',
    bookRef: 'Foundations U2',
    searchTerms: 'hay|there is|there are|haber|existence|había|hubo',
  },
  {
    id: 'a1.verb.irregulares_core',
    nameEn: 'Core irregulars: tener, ir, hacer',
    nameEs: 'Irregulares fundamentales: tener, ir, hacer',
    level: 'A1',
    strand: 'verb',
    summary:
      'The three highest-frequency irregular verbs, each irregular in a different way: tener stem-changes and adds -go, ir is suppletive, hacer is -go plus an irregular preterite stem. They anchor dozens of fixed expressions (tener que, ir a, hacer falta).',
    bookRef: 'Foundations U3',
    searchTerms: 'tener|ir|hacer|tengo|voy|hago|irregular|irregulares',
  },
  {
    id: 'a1.verb.gustar',
    nameEn: 'Gustar-type verbs',
    nameEs: 'Verbos tipo gustar',
    level: 'A1',
    strand: 'verb',
    summary:
      'GUSTAR does not mean "to like" — it means "to be pleasing to", so the thing liked is the subject and the person is an indirect object: me gusta el diseño, me gustan los planos. The whole family works this way (interesar, faltar, quedar, doler, convenir), and misreading it produces the doler error in this log: le duele la rodilla, never se duele.',
    bookRef: 'Foundations U6',
    searchTerms: 'gustar|me gusta|encantar|interesar|faltar|doler|quedar|indirect object',
  },
  {
    id: 'a1.verb.ir_a_infinitivo',
    nameEn: 'Ir a + infinitive (near future)',
    nameEs: 'Ir a + infinitivo',
    level: 'A1',
    strand: 'verb',
    summary:
      'The everyday future across Latin America: voy a revisar los planos. It is more common in speech than the synthetic future, which drifts toward probability and formal register.',
    bookRef: 'Foundations U11',
    searchTerms: 'ir a|voy a|near future|futuro próximo|going to',
  },
  {
    id: 'a1.pron.sujeto',
    nameEn: 'Subject pronouns',
    nameEs: 'Pronombres de sujeto',
    level: 'A1',
    strand: 'pron',
    summary:
      'yo, tú, él/ella/usted, nosotros, ustedes, ellos. Normally omitted because the verb ending already carries the person — stating them is marked, used for contrast or emphasis. Note the register split this learner needs: usted/ustedes is the professional default in Peru, and the second-person plural familiar form used in Spain has no place in Latin American usage.',
    bookRef: 'Foundations U3',
    searchTerms: 'yo|tú|usted|nosotros|ustedes|subject pronoun|pronombre sujeto',
  },
  {
    id: 'a1.pron.reflexivos_basico',
    nameEn: 'Reflexive pronouns: basics',
    nameEs: 'Pronombres reflexivos',
    level: 'A1',
    strand: 'pron',
    summary:
      'me/te/se/nos attach to pronominal verbs and agree with the subject. The pronoun is part of the verb, not an optional extra — dropping it either breaks the sentence or changes its meaning (quedar vs. quedarse, acordar vs. acordarse de). This is an active error in the log.',
    bookRef: 'Foundations U3',
    searchTerms: 'reflexive|reflexivo|me|te|se|nos|levantarse|reunirse',
  },
  {
    id: 'a1.prep.basicas',
    nameEn: 'Basic prepositions: a, de, en, con',
    nameEs: 'Preposiciones básicas',
    level: 'A1',
    strand: 'prep',
    summary:
      'The four highest-frequency prepositions and their contractions (al, del). Most preposition errors at higher levels are not about these meanings but about which preposition a given verb demands — a fixed pairing that has to be learned with the verb.',
    bookRef: 'Foundations U4',
    searchTerms: 'a|de|en|con|preposition|preposición|al|del',
  },
  {
    id: 'a1.lex.numeros_tiempo',
    nameEn: 'Numbers, dates and telling time',
    nameEs: 'Números, fechas y la hora',
    level: 'A1',
    strand: 'lex',
    summary:
      'Cardinals, ordinals, dates and clock time — the substrate of every schedule, budget line and milestone this learner discusses professionally. Note the Latin American decimal and thousands convention, which is the opposite of the English one.',
    bookRef: 'Foundations U1',
    searchTerms: 'numbers|números|dates|fechas|hora|time|cardinal|ordinal',
  },
  {
    id: 'a1.syntax.preguntas',
    nameEn: 'Forming questions',
    nameEs: 'La interrogación',
    level: 'A1',
    strand: 'syntax',
    summary:
      'Yes/no questions rely on intonation and inverted punctuation rather than an auxiliary — there is no Spanish "do". Information questions use an accented interrogative (qué, cuál, dónde, cuándo, por qué, cómo, cuánto), and the accent is what distinguishes the question word from its relative twin.',
    bookRef: 'Foundations U4',
    searchTerms: 'questions|preguntas|qué|cuál|dónde|cuándo|por qué|cómo|interrogative',
  },
  {
    id: 'a1.lex.rutina',
    nameEn: 'Daily routine vocabulary',
    nameEs: 'La rutina diaria',
    level: 'A1',
    strand: 'lex',
    summary:
      'Everyday verbs and time expressions for describing a working day. Seeded for completeness of the graph; for this learner the useful version of this vocabulary is the site-day version, which lives in the professional strand.',
    bookRef: 'Foundations U3',
    searchTerms: 'routine|rutina|daily|diario|schedule',
  },

  /* ---------------- A2 ---------------- */
  {
    id: 'a2.verb.preterito_regular',
    nameEn: 'Preterite: regular forms and core irregulars',
    nameEs: 'Pretérito indefinido',
    level: 'A2',
    strand: 'verb',
    summary:
      'The tense that reports what happened. The two singular endings are minimal pairs separated only by the stressed vowel — hablé/habló, escribí/escribió — so a slip changes the subject of the sentence rather than merely sounding foreign. That confusion is a severity-5 error in this log.',
    bookRef: 'Foundations U9',
    searchTerms: 'preterite|pretérito|indefinido|hablé|habló|past|pasado|hice|fui|tuve',
  },
  {
    id: 'a2.verb.imperfecto',
    nameEn: 'Imperfect',
    nameEs: 'Pretérito imperfecto',
    level: 'A2',
    strand: 'verb',
    summary:
      'Only three verbs are irregular (ser, ir, ver), which makes the forms easy and the usage hard. The imperfect describes the scenery around events: ongoing states, habitual action, and the frame an interruption cuts into.',
    bookRef: 'Foundations U10',
    searchTerms: 'imperfect|imperfecto|hablaba|era|iba|veía|used to|habitual',
  },
  {
    id: 'a2.verb.progresivo',
    nameEn: 'Present progressive',
    nameEs: 'Presente progresivo',
    level: 'A2',
    strand: 'verb',
    summary:
      'estar + gerundio for action genuinely in progress right now. Spanish uses it far less than English: for scheduled future events Spanish takes the simple present or ir a, never the progressive. The gerund is also where a live error sits — he hablando for he hablado confuses gerund with participle.',
    bookRef: 'Foundations U7',
    searchTerms: 'progressive|progresivo|gerund|gerundio|estoy hablando|-ando|-iendo',
  },
  {
    id: 'a2.verb.futuro_simple',
    nameEn: 'Future simple',
    nameEs: 'Futuro simple',
    level: 'A2',
    strand: 'verb',
    summary:
      'One ending set for all three conjugations, attached to the whole infinitive, with twelve contracted stems (tendr-, pondr-, saldr-, vendr-, har-, dir-, podr-, sabr-, querr-, habr-, valdr-, cabr-). Its endings sit one letter away from the conditional, and that collision — preferiremos vs. preferiríamos — is an active severity-4 error here.',
    bookRef: 'Foundations U11',
    searchTerms: 'future|futuro|simple|hablaré|tendré|podré|-ré|-remos|will',
  },
  {
    id: 'a2.verb.condicional',
    nameEn: 'Conditional simple',
    nameEs: 'Condicional simple',
    level: 'A2',
    strand: 'verb',
    summary:
      'Same contracted stems as the future, but with imperfect endings: -ía, -ías, -ía, -íamos, -ían. Beyond hypotheticals it is the main politeness device in professional Spanish — podría, sería, me gustaría, habría que — and the tense that softens a hard message without weakening it.',
    bookRef: 'Foundations U12',
    searchTerms: 'conditional|condicional|hablaría|podría|sería|would|-ría|-ríamos',
  },
  {
    id: 'a2.verb.imperativo',
    nameEn: 'Imperative: affirmative and negative',
    nameEs: 'Imperativo afirmativo y negativo',
    level: 'A2',
    strand: 'verb',
    summary:
      'Affirmative tú commands use the third-person present with eight irregulars (di, haz, ve, pon, sal, sé, ten, ven). Usted commands and all negatives borrow the present subjunctive. Pronoun placement flips with polarity: attached to affirmatives (fírmelo), before negatives (no lo firme). Resolved in this log — maintenance only.',
    bookRef: 'Foundations U13',
    searchTerms: 'imperative|imperativo|command|mandato|haz|ponga|firme|no firmes',
  },
  {
    id: 'a2.pron.od',
    nameEn: 'Direct object pronouns',
    nameEs: 'Pronombres de objeto directo',
    level: 'A2',
    strand: 'pron',
    summary:
      'lo/la/los/las replace a noun already identified, and they agree with it in gender and number. Spanish repeats far less than English, so a report that keeps naming el expediente instead of pronominalising it reads as laboured.',
    bookRef: 'Foundations U14',
    searchTerms: 'direct object|objeto directo|lo|la|los|las|OD',
  },
  {
    id: 'a2.pron.oi',
    nameEn: 'Indirect object pronouns',
    nameEs: 'Pronombres de objeto indirecto',
    level: 'A2',
    strand: 'pron',
    summary:
      'me/te/le/nos/les mark the recipient. Spanish routinely doubles them — le dije al supervisor, with both the pronoun and the noun — and omitting that redundant le is an active error in this log.',
    bookRef: 'Foundations U14',
    searchTerms: 'indirect object|objeto indirecto|le|les|me|te|nos|OI|redundant',
  },
  {
    id: 'a2.pron.se_lo',
    nameEn: 'Combining pronouns: se lo, se la',
    nameEs: 'Se lo, se la',
    level: 'A2',
    strand: 'pron',
    summary:
      'When both pronouns appear the indirect comes first, and le/les becomes se before lo/la/los/las: se lo entregué al cliente. This se is not reflexive — it is a phonetic repair — and confusing it with the reflexive or with the accented sé is an active error.',
    bookRef: 'Foundations U14',
    searchTerms: 'se lo|se la|combining|dos pronombres|clitic order',
  },
  {
    id: 'a2.noun.posesivos',
    nameEn: 'Possessives',
    nameEs: 'Posesivos',
    level: 'A2',
    strand: 'noun',
    summary:
      'mi/tu/su/nuestro agree with the thing possessed, not the possessor. Spanish prefers the definite article plus a pronoun where English uses a possessive, especially with body parts and personal effects: me duele la cabeza, not me duele mi cabeza. That calque is an active error here.',
    bookRef: 'Foundations U2',
    searchTerms: 'possessive|posesivo|mi|tu|su|nuestro|my|your',
  },
  {
    id: 'a2.noun.demostrativos',
    nameEn: 'Demonstratives',
    nameEs: 'Demostrativos',
    level: 'A2',
    strand: 'noun',
    summary:
      'A three-way distance system — este/ese/aquel — rather than English\'s two. They agree in gender and number, so they inherit any gender error in the noun: este problema, never esta problema.',
    bookRef: 'Foundations U2',
    searchTerms: 'demonstrative|demostrativo|este|ese|aquel|esta|esa|this|that',
  },
  {
    id: 'a2.noun.comparativos',
    nameEn: 'Comparatives and superlatives',
    nameEs: 'Comparativos y superlativos',
    level: 'A2',
    strand: 'noun',
    summary:
      'más/menos… que for inequality, tan/tanto… como for equality, with four irregulars (mejor, peor, mayor, menor). Note más de before a number — más de tres semanas — which is resolved in this log.',
    bookRef: 'Breakthrough U11',
    searchTerms: 'comparative|comparativo|más que|menos que|tan como|mejor|peor|superlative|ísimo',
  },
  {
    id: 'a2.prep.por_para_intro',
    nameEn: 'Por vs. para: introduction',
    nameEs: 'Por y para (introducción)',
    level: 'A2',
    strand: 'prep',
    summary:
      'The first pass: por points backward at cause, exchange, duration and means; para points forward at purpose, recipient, destination and deadline. This learner already controls the rule — SPEC §10 records it as understood — so it is seeded for search and warm-up reinforcement but never scheduled as a lesson.',
    bookRef: 'Foundations U4',
    searchTerms: 'por|para|por vs para|preposition|cause|purpose|deadline',
    noSchedule: true,
  },
  {
    id: 'a2.discourse.conectores_basicos',
    nameEn: 'Basic connectors',
    nameEs: 'Conectores básicos',
    level: 'A2',
    strand: 'discourse',
    summary:
      'y, pero, porque, entonces — enough to join clauses but not enough to structure an argument. The professional upgrade path runs through the tier-1 and tier-2 connector topics at B1 and B2.',
    bookRef: 'Breakthrough U4',
    searchTerms: 'connectors|conectores|y|pero|porque|entonces|basic',
  },
  {
    id: 'a2.verb.presente_perfecto_intro',
    nameEn: 'Present perfect: introduction',
    nameEs: 'Pretérito perfecto (introducción)',
    level: 'A2',
    strand: 'verb',
    summary:
      'haber + participio for events inside a period still open. A register warning that the source book does not give: Latin American Spanish, and Peruvian usage in particular, reaches for the simple preterite where Peninsular Spanish would use the present perfect. Prefer entregué ayer over he entregado ayer.',
    bookRef: 'Foundations U8',
    searchTerms: 'present perfect|pretérito perfecto|he hablado|ha llegado|haber participio',
  },
];
