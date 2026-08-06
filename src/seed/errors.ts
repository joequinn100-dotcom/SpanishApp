import type { SeedError } from './types';

/**
 * The error log (SPEC §10) — the engine everything else reads from.
 *
 * `rule` is deliberately long. SPEC §11: "The user has explicitly rejected
 * abbreviated grammar explanations. Give the rule, the why, and the exceptions."
 *
 * On `occurrences`: §4's weight formula multiplies by log(1 + occurrences), so a
 * zero here makes an error invisible to warm-up selection forever. §10 gives
 * volume in prose ("highest by volume", "10+/week", "6+ instances") rather than
 * counts, so these are calibrated estimates from those notes, not measurements.
 * They are starting values only — every real event from a drill or transcript
 * overwrites them with evidence.
 */
export const ERRORS: SeedError[] = [
  {
    code: 'noun.gender_agreement',
    labelEn: 'Gender and number agreement across the noun phrase',
    wrong: 'un nuevo demostración · muchas choques · un fusión',
    right: 'una nueva demostración · muchos choques · una fusión',
    rule:
      'Gender is a property of the noun, and every word that modifies it must match: article, demonstrative, quantifier and adjective, however far away they sit. The -o/-a pattern is a strong tendency but not a rule, and the endings that mislead most are -ión (almost always feminine: la demostración, la fusión, la licitación, la valorización), -aje (masculine: el peaje, el montaje), -umbre (feminine: la incertidumbre) and -e (unpredictable, must be learned).\n\nThe failure here is not usually ignorance of the noun\'s gender — it is agreement decaying with distance. "Un nuevo demostración" gets both the article and the adjective wrong from a single wrong assumption made before the noun was spoken, which is a planning problem rather than a knowledge problem: the speaker commits to a determiner before the noun is chosen.\n\nThe practical fix is to store every noun as article + noun as one unit, and to check the whole phrase rather than the article alone. "La problema" and "el problema complicada" are the same error at different distances.',
    topicId: 'a1.noun.genero',
    severity: 4,
    status: 'active',
    occurrences: 34,
    note: 'Highest by volume in the log.',
  },
  {
    code: 'noun.greek_ma',
    labelEn: 'The Greek -ma group treated as feminine',
    wrong: 'la tema · una problema · la idioma',
    right: 'el tema · un problema · el idioma',
    rule:
      'A closed set of nouns ending in -ma is masculine despite the -a: el tema, el problema, el sistema, el programa, el clima, el idioma, el esquema, el diagrama, el cronograma, el síntoma, el dilema, el teorema. They entered Spanish from Greek neuter nouns in -ma, which Latin absorbed as masculine, so the -a here is not the Spanish feminine marker at all — it is the tail of a Greek ending.\n\nThe set is closed and short, which is what makes it learnable. Note that not every -ma noun belongs to it: la cama, la firma, la forma, la norma and la víctima are ordinary feminine nouns. The test is etymological rather than phonetic, so the group has to be memorised as a list.\n\nA few others break the -a rule for different reasons and are worth learning alongside: el día, el mapa, el planeta, and la mano and la foto going the other way. As with all gender, the whole noun phrase inherits it: este problema técnico, los mismos temas presupuestales, un cronograma ajustado.',
    topicId: 'a1.noun.genero',
    severity: 4,
    status: 'active',
    occurrences: 31,
  },
  {
    code: 'verb.preterito_persona',
    labelEn: 'Preterite person endings: yo and él collapsed',
    wrong: 'hablé (meaning he spoke)',
    right: 'habló',
    rule:
      'In the preterite the person is carried entirely by the ending, and the two singular endings are minimal pairs separated only by the stressed vowel: -é/-í for yo, -ó/-ió for él, ella and usted. yo hablé, revisé, coordiné against él habló, revisó, coordinó; yo escribí, cumplí against él escribió, cumplió.\n\nThis is severity 5 rather than a cosmetic slip because it does not merely sound wrong — it reassigns the action. "Yo aprobé el presupuesto" and "él aprobó el presupuesto" are both perfectly grammatical sentences that name different people as responsible. In a claim meeting, a status report or an acta, that is a change of fact rather than a change of form.\n\nBecause the written accent falls on the final syllable in both, spelling gives no help; the only cue is the vowel. Under speaking pressure the fix is procedural rather than grammatical: fix the subject before starting the verb, then choose the vowel — yo takes é or í, él takes ó or ió.',
    topicId: 'b1.verb.preterito',
    severity: 5,
    status: 'active',
    occurrences: 14,
  },
  {
    code: 'mood.subj_leak_past',
    labelEn: 'Subjunctive leaking into past-indicative narration',
    wrong: 'La semana pasada compremos el material · los planos fueran tarde',
    right: 'La semana pasada compramos el material · los planos fueron tarde',
    rule:
      'Narrating what actually happened is indicative. The subjunctive appears only when something licenses it: a subordinating que after a verb of wish, influence, doubt or emotion (quería que llegaran); a hypothetical si (si tuviéramos más plazo); ojalá; cuando pointing at an unrealised future; aunque conceding something unreal; or como si.\n\nWith none of those present, a finished past event takes the preterite. "La semana pasada compramos el material" — not compremos. "Los planos llegaron tarde" — not llegaran.\n\nThe mechanism behind this error is worth naming, because it is not ignorance. The -ramos and -ran forms feel more advanced, so they get reached for under pressure as a marker of sophistication — the speaker is aiming up. The diagnostic is simple: if you could put "ayer" in front of the clause and it would still describe something that really happened, the verb must be indicative.',
    topicId: 'b1.verb.preterito',
    severity: 4,
    status: 'active',
    occurrences: 9,
  },
  {
    code: 'verb.participio_adj',
    labelEn: 'Participle and finite verb confused',
    wrong: 'muy avanzó · la obra ha avanzó',
    right: 'muy avanzado · la obra ha avanzado',
    rule:
      '"Avanzó" is a finite verb — third person singular preterite — and it is the only one of the two forms that can be the main verb of a clause on its own: la obra avanzó un 20% en marzo.\n\n"Avanzado" is the past participle, and it never stands alone as a main verb. It has exactly two jobs. After the auxiliary HABER it forms the perfect tenses and is invariable: la obra ha avanzado, habíamos avanzado — never ha avanzada. After SER or ESTAR, or attached directly to a noun, it is an adjective and now agrees in gender and number: el presupuesto está aprobado, las partidas aprobadas, una obra muy avanzada.\n\nThe test is whether an auxiliary is present. Auxiliary → participle. No auxiliary, stating an event → finite verb. Modified by an adverb of degree like muy → adjective, therefore participle, because muy modifies adjectives and never verbs.',
    topicId: 'b1.verb.presente_perfecto',
    severity: 3,
    status: 'active',
    occurrences: 11,
    note: '6+ instances across transcripts.',
  },
  {
    code: 'prep.despues_de',
    labelEn: 'Después used without de',
    wrong: 'después la reunión',
    right: 'después de la reunión',
    rule:
      '"Después" on its own is an adverb meaning "afterwards", and in that use it takes no complement: revisamos los planos y después firmamos.\n\nThe moment anything follows it — a noun, a pronoun, an infinitive or a clause — the preposition DE becomes obligatory: después de la reunión, después de eso, después de revisar los planos, después de que el cliente apruebe el adicional. Note the contraction with the masculine article: después del comité, después del pago.\n\nThere are two complement patterns and choosing between them depends on the subject. Same subject on both verbs takes de + infinitive: después de firmar, salimos. A change of subject takes de que + clause, and when it points at the future that clause is subjunctive: después de que el cliente firme, empezamos.\n\nThe identical pattern governs antes: antes de la reunión, antes de firmar, antes de que llegue el material. At 10-plus occurrences a week this is the highest-frequency single error in the log, which makes it the cheapest one to fix by volume.',
    topicId: 'b1.prep.verbos_regimen',
    severity: 3,
    status: 'active',
    occurrences: 38,
    note: '10+ per week.',
  },
  {
    code: 'pron.reflexive_dropped',
    labelEn: 'Reflexive pronoun dropped',
    wrong: 'voy a relajar',
    right: 'voy a relajarme',
    rule:
      'Pronominal verbs carry their pronoun everywhere; it is part of the verb, not an optional intensifier. The pronoun agrees with the subject: me relajo, te relajas, se relaja, nos relajamos, se relajan.\n\nWith an infinitive after another verb there are two legal positions and both are correct — "quiero relajarme" attached, or "me quiero relajar" fronted. What is not legal is dropping it: "quiero relajar" means you want to relax something else.\n\nMany verbs in this family change meaning without the pronoun, which is why the omission is more than cosmetic. quedar is to arrange to meet or to be left over; quedarse is to stay. acordar is to agree on something; acordarse de is to remember. ir is to go; irse is to leave. dormir is to sleep; dormirse is to fall asleep.\n\nThe working set for this learner: reunirme con el cliente, encargarme de la licitación, comprometerme con la fecha, darme cuenta del error, enfocarme en el cronograma, quedarme en obra, acordarme del acta.',
    topicId: 'a1.pron.reflexivos_basico',
    severity: 3,
    status: 'active',
    occurrences: 17,
  },
  {
    code: 'lex.una_otra_vez',
    labelEn: 'Article before otro/otra',
    wrong: 'una otra vez',
    right: 'otra vez',
    rule:
      'Spanish never places the indefinite article before otro, otra, otros or otras. "Otro" already contains the sense English splits into "an" + "other": otra vez, otro problema, otras opciones.\n\n"Una otra vez" is a direct calque of "another time" and marks a speaker instantly, because no native construction produces it. The same restriction holds throughout: otro medio día, otra semana.\n\nThe definite article is possible and changes the meaning to "the other", a specific one already in play: el otro contratista, la otra propuesta. And to say "one more" rather than "another", Spanish uses un/una … más: una semana más, un mes más. A useful escape hatch is volver a + infinitive, which expresses "again" without the trap at all: el cliente volvió a solicitar el mismo cambio.',
    topicId: null,
    severity: 2,
    status: 'active',
    occurrences: 8,
  },
  {
    code: 'verb.hace_ago',
    labelEn: 'Missing hace + time for "ago"',
    wrong: '(omitted, or "dos semanas atrás")',
    right: 'hace dos semanas',
    rule:
      '"Ago" is expressed with HACE placed before the time expression: hace dos semanas, hace tres meses, hace un año. English word order produces "dos semanas atrás", which exists but is regionally marked; hace + tiempo is the neutral professional default. The verb of the sentence goes in the preterite: entregamos el expediente hace dos semanas.\n\nTwo related patterns are worth locking in at the same time, because they use the same word for something different. "Hace + tiempo + QUE + presente" says how long something has been going on and still is: hace tres meses que trabajamos en ese proyecto. "Desde hace + tiempo" says the same thing with the verb first: trabajamos en ese proyecto desde hace tres meses.\n\nDo not mix these with por or durante, which measure a finished stretch of time rather than distance back from now. "Trabajamos ahí por tres meses" is a closed period; "hace tres meses que trabajamos ahí" is still true today.',
    topicId: 'b1.verb.preterito',
    severity: 3,
    status: 'active',
    occurrences: 7,
  },
  {
    code: 'verb.futuro_vs_condicional',
    labelEn: 'Conditional used where the future is meant',
    wrong: 'preferiríamos el hormigón (meaning: we will prefer)',
    right: 'preferiremos el hormigón',
    rule:
      'The future and the conditional share a stem and differ only in their endings, which puts them one or two letters apart: preferiremos (we will prefer) against preferiríamos (we would prefer). Future endings are -é, -ás, -á, -emos, -án. Conditional endings are the imperfect set: -ía, -ías, -ía, -íamos, -ían.\n\nThe meanings are not close. The future commits: preferiremos states a decision. The conditional withdraws: preferiríamos floats an option without accepting it. In a negotiation that is the difference between a position and a hint, and a listener will act on the one you said rather than the one you meant.\n\nBoth take the same twelve contracted stems — tendr-, pondr-, saldr-, vendr-, har-, dir-, podr-, sabr-, querr-, habr-, valdr-, cabr- — so learning them once serves both tenses. The third member of this family, the imperfect subjunctive in -áramos/-iéramos, completes the collision and is best drilled against these two rather than separately.',
    topicId: 'b2.verb.colision_r',
    severity: 4,
    status: 'active',
    occurrences: 12,
  },
  {
    code: 'mood.subj_imperfecto_missing',
    labelEn: 'Imperfect subjunctive not yet acquired',
    wrong: 'si preferirá otro proveedor…',
    right: 'si prefiriera otro proveedor…',
    rule:
      'The imperfect subjunctive is formed mechanically from the third person plural of the preterite: take prefirieron, drop -ron, add -ra (prefiriera) or -se (prefiriese). Both sets are correct; -ra dominates in Latin America. Because it derives from the preterite, every preterite irregularity carries through — tuvieron gives tuviera, fueron gives fuera, hicieron gives hiciera, pudieron gives pudiera — which makes this tense a direct test of whether the preterite is genuinely secure.\n\nIt is required in three places this learner needs daily. After a hypothetical si: si tuviéramos dos semanas más. After a past-tense trigger, by sequence of tenses: el cliente pidió que entregáramos el cronograma. And after como si, always: responde como si el contrato no existiera.\n\nSeverity 5 because its absence is not a slip but a missing structure: without it the hypothetical conditional cannot be built at all, and hypothetical framing is the core move of professional negotiation. A speaker who lacks it is forced to state as fact things they mean to float as possibilities.',
    topicId: 'b2.mood.subj_imperfecto',
    severity: 5,
    status: 'active',
    occurrences: 6,
  },
  {
    code: 'pron.body_part_article',
    labelEn: 'Possessive used with body parts and personal effects',
    wrong: 'lava tus manos · me duele mi cabeza',
    right: 'lávate las manos · me duele la cabeza',
    rule:
      'Where English marks ownership with a possessive, Spanish marks it with a pronoun and uses the plain definite article on the noun. Lávate las manos: the te already says whose hands they are, so mis would be redundant and sounds odd. Me duele la cabeza: the me does the same work.\n\nThe principle extends beyond body parts to clothing and closely held possessions: se quitó el casco, me dejé el plano en la camioneta.\n\nUsing the possessive is not ungrammatical so much as unidiomatic and faintly emphatic — it reads as though you are distinguishing your head from someone else\'s. Since the pronoun is already obligatory for other reasons, the fix is subtraction: keep the pronoun, swap the possessive for the article.',
    topicId: 'a2.noun.posesivos',
    severity: 3,
    status: 'active',
    occurrences: 9,
  },
  {
    code: 'pron.doler_le',
    labelEn: 'Doler treated as reflexive',
    wrong: 'se duele la rodilla',
    right: 'le duele la rodilla',
    rule:
      'DOLER belongs to the gustar family: the thing that hurts is the grammatical subject and the person is an indirect object. So the knee is doing the hurting, and the person receives it — le duele la rodilla, me duelen las manos, with the verb agreeing with the body part rather than the person.\n\n"Se duele" applies a reflexive pronoun to a verb that does not take one, which produces either nonsense or, in some varieties, the unrelated sense of complaining about something.\n\nThe same structure governs the whole family and is worth drilling as a set, because they all resist the English subject-verb intuition: me interesa la propuesta, nos falta el acero, le conviene esa opción, me queda una semana, nos preocupa el plazo.',
    topicId: 'a1.verb.gustar',
    severity: 3,
    status: 'active',
    occurrences: 6,
  },
  {
    code: 'pron.se_vs_se_accent',
    labelEn: 'sé and se confused',
    wrong: 'no sé lo digas',
    right: 'no se lo digas',
    rule:
      'Two different words that sound identical. "Sé" with an accent is a verb — first person of saber (yo sé) or the tú command of ser (sé puntual). "Se" without an accent is the pronoun: reflexive, impersonal, passive, or the repair form that replaces le before lo/la.\n\nIn "no se lo digas" the se is that repair form: the underlying pronoun is le, but le lo is not pronounceable in Spanish, so le becomes se. Writing "no sé lo digas" produces "I don\'t know say it to him", which is not a sentence.\n\nThis is the diacritical accent doing real work rather than decorating. The same job is done by él/el, tú/tu, mí/mi, sí/si, más/mas and dé/de — in each pair the accented form is the stressed content word and the unaccented one is the grammatical particle.',
    topicId: 'a2.pron.se_lo',
    severity: 3,
    status: 'active',
    occurrences: 5,
  },
  {
    code: 'verb.infinitive_after_prep',
    labelEn: 'Conjugated verb after a preposition',
    wrong: 'para regresaré',
    right: 'para regresar',
    rule:
      'After a preposition Spanish uses the infinitive, always and without exception: para regresar, antes de firmar, sin avisar, después de revisar, al llegar. There is no Spanish equivalent of the English gerund in this position — "before signing" is antes de firmar, never antes de firmando.\n\nThe error usually appears when the speaker is thinking about who will do the action and reaches for a conjugated form to carry the person. If the subject genuinely changes, the structure changes with it: preposition + que + conjugated verb, with the subjunctive where the clause points at the future. Para que el municipio emita la licencia. Antes de que llegue el material.\n\nSo the choice is: same subject → preposition + infinitive; different subject → preposition + que + subjunctive.',
    topicId: 'a1.prep.basicas',
    severity: 3,
    status: 'active',
    occurrences: 7,
  },
  {
    code: 'pron.personal_a',
    labelEn: 'Personal a omitted',
    wrong: '¿conoces Capo?',
    right: '¿conoces a Capo?',
    rule:
      'When the direct object of a verb is a specific person — or a pet, or a personified institution — Spanish inserts the preposition a before it. Conozco a Capo. Vi al residente. Llamé a la supervisión. It has no English equivalent and translates to nothing, which is exactly why it disappears.\n\nIt is omitted when the person is indefinite or is being counted rather than identified: busco un ingeniero que sepa alemán (any such engineer), necesitamos tres operarios. Compare busco a un ingeniero que sabe alemán, where the a plus the indicative together say you have a particular person in mind.\n\nThe verb tener normally drops it: tengo dos hijos, tenemos un residente nuevo. And note that this a is not an indirect object marker even though it looks identical — the personal a marks a direct object, which is why the pronoun that replaces it is lo or la, not le.',
    topicId: 'a1.prep.basicas',
    severity: 2,
    status: 'active',
    occurrences: 6,
  },
  {
    code: 'verb.perfecto_gerundio',
    labelEn: 'Gerund used instead of participle after haber',
    wrong: 'he hablando',
    right: 'he hablado',
    rule:
      'Two non-finite forms with different jobs that are one letter apart in the -ar conjugation. The participle ends in -ado or -ido and follows haber to build the perfect tenses: he hablado, hemos entregado, había llegado. The gerund ends in -ando or -iendo and follows estar to build the progressive: estoy hablando, estamos entregando.\n\n"He hablando" crosses the two: the auxiliary of one construction with the non-finite form of the other. It is not a possible Spanish sentence, which is why it registers as a jarring error rather than an accent.\n\nSeverity 4 because it hits the perfect tenses, which carry a large share of professional reporting, and because it compounds with the participle-versus-finite-verb error already in the log — both are failures to keep the three non-finite forms apart. Irregular participles are worth drilling alongside: hecho, dicho, puesto, escrito, visto, vuelto, abierto, resuelto, roto.',
    topicId: 'b1.verb.presente_perfecto',
    severity: 4,
    status: 'active',
    occurrences: 8,
  },
  {
    code: 'pron.io_redundant',
    labelEn: 'Redundant indirect object pronoun omitted',
    wrong: 'no digas a mi esposo',
    right: 'no le digas a mi esposo',
    rule:
      'Spanish doubles the indirect object: the pronoun appears even when the noun it refers to is also stated. Le dije al supervisor. Les entregamos el acta a los contratistas. English finds this redundant; Spanish requires it, and omitting it is one of the most reliable markers of a non-native speaker.\n\nThe doubling is obligatory whenever the indirect object is a person expressed with a, and it is obligatory with a fronted object of any kind: a mí me parece, a ese frente le falta acceso.\n\nThe direct object behaves differently and doubles only when it is fronted — el expediente lo entregamos ayer — which is why the two cases have to be learned separately rather than as one rule about "repeating things".',
    topicId: 'b2.pron.cliticos_redundantes',
    severity: 3,
    status: 'active',
    occurrences: 9,
  },
  {
    code: 'prep.buscar_para',
    labelEn: 'English particle carried onto a Spanish verb',
    wrong: 'buscar para ingredientes',
    right: 'buscar ingredientes',
    rule:
      'Several Spanish verbs contain in their own meaning the preposition that English attaches as a separate particle, and adding it in Spanish is ungrammatical. buscar already means "look for" — buscar los planos, never buscar para. The same applies to esperar (wait for), pedir (ask for), pagar (pay for) and escuchar (listen to): esperamos la conformidad, pedimos una prórroga, pagamos el suministro, escuchamos al cliente.\n\nThe reverse trap also exists — Spanish verbs that demand a preposition where English uses none: entrar en, casarse con, soñar con, depender de, confiar en. So the rule is not "Spanish uses fewer prepositions"; it is that the pairing is arbitrary in both directions and belongs to the verb.\n\nThe reliable fix is to store each verb with its preposition, or its explicit absence, as part of the lexical entry rather than deriving it from English.',
    topicId: 'b1.prep.verbos_regimen',
    severity: 3,
    status: 'active',
    occurrences: 6,
    note: 'Anglicism.',
  },

  /* ---------------- Resolved (SPEC §10) ---------------- */
  {
    code: 'mood.que_before_subj',
    labelEn: 'Missing que before a subjunctive clause',
    wrong: 'quiero entreguen el informe',
    right: 'quiero que entreguen el informe',
    rule:
      'A subjunctive clause after a verb of wish, influence, doubt or emotion is introduced by que, and the que is not optional: quiero que entreguen, espero que llegue, dudo que apruebe. Dropping it produces a sequence of two finite verbs with nothing joining them.\n\nThe exception is a same-subject sentence, which takes an infinitive and no clause at all: quiero entregar el informe myself. So the choice is: same subject → infinitive, no que; different subject → que + subjunctive. Resolved.',
    topicId: 'b1.mood.subj_presente',
    severity: 3,
    status: 'resolved',
    occurrences: 12,
  },
  {
    code: 'lex.en_punto_a_tiempo',
    labelEn: 'en punto vs. a tiempo',
    wrong: 'llegamos en punto (meaning: on time)',
    right: 'llegamos a tiempo',
    rule:
      '"A tiempo" means on time — before or by the deadline, with no claim about precision: llegamos a tiempo para el vaciado. "En punto" means exactly on the hour, sharp: la reunión es a las nueve en punto. English "on time" covers both senses, so the distinction has to be made deliberately.\n\nA third member of the set is worth holding alongside them. "Puntual" describes a person or a habit rather than an event — es muy puntual — and "a la hora" is the everyday spoken alternative to en punto. In a schedule discussion the difference matters: entregar a tiempo is meeting the deadline, entregar en punto would mean delivering at a named hour exactly, which is rarely what a contract requires.\n\nResolved.',
    topicId: null,
    severity: 2,
    status: 'resolved',
    occurrences: 5,
  },
  {
    code: 'pron.me_dropped',
    labelEn: 'Object pronoun me dropped',
    wrong: 'puedes explicar el procedimiento',
    right: 'me puedes explicar el procedimiento',
    rule:
      'Spanish states the recipient with a pronoun where English can leave it to context. ¿Me puedes explicar el procedimiento?, ¿nos confirmas la fecha?, ¿te paso el archivo? Without the pronoun the sentence stays grammatical but loses its addressee: ¿puedes explicar el procedimiento? asks whether explaining is possible in general rather than asking you to explain it to me.\n\nThe pronoun is also what makes a request sound like a request rather than an interrogation of someone\u2019s capabilities. In a professional exchange that difference is audible.\n\nPlacement follows the ordinary clitic rules: before the conjugated verb (me puedes explicar) or attached to the infinitive (puedes explicarme), both correct and interchangeable here. Resolved.',
    topicId: 'b1.pron.od_oi',
    severity: 3,
    status: 'resolved',
    occurrences: 8,
  },
  {
    code: 'pron.command_placement',
    labelEn: 'Pronoun placement with commands',
    wrong: 'no fírmelo · me diga',
    right: 'no lo firme · dígame',
    rule:
      'Placement flips with polarity. Affirmative commands take the pronoun attached to the end, and a written accent appears to keep the original stress: dígame, fírmelo, entrégueselo. Negative commands take it before the verb, detached: no me diga, no lo firme, no se lo entregue.\n\nThis is the one context where placement is fixed rather than optional — unlike infinitives and gerunds, where both positions are legal. Resolved.',
    topicId: 'a2.verb.imperativo',
    severity: 3,
    status: 'resolved',
    occurrences: 10,
  },
  {
    code: 'verb.commands_irregular',
    labelEn: 'Irregular and reflexive commands',
    wrong: 'hace el informe · siéntase',
    right: 'haz el informe · siéntese',
    rule:
      'Eight irregular affirmative tú commands have to be memorised: di, haz, ve, pon, sal, sé, ten, ven. Usted commands and every negative command borrow the present subjunctive, which is why haga, ponga and tenga look nothing like the tú forms.\n\nReflexive commands add the pronoun and, in the nosotros form, drop the final -s before nos: sentémonos, not sentemosnos. Resolved.',
    topicId: 'a2.verb.imperativo',
    severity: 3,
    status: 'resolved',
    occurrences: 9,
  },
  {
    code: 'mood.cuando_subj',
    labelEn: 'Cuando + subjunctive',
    wrong: 'cuando llega el material, empezamos (future intent)',
    right: 'cuando llegue el material, empezamos',
    rule:
      'CUANDO pointing at an unrealised future takes the subjunctive: cuando llegue el material, cuando el cliente apruebe el adicional. Pointing at a habit or a completed fact it takes the indicative: cuando llega el material, siempre lo revisamos; cuando llegó, lo revisamos.\n\nThe same split governs en cuanto, tan pronto como, hasta que, mientras and después de que.\n\nThis is the model case for what "resolved" means in this log. It was not marked resolved because a drill came back correct — it was marked resolved because it appeared correctly in spontaneous speech and because the rule was explained unprompted. That is the standard every other error is held to.',
    topicId: 'b1.mood.subj_cuando',
    severity: 4,
    status: 'resolved',
    occurrences: 15,
  },
  {
    code: 'lex.mas_de_numero',
    labelEn: 'más de before a number',
    wrong: 'más que tres semanas',
    right: 'más de tres semanas',
    rule:
      'Before a number Spanish uses más de or menos de, never más que: más de tres semanas, menos de veinte partidas, más de un millón de soles. "Más que" is for comparing two things to each other — este frente avanza más que el otro, cuesta más que lo presupuestado.\n\nThe test is what follows the comparative. A quantity takes de; a second term of comparison takes que. English uses "than" for both, which is the entire source of the error.\n\nThe exception matters commercially. In a negative sentence, no… más que means "only", not "more than": no tenemos más que dos semanas means we have only two weeks. To say we do not have more than two weeks you need no tenemos más de dos semanas. One letter reverses the claim, and both sentences are things a person says in a contract negotiation. Resolved.',
    topicId: 'a2.noun.comparativos',
    severity: 2,
    status: 'resolved',
    occurrences: 6,
  },
];
