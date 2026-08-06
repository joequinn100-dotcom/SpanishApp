import type { SeedDrill } from './types';

/**
 * Topic drills — the second half of a session, after the warm-up.
 *
 * These do not target an error from the log. They build the topic itself, and
 * they are ordered by `difficulty` so the block runs recognition → guided
 * production → unaided production, which is the sequence the fluency layers in
 * the brief describe.
 *
 * Coverage is deliberately narrow: six topics that are unlocked right now plus
 * the imperfect subjunctive, which is the highest-severity gap in the log. The
 * remaining ~85 topics get their content from the gauntlet once an API key
 * exists. Writing thin content for all 92 by hand would have been worse than
 * writing real content for seven.
 */
export const TOPIC_DRILLS: SeedDrill[] = [
  /* ================= b1.verb.imperfecto ================= */
  {
    topicId: 'b1.verb.imperfecto',
    kind: 'drill_conjugation',
    difficulty: 1,
    targetsError: null,
    payload: {
      prompt: 'Put the verb in the imperfect.',
      context: 'Describing how the site used to run before the new contractor.',
      sentence: 'Antes el proveedor ___ (entregar) el material los lunes.',
      answer: 'entregaba',
      explanation:
        'The imperfect of -ar verbs is -aba, -abas, -aba, -ábamos, -aban. For -er and -ir verbs it is -ía, -ías, -ía, -íamos, -ían. There are exactly three irregular verbs in the whole tense: ser (era), ir (iba) and ver (veía). Three. No others.\n\nThat makes the imperfect the most regular tense in Spanish and the cheapest one to acquire completely.\n\nWhat it means is habitual or ongoing past — what used to happen, what was happening, what things were like. «Entregaba los lunes» describes a routine, with no interest in when it started or stopped. Words like antes, siempre, normalmente, todos los lunes and cada semana are strong signals that the imperfect is what you want.',
    },
  },
  {
    topicId: 'b1.verb.imperfecto',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: null,
    payload: {
      prompt: 'Complete with the imperfect.',
      context: 'Setting the scene before an incident.',
      sentence: 'Cuando llegué a obra, ___ (llover) y la cuadrilla ___ (estar) parada.',
      answer: 'llovía y la cuadrilla estaba',
      accept: ['llovía, y la cuadrilla estaba'],
      distractors: [
        {
          answer: 'llovió y la cuadrilla estuvo',
          feedback:
            'The preterite turns the background into two events. Rain and an idle crew are the situation you walked into, so both are imperfect.',
        },
      ],
      explanation:
        'This is the imperfect doing its most characteristic job: painting the background against which a single event happens. «Llegué» is the event — one moment, preterite. «Llovía» and «estaba parada» are the scene that was already in place — imperfect.\n\nThe test is whether the verb answers "what happened?" or "what was going on?". Weather, time of day, ongoing states, physical descriptions and emotions are almost always imperfect, because they are conditions rather than occurrences.\n\n«Estar parado» is standard site usage for work being stopped or idle: «la cuadrilla está parada», «la obra estuvo parada dos días». Note it takes estar rather than ser, because it is a temporary condition.',
    },
  },
  {
    topicId: 'b1.verb.imperfecto',
    kind: 'drill_transform',
    difficulty: 3,
    targetsError: null,
    payload: {
      prompt: 'Rewrite as a habit that no longer holds. Begin with «Antes».',
      context: 'Contrasting the old process with the current one.',
      sentence: 'El supervisor firma cada valorización personalmente.',
      answer: 'Antes el supervisor firmaba cada valorización personalmente.',
      explanation:
        'Moving a present habit into the past is exactly what the imperfect is for, and it is a one-step change: firma → firmaba.\n\nThe implication carried by the imperfect is worth naming. «Firmaba» says this was the routine and quietly suggests it is no longer, without you having to say so. That contrast is why the imperfect is so useful in a consulting register: «antes coordinábamos por correo» sets up a change without criticising anyone.\n\nIf you want to state the end of the habit explicitly, the preterite marks it: «firmaba cada valorización hasta que cambió el procedimiento». The imperfect gives the routine; the preterite gives the moment it stopped.',
    },
  },
  {
    topicId: 'b1.verb.imperfecto',
    kind: 'drill_translate',
    difficulty: 3,
    targetsError: null,
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Explaining a past working arrangement to a new client.',
      sentence: 'We used to coordinate with the Colombian office every Thursday.',
      answer: 'Coordinábamos con la oficina de Colombia todos los jueves.',
      accept: [
        'nos coordinábamos con la oficina de colombia todos los jueves',
        'coordinábamos con la oficina colombiana todos los jueves',
      ],
      distractors: [
        {
          answer: 'Solíamos coordinar con la oficina de Colombia cada jueves.',
          feedback:
            'Correct Spanish, and «soler» is a good verb to own — but the imperfect alone already carries "used to", so this drill wants «coordinábamos».',
        },
      ],
      explanation:
        'English needs "used to" to mark a past habit; Spanish gets it from the imperfect alone. «Coordinábamos» already means "we used to coordinate", and adding «solíamos» is optional emphasis rather than a requirement.\n\nNote the accent on «coordinábamos». Every nosotros form of the -ar imperfect is accented on the -á-: hablábamos, revisábamos, trabajábamos. It is the only person in the tense that carries one for -ar verbs.\n\n«Todos los jueves» is the neutral way to say "every Thursday". «Cada jueves» is also correct and slightly more emphatic, closer to "each and every". Days of the week take no preposition and pluralise for recurrence: los jueves, los lunes.',
    },
  },
  {
    topicId: 'b1.verb.imperfecto',
    kind: 'drill_error_spot',
    difficulty: 4,
    targetsError: null,
    payload: {
      prompt: 'One verb is in the wrong past tense. Rewrite the sentence.',
      context: 'Narrating a delay to your director.',
      sentence: 'Mientras revisamos el expediente, el cliente llamó para pedir el avance.',
      answer: 'Mientras revisábamos el expediente, el cliente llamó para pedir el avance.',
      distractors: [
        {
          answer: 'Mientras revisábamos el expediente, el cliente llamaba para pedir el avance.',
          feedback:
            'Now both are imperfect. The call is a single interrupting event, so it stays in the preterite.',
        },
      ],
      explanation:
        '«Mientras» introduces the ongoing action, so it takes the imperfect: «mientras revisábamos». The call interrupts it and is a single completed event, so it takes the preterite: «llamó».\n\nThat pairing — imperfect for the frame, preterite for the interruption — is the core of preterite-versus-imperfect and it recurs constantly in incident narration. Mientras + imperfect, then preterite. Cuando + preterite, with the imperfect around it.\n\n«Revisamos» is ambiguous in isolation, which is what makes this item hard: for -ar verbs the nosotros form is identical in the present and the preterite. Only the context tells you which one was meant, and here neither is right.\n\n«El avance» is progress in the site sense — «el avance de obra», «el porcentaje de avance». It is core reporting vocabulary.',
    },
  },
  {
    topicId: 'b1.verb.imperfecto',
    kind: 'drill_translate',
    difficulty: 4,
    targetsError: null,
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Explaining why a decision was taken.',
      sentence: 'The crew was waiting for the pour, and there was no concrete on site.',
      answer: 'La cuadrilla esperaba el vaciado y no había concreto en obra.',
      accept: [
        'la cuadrilla estaba esperando el vaciado y no había concreto en obra',
        'la cuadrilla esperaba el vaciado y no había concreto en la obra',
      ],
      distractors: [
        {
          answer: 'La cuadrilla esperaba por el vaciado y no hubo concreto en obra.',
          feedback:
            'Two things: «esperar» takes no preposition, and «había» is the imperfect of hay, which is what a background state needs.',
          errorCode: 'prep.buscar_para',
        },
      ],
      explanation:
        'Both halves are background, so both are imperfect: «esperaba» and «había».\n\n«Había» is the imperfect of «hay», and like «hay» it is invariable — «había concreto», «había tres camiones», never «habían tres camiones». That plural form is extremely common in speech across Latin America and is still considered an error in careful writing, so it is worth fixing now.\n\nEnglish "was waiting" tempts a progressive, and «estaba esperando» is perfectly correct. But the plain imperfect already carries the ongoing sense, and Spanish uses the progressive more sparingly than English does. Default to the imperfect and reserve «estar + gerundio» for when you want to stress that something was in progress at that exact moment.\n\n«En obra» without an article is the idiomatic site usage, parallel to «en casa».',
    },
  },

  /* ================= b1.mood.subj_presente ================= */
  {
    topicId: 'b1.mood.subj_presente',
    kind: 'drill_conjugation',
    difficulty: 1,
    targetsError: null,
    payload: {
      prompt: 'Put the verb in the present subjunctive.',
      context: 'Making a request through a third party.',
      sentence: 'Necesito que el proveedor ___ (confirmar) la fecha de entrega.',
      answer: 'confirme',
      explanation:
        'The present subjunctive is built from the yo form of the present indicative: take «confirmo», drop the -o, and add the opposite vowel endings. -ar verbs take -e, -es, -e, -emos, -en. -er and -ir verbs take -a, -as, -a, -amos, -an.\n\nBuilding from the yo form rather than the infinitive is what makes irregulars fall into line automatically: tengo → tenga, digo → diga, hago → haga, salgo → salga, conozco → conozca, construyo → construya. If you know the yo form, you know the subjunctive.\n\nOnly six verbs escape this, and they are worth memorising as a closed list: ser (sea), ir (vaya), haber (haya), saber (sepa), dar (dé), estar (esté).\n\nWhat licenses it here is «necesitar que» — a verb of influence. When you need, want, ask, order, recommend or prohibit that someone else do something, the second verb goes into the subjunctive.',
    },
  },
  {
    topicId: 'b1.mood.subj_presente',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: null,
    payload: {
      prompt: 'Complete with the indicative or the subjunctive, whichever the sentence licenses.',
      context: 'Two statements about the same fact.',
      sentence: 'Sé que el plazo ___ (ser) ajustado, pero dudo que ___ (haber) otra opción.',
      answer: 'es ajustado, pero dudo que haya',
      accept: ['es, pero dudo que haya', 'es ajustado pero dudo que haya'],
      distractors: [
        {
          answer: 'sea ajustado, pero dudo que hay',
          feedback:
            'The two are swapped. «Saber que» asserts a fact and takes the indicative; «dudar que» questions one and takes the subjunctive.',
        },
      ],
      explanation:
        'The clearest way to see what the subjunctive does is to put an assertion and a doubt side by side. «Sé que» claims something is true, so the indicative follows. «Dudo que» declines to claim it, so the subjunctive follows.\n\nThis is the underlying logic of the whole mood, and it is more useful than a list of triggers: the indicative asserts, the subjunctive does not. Everything else follows from that. «Creo que llega» asserts; «no creo que llegue» does not. «Es cierto que funciona» asserts; «no es cierto que funcione» does not.\n\n«Haya» is the present subjunctive of «haber», and in this impersonal use it corresponds to «hay». «Dudo que haya otra opción» — I doubt there is another option. Like «hay», it stays singular regardless of what follows.',
    },
  },
  {
    topicId: 'b1.mood.subj_presente',
    kind: 'drill_transform',
    difficulty: 3,
    targetsError: null,
    payload: {
      prompt: 'Rewrite as a request routed through the client. Begin with «Le pedimos al cliente que».',
      context: 'Turning a direct instruction into a formal request.',
      sentence: 'El cliente aprueba el adicional esta semana.',
      answer: 'Le pedimos al cliente que apruebe el adicional esta semana.',
      explanation:
        '«Pedir que» is a verb of influence, so its clause goes into the subjunctive: aprueba → apruebe.\n\nNotice the doubled indirect object: «le pedimos al cliente». Spanish names the recipient twice, as a pronoun and as a full phrase, and the pronoun is not optional.\n\nNote also that the stem change survives into the subjunctive. «Aprobar» is not stem-changing, but many verbs of this shape are — «poder» gives «pueda», «cerrar» gives «cierre», «devolver» gives «devuelva» — because the subjunctive is built from the yo form, which already carries the change.\n\n«El adicional» is standard Peruvian contracting vocabulary for a variation or change order — «un adicional de obra». It is a noun here, not an adjective.',
    },
  },
  {
    topicId: 'b1.mood.subj_presente',
    kind: 'drill_translate',
    difficulty: 4,
    targetsError: null,
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Recommending a course of action in a meeting.',
      sentence: 'I recommend that we review the assumptions before we send the estimate.',
      answer: 'Recomiendo que revisemos los supuestos antes de enviar el estimado.',
      accept: [
        'recomiendo que revisemos las premisas antes de enviar el estimado',
        'recomiendo que revisemos los supuestos antes de enviar la estimación',
      ],
      distractors: [
        {
          answer: 'Recomiendo que revisamos los supuestos antes de enviar el estimado.',
          feedback:
            '«Recomendar que» is a verb of influence and takes the subjunctive: revisemos.',
        },
      ],
      explanation:
        'Verbs of recommendation, suggestion and advice all take the subjunctive: recomendar que, sugerir que, aconsejar que, proponer que.\n\nEnglish has a subjunctive here too — "I recommend that we review", not "that we reviewed" — but it is invisible in most persons, so it gives you no help.\n\nThe second clause uses an infinitive rather than a subjunctive because the subject does not change: we are doing both the sending and the reviewing, so «antes de enviar» is correct and «antes de que enviemos» would be unnaturally heavy. Same subject takes the infinitive; different subjects take «que» and a conjugated verb.\n\n«Los supuestos» is the standard term for assumptions in a technical or commercial proposal. «Las premisas» is also used and is slightly more formal.',
    },
  },
  {
    topicId: 'b1.mood.subj_presente',
    kind: 'drill_error_spot',
    difficulty: 4,
    targetsError: null,
    payload: {
      prompt: 'One clause has the wrong mood. Rewrite the sentence.',
      context: 'Stating what you believe and what you doubt in the same breath.',
      sentence: 'Creo que el cronograma sea realista, aunque no estoy seguro de que alcanza el plazo.',
      answer:
        'Creo que el cronograma es realista, aunque no estoy seguro de que alcance el plazo.',
      distractors: [
        {
          answer: 'Creo que el cronograma es realista, aunque no estoy seguro de que alcanza el plazo.',
          feedback:
            'The first clause is fixed but the second is not. «No estar seguro de que» expresses doubt, so it takes the subjunctive: alcance.',
        },
      ],
      explanation:
        'Both clauses are wrong, in opposite directions, which is the useful shape for this drill.\n\n«Creer que» in the affirmative is an assertion — you are claiming the schedule is realistic — so it takes the indicative: «creo que es realista». Negate it and the assertion disappears: «no creo que sea realista» takes the subjunctive.\n\n«No estar seguro de que» works the other way round. The negation puts it into doubt, so the subjunctive follows: «no estoy seguro de que alcance». Affirmative «estoy seguro de que alcanza» would take the indicative.\n\nThe rule underneath both is the same one: assert with the indicative, withhold assertion with the subjunctive. Negation flips which one applies, so the tell is not the verb but whether the sentence commits to the claim.',
    },
  },
  {
    topicId: 'b1.mood.subj_presente',
    kind: 'drill_translate',
    difficulty: 5,
    targetsError: null,
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Setting a condition on a commitment in a negotiation.',
      sentence: 'We will start on Monday provided that the client confirms the budget.',
      answer: 'Empezamos el lunes siempre y cuando el cliente confirme el presupuesto.',
      accept: [
        'empezaremos el lunes siempre y cuando el cliente confirme el presupuesto',
        'empezamos el lunes siempre que el cliente confirme el presupuesto',
      ],
      distractors: [
        {
          answer: 'Empezamos el lunes siempre y cuando el cliente confirma el presupuesto.',
          feedback:
            '«Siempre y cuando» sets a condition that has not been met yet, so it always takes the subjunctive: confirme.',
        },
      ],
      explanation:
        '«Siempre y cuando» — provided that, as long as — always takes the subjunctive, without exception, because it names a condition rather than a fact. The same holds for «a condición de que», «con tal de que», «a menos que», «en caso de que» and «sin que».\n\nIt is one of the highest-value phrases in your professional register, because it lets you make a commitment conditional without sounding evasive. «Empezamos el lunes siempre y cuando el cliente confirme» is firm and precise; the conditional «empezaríamos» would be neither.\n\nNote the present indicative in the main clause. Spanish uses the present for scheduled near-future events far more freely than English does — «empezamos el lunes» is entirely natural for a future start, and «empezaremos» is only slightly more formal.\n\n«Siempre que» is a shorter alternative, but be aware it is ambiguous: with the indicative it means "whenever", and only with the subjunctive does it mean "provided that".',
    },
  },

  /* ================= b1.pron.od_oi ================= */
  {
    topicId: 'b1.pron.od_oi',
    kind: 'drill_transform',
    difficulty: 2,
    targetsError: null,
    payload: {
      prompt: 'Replace the underlined object with a pronoun: «el informe».',
      context: 'Answering a question about a document you already sent.',
      sentence: 'Enviamos el informe ayer.',
      answer: 'Lo enviamos ayer.',
      distractors: [
        {
          answer: 'Enviamos lo ayer.',
          feedback:
            'Object pronouns go before a conjugated verb, never after it. «Lo enviamos», not «enviamos lo».',
        },
        {
          answer: 'Le enviamos ayer.',
          feedback:
            '«Le» is for indirect objects — the recipient. «El informe» is what was sent, so it is a direct object: «lo».',
        },
      ],
      explanation:
        'Direct object pronouns replace the thing acted on: lo, la, los, las. «El informe» is masculine singular, so it becomes «lo».\n\nPosition is fixed and is the half that English speakers get wrong. Before a conjugated verb the pronoun goes in front, as a separate word: «lo enviamos», «la revisé», «los aprobaron». It attaches to the end only in three cases: an infinitive («enviarlo»), a gerund («enviándolo») and an affirmative command («envíalo»).\n\nWith a two-verb structure you get a genuine choice: «lo vamos a enviar» or «vamos a enviarlo», both correct and both common. What is never possible is placing it between the two verbs.\n\nIndirect object pronouns are a different set — me, te, le, nos, les — and mark the recipient rather than the thing. «Le enviamos el informe» tells you who received it.',
    },
  },
  {
    topicId: 'b1.pron.od_oi',
    kind: 'drill_cloze',
    difficulty: 3,
    targetsError: null,
    payload: {
      prompt: 'Complete with the correct pronoun.',
      context: 'Confirming an action to a colleague.',
      sentence: '¿Los planos actualizados? Ya ___ mandé al contratista esta mañana.',
      answer: 'se los',
      distractors: [
        {
          answer: 'les los',
          feedback:
            'Spanish never allows «le los» or «les los». When an indirect «le/les» meets a direct «lo/la/los/las», the indirect one becomes «se».',
        },
        {
          answer: 'los',
          feedback:
            'That drops the recipient. Both objects are present here — the drawings and the contractor — so you need both pronouns: «se los».',
        },
      ],
      explanation:
        'When both objects become pronouns, the indirect one comes first and the direct one second: «me lo», «te la», «nos los». But «le» and «les» cannot stand before an l-pronoun, so they change to «se»: «se lo», «se la», «se los», «se las».\n\nThe reason is purely phonetic — «le lo» was avoided historically for how it sounded — which is why the rule looks arbitrary and has to be memorised rather than derived.\n\nThe cost is ambiguity: «se los mandé» could mean you sent them to him, to her, to you (usted) or to them. Spanish resolves it by adding the phrase back: «se los mandé al contratista», «se los mandé a ellos». That is not redundancy, it is how the language repairs the information the «se» destroyed.\n\nNote that this «se» has nothing to do with the reflexive «se». Same spelling, unrelated job.',
    },
  },
  {
    topicId: 'b1.pron.od_oi',
    kind: 'drill_translate',
    difficulty: 4,
    targetsError: null,
    payload: {
      prompt: 'Translate into Spanish, using pronouns for both objects.',
      context: 'Confirming a handover. «It» is el expediente; «them» is the supervision team.',
      sentence: 'I gave it to them yesterday, at the site meeting.',
      answer: 'Se lo di ayer, en la reunión de obra.',
      accept: ['se lo entregué ayer, en la reunión de obra', 'se lo di ayer en la reunión de obra'],
      distractors: [
        {
          answer: 'Lo les di ayer, en la reunión de obra.',
          feedback:
            'The order is wrong and the form is impossible. Indirect comes first, and before «lo» it must become «se»: «se lo di».',
        },
      ],
      explanation:
        'Two pronouns, and both rules apply at once: indirect before direct, and «les» becoming «se» in front of «lo».\n\n«Di» is the preterite of dar, and it is one of the few forms in Spanish that takes no written accent despite being a single stressed syllable — di, vi, fui. The accentless spelling is correct.\n\nIf the recipient is not clear from context you would restore it: «se lo di a ellos ayer». Spanish is comfortable with that apparent duplication precisely because «se» is uninformative.\n\nEnglish word order — "gave it to them" — puts the direct object first, which is the reverse of Spanish. That inversion is the single most reliable source of errors in this construction, so it is worth drilling until the Spanish order is automatic rather than translated.',
    },
  },
  {
    topicId: 'b1.pron.od_oi',
    kind: 'drill_error_spot',
    difficulty: 4,
    targetsError: null,
    payload: {
      prompt: 'Correct the pronoun placement.',
      context: 'Explaining what you are about to do.',
      sentence: 'Voy a enviar le la valorización al cliente hoy mismo.',
      answer: 'Voy a enviarle la valorización al cliente hoy mismo.',
      accept: ['le voy a enviar la valorización al cliente hoy mismo'],
      distractors: [
        {
          answer: 'Voy le a enviar la valorización al cliente hoy mismo.',
          feedback:
            'The pronoun can go before the whole verb phrase or attached to the infinitive — never between the two verbs.',
        },
      ],
      explanation:
        'With «ir a + infinitive» the pronoun has two legal positions and one illegal one. Attached to the infinitive as a single written word: «voy a enviarle». Or before the entire phrase: «le voy a enviar». It can never sit loose between them, and it is never written as a separate word after the infinitive.\n\nBoth legal versions are equally correct and equally common. Attaching is marginally more formal in writing; fronting is marginally more common in speech.\n\nWhen attaching pushes the stress three syllables from the end, a written accent appears: «enviándole», «entregándoselo». That does not happen with a plain infinitive plus one pronoun, so «enviarle» takes none.\n\nNote «le» alongside «al cliente» — the doubled indirect object again, obligatory rather than redundant.',
    },
  },

  /* ================= b1.syntax.relativos ================= */
  {
    topicId: 'b1.syntax.relativos',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: null,
    payload: {
      prompt: 'Complete with the correct relative pronoun.',
      context: 'Identifying which of several documents you mean.',
      sentence: 'El informe ___ enviamos el martes ya tiene los comentarios de la supervisión.',
      answer: 'que',
      distractors: [
        {
          answer: 'cual',
          feedback:
            '«Cual» never stands alone. It needs an article — «el cual» — and in a short defining clause like this, plain «que» is what Spanish uses.',
        },
      ],
      explanation:
        '«Que» is the default relative pronoun and covers most cases. It works for people and things, as subject or object, and it never changes form: el informe que enviamos, la carta que llegó, los ingenieros que vinieron.\n\nSpanish differs from English in one respect that matters constantly: «que» can never be omitted. English drops it freely — "the report we sent" — and that omission is the most frequent English-speaker error in relative clauses. «El informe enviamos» is not a sentence.\n\n«El cual», «la cual», «los cuales» exist and are more formal. They earn their place after a preposition, especially a long one: «el criterio según el cual se valorizó», «la reunión durante la cual se acordó el cambio». In a short defining clause they sound stilted.\n\nAfter a short preposition, «el que» and «que» compete: «la carpeta en la que está el plano» or «la carpeta en que está el plano». Both are correct; the first is more common in speech.',
    },
  },
  {
    topicId: 'b1.syntax.relativos',
    kind: 'drill_cloze',
    difficulty: 3,
    targetsError: null,
    payload: {
      prompt: 'Complete with the correct form.',
      context: 'Referring to a company by its representative.',
      sentence: 'Trabajamos con un contratista ___ certificaciones vencieron el mes pasado.',
      answer: 'cuyas',
      distractors: [
        {
          answer: 'que sus',
          feedback:
            'That is the spoken workaround, and it is not accepted in writing. Spanish has a dedicated possessive relative: «cuyas».',
        },
        {
          answer: 'cuyos',
          feedback:
            '«Cuyo» agrees with the thing possessed, not the possessor. «Certificaciones» is feminine plural, so it is «cuyas».',
        },
      ],
      explanation:
        '«Cuyo» is the possessive relative — "whose" — and it agrees with the thing possessed, never with the owner. «Un contratista cuyas certificaciones»: contratista is masculine singular, but certificaciones is feminine plural, and «cuyas» follows the certificates.\n\nThat agreement rule is the whole difficulty, and it is counterintuitive because English "whose" is invariable and points at the owner.\n\nThe forms are cuyo, cuya, cuyos, cuyas, and no article ever appears between «cuyo» and its noun: «cuyas certificaciones», never «cuyas las certificaciones».\n\nIn speech you will hear «que sus» instead — «un contratista que sus certificaciones vencieron». It is widespread and it is not acceptable in written or professional Spanish, so it is worth learning «cuyo» properly rather than relying on the workaround. This is also a B2 exam marker: using «cuyo» correctly is one of the cheapest ways to signal the level in a written task.',
    },
  },
  {
    topicId: 'b1.syntax.relativos',
    kind: 'drill_translate',
    difficulty: 4,
    targetsError: null,
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Describing a contractual mechanism.',
      sentence: 'This is the clause under which the client can suspend the work.',
      answer: 'Esta es la cláusula según la cual el cliente puede suspender los trabajos.',
      accept: [
        'ésta es la cláusula según la cual el cliente puede suspender los trabajos',
        'esta es la cláusula en virtud de la cual el cliente puede suspender los trabajos',
      ],
      distractors: [
        {
          answer: 'Esta es la cláusula que el cliente puede suspender los trabajos.',
          feedback:
            'The relative has to carry the preposition. Without «según la cual» the sentence says the client can suspend the clause.',
        },
      ],
      explanation:
        'This is where «el cual» earns its keep. After a multi-syllable preposition — según, mediante, durante, respecto a, en virtud de — Spanish strongly prefers «el cual / la cual» over «el que».\n\nThe preposition must be part of the relative phrase and cannot be stranded at the end. English allows "the clause the client can suspend the work under"; Spanish never does. The preposition travels with the relative pronoun, always.\n\n«La cual» is feminine singular because it refers to «la cláusula». The agreement is with the antecedent here, unlike «cuyo».\n\nA register note: «en virtud de la cual» is the phrase you will meet in actual contracts and is worth recognising even if you would not write it. «Según la cual» is the neutral choice for a meeting.',
    },
  },

  /* ================= b1.discourse.conectores_1 ================= */
  {
    topicId: 'b1.discourse.conectores_1',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: null,
    payload: {
      prompt: 'Complete with the connector the logic requires.',
      context: 'Explaining a consequence in a status report.',
      sentence: 'El proveedor no confirmó la fecha; ___ , reprogramamos el vaciado para el jueves.',
      answer: 'por lo tanto',
      accept: ['por tanto', 'en consecuencia', 'por consiguiente'],
      distractors: [
        {
          answer: 'sin embargo',
          feedback:
            '«Sin embargo» marks a contrast. The second clause is a consequence of the first, not a contrast with it.',
        },
      ],
      explanation:
        'The relationship is cause and effect, so the connector must be consequential: por lo tanto, por consiguiente, en consecuencia, de modo que.\n\nRegister separates them. «Por lo tanto» is the neutral, all-purpose choice and works in speech and writing alike. «Por consiguiente» and «en consecuencia» are more formal and belong in written reports. «Así que» is the informal counterpart and is fine in a call but out of place in a letter to a client.\n\nPunctuation matters here and is a common source of lost marks. These connectors take a semicolon or a full stop before them and a comma after: «no confirmó la fecha; por lo tanto, reprogramamos». A bare comma before «por lo tanto» is a comma splice in Spanish just as in English.\n\n«Reprogramar» is the standard verb for rescheduling an activity — «reprogramamos el vaciado», «la reunión se reprogramó».',
    },
  },
  {
    topicId: 'b1.discourse.conectores_1',
    kind: 'drill_transform',
    difficulty: 3,
    targetsError: null,
    payload: {
      prompt: 'Join the two sentences with a concessive connector, keeping both facts.',
      context: 'Reporting mixed progress.',
      sentence: 'Avanzamos con la estructura. El acabado sigue retrasado.',
      answer: 'Avanzamos con la estructura; sin embargo, el acabado sigue retrasado.',
      accept: [
        'avanzamos con la estructura, pero el acabado sigue retrasado',
        'avanzamos con la estructura; no obstante, el acabado sigue retrasado',
      ],
      distractors: [
        {
          answer: 'Avanzamos con la estructura; por lo tanto, el acabado sigue retrasado.',
          feedback:
            '«Por lo tanto» makes the delay a consequence of the progress, which is not what the two facts say. The relationship is a contrast.',
        },
      ],
      explanation:
        'The two facts pull against each other, so the connector must be adversative: sin embargo, no obstante, pero, aunque.\n\nThey are not interchangeable in structure. «Pero» is a conjunction and joins two clauses with a comma: «avanzamos con la estructura, pero el acabado sigue retrasado». «Sin embargo» and «no obstante» are adverbials and need stronger punctuation before them: a semicolon or a full stop, then a comma.\n\nGetting that punctuation right is worth real marks in a B2 written task, and getting it wrong is one of the most visible errors an otherwise strong writer makes.\n\nIn register terms, «sin embargo» is the neutral written choice, «no obstante» is more formal, and «pero» is the everyday one. In a client report, «sin embargo» is almost always the right pick.',
    },
  },
  {
    topicId: 'b1.discourse.conectores_1',
    kind: 'drill_translate',
    difficulty: 4,
    targetsError: null,
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Opening a summary at the end of a meeting.',
      sentence: 'In short, the schedule holds, although the cost needs to be revisited.',
      answer: 'En resumen, el cronograma se mantiene, aunque el costo debe revisarse.',
      accept: [
        'en resumen, el cronograma se mantiene, aunque hay que revisar el costo',
        'en síntesis, el cronograma se mantiene, aunque el costo debe revisarse',
      ],
      distractors: [
        {
          answer: 'En resumen, el cronograma se mantiene, aunque el costo debe ser revisado.',
          feedback:
            'Not wrong, but the passive with «ser» is heavy in Spanish. «Debe revisarse» is what a native writer reaches for.',
        },
      ],
      explanation:
        '«En resumen» is the standard summarising connector. «En síntesis» and «en conclusión» are alternatives; «para resumir» is fine in speech.\n\n«Aunque» takes the indicative when the concession is a fact — and the cost really does need revisiting, so «debe» is indicative here. With the subjunctive, «aunque deba revisarse» would mean "even if it should need revisiting", presenting it as hypothetical. That contrast is a B2-level distinction and one worth having deliberately.\n\nThe reflexive passive «revisarse» is the idiomatic way to say something must be reviewed without naming who reviews it. Spanish prefers «se» constructions where English uses the passive: «se debe revisar el costo», «el costo debe revisarse», «hay que revisar el costo». All three are more natural than «debe ser revisado».\n\n«El cronograma se mantiene» — "the schedule holds" — is a useful fixed phrase for status reporting.',
    },
  },

  /* ================= b2.mood.subj_imperfecto (topic block) ================= */
  {
    topicId: 'b2.mood.subj_imperfecto',
    kind: 'drill_conjugation',
    difficulty: 2,
    targetsError: null,
    payload: {
      prompt: 'Follow the derivation and complete the sentence.',
      context: 'The form is built from the preterite. Weighing an option with the client.',
      sentence:
        'poder → (ellos, pretérito) pudieron → Si ___ adelantar el vaciado, ganaríamos una semana.',
      answer: 'pudiéramos',
      accept: ['pudiésemos'],
      distractors: [
        {
          answer: 'podríamos',
          feedback:
            'That is the conditional. The imperfect subjunctive comes from the preterite stem: pudieron → pudiéramos.',
          errorCode: 'verb.futuro_vs_condicional',
        },
        {
          answer: 'pudieramos',
          feedback:
            'The form is right but the accent is missing. Every nosotros imperfect subjunctive carries one: pudiéramos, tuviéramos, fuéramos.',
        },
      ],
      explanation:
        'The derivation is mechanical and has no exceptions anywhere in the language. Take the third-person plural preterite, drop -ron, and add -ra, -ras, -ra, -´ramos, -ran.\n\npudieron → pudiera, pudiéramos\ntuvieron → tuviera, tuviéramos\nfueron → fuera, fuéramos\ndijeron → dijera, dijéramos\ncondujeron → condujera, condujéramos\n\nEvery irregular preterite you already know becomes an irregular imperfect subjunctive for free. That is why this tense is cheaper to learn than it looks — the hard work was done when you learned the preterite.\n\nThe nosotros form always carries a written accent, because dropping -ron and adding -ramos puts the stress three syllables from the end. Forgetting it is not cosmetic: «pudieramos» would be stressed on the wrong syllable.\n\nThe -se forms (pudiésemos) are equally correct and sound literary. In Latin America the -ra forms dominate overwhelmingly.',
    },
  },
  {
    topicId: 'b2.mood.subj_imperfecto',
    kind: 'drill_cloze',
    difficulty: 3,
    targetsError: null,
    payload: {
      prompt: 'Complete with the imperfect subjunctive.',
      context: 'Reporting a requirement the client set last month.',
      sentence: 'Era necesario que el contratista ___ (presentar) el plan de seguridad antes de movilizar.',
      answer: 'presentara',
      accept: ['presentase'],
      distractors: [
        {
          answer: 'presentaba',
          feedback:
            '«Ser necesario que» is an impersonal expression of necessity and always takes the subjunctive, not the indicative.',
        },
      ],
      explanation:
        'Impersonal expressions of necessity, importance, possibility and value judgement all take the subjunctive: es necesario que, es importante que, es posible que, es mejor que, conviene que, hace falta que.\n\nWhen the impersonal expression is in the past, the subordinate clause follows it into the imperfect subjunctive: «es necesario que presente» becomes «era necesario que presentara».\n\nThe exceptions are the expressions that assert rather than evaluate: «es cierto que», «es evidente que», «es verdad que» all take the indicative, because they claim something is so. Negate them and they flip: «no es cierto que sea así».\n\n«Antes de movilizar» uses an infinitive because the subject is the same. «Movilizar» is the standard term for bringing crew and equipment onto site — «la movilización» is a billable line item in most contracts.',
    },
  },
  {
    topicId: 'b2.mood.subj_imperfecto',
    kind: 'drill_translate',
    difficulty: 5,
    targetsError: null,
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Softening a request to a senior client contact.',
      sentence: 'I would like you to review the assumptions before the committee meets.',
      answer: 'Quisiera que revisara los supuestos antes de que se reúna el comité.',
      accept: [
        'quisiera que revisaras los supuestos antes de que se reúna el comité',
        'me gustaría que revisara los supuestos antes de que se reúna el comité',
      ],
      distractors: [
        {
          answer: 'Quisiera que revise los supuestos antes de que se reúna el comité.',
          feedback:
            '«Quisiera» is a past subjunctive form, so its clause follows into the imperfect subjunctive: revisara.',
        },
      ],
      explanation:
        '«Quisiera» is the imperfect subjunctive of querer used as a politeness form, and it is one of the most useful single words in professional Spanish. It is softer than «quiero» and less tentative than «me gustaría», and it is exactly the register for a request to a client.\n\nBecause «quisiera» is itself a past subjunctive, the clause below it takes the imperfect subjunctive too: «quisiera que revisara». Using «revise» there is the most common error in this construction.\n\n«Revisara» here is the usted form, which is what the situation calls for. Note that Spanish drops the pronoun, so «que revisara» carries the "you" in the ending alone.\n\n«Antes de que» always takes the subjunctive, and «se reúna» is present subjunctive because the committee meeting is still ahead. Two different subjunctive tenses in one sentence, each licensed by its own trigger — which is what B2 control of this system actually looks like.',
    },
  },
];
