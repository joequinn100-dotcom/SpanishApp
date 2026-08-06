import type { SeedDrill } from './types';

/**
 * Warm-up drills — three per active error in SPEC §10.
 *
 * These are what the session opens with. Every item probes exactly one error
 * from the log, so a correct answer is evidence that error was avoided and a
 * wrong one is evidence it was committed. That link is the whole reason the
 * warm-up exists (SPEC §4).
 *
 * Every `distractor` is a wrong answer this learner has actually produced,
 * taken from the `wrong` field of the error it belongs to. A drill whose wrong
 * answers are invented teaches nothing, because the learner never reaches for
 * them.
 *
 * Context rule (SPEC §11): construction, engineering, client negotiation,
 * budget, multi-country coordination. Never generic.
 */
export const ERROR_DRILLS: SeedDrill[] = [
  /* ============ noun.gender_agreement ============ */
  {
    topicId: 'a1.noun.genero',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: 'noun.gender_agreement',
    payload: {
      prompt: 'Complete the noun phrase.',
      context: 'Opening line of a progress note to the client.',
      sentence: 'El contratista programó ___ demostración del sistema contra incendios para el jueves.',
      answer: 'una',
      distractors: [
        {
          answer: 'un',
          feedback:
            'Demostración is feminine. Nouns ending in -ión are feminine almost without exception — la demostración, la fusión, la licitación, la valorización, la supervisión — so the article and the adjective both have to be feminine.',
          errorCode: 'noun.gender_agreement',
        },
      ],
      explanation:
        'Gender belongs to the noun, and every word that modifies it must agree: article, demonstrative, quantifier and adjective, however far from the noun they sit.\n\nThe -ión ending is one of the reliable ones: it is feminine in effectively every case you will meet at work — la construcción, la instalación, la negociación, la ampliación, la observación. Because the ending is predictable, the article is too, which makes this one of the few gender questions you never have to memorise word by word.\n\nNote that nothing before the blank tells you the gender — that is deliberate. In real writing the article is committed to before the noun arrives, and a wrong guess then propagates through everything that agrees with it: «un nuevo demostración» is one mistake showing up twice. Storing nouns as article + noun — «la demostración», not «demostración» — removes the guess at source.',
    },
  },
  {
    topicId: 'a1.noun.genero',
    kind: 'drill_error_spot',
    difficulty: 3,
    targetsError: 'noun.gender_agreement',
    payload: {
      prompt: 'This sentence has one agreement error. Write the sentence corrected.',
      context: 'Site report.',
      sentence: 'Registramos muchas choques entre las tuberías y la estructura metálica.',
      answer: 'Registramos muchos choques entre las tuberías y la estructura metálica.',
      accept: ['registramos muchos choques entre las tuberias y la estructura metalica'],
      distractors: [
        {
          answer: 'Registramos muchas choques entre los tuberías y la estructura metálica.',
          feedback:
            'Tubería is feminine — «las tuberías» was already right. The error is «muchas choques»: choque is masculine.',
          errorCode: 'noun.gender_agreement',
        },
      ],
      explanation:
        'Choque is masculine, so the quantifier must be «muchos». The -e ending gives no information about gender in either direction — el choque, el informe, el avance, el detalle, el margen are masculine; la gente, la clave, la fase, la base, la red are feminine — which is why -e nouns have to be learned with their article rather than reasoned about.\n\nNote what is *not* wrong in the original: «las tuberías» and «la estructura metálica» both agree correctly. Agreement errors cluster on the noun you were least sure of, and the rest of the sentence usually survives. When you proofread, check each noun phrase as a unit rather than scanning the sentence for anything that looks off.\n\nIn a clash-detection context this vocabulary recurs constantly, so it is worth fixing as a set: el choque, la interferencia, el cruce, la colisión, el desfase.',
    },
  },
  {
    topicId: 'a1.noun.genero',
    kind: 'drill_translate',
    difficulty: 3,
    targetsError: 'noun.gender_agreement',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Summarising a corporate change to the site team.',
      sentence: 'The merger of the two contractors created a lot of uncertainty.',
      answer: 'La fusión de los dos contratistas creó mucha incertidumbre.',
      accept: [
        'la fusión de los dos contratistas generó mucha incertidumbre',
      ],
      distractors: [
        {
          answer: 'El fusión de los dos contratistas creó mucho incertidumbre.',
          feedback:
            'Both nouns are feminine: la fusión (-ión) and la incertidumbre (-umbre). Two endings, two reliable rules.',
          errorCode: 'noun.gender_agreement',
        },
      ],
      explanation:
        'Two of the dependable gender endings appear in one short sentence. Nouns in -ión are feminine (la fusión, la adquisición, la ampliación); nouns in -umbre are feminine as well (la incertidumbre, la costumbre, la cumbre, la muchedumbre).\n\nIncertidumbre is uncountable here, so it takes «mucha» rather than «muchas» — English "a lot of" hides the count distinction that Spanish makes visible. If you were counting discrete unknowns you would say «muchas incógnitas» or «muchos puntos abiertos» instead.\n\nCreó and generó are both natural; generó is slightly more formal and is what you would more often see in written corporate Spanish. Avoid «causó» here unless you mean to assign blame — it carries a negative attribution that «generó» does not.',
    },
  },

  /* ============ noun.greek_ma ============ */
  {
    topicId: 'a1.noun.genero',
    kind: 'drill_cloze',
    difficulty: 1,
    targetsError: 'noun.greek_ma',
    payload: {
      prompt: 'Choose the correct article.',
      context: 'Raising an issue in a coordination meeting.',
      sentence: 'Quiero plantear ___ tema del acceso vehicular antes de cerrar la reunión.',
      answer: 'el',
      distractors: [
        {
          answer: 'la',
          feedback:
            'Tema is masculine. It belongs to the closed Greek -ma group, where the -a is the tail of a Greek ending rather than the Spanish feminine marker.',
          errorCode: 'noun.greek_ma',
        },
      ],
      explanation:
        'A short, closed set of nouns ending in -ma is masculine: el tema, el problema, el sistema, el programa, el esquema, el diagrama, el cronograma, el clima, el idioma, el síntoma, el dilema, el teorema.\n\nThey came into Spanish from Greek neuter nouns in -ma, which Latin absorbed as masculine. The -a is therefore not the feminine ending at all — it is the last letter of a borrowed Greek suffix that happens to look like one.\n\nThe set being closed is what makes it learnable: you memorise a list rather than a rule. And the test is etymological, not phonetic, so plenty of other -ma nouns are ordinary feminines — la cama, la firma, la forma, la norma, la víctima, la plataforma. Half of the work here is knowing which -ma words are *not* in the group.',
    },
  },
  {
    topicId: 'a1.noun.genero',
    kind: 'drill_error_spot',
    difficulty: 2,
    targetsError: 'noun.greek_ma',
    payload: {
      prompt: 'Correct the sentence.',
      context: 'Escalating a recurring issue by email.',
      sentence: 'Tenemos una problema seria con la programa de entregas.',
      answer: 'Tenemos un problema serio con el programa de entregas.',
      distractors: [
        {
          answer: 'Tenemos un problema seria con el programa de entregas.',
          feedback:
            'The article was fixed but the adjective was not. Gender runs through the whole phrase: un problema serio.',
          errorCode: 'noun.greek_ma',
        },
      ],
      explanation:
        'Both problema and programa are Greek -ma masculines, so both the article and the adjective change: un problema serio, el programa de entregas.\n\nThis is the version of the error that costs most, because it shows agreement decaying across the phrase. Fixing «una» to «un» while leaving «seria» produces a sentence that is still wrong and now looks careless rather than uncertain. Gender is a property of the noun and it propagates to every modifier: este problema técnico, los mismos temas presupuestales, un cronograma ajustado.\n\nNote «de entregas» in the plural: Spanish uses a bare plural noun in this complement where English would say "the delivery schedule". «El programa de entrega» would read as a single specific handover.',
    },
  },
  {
    topicId: 'a1.noun.genero',
    kind: 'drill_translate',
    difficulty: 3,
    targetsError: 'noun.greek_ma',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Explaining a delay to a client.',
      sentence: 'The updated schedule solves the same problem in a different way.',
      answer: 'El cronograma actualizado resuelve el mismo problema de otra manera.',
      accept: [
        'el cronograma actualizado soluciona el mismo problema de otra manera',
        'el cronograma actualizado resuelve el mismo problema de una manera distinta',
      ],
      distractors: [
        {
          answer: 'La cronograma actualizada resuelve la misma problema de otra manera.',
          feedback:
            'Cronograma and problema are both in the Greek -ma group, so both are masculine and both drag their modifiers with them.',
          errorCode: 'noun.greek_ma',
        },
      ],
      explanation:
        'Cronograma and problema are both Greek -ma masculines. Every modifier follows: el cronograma actualizado, el mismo problema.\n\n«De otra manera» is the idiomatic rendering of "in a different way" — note that Spanish takes «otra» with no article, so «de una otra manera» is not possible. This is the same article rule that makes "another meeting" into «otra reunión», never «una otra reunión».\n\nResolver and solucionar are interchangeable here. Resolver is the higher-frequency choice in professional writing across Latin America; solucionar is slightly more concrete and pairs naturally with a specific fault rather than an abstract difficulty.',
    },
  },

  /* ============ verb.preterito_persona (severity 5) ============ */
  {
    topicId: 'b1.verb.preterito',
    kind: 'drill_conjugation',
    difficulty: 2,
    targetsError: 'verb.preterito_persona',
    payload: {
      prompt: 'Put the verb in the preterite for the subject given.',
      context: 'Attributing a decision in the minutes of a meeting.',
      sentence: 'El supervisor ___ (aprobar) el cambio de especificación.',
      answer: 'aprobó',
      distractors: [
        {
          answer: 'aprobé',
          feedback:
            'That is the yo form — it says *I* approved the change. The subject is «el supervisor», so the ending is -ó.',
          errorCode: 'verb.preterito_persona',
        },
        {
          answer: 'aprobo',
          feedback:
            'The ending is right but the accent is missing, and here it is not decoration: «aprobo» without the accent is not a preterite form at all.',
          errorCode: 'verb.preterito_persona',
        },
      ],
      explanation:
        'In the preterite, person is carried entirely by the ending, and the two singular endings differ only in the stressed vowel: -é (yo) against -ó (él, ella, usted) for -ar verbs, and -í (yo) against -ió (él, ella, usted) for -er and -ir verbs.\n\nyo aprobé, revisé, coordiné, firmé — él aprobó, revisó, coordinó, firmó.\nyo escribí, cumplí, recibí — él escribió, cumplió, recibió.\n\nThis is the most expensive error in your log because it does not merely sound wrong, it reassigns responsibility. «Yo aprobé el cambio» and «el supervisor aprobó el cambio» are both perfectly grammatical, and they name different people. In an acta, a claim file or a status report, that is a change of fact.\n\nThe written accent is load-bearing in both persons and gives no disambiguating help, since both forms carry one. Under speaking pressure the fix is procedural rather than grammatical: settle the subject before you start the verb, then pick the vowel — yo takes é or í, él takes ó or ió.',
    },
  },
  {
    topicId: 'b1.verb.preterito',
    kind: 'drill_error_spot',
    difficulty: 4,
    targetsError: 'verb.preterito_persona',
    payload: {
      prompt: 'The verb names the wrong person. Rewrite the sentence.',
      context: 'You are reporting what the client did, not what you did.',
      sentence: 'El cliente revisé los planos y devolví los comentarios el viernes.',
      answer: 'El cliente revisó los planos y devolvió los comentarios el viernes.',
      distractors: [
        {
          answer: 'El cliente revisó los planos y devolví los comentarios el viernes.',
          feedback:
            'Half fixed. Both verbs share the subject «el cliente», so both take the third-person ending: revisó and devolvió.',
          errorCode: 'verb.preterito_persona',
        },
      ],
      explanation:
        'Both verbs hang off the same subject, so both take third-person endings — and note that they take *different* vowels, because revisar is -ar (revisó) and devolver is -er (devolvió).\n\nThat is the detail this error hides behind. Once you know «él» takes an accented ending, there is still a choice to make: -ó for -ar verbs and -ió for -er/-ir verbs. Getting the person right but the conjugation class wrong produces «devolvó», which is not a word.\n\nThe second half of the sentence is where the error survives correction, because the subject is not repeated. Spanish drops repeated subjects freely, so a coordinated clause inherits the subject silently — and an inherited subject is exactly the one your ending is most likely to disagree with. When you proofread a compound sentence, say the subject out loud before each verb.',
    },
  },
  {
    topicId: 'b1.verb.preterito',
    kind: 'drill_translate',
    difficulty: 4,
    targetsError: 'verb.preterito_persona',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Clarifying who did what after a disputed instruction.',
      sentence: 'I sent the drawings on Monday and she approved them on Wednesday.',
      answer: 'Envié los planos el lunes y ella los aprobó el miércoles.',
      accept: [
        'yo envié los planos el lunes y ella los aprobó el miércoles',
        'mandé los planos el lunes y ella los aprobó el miércoles',
      ],
      distractors: [
        {
          answer: 'Envió los planos el lunes y ella los aprobé el miércoles.',
          feedback:
            'The two endings are swapped. «Yo» takes -é (envié); «ella» takes -ó (aprobó).',
          errorCode: 'verb.preterito_persona',
        },
      ],
      explanation:
        'The sentence deliberately puts the two persons next to each other, because that is where the collapse happens: envié (yo) against aprobó (ella).\n\nThree things are worth noticing. First, «ella» is stated rather than dropped — Spanish omits subject pronouns by default, but keeps them exactly when the subject changes or contrast matters, which is the case here. Second, the object pronoun «los» goes before the conjugated verb: «los aprobó», never «aprobó los». Third, days of the week take «el» and no preposition: «el lunes», not «en lunes».\n\nEnviar and mandar are both natural in Latin American professional Spanish. Enviar is a shade more formal and is the safer default in writing to a client.',
    },
  },

  /* ============ mood.subj_leak_past ============ */
  {
    topicId: 'b1.verb.preterito',
    kind: 'drill_cloze',
    difficulty: 3,
    targetsError: 'mood.subj_leak_past',
    payload: {
      prompt: 'Complete with the correct form.',
      context: 'Reporting what actually happened last week.',
      sentence: 'La semana pasada ___ (comprar, nosotros) el material en Chile.',
      answer: 'compramos',
      distractors: [
        {
          answer: 'compremos',
          feedback:
            'That is the present subjunctive. Nothing in this sentence licenses a subjunctive — it narrates something that really happened, so it takes the indicative.',
          errorCode: 'mood.subj_leak_past',
        },
        {
          answer: 'compráramos',
          feedback:
            'Imperfect subjunctive, and again nothing licenses it. This form needs a trigger above it: «querían que compráramos…», «si compráramos…».',
          errorCode: 'mood.subj_leak_past',
        },
      ],
      explanation:
        'Narrating what actually happened is indicative, full stop. The subjunctive is never chosen for its own sake — something above it has to license it.\n\nThe licensers are a short list: a subordinating que after a verb of wish, influence, doubt or emotion (quería que llegaran); a hypothetical si (si tuviéramos más plazo); ojalá; cuando pointing at an unrealised future (cuando llegue el equipo); aunque conceding something unreal; and como si. With none of those present, a finished past event takes the preterite.\n\nThe mechanism behind this error is worth naming, because it is not ignorance. The -ramos and -emos forms feel more advanced, so under pressure they get reached for as a marker of sophistication — you are aiming up rather than guessing. The diagnostic is mechanical: if you could put «ayer» in front of the clause and it would still describe something that really happened, the verb is indicative.',
    },
  },
  {
    topicId: 'b1.verb.preterito',
    kind: 'drill_error_spot',
    difficulty: 4,
    targetsError: 'mood.subj_leak_past',
    payload: {
      prompt: 'One verb is in the wrong mood. Rewrite the sentence.',
      context: 'Explaining a delay in a weekly report.',
      sentence: 'Los planos llegaran tarde porque el proveedor cambió el alcance.',
      answer: 'Los planos llegaron tarde porque el proveedor cambió el alcance.',
      distractors: [
        {
          answer: 'Los planos llegaran tarde porque el proveedor cambiara el alcance.',
          feedback:
            'This moves in the wrong direction — now both verbs are subjunctive. «Porque» introducing a real, stated reason takes the indicative.',
          errorCode: 'mood.subj_leak_past',
        },
      ],
      explanation:
        '«Llegaran» is imperfect subjunctive; the sentence reports something that happened, so it needs the indicative: «llegaron». Mood is the only thing wrong here — the verb, the person and the tense are all already right, so the fix is a single vowel.\n\nThe subordinate clause matters too. «Porque» stating a real reason always takes the indicative: «porque el proveedor cambió el alcance». The subjunctive appears with «porque» only under negation, where the reason is being denied: «no lo hicimos porque nos lo pidieran, sino porque era necesario».\n\nThis is the shape of the error to watch for in your own writing: the leak usually lands on the main verb of a perfectly factual report, and the surrounding clause is untouched. If the sentence answers "what happened?", every verb in it is indicative unless a listed trigger says otherwise.',
    },
  },
  {
    topicId: 'b1.verb.preterito',
    kind: 'drill_transform',
    difficulty: 4,
    targetsError: 'mood.subj_leak_past',
    payload: {
      prompt:
        'Rewrite in the past, keeping the same meaning. Only the licensed clause stays subjunctive.',
      context: 'Reporting an instruction you were given.',
      sentence: 'El cliente quiere que reforcemos la cimentación y aprueba el costo adicional.',
      answer: 'El cliente quiso que reforzáramos la cimentación y aprobó el costo adicional.',
      accept: [
        'el cliente quiso que reforzásemos la cimentación y aprobó el costo adicional',
        'el cliente quería que reforzáramos la cimentación y aprobó el costo adicional',
      ],
      distractors: [
        {
          answer: 'El cliente quisiera que reforzáramos la cimentación y aprobara el costo adicional.',
          feedback:
            'Two problems. «Quiso/quería» is the reporting verb and is indicative; and «aprobó» is a second main verb, not a subordinate one, so it stays indicative too.',
          errorCode: 'mood.subj_leak_past',
        },
      ],
      explanation:
        'This item separates the licensed subjunctive from the leak. «Querer que» is a verb of influence, so its subordinate clause is genuinely subjunctive — and shifting the main verb to the past drags it into the imperfect subjunctive: quiere que reforcemos → quiso que reforzáramos. That is the sequence-of-tenses rule, and it is not optional.\n\nBut «aprueba» is a second *main* verb, coordinated with «quiere», not subordinated to it. It has no trigger above it, so it simply becomes the preterite: aprobó.\n\nNote the spelling change in reforzáramos: -zar verbs write c before e (reforcemos) and keep z before a (reforzáramos). It is orthography rather than morphology — the sound is unchanged, and Spanish spelling has no ze/zi in native words.\n\nBoth «quiso» and «quería» are defensible. «Quiso» presents the instruction as a single moment; «quería» presents it as a standing wish that framed the work.',
    },
  },

  /* ============ verb.participio_adj ============ */
  {
    topicId: 'b1.verb.presente_perfecto',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: 'verb.participio_adj',
    payload: {
      prompt: 'Complete with the correct form.',
      context: 'Confirming the status of a submittal.',
      sentence: 'El expediente ya está ___ (revisar) por la supervisión.',
      answer: 'revisado',
      distractors: [
        {
          answer: 'revisa',
          feedback:
            'That is a conjugated present-tense verb. After estar you need the participle, which is the adjectival form: revisado.',
          errorCode: 'verb.participio_adj',
        },
        {
          answer: 'revisando',
          feedback:
            'The gerund describes an action in progress. «Está revisando» means the file is doing the reviewing — you want the state that results from it: está revisado.',
          errorCode: 'verb.participio_adj',
        },
      ],
      explanation:
        'The participle (-ado for -ar verbs, -ido for -er/-ir) is the form that behaves like an adjective, and it is what follows estar to describe a resulting state: está revisado, está aprobado, está firmado, está terminado.\n\nAfter estar the participle agrees with the subject like any adjective: el expediente está revisado, la valorización está revisada, los planos están revisados. That agreement is the tell that it really is functioning adjectivally.\n\nContrast the two neighbouring forms. The conjugated finite verb states an action with a subject doing it: «la supervisión revisa el expediente». The gerund states an action in progress: «la supervisión está revisando el expediente». The participle states the state left behind: «el expediente está revisado». Three different claims, and only the third answers "is it done?"\n\nOne trap: after haber the participle never agrees. «Hemos revisado la valorización», not «revisada» — the agreement rule applies to the estar construction, not the perfect tense.',
    },
  },
  {
    topicId: 'b1.verb.presente_perfecto',
    kind: 'drill_error_spot',
    difficulty: 3,
    targetsError: 'verb.participio_adj',
    payload: {
      prompt: 'Correct the sentence.',
      context: 'Reporting completion to the client.',
      sentence: 'Los trabajos de excavación están termina desde el martes.',
      answer: 'Los trabajos de excavación están terminados desde el martes.',
      distractors: [
        {
          answer: 'Los trabajos de excavación están terminado desde el martes.',
          feedback:
            'The participle is now right but it does not agree. After estar it behaves as an adjective, so a plural subject takes «terminados».',
          errorCode: 'verb.participio_adj',
        },
      ],
      explanation:
        '«Termina» is a finite third-person present form — it needs its own subject doing the finishing. What the sentence describes is a state, so it needs the participle, and after estar the participle agrees in gender and number with the subject: los trabajos están terminados.\n\nThe agreement is what makes this drill worth doing twice. Learners fix the form and forget the ending, producing «están terminado», which is a second error rather than a correction.\n\n«Desde el martes» is the right preposition for a state that began at a point and continues: desde el martes, desde marzo, desde la última reunión. If you wanted to give the elapsed time instead of the starting point, Spanish uses «desde hace» with a continuing state: «los trabajos están terminados desde hace tres días». Bare «hace tres días» marks the moment an event happened, so it pairs with a preterite: «terminamos hace tres días».',
    },
  },
  {
    topicId: 'b1.verb.presente_perfecto',
    kind: 'drill_translate',
    difficulty: 3,
    targetsError: 'verb.participio_adj',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Short status line in a WhatsApp update to the site team.',
      sentence: 'The budget is approved but the contract is not signed yet.',
      answer: 'El presupuesto está aprobado pero el contrato todavía no está firmado.',
      accept: [
        'el presupuesto está aprobado pero el contrato aún no está firmado',
        'el presupuesto está aprobado, pero el contrato todavía no está firmado',
      ],
      distractors: [
        {
          answer: 'El presupuesto está aprueba pero el contrato todavía no está firma.',
          feedback:
            'Both verbs are finite present forms where participles belong: aprobado and firmado.',
          errorCode: 'verb.participio_adj',
        },
      ],
      explanation:
        'Two states, two participles: está aprobado, está firmado. Both agree with masculine singular subjects, so both end in -o here.\n\n«Todavía no» and «aún no» are equivalent for "not yet"; both go before the verb phrase, and «todavía no está firmado» is the neutral Latin American order. Putting «todavía» at the end — «no está firmado todavía» — is also correct and slightly more emphatic.\n\nThe useful contrast to keep in mind is with the perfect tense: «hemos aprobado el presupuesto» reports the action you took, «el presupuesto está aprobado» reports the state the document is in. In a status update the second is almost always what you want, because the client is asking about the document, not about your week.',
    },
  },

  /* ============ prep.despues_de ============ */
  {
    topicId: 'b1.prep.verbos_regimen',
    kind: 'drill_cloze',
    difficulty: 1,
    targetsError: 'prep.despues_de',
    payload: {
      prompt: 'Complete the sentence.',
      context: 'Sequencing two site activities.',
      sentence: 'Vamos a vaciar la losa ___ la inspección.',
      answer: 'después de',
      accept: ['tras'],
      distractors: [
        {
          answer: 'después',
          feedback:
            'Después needs «de» before a noun or an infinitive. Bare «después» only works as a standalone adverb: «lo revisamos después».',
          errorCode: 'prep.despues_de',
        },
      ],
      explanation:
        'Después is an adverb. To connect it to anything — a noun, a pronoun or an infinitive — it needs the preposition «de»: después de la inspección, después de firmar, después de eso.\n\nBare «después» is correct only when it stands alone with nothing following it: «primero vaciamos la losa y después revisamos los acabados». The moment a complement appears, «de» is obligatory.\n\nThe same pattern governs a whole family of adverbs that behave identically: antes de, dentro de, cerca de, lejos de, encima de, debajo de, además de, a pesar de. English attaches its complement directly ("after the inspection"), which is exactly why the «de» goes missing — there is nothing in the English to translate it from.\n\nOne further form to keep separate: when a full clause with its own subject follows, you need «después de que» — «después de que el cliente apruebe el cambio». And note that clause takes the subjunctive when it points at an unrealised future.',
    },
  },
  {
    topicId: 'b1.prep.verbos_regimen',
    kind: 'drill_error_spot',
    difficulty: 2,
    targetsError: 'prep.despues_de',
    payload: {
      prompt: 'Correct the sentence.',
      context: 'Explaining a sequence to the client.',
      sentence: 'Después la reunión enviamos el acta a todos los participantes.',
      answer: 'Después de la reunión enviamos el acta a todos los participantes.',
      distractors: [
        {
          answer: 'Después que la reunión enviamos el acta a todos los participantes.',
          feedback:
            '«Después de que» introduces a clause with its own conjugated verb. Here «la reunión» is just a noun, so the form you need is «después de».',
          errorCode: 'prep.despues_de',
        },
      ],
      explanation:
        'A noun follows, so the form is «después de la reunión».\n\nThe distinction to hold onto is what comes next. A noun or an infinitive takes «después de»: después de la reunión, después de revisar el acta. A full clause with its own conjugated verb takes «después de que»: después de que el cliente firme el acta.\n\nDropping the «de» from «después de que» — producing «después que» — is widespread in speech across Latin America and you will hear it constantly. It is not what you want in written professional Spanish, and it is not what a B2 examiner wants either, so keep the «de» in both forms.\n\n«Enviar el acta a los participantes» is the natural collocation. Note «el acta» with a masculine article despite being feminine: nouns beginning with a stressed a- take «el» in the singular for pronunciation (el acta, el agua, el área), but adjectives still agree as feminine — «el acta firmada», «las actas firmadas».',
    },
  },
  {
    topicId: 'b1.prep.verbos_regimen',
    kind: 'drill_translate',
    difficulty: 3,
    targetsError: 'prep.despues_de',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Setting a condition in a negotiation.',
      sentence: 'We will start after signing the addendum.',
      answer: 'Vamos a empezar después de firmar la adenda.',
      accept: [
        'empezaremos después de firmar la adenda',
        'vamos a comenzar después de firmar la adenda',
        'comenzaremos después de firmar la adenda',
      ],
      distractors: [
        {
          answer: 'Vamos a empezar después firmar la adenda.',
          feedback: 'The «de» is missing. An infinitive complement still needs it: después de firmar.',
          errorCode: 'prep.despues_de',
        },
      ],
      explanation:
        'An infinitive is a complement like any other, so «de» is required: después de firmar.\n\nThis is also a reminder of the wider rule that any preposition in Spanish takes the infinitive, never a conjugated verb and never a gerund: antes de firmar, sin firmar, para firmar, al firmar. English uses -ing after prepositions ("after signing"), which is why the gerund «firmando» feels right and is wrong.\n\n«Al + infinitive» is worth knowing as a compact alternative for simultaneity: «al firmar la adenda, arrancamos» means "on signing the addendum, we start".\n\nOn vocabulary: «la adenda» is the standard term in Peruvian and broader Latin American contracting for a contract addendum. «El adéndum» appears too — note the accent, since Spanish spells the Latinism with one — but «la adenda» is what you will see in contracts here.',
    },
  },

  /* ============ pron.reflexive_dropped ============ */
  {
    topicId: 'a1.pron.reflexivos_basico',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: 'pron.reflexive_dropped',
    payload: {
      prompt: 'Complete the sentence.',
      context: 'Proposing a meeting.',
      sentence: 'Quiero ___ con el equipo de Colombia antes del viernes.',
      answer: 'reunirme',
      distractors: [
        {
          answer: 'reunir',
          feedback:
            'Reunirse is inherently reflexive when it means "to meet". Without the pronoun, «reunir» means to gather things together and needs a direct object.',
          errorCode: 'pron.reflexive_dropped',
        },
      ],
      explanation:
        'A set of verbs carry a reflexive pronoun as part of their meaning, and dropping it either changes the meaning or breaks the sentence. Reunirse (to meet), quedarse (to stay), irse (to leave), darse cuenta (to realise), quejarse (to complain), comprometerse (to commit), encargarse (to take charge of), enterarse (to find out).\n\n«Reunir» without the pronoun is a different verb: it means to gather or assemble, and it needs a direct object — «reunimos los documentos». «Reunirse» means to meet with someone and takes «con».\n\nThe pronoun agrees with the subject, not the verb: quiero reunirme, quieres reunirte, queremos reunirnos. With an infinitive after a conjugated verb, you have a genuine choice of position — «quiero reunirme» (attached) or «me quiero reunir» (before the whole verb phrase). Both are correct and both are common; attaching it is marginally more formal in writing.\n\nWhat is *not* allowed is putting it between: «quiero me reunir» is impossible.',
    },
  },
  {
    topicId: 'a1.pron.reflexivos_basico',
    kind: 'drill_error_spot',
    difficulty: 2,
    targetsError: 'pron.reflexive_dropped',
    payload: {
      prompt: 'Correct the sentence.',
      context: 'Explaining a change of plan to the site team.',
      sentence: 'El ingeniero va a quedar en obra hasta que llegue el concreto.',
      answer: 'El ingeniero se va a quedar en obra hasta que llegue el concreto.',
      accept: ['el ingeniero va a quedarse en obra hasta que llegue el concreto'],
      distractors: [
        {
          answer: 'El ingeniero va a se quedar en obra hasta que llegue el concreto.',
          feedback:
            'The pronoun cannot sit between the conjugated verb and the infinitive. Either «se va a quedar» or «va a quedarse».',
          errorCode: 'pron.reflexive_dropped',
        },
      ],
      explanation:
        'Quedarse means to stay. Without the pronoun, «quedar» means something quite different — to be left over, to be located, or to arrange to meet: «quedan tres módulos», «la obra queda en San Isidro», «quedamos en vernos el lunes».\n\nWith a periphrasis like «ir a + infinitive», the pronoun has exactly two legal positions: before the whole verb phrase («se va a quedar») or attached to the infinitive («va a quedarse»). It can never sit inside, between the auxiliary and the infinitive.\n\nThe subordinate clause is doing something else worth noticing: «hasta que llegue» is subjunctive because the arrival has not happened yet. Time conjunctions pointing at an unrealised future — cuando, hasta que, en cuanto, apenas, después de que — all take the subjunctive. Had it already happened, it would be indicative: «se quedó hasta que llegó el concreto».',
    },
  },
  {
    topicId: 'a1.pron.reflexivos_basico',
    kind: 'drill_translate',
    difficulty: 4,
    targetsError: 'pron.reflexive_dropped',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Admitting an oversight in a meeting.',
      sentence: 'We realised that the supplier had changed the specification.',
      answer: 'Nos dimos cuenta de que el proveedor había cambiado la especificación.',
      accept: ['nos dimos cuenta que el proveedor había cambiado la especificación'],
      distractors: [
        {
          answer: 'Dimos cuenta que el proveedor había cambiado la especificación.',
          feedback:
            'Two pieces are missing: the reflexive pronoun «nos», and the «de» that «darse cuenta de» requires.',
          errorCode: 'pron.reflexive_dropped',
        },
      ],
      explanation:
        '«Darse cuenta de» is a fixed expression with two obligatory parts: the reflexive pronoun and the preposition «de». «Nos dimos cuenta de que…». Without the pronoun, «dar cuenta de» means to account for or report on something, which is a different claim entirely.\n\nDropping the «de» before «que» — «nos dimos cuenta que» — is extremely common in speech throughout Latin America and is generally tolerated in writing, but keeping it is the safer choice in a professional or exam register.\n\nThe subordinate clause takes the pluperfect: «había cambiado». The change happened before the realising, and Spanish marks that ordering with «haber» in the imperfect plus the participle, just as English does with "had changed". Note that the participle after haber never agrees — «había cambiado la especificación», not «cambiada».',
    },
  },

  /* ============ lex.una_otra_vez ============ */
  {
    topicId: 'a1.noun.articulos',
    kind: 'drill_error_spot',
    difficulty: 1,
    targetsError: 'lex.una_otra_vez',
    payload: {
      prompt: 'Correct the sentence.',
      context: 'Asking for a rescheduled call.',
      sentence: '¿Podemos revisar el alcance en una otra reunión?',
      answer: '¿Podemos revisar el alcance en otra reunión?',
      distractors: [
        {
          answer: '¿Podemos revisar el alcance en una otra reunión más?',
          feedback: 'The problem is the article itself. «Otro/otra» never takes «un/una» in front of it.',
          errorCode: 'lex.una_otra_vez',
        },
      ],
      explanation:
        'Otro and otra never take an indefinite article. «Otra reunión», «otro plano», «otra semana» — never «una otra reunión».\n\nThe reason is that «otro» already contains the indefiniteness that «un» would supply; Spanish treats them as competing for the same slot. English "another" is literally an + other fused into one word, so the English form hides the article and you have nothing to warn you off adding a second one.\n\nThe definite article, by contrast, is perfectly normal and changes the meaning: «el otro plano» is the other one of a known pair, while «otro plano» is one more, unspecified. Both are correct and they mean different things.\n\nA similar preference applies to «cierto» in the singular: careful writing prefers «cierto riesgo» to «un cierto riesgo», though the article is not ungrammatical there — it is a style point, not a rule like «otro».',
    },
  },
  {
    topicId: 'a1.noun.articulos',
    kind: 'drill_translate',
    difficulty: 2,
    targetsError: 'lex.una_otra_vez',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Reporting a repeat problem.',
      sentence: 'The supplier missed the deadline another time.',
      answer: 'El proveedor incumplió el plazo otra vez.',
      accept: [
        'el proveedor incumplió el plazo una vez más',
        'el proveedor volvió a incumplir el plazo',
      ],
      distractors: [
        {
          answer: 'El proveedor incumplió el plazo una otra vez.',
          feedback: '«Otra vez» stands alone. The «una» has nothing to do.',
          errorCode: 'lex.una_otra_vez',
        },
      ],
      explanation:
        '«Otra vez» is the standard phrase for "again" and takes no article. «Una vez más» is the alternative and *does* take one, because there the article belongs to «vez» and «más» is doing the work of "another".\n\nThat pair is worth memorising together, since it shows the logic: otra vez / una vez más. Both are natural; «una vez más» is slightly more formal and carries a hint of patience running out, which may or may not be what you want in a client email.\n\nThe most idiomatic option of the three is «volver a + infinitive» — «volvió a incumplir el plazo». Spanish prefers this construction to an adverb where English says "again", and reaching for it is one of the clearest markers of a B2 speaker rather than a B1 one.\n\n«Incumplir el plazo» is the standard contractual collocation. «Perder el plazo» is a direct translation from English and does not carry the same force.',
    },
  },

  /* ============ verb.hace_ago ============ */
  {
    topicId: 'b1.verb.preterito',
    kind: 'drill_translate',
    difficulty: 3,
    targetsError: 'verb.hace_ago',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Answering a question about when something was submitted.',
      sentence: 'We submitted the valuation three weeks ago.',
      answer: 'Presentamos la valorización hace tres semanas.',
      accept: [
        'hace tres semanas presentamos la valorización',
        'entregamos la valorización hace tres semanas',
      ],
      distractors: [
        {
          answer: 'Presentamos la valorización antes tres semanas.',
          feedback: '«Antes» means "before", not "ago". "Ago" is «hace + time».',
          errorCode: 'verb.hace_ago',
        },
      ],
      explanation:
        'Spanish has no word for "ago". «Tres semanas atrás» is also correct and standard across Latin America, but the everyday form is «hace» — the third-person present of hacer — followed by the amount of time: hace tres semanas, hace un mes, hace dos años.\n\n«Hace» is frozen in the singular no matter how much time follows: «hace tres semanas», never «hacen tres semanas». It is not agreeing with anything; it is an impersonal form.\n\nIt can sit at either end of the sentence. «Presentamos la valorización hace tres semanas» and «Hace tres semanas presentamos la valorización» are both natural, with the fronted version putting slightly more weight on the elapsed time.\n\nTwo neighbouring constructions to keep separate. «Hace tres semanas que presentamos» means the same thing with «que». But «hace tres semanas que trabajamos en esto», with a *present* tense verb, means something different: we have been working on it for three weeks and still are. Same «hace», and the tense of the main verb is what decides.',
    },
  },
  {
    topicId: 'b1.verb.preterito',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: 'verb.hace_ago',
    payload: {
      prompt: 'Complete the sentence.',
      context: 'Reminding the client of an outstanding item.',
      sentence: 'Enviamos la consulta ___ dos semanas y seguimos sin respuesta.',
      answer: 'hace',
      distractors: [
        {
          answer: 'hacen',
          feedback: '«Hace» in this use is impersonal and never pluralises, however much time follows.',
          errorCode: 'verb.hace_ago',
        },
      ],
      explanation:
        '«Hace + amount of time» is Spanish\'s equivalent of English "ago", and «hace» is invariable: hace dos semanas, hace seis meses, hace tres años.\n\nThe temptation to write «hacen» comes from reading «dos semanas» as the subject. It is not — the construction is impersonal, like «hay» or «llueve», and has no subject at all.\n\nThe second half of the sentence is a useful phrase in its own right: «seguimos sin respuesta» — literally "we continue without an answer". «Seguir + sin + infinitive or noun» is the standard way to say something still has not happened, and it is far more idiomatic than a negated present perfect: «seguimos sin recibir los planos» beats «todavía no hemos recibido los planos» in a chasing email, because it is shorter and puts no blame in the verb.',
    },
  },
  {
    topicId: 'b1.verb.preterito',
    kind: 'drill_error_spot',
    difficulty: 3,
    targetsError: 'verb.hace_ago',
    payload: {
      prompt: 'Correct the sentence.',
      context: 'Giving background in a claim meeting.',
      sentence: 'El cliente aprobó el diseño desde hace seis meses.',
      answer: 'El cliente aprobó el diseño hace seis meses.',
      distractors: [
        {
          answer: 'El cliente aprobó el diseño hace seis meses atrás.',
          feedback:
            '«Hace» already carries "ago". Adding «atrás» doubles it — pick one, and in neutral Latin American Spanish that is «hace».',
          errorCode: 'verb.hace_ago',
        },
      ],
      explanation:
        '«Hace» and «desde hace» are not interchangeable, and the verb tense is what decides between them.\n\nBare «hace + time» locates a completed event at a point in the past, so it pairs with the preterite: «aprobó el diseño hace seis meses». «Desde hace + time» measures a situation that started then and is *still going*, so it pairs with the present: «el expediente está en revisión desde hace seis meses», «esperamos la orden de compra desde hace dos semanas». An approval is a moment, not a situation, so «desde hace» cannot apply to it.\n\nThe English does not help here. "Six months ago" and "for six months" are clearly different in English, but learners reach for «desde» because it is the word they know for "since" — and "since" is the word English uses for the continuing case.\n\nThe distractor covers the other half of the same territory: «hace seis meses atrás» stacks two markers of pastness. It is heard in speech in several countries, but it is redundant, and in writing it reads as a slip.\n\nAlso note that «hace» is impersonal and invariable — «hace seis meses», never «hacen seis meses». It is not agreeing with anything.',
    },
  },

  /* ============ verb.futuro_vs_condicional ============ */
  {
    topicId: 'b2.verb.colision_r',
    kind: 'drill_cloze',
    difficulty: 3,
    targetsError: 'verb.futuro_vs_condicional',
    payload: {
      prompt: 'Complete with the correct form.',
      context: 'Committing to a delivery date in front of the client.',
      sentence: 'El próximo lunes ___ (entregar, nosotros) el informe final.',
      answer: 'entregaremos',
      accept: ['vamos a entregar'],
      distractors: [
        {
          answer: 'entregaríamos',
          feedback:
            'That is the conditional — it makes the delivery hypothetical, dependent on something unstated. You are committing to a date, so you need the future: entregaremos.',
          errorCode: 'verb.futuro_vs_condicional',
        },
      ],
      explanation:
        'The two forms differ by one syllable and by everything else. The future says it will happen: entregaremos, revisaremos, prepararemos. The conditional says it would happen if something else were true: entregaríamos, revisaríamos, prepararíamos.\n\nBoth are built on the full infinitive, which is why they collide: entregar + emos against entregar + íamos. Under speaking pressure the -ría- forms tend to win, because they feel more courteous, and courtesy is a real use of the conditional — «¿podría revisarlo?» is softer than «¿puede revisarlo?».\n\nBut softening a commitment is not politeness, it is hedging. Telling a client «entregaríamos el lunes» invites them to hear a caveat you did not state, and in a claim context that reading can be held against you. If you mean Monday, say «entregaremos el lunes» or «vamos a entregar el lunes».\n\nThe diagnostic: if you could attach «si…» to the sentence and it would make sense, the conditional belongs. If not, use the future.',
    },
  },
  {
    topicId: 'b2.verb.colision_r',
    kind: 'drill_error_spot',
    difficulty: 4,
    targetsError: 'verb.futuro_vs_condicional',
    payload: {
      prompt: 'The tense weakens a commitment that should be firm. Rewrite the sentence.',
      context: 'Confirming scope in writing after a meeting.',
      sentence: 'Confirmamos que incluiríamos la partida de instalaciones en el alcance.',
      answer: 'Confirmamos que incluiremos la partida de instalaciones en el alcance.',
      distractors: [
        {
          answer: 'Confirmamos que incluimos la partida de instalaciones en el alcance.',
          feedback:
            'The present is defensible if the inclusion is already done, but the sentence is a forward commitment, so the future is what you want: incluiremos.',
          errorCode: 'verb.futuro_vs_condicional',
        },
      ],
      explanation:
        '«Confirmamos que…» sets up an assertion, and an assertion in the conditional contradicts itself: you cannot confirm a hypothesis. «Incluiremos» is the form the sentence needs.\n\nThe professional cost here is larger than the grammatical one. A conditional inside a confirmation reads to a Spanish-speaking client as deliberate hedging — as though you are leaving yourself an exit. That is a worse impression than a grammatical slip, because it looks like intent.\n\nWhere the conditional does belong in this register is in softening a *request* or a *proposal*: «propondríamos incluir la partida» is a genuine, useful hedge before a decision is made. Once the decision is made, the hedge has to come off.\n\nNote «la partida» in the construction sense — a budget line item or work package. «El alcance» is scope. Both are core vocabulary in your context and neither is a false friend, but «partida» has enough other meanings that the collocation is worth fixing as a unit.',
    },
  },
  {
    topicId: 'b2.verb.colision_r',
    kind: 'drill_transform',
    difficulty: 4,
    targetsError: 'verb.futuro_vs_condicional',
    payload: {
      prompt:
        'Rewrite as a genuine hypothesis, keeping the same verb. Start with «Si el cliente ampliara el plazo,».',
      context: 'Answering a "what if" question in a negotiation.',
      sentence: 'Reforzaremos la cuadrilla de encofrado.',
      answer: 'Si el cliente ampliara el plazo, reforzaríamos la cuadrilla de encofrado.',
      accept: [
        'si el cliente ampliara el plazo reforzaríamos la cuadrilla de encofrado',
        'si el cliente ampliase el plazo, reforzaríamos la cuadrilla de encofrado',
      ],
      distractors: [
        {
          answer: 'Si el cliente ampliara el plazo, reforzaremos la cuadrilla de encofrado.',
          feedback:
            'The si-clause is hypothetical but the main clause stayed in the future. The frame is fixed: imperfect subjunctive in the si-clause, conditional in the result.',
          errorCode: 'verb.futuro_vs_condicional',
        },
      ],
      explanation:
        'This is the mirror of the previous item, and doing both is the point: the conditional is not weaker Spanish, it is a different claim, and here it is exactly right.\n\nThe frame is fixed and worth memorising as a shape rather than as two rules: «si + imperfect subjunctive, + conditional». Si ampliara, reforzaríamos. Si tuviéramos, haríamos. Si el cliente aceptara, avanzaríamos.\n\nWhat you can never do is put the conditional inside the si-clause. «Si ampliaría el plazo» is ungrammatical in standard Spanish, and it is the single most common English-speaker error in this construction, because English allows "would" in both halves of the sentence.\n\n«Ampliara» and «ampliase» are equally correct; the -ra forms dominate in Latin America and the -se forms sound more literary. Use -ra.',
    },
  },

  /* ============ mood.subj_imperfecto_missing (severity 5) ============ */
  {
    topicId: 'b2.mood.subj_imperfecto',
    kind: 'drill_cloze',
    difficulty: 3,
    targetsError: 'mood.subj_imperfecto_missing',
    payload: {
      prompt: 'Complete with the correct form.',
      context: 'Reporting an instruction from last week.',
      sentence: 'El cliente pidió que ___ (revisar, nosotros) el metrado antes de facturar.',
      answer: 'revisáramos',
      accept: ['revisásemos'],
      distractors: [
        {
          answer: 'revisemos',
          feedback:
            'That is the present subjunctive. The reporting verb «pidió» is in the past, so the subordinate clause has to move back with it: revisáramos.',
          errorCode: 'mood.subj_imperfecto_missing',
        },
        {
          answer: 'revisamos',
          feedback:
            '«Pedir que» is a verb of influence and always takes the subjunctive in its clause, whatever the tense.',
          errorCode: 'mood.subj_imperfecto_missing',
        },
      ],
      explanation:
        'The imperfect subjunctive is formed from the third-person plural preterite: revisaron → revisara, revisáramos; pidieron → pidiera; tuvieron → tuviera; fueron → fuera; hicieron → hiciera. Take the preterite, drop -ron, add -ra endings. That derivation is worth drilling directly, because it makes every irregular verb regular in this tense — if you know the preterite, you know this.\n\nThe rule that selects it here is sequence of tenses. A verb of influence, wish, doubt or emotion takes the subjunctive in its subordinate clause, and the *tense* of that subjunctive follows the main verb: present main verb → present subjunctive («pide que revisemos»); past main verb → imperfect subjunctive («pidió que revisáramos»).\n\nNote the written accent on «revisáramos». The nosotros form of the imperfect subjunctive is always accented on the stem vowel, because the stress falls three syllables from the end: revisáramos, tuviéramos, hiciéramos, fuéramos. It is one of the few places where forgetting the accent produces a word that is stressed wrongly enough to be misheard.',
    },
  },
  {
    topicId: 'b2.mood.subj_imperfecto',
    kind: 'drill_transform',
    difficulty: 4,
    targetsError: 'mood.subj_imperfecto_missing',
    payload: {
      prompt: 'Shift the whole sentence into the past. Start with «Queríamos».',
      context: 'Explaining what your team wanted the supplier to do.',
      sentence: 'Queremos que el proveedor entregue los equipos antes del vaciado.',
      answer: 'Queríamos que el proveedor entregara los equipos antes del vaciado.',
      accept: ['queríamos que el proveedor entregase los equipos antes del vaciado'],
      distractors: [
        {
          answer: 'Queríamos que el proveedor entregue los equipos antes del vaciado.',
          feedback:
            'The main verb moved to the past but the subordinate clause did not. Sequence of tenses drags it back: entregara.',
          errorCode: 'mood.subj_imperfecto_missing',
        },
        {
          answer: 'Queríamos que el proveedor entregó los equipos antes del vaciado.',
          feedback:
            '«Querer que» takes the subjunctive in every tense. The preterite indicative is not available here.',
          errorCode: 'mood.subj_imperfecto_missing',
        },
      ],
      explanation:
        'Sequence of tenses is a mechanical consequence, not a stylistic choice. Move the main verb back and the subordinate subjunctive moves with it: quiere que entregue → quería que entregara.\n\nThe derivation again: entregaron (third-person plural preterite) → drop -ron → entrega- → add -ra → entregara. Every verb in Spanish, including every irregular, forms the imperfect subjunctive this way with no exceptions at all. Fuera, tuviera, pudiera, dijera, condujera, quisiera — all from fueron, tuvieron, pudieron, dijeron, condujeron, quisieron.\n\nThis is why the form is worth the effort of drilling. It is not rare; it is required every time you report a past instruction, a past wish, a past doubt or a past requirement, which in a consulting context is most of what you say about last week. Not having it forces you to paraphrase around a whole region of the language.\n\n«El vaciado» is the pour — «antes del vaciado», with «de + el» contracting to «del» obligatorily.',
    },
  },
  {
    topicId: 'b2.mood.subj_imperfecto',
    kind: 'drill_translate',
    difficulty: 5,
    targetsError: 'mood.subj_imperfecto_missing',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Explaining to your director why the schedule slipped.',
      sentence: 'They asked us to redo the structural calculation before they would sign it.',
      answer: 'Nos pidieron que rehiciéramos el cálculo estructural antes de que lo firmaran.',
      accept: [
        'nos pidieron que rehiciésemos el cálculo estructural antes de que lo firmaran',
        'nos pidieron rehacer el cálculo estructural antes de que lo firmaran',
      ],
      distractors: [
        {
          answer: 'Nos pidieron que rehacemos el cálculo estructural antes de firmarlo.',
          feedback: '«Pedir que» requires the subjunctive, and a past main verb requires the imperfect subjunctive.',
          errorCode: 'mood.subj_imperfecto_missing',
        },
      ],
      explanation:
        '«Rehiciéramos» comes from «rehicieron», the third-person plural preterite of rehacer, which inherits hacer\'s irregular stem: hicieron → hiciera, rehicieron → rehiciera. The accent on «rehiciéramos» is obligatory.\n\nThe English sentence hides two things Spanish makes explicit. First, "asked us to" is a verb of influence, so Spanish needs «pedir que + subjunctive» rather than an infinitive when the subject of the second verb is stated or contrastive.\n\nSecond, and this is the trap: the subjects are not the same. They ask, we redo, *they* sign. An infinitive after «antes de» takes its subject from the nearest clause — so «antes de firmarlo» says we sign it, which reverses the English. Different subjects force «antes de que» and a conjugated verb: «antes de que lo firmaran».\n\n«Antes de que» is one of the handful of conjunctions that takes the subjunctive unconditionally, whether the event is past or future — unlike «después de que», which takes the indicative for real past events.',
    },
  },

  /* ============ pron.body_part_article ============ */
  {
    topicId: 'a2.noun.posesivos',
    kind: 'drill_error_spot',
    difficulty: 2,
    targetsError: 'pron.body_part_article',
    payload: {
      prompt: 'Correct the sentence.',
      context: 'Reporting a minor site incident.',
      sentence: 'El operario se lastimó su mano con la amoladora.',
      answer: 'El operario se lastimó la mano con la amoladora.',
      distractors: [
        {
          answer: 'El operario lastimó su mano con la amoladora.',
          feedback:
            'Now the reflexive pronoun is gone too. It is «se» that tells you whose hand it is, which is precisely why the possessive is unnecessary.',
          errorCode: 'pron.body_part_article',
        },
      ],
      explanation:
        'Spanish uses the definite article with body parts and personal effects, not the possessive, because the reflexive or indirect object pronoun has already identified the owner: «se lastimó la mano», «me duele la espalda», «le rompieron los lentes».\n\nThe logic is that the information is carried once. «Se» already says the hand belongs to the operator, so «su» would be repeating it, and Spanish treats that repetition as marked — it sounds either emphatic or foreign.\n\nWhere the possessive *is* correct is when there is no such pronoun and ownership is genuinely at issue, or when the body part is being contrasted: «su mano derecha quedó inutilizada» in a medical report, for instance.\n\nThe same pattern extends to clothing and worn equipment: «se puso el casco», not «se puso su casco»; «se quitó los guantes». On a site this comes up constantly, so it is worth over-learning.',
    },
  },
  {
    topicId: 'a2.noun.posesivos',
    kind: 'drill_translate',
    difficulty: 3,
    targetsError: 'pron.body_part_article',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Explaining why you left the site early.',
      sentence: 'My back was hurting after the inspection.',
      answer: 'Me dolía la espalda después de la inspección.',
      accept: ['me dolía la espalda tras la inspección'],
      distractors: [
        {
          answer: 'Mi espalda estaba doliendo después de la inspección.',
          feedback:
            'Two calques at once: the possessive where Spanish wants the article, and a progressive where Spanish uses the imperfect. «Me dolía la espalda».',
          errorCode: 'pron.body_part_article',
        },
      ],
      explanation:
        '«Doler» works like «gustar»: the body part is the subject and the person is an indirect object. «Me dolía la espalda» is literally "the back was hurting to me", and the «me» is what makes «la» sufficient.\n\nBecause the body part is the grammatical subject, the verb agrees with *it*, not with you: me duele la espalda, me duelen las rodillas. Getting that agreement wrong is the second half of this error and worth checking every time.\n\nThe imperfect is right here because the pain is background — a state that was going on, not an event that happened. «Me dolió la espalda» would report a single moment of pain, which is not what the English means.\n\nAvoid the progressive. Spanish uses «estar + gerundio» far more narrowly than English uses "-ing", and for an ongoing past state the imperfect alone is the natural form.',
    },
  },

  /* ============ pron.doler_le ============ */
  {
    topicId: 'a1.verb.gustar',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: 'pron.doler_le',
    payload: {
      prompt: 'Complete with the correct pronoun.',
      context: 'Passing on what a colleague told you.',
      sentence: 'Al ingeniero ___ duelen las rodillas después de subir a la torre.',
      answer: 'le',
      distractors: [
        {
          answer: 'se',
          feedback:
            'Doler is not reflexive. The person who feels the pain is an indirect object, so the pronoun is «le».',
          errorCode: 'pron.doler_le',
        },
      ],
      explanation:
        'Doler follows the gustar pattern exactly: the thing that hurts is the grammatical subject, and the person who feels it is an indirect object. «Le duelen las rodillas» — the knees hurt to him.\n\nThat is why the pronoun is «le» and never «se». «Se duele» exists but means something else entirely — it is «dolerse de», to lament or complain about something, and it is rare and literary.\n\nThe verb agrees with the body part, not the person: le duele la espalda (singular), le duelen las rodillas (plural). This is the single most common slip in the whole gustar family, because English makes the person the subject and Spanish does not.\n\nNote the redundant «al ingeniero» alongside «le». That is not an error — Spanish routinely doubles the indirect object, naming it and pronominalising it in the same clause. «Al ingeniero le duelen las rodillas» is the normal form; dropping the «le» would sound incomplete.',
    },
  },
  {
    topicId: 'a1.verb.gustar',
    kind: 'drill_translate',
    difficulty: 3,
    // Deliberately not tagged `pron.doler_le`. This item probes the gustar-family
    // inversion through *faltar*; a miss here is not evidence that the learner
    // treats «doler» as reflexive, and tagging it would write that claim into the
    // error log, which drives scheduling.
    targetsError: null,
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Explaining a resourcing problem.',
      sentence: 'The foremen are missing two people on the night shift.',
      answer: 'A los capataces les faltan dos personas en el turno noche.',
      accept: [
        'a los capataces les faltan dos personas en el turno de noche',
        'les faltan dos personas a los capataces en el turno noche',
      ],
      distractors: [
        {
          answer: 'Los capataces faltan dos personas en el turno noche.',
          feedback:
            'Faltar works like gustar and doler: the missing people are the subject, and the foremen are an indirect object. «A los capataces les faltan…»',
        },
      ],
      explanation:
        'Faltar belongs to the same family as gustar and doler, and it is the one that matters most at work: «me falta información», «nos faltan dos días», «al expediente le falta la firma».\n\nThe structure is: a + person (optional but common), the indirect object pronoun (obligatory), the verb agreeing with the thing, then the thing. «A los capataces les faltan dos personas» — the verb is plural because «dos personas» is plural, not because «los capataces» is.\n\nEnglish inverts this completely, making the person the subject of "are missing", which is why the error is so persistent. The whole family works the same way and is worth learning as one pattern rather than verb by verb: gustar, doler, faltar, quedar, sobrar, interesar, importar, convenir, parecer.\n\n«El turno noche» is the common form in Peruvian site usage; «el turno de noche» is equally correct and more standard in writing.',
    },
  },

  /* ============ pron.se_vs_se_accent ============ */
  {
    topicId: 'a2.pron.se_lo',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: 'pron.se_vs_se_accent',
    payload: {
      prompt: 'Complete with «se» or «sé».',
      context: 'Answering a question you cannot answer.',
      sentence: 'No ___ si el cliente ya firmó la adenda.',
      answer: 'sé',
      distractors: [
        {
          answer: 'se',
          feedback:
            'Without the accent this is the pronoun. The verb "I know" is «sé», and the accent is the only thing distinguishing them.',
          errorCode: 'pron.se_vs_se_accent',
        },
      ],
      explanation:
        '«Sé» with an accent is a verb — the first-person present of saber ("I know") or the informal command of ser ("be"). «Se» without an accent is a pronoun: reflexive, impersonal, passive, or the substitute for «le» before another third-person pronoun.\n\nThis is a diacritic accent (the *tilde diacrítica*), which is a specific category: it does not follow the ordinary stress rules, which would leave both spellings bare. What it marks is that the accented member of the pair is a tonic word — «sé» carries its own stress as a verb — while the unaccented member is a clitic, pronounced leaning on the word beside it. In writing, its practical job is to separate two identical spellings. The same job is done by él/el, tú/tu, mí/mi, sí/si, más/mas, dé/de, té/te and aún/aun.\n\nBecause the stress difference is slight and easy to miss, the accent is effectively invisible in speech and can only be got right in writing — which makes it exactly the kind of error that survives fluency. The fix is a substitution test: if you can replace the word with "I know", it takes the accent.\n\nNote also «si» without an accent here, meaning "whether". «Sí» with an accent means "yes". Two diacritic pairs in one short sentence.',
    },
  },
  {
    topicId: 'a2.pron.se_lo',
    kind: 'drill_error_spot',
    difficulty: 3,
    targetsError: 'pron.se_vs_se_accent',
    payload: {
      prompt: 'Correct the accents.',
      context: 'Replying to a request for a document.',
      sentence: 'Sé lo envío mañana, pero no se el número de expediente.',
      answer: 'Se lo envío mañana, pero no sé el número de expediente.',
      distractors: [
        {
          answer: 'Se lo envío mañana, pero no se el número de expediente.',
          feedback:
            'The first one is fixed; the second is still the pronoun. «No sé» — "I do not know" — takes the accent.',
          errorCode: 'pron.se_vs_se_accent',
        },
      ],
      explanation:
        'The sentence has both words in the wrong places, which is the useful case. «Se lo envío» uses the pronoun: «se» here is standing in for «le», because Spanish does not allow «le lo» and replaces the first pronoun with «se». «No sé» uses the verb.\n\nThat «le → se» substitution is worth stating on its own, since it is the least intuitive use of «se» in the language. «Le envío el documento» becomes «se lo envío», never «le lo envío». The substitution applies whenever an indirect «le/les» meets a direct «lo/la/los/las». It is often explained as a matter of euphony, but the real history is that the older form was «ge lo» (from Latin ILLI ILLUM), and «ge» merged with «se» in pronunciation. This «se» and the reflexive «se» are unrelated words that ended up spelled alike.\n\nThe substitution test again: replace with "I know" and see whether the sentence survives. «I know it I send tomorrow» does not; «I do not know the file number» does.\n\n«El expediente» is the file or case record — standard in Peruvian administrative and contractual usage, and worth having alongside «el acta», «la valorización» and «la adenda».',
    },
  },

  /* ============ verb.infinitive_after_prep ============ */
  {
    topicId: 'a1.prep.basicas',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: 'verb.infinitive_after_prep',
    payload: {
      prompt: 'Complete the sentence with one of: iniciar / iniciamos / iniciando.',
      context: 'Setting out a condition in an email.',
      sentence: 'Necesitamos la aprobación del cliente para ___ los trabajos.',
      answer: 'iniciar',
      distractors: [
        {
          answer: 'iniciamos',
          feedback:
            'A preposition is never followed by a conjugated verb in Spanish. «Para» takes the infinitive: para iniciar.',
          errorCode: 'verb.infinitive_after_prep',
        },
        {
          answer: 'iniciando',
          feedback:
            'The gerund is what English uses after a preposition, not Spanish. «Para iniciar», never «para iniciando».',
          errorCode: 'verb.infinitive_after_prep',
        },
      ],
      explanation:
        'Every preposition in Spanish takes the infinitive: para iniciar, sin firmar, antes de revisar, después de vaciar, al llegar, por no avisar, a pesar de tener.\n\nThe rule is near-absolute, and the handful of exceptions are worth knowing rather than fearing: «según» takes a conjugated verb («según acordamos», «según indica el expediente»), «excepto», «salvo» and «menos» can front a full clause, and a small set of fixed phrases like «desde que» and «hasta que» carry «que» precisely because a clause follows. Outside those, treat it as exceptionless. Where English uses "-ing" after a preposition ("before starting", "without signing"), Spanish uses the bare infinitive — and where English uses an infinitive, Spanish often does too, which is why the rule feels inconsistent until you see that Spanish is the simpler of the two.\n\nThe conjugated form only becomes possible when you insert «que» and build a full clause with its own subject: «para que el cliente inicie los trabajos», which then takes the subjunctive. That is the choice point: same subject → preposition + infinitive; different subject → «que» + conjugated verb.\n\n«Al + infinitive» deserves a note of its own, because it has no English equivalent and is very useful: «al llegar a obra» means "on arriving at site" or "when we got to site", compressing a whole time clause into two words.',
    },
  },
  {
    topicId: 'a1.prep.basicas',
    kind: 'drill_error_spot',
    difficulty: 3,
    targetsError: 'verb.infinitive_after_prep',
    payload: {
      prompt: 'Correct the sentence.',
      context: 'Warning about a compliance risk.',
      sentence: 'No podemos facturar sin entregamos el acta de conformidad.',
      answer: 'No podemos facturar sin entregar el acta de conformidad.',
      distractors: [
        {
          answer: 'No podemos facturar sin que entregamos el acta de conformidad.',
          feedback:
            '«Sin que» does introduce a clause — but it takes the subjunctive, and here the subject is the same in both halves, so a plain infinitive is what you want.',
          errorCode: 'verb.infinitive_after_prep',
        },
      ],
      explanation:
        '«Sin» is a preposition, so it takes the infinitive: «sin entregar».\n\nThe distractor shows the alternative and why it does not apply. «Sin que» exists and introduces a full clause, but it takes the subjunctive («sin que el cliente lo apruebe») and it is only natural when the two subjects differ. Here both halves are about us, so the infinitive is not just correct but obligatory in practice.\n\nThis same-subject test governs a whole set of pairs: para / para que, sin / sin que, antes de / antes de que, después de / después de que, hasta / hasta que. Same subject takes the preposition and an infinitive; different subject takes «que» and a conjugated verb.\n\n«El acta de conformidad» is the sign-off certificate — again, «el acta» takes a masculine article for phonetic reasons while remaining feminine for agreement.',
    },
  },

  /* ============ pron.personal_a ============ */
  {
    topicId: 'a1.prep.basicas',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: 'pron.personal_a',
    payload: {
      prompt: 'Complete the sentence with «a», «al», or «—» for nothing.',
      context: 'Describing a staffing decision.',
      sentence: 'Contratamos ___ los dos ingenieros que nos recomendó el cliente.',
      answer: 'a',
      distractors: [
        {
          answer: '—',
          feedback:
            'A specific human direct object takes the personal «a». These are two identified engineers — the client named them — so the «a» is required.',
          errorCode: 'pron.personal_a',
        },
        {
          answer: 'al',
          feedback:
            '«A + el» contracts to «al», but only before the singular «el». Before «los», «la» or «las» there is no contraction: a los ingenieros, a la supervisora, a las contratistas.',
          errorCode: 'pron.personal_a',
        },
      ],
      explanation:
        'Spanish marks a direct object that is a specific person with «a». «Vimos al supervisor», «llamé a la cliente», «contratamos a los dos ingenieros que nos recomendó el cliente». English has no equivalent, so there is nothing prompting you to include it.\n\nThe condition is specificity as much as humanness, and this item is built to make that visible. «Los dos ingenieros que nos recomendó el cliente» are particular, identified people, so the «a» is obligatory. Strip the identification away and it stops being obligatory: «contratamos dos ingenieros» describes filling two posts with anyone qualified, and is perfectly good Spanish without the «a». «Buscamos un ingeniero» means you are describing a vacancy; «buscamos a un ingeniero» means there is a particular one you are trying to find. The pairs are correct in both directions and they mean different things, which is why this is worth understanding rather than memorising.\n\nIt extends to pets and personified entities, and to indefinite pronouns referring to people: «no vi a nadie», «¿conoces a alguien en la municipalidad?». The «a» before «nadie» and «alguien» is obligatory.\n\nOne exception worth knowing: «tener» normally drops it. «Tenemos dos ingenieros en obra», not «a dos ingenieros» — unless you are stressing a relationship: «tengo a mi hermano trabajando aquí».',
    },
  },
  {
    topicId: 'a1.prep.basicas',
    kind: 'drill_translate',
    difficulty: 3,
    targetsError: 'pron.personal_a',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Explaining an escalation.',
      sentence: 'We called the project manager, not the supervisor.',
      answer: 'Llamamos al gerente de proyecto, no al supervisor.',
      accept: ['llamamos al jefe de proyecto, no al supervisor'],
      distractors: [
        {
          answer: 'Llamamos el gerente de proyecto, no el supervisor.',
          feedback:
            'Both direct objects are specific people, so both take the personal «a» — and «a + el» contracts to «al».',
          errorCode: 'pron.personal_a',
        },
      ],
      explanation:
        'Both objects are specific people, so both take the personal «a», and both contract: a + el → al. That contraction is obligatory and has no exceptions except before a capitalised name beginning with El.\n\nThe contrast structure keeps the «a» visible in the second half, which is where it usually goes missing. Once the first «a» is written, the parallel one after «no» feels redundant and gets dropped — but it is required, because it belongs to the second object, not to the sentence.\n\n«El gerente de proyecto» and «el jefe de proyecto» are both current in Latin American practice; «gerente» carries slightly more seniority. Avoid «el manager», which is understood but reads as an anglicism in written Spanish.',
    },
  },

  /* ============ verb.perfecto_gerundio ============ */
  {
    topicId: 'b1.verb.presente_perfecto',
    kind: 'drill_cloze',
    difficulty: 2,
    targetsError: 'verb.perfecto_gerundio',
    payload: {
      prompt: 'Complete with the correct form.',
      context: 'Reporting progress at a weekly meeting.',
      sentence: 'Hemos ___ (revisar) las tres primeras valorizaciones.',
      answer: 'revisado',
      distractors: [
        {
          answer: 'revisando',
          feedback:
            'After haber the verb takes the participle, not the gerund. «Hemos revisado», never «hemos revisando».',
          errorCode: 'verb.perfecto_gerundio',
        },
        {
          answer: 'revisar',
          feedback:
            'Haber is not a modal — it does not take a bare infinitive. Only the participle can follow it: «hemos revisado».',
          errorCode: 'verb.perfecto_gerundio',
        },
      ],
      explanation:
        'The perfect tense is «haber» plus the participle: he revisado, has revisado, ha revisado, hemos revisado, han revisado. The gerund never appears after haber in any tense.\n\nThe confusion comes from English, where "have been reviewing" puts an -ing form after "have". But English gets there through two auxiliaries — have + been + reviewing — and Spanish builds that meaning differently: «hemos estado revisando», with «estado» as the participle and the gerund attached to «estar», not to «haber».\n\nSo both forms exist and mean different things. «Hemos revisado las valorizaciones» says the reviewing is done. «Hemos estado revisando las valorizaciones» says it has been going on and may still be. In a status report the first is usually what you want, because it reports a result.\n\nAfter haber the participle is invariable: «hemos revisado las valorizaciones», never «revisadas». Agreement only happens when the participle follows estar or ser.',
    },
  },
  {
    topicId: 'b1.verb.presente_perfecto',
    kind: 'drill_error_spot',
    difficulty: 3,
    targetsError: 'verb.perfecto_gerundio',
    payload: {
      prompt: 'Correct the sentence.',
      context: 'Chasing an outstanding response.',
      sentence: 'El proveedor no ha respondiendo a nuestras dos últimas consultas.',
      answer: 'El proveedor no ha respondido a nuestras dos últimas consultas.',
      distractors: [
        {
          answer: 'El proveedor no está respondiendo a nuestras dos últimas consultas.',
          feedback:
            'That is a valid sentence, but it changes the meaning to an ongoing pattern. The original reports that no answer has arrived: «no ha respondido».',
          errorCode: 'verb.perfecto_gerundio',
        },
      ],
      explanation:
        '«Haber» takes the participle: «no ha respondido». The gerund cannot follow it.\n\nThe distractor is worth reading twice, because it is not ungrammatical — it is a different claim. «No ha respondido» reports a completed absence of response up to now. «No está respondiendo» describes an ongoing behaviour, and in a client email that difference is the difference between a factual chase and an accusation.\n\n«Responder a» takes the preposition: «responder a una consulta», «responder a un correo». Dropping it is a separate error and a common one, since English "answer" is transitive.\n\n«Nuestras dos últimas consultas» — note the order. Spanish normally puts the number before «último/a», the reverse of English "last two": las dos últimas consultas, los tres últimos informes. «Las últimas dos consultas» is heard and is not an error, but the numeral-first order is the standard one and the safer default in writing.',
    },
  },

  /* ============ pron.io_redundant ============ */
  {
    topicId: 'b2.pron.cliticos_redundantes',
    kind: 'drill_cloze',
    difficulty: 3,
    targetsError: 'pron.io_redundant',
    payload: {
      prompt: 'Complete with the pronoun the sentence needs.',
      context: 'Confirming what you sent and to whom.',
      sentence: '___ enviamos el informe al cliente el martes por la tarde.',
      answer: 'Le',
      distractors: [
        {
          answer: '—',
          feedback:
            'Spanish doubles the indirect object: even with «al cliente» stated, the pronoun «le» is required.',
          errorCode: 'pron.io_redundant',
        },
        {
          answer: 'Lo',
          feedback:
            '«Lo» is a direct object pronoun. The client is the recipient — an indirect object — so it is «le».',
          errorCode: 'pron.io_redundant',
        },
      ],
      explanation:
        'Spanish routinely names the indirect object twice: once as a full phrase and once as a pronoun. «Le enviamos el informe al cliente». To an English speaker this looks redundant, and grammatically it is — but leaving out the «le» makes the sentence sound incomplete to a native ear.\n\nWith a postverbal indirect object the clitic is strongly preferred rather than strictly obligatory — the NGLE treats «Envió flores a su madre» as well formed. It becomes genuinely obligatory when the indirect object is fronted («Al cliente le enviamos el informe») or is a stressed pronoun («le enviamos el informe a él»). It is also obligatory whenever the indirect object is a pronoun: «le enviamos el informe a él».\n\nDirect objects behave differently and are the source of the confusion. They are only doubled when fronted for emphasis: «el informe lo enviamos el martes». In neutral order you would simply say «enviamos el informe», with no pronoun.\n\nSo the practical rule is: indirect objects double by default, direct objects do not. Getting this right is one of the things that most separates fluent-sounding Spanish from correct-but-foreign Spanish, which is why it sits in the B2 band.',
    },
  },
  {
    topicId: 'b2.pron.cliticos_redundantes',
    kind: 'drill_translate',
    difficulty: 4,
    targetsError: 'pron.io_redundant',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Describing a coordination step across two countries.',
      sentence: 'We explained the change to the Chilean team on Friday.',
      answer: 'Le explicamos el cambio al equipo chileno el viernes.',
      accept: [
        'el viernes le explicamos el cambio al equipo chileno',
        'explicamos el cambio al equipo chileno el viernes',
      ],
      distractors: [
        {
          answer: 'Le explicamos el cambio a el equipo chileno el viernes.',
          feedback:
            '«A + el» always contracts to «al». The doubled pronoun is right; the contraction is not optional.',
          errorCode: 'pron.io_redundant',
        },
      ],
      explanation:
        '«Explicar» takes an indirect object — you explain something *to* someone — so the doubling applies: «le explicamos el cambio al equipo chileno».\n\n«El equipo» is singular, so the pronoun is «le» rather than «les», even though a team is made of people. Spanish agrees with the grammatical number of the noun, not with how many humans it contains.\n\nNote the nationality adjective is lowercase: «chileno», «peruano», «colombiano». Spanish capitalises the country but not the adjective or the language, which is the reverse of English and an easy mark to lose in written work.\n\nWord order is flexible for the time expression: «el viernes» can open the sentence or close it, with no change of meaning and only a slight shift of emphasis.',
    },
  },

  /* ============ prep.buscar_para ============ */
  {
    topicId: 'b1.prep.verbos_regimen',
    kind: 'drill_error_spot',
    difficulty: 3,
    targetsError: 'prep.buscar_para',
    payload: {
      prompt: 'Correct the sentence.',
      context: 'Describing a procurement task.',
      sentence: 'Estamos buscando para un proveedor local de encofrados.',
      answer: 'Estamos buscando un proveedor local de encofrados.',
      distractors: [
        {
          answer: 'Estamos buscando por un proveedor local de encofrados.',
          feedback:
            'Swapping «para» for «por» does not fix it — «buscar» takes a direct object with no preposition at all.',
          errorCode: 'prep.buscar_para',
        },
      ],
      explanation:
        'Buscar means "to look for", with the "for" already inside the verb. It takes a direct object and no preposition: «buscamos un proveedor», «busco el plano», «estamos buscando alternativas».\n\nThis is a whole class of English particles that get carried onto Spanish verbs where they do not belong. «Esperar» means "wait for" — «esperamos la respuesta», not «esperamos por la respuesta». «Pedir» means "ask for" — «pedimos una prórroga». «Pagar» means "pay for" — «pagamos el material». «Mirar» means "look at" — «mira el plano».\n\nThe mirror-image error also exists and is worth guarding against at the same time: some Spanish verbs demand a preposition where English has none. «Entrar en/a la sala», «depender de», «confiar en», «asistir a una reunión», «responder a una consulta».\n\nSo neither language can be used as a guide for the other. Verb government has to be learned verb by verb, which is why this topic exists as its own item in the curriculum.',
    },
  },
  {
    topicId: 'b1.prep.verbos_regimen',
    kind: 'drill_translate',
    difficulty: 3,
    targetsError: 'prep.buscar_para',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Explaining a hold-up in a status call.',
      sentence: 'We are still waiting for the client\'s approval.',
      answer: 'Seguimos esperando la aprobación del cliente.',
      accept: [
        'todavía estamos esperando la aprobación del cliente',
        'aún esperamos la aprobación del cliente',
      ],
      distractors: [
        {
          answer: 'Seguimos esperando por la aprobación del cliente.',
          feedback:
            '«Esperar» already means "wait for". The «por» is the English particle carried across.',
          errorCode: 'prep.buscar_para',
        },
      ],
      explanation:
        '«Esperar» takes a direct object: «esperamos la aprobación». No preposition. The same verb also means "to hope" and "to expect", and it keeps the same government in all three senses.\n\n«Seguir + gerundio» is the natural way to say something is still happening: «seguimos esperando», «seguimos revisando», «sigue pendiente». It is more idiomatic than «todavía estamos + gerundio», and noticeably more so than a bare «todavía» with a simple present.\n\n«La aprobación del cliente» — «de + el» contracts to «del» without exception.\n\nOne related trap: «esperar a que» *does* take a preposition, but only when a clause follows. «Esperamos a que el cliente apruebe» — and the clause is subjunctive, because the approval has not happened.',
    },
  },

  /* ============ pron.doler_le (appended — see drillKey: never insert) ============ */
  {
    topicId: 'a1.verb.gustar',
    kind: 'drill_translate',
    difficulty: 3,
    targetsError: 'pron.doler_le',
    payload: {
      prompt: 'Translate into Spanish.',
      context: 'Explaining to the site manager why a welder has been moved off the night shift.',
      sentence: "The welder's back has been hurting since Monday, so we moved him to the day shift.",
      answer: 'Al soldador le duele la espalda desde el lunes; lo pasamos al turno de día.',
      accept: [
        'al soldador le duele la espalda desde el lunes, así que lo pasamos al turno de día',
        'al soldador le duele la espalda desde el lunes; por eso lo pasamos al turno de día',
      ],
      distractors: [
        {
          answer: 'El soldador se duele la espalda desde el lunes; lo pasamos al turno de día.',
          feedback:
            'Doler takes no reflexive pronoun. The back is the subject and the welder is an indirect object, so it is «le duele», never «se duele».',
          errorCode: 'pron.doler_le',
        },
        {
          answer: 'Al soldador le duele su espalda desde el lunes; lo pasamos al turno de día.',
          feedback:
            'Spanish uses the definite article for body parts, not the possessive. The «le» already tells you whose back it is: «le duele la espalda».',
          errorCode: 'pron.body_part_article',
        },
      ],
      explanation:
        'Two things have to be right at once here, which is why this item sits at the production end of the doler set.\n\nFirst, the structure. Doler is a gustar-family verb: the thing that hurts is the grammatical subject and the person who feels it is an indirect object. So the sentence is literally "to the welder, the back hurts" — «al soldador le duele la espalda». The pronoun «le» is obligatory even though «al soldador» is already there; Spanish doubles the indirect object as a matter of course. «Se duele» is not an alternative — it is a different verb, «dolerse de» (to lament), and it is rare and literary.\n\nSecond, the article. Where English says "his back", Spanish says «la espalda». The indirect object pronoun has already established whose back it is, so a possessive on top of it is redundant and sounds foreign. This holds across the body: «me duele la cabeza», «le duelen las rodillas», «se lastimó la mano». Reserve «su espalda» for cases where ownership is genuinely in contrast.\n\nThird, agreement. The verb agrees with the body part, not with the person: «le duele la espalda» but «le duelen las rodillas». Because English makes the person the subject of "hurt", the pull towards «duelen» after a plural person is strong and worth resisting deliberately.\n\nOn «desde el lunes»: a state that began at a point and is still going takes «desde» plus that point. English reaches for a perfect continuous ("has been hurting"); Spanish is content with the simple present, because «desde» already carries the continuity. «Le duele desde el lunes», not «le ha estado doliendo».',
    },
  },
];
