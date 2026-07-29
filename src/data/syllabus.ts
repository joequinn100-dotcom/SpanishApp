import type { Topic } from '../types';

/**
 * Curriculum order follows the Read2Speak *Breakthrough (B1–B2)* sequence,
 * with Foundations (A1–A2) below and Mastery (C1–C2) above for reference.
 */
export const SEED_TOPICS: Topic[] = [
  {
    id: 't-ser-estar',
    name: 'Ser vs. estar (+ gender agreement)',
    level: 'Breakthrough (B1–B2)',
    order: 1,
    status: 'covered',
    confidence: 5,
    layer: 'confidence',
    summary: 'Identity/classification vs. state/result. Covered with Lorena, resolved in the error log.',
    lesson: {
      sections: [
        {
          heading: 'The split that actually matters at B2',
          body:
            'At A2 the rule is taught as "permanent vs. temporary", which breaks the moment you use it professionally. The workable split is: SER assigns something to a category or identifies what it is — material, origin, ownership, profession, the event itself ("la reunión es en la sala 3"). ESTAR gives a state, a position, or the result of a process — where a thing is, how it currently is, how it turned out.\n\nWith participles this becomes a live distinction you use daily on site: "la obra está paralizada" describes the current state; "la obra fue paralizada por el municipio" is a true passive naming who did it. "El presupuesto está aprobado" = it is now in an approved state. "El presupuesto fue aprobado el martes" = the act of approving happened Tuesday.',
        },
        {
          heading: 'Adjectives that change meaning',
          body:
            'ser listo = clever / estar listo = ready. ser aburrido = boring / estar aburrido = bored. ser grave = serious by nature / estar grave = in a serious condition. ser rico = wealthy / estar rico = tasty. For your register the two to own are listo and grave: "el expediente está listo" vs "el problema es grave".',
        },
      ],
      quiz: [],
    },
  },
  {
    id: 't-future',
    name: 'Future simple + irregular stems',
    level: 'Breakthrough (B1–B2)',
    order: 2,
    status: 'covered',
    confidence: 5,
    layer: 'confidence',
    summary: 'Endings on the full infinitive; twelve contracted stems. Future of probability used spontaneously.',
  },
  {
    id: 't-three-r',
    name: 'The three -R forms (futuro / condicional / subjuntivo imperfecto)',
    level: 'Breakthrough (B1–B2)',
    order: 3,
    status: 'covered',
    confidence: 4,
    layer: 'naturalness',
    summary: 'Recognising and producing the three families that share the -r- signal.',
  },
  {
    id: 't-preterite',
    name: 'Preterite narration',
    level: 'Breakthrough (B1–B2)',
    order: 4,
    status: 'covered',
    confidence: 3,
    layer: 'accuracy',
    summary: 'Forms are in place; person endings (yo/él) still slipping. Active error in the log.',
  },
  {
    id: 't-imp-vs-pret',
    name: 'Imperfecto vs. pretérito — background vs. foreground',
    level: 'Breakthrough (B1–B2)',
    order: 5,
    status: 'next',
    confidence: 2,
    layer: 'accuracy',
    summary: 'The next topic. How Spanish splits a past narrative into events and the scenery around them.',
    lesson: {
      sections: [
        {
          heading: 'Not "completed vs. uncompleted" — foreground vs. background',
          body:
            'Textbooks say the preterite is for completed actions and the imperfect for ongoing ones. That description fails constantly, because "trabajé ahí cinco años" is the preterite and is very much finished and very much ongoing-for-five-years. The description that actually predicts native usage is narrative role.\n\nThe PRETERITE is the foreground. It reports the events on the timeline — the things that happened, one after another, that move the story forward. Each preterite verb advances the clock: "Llegué a obra, revisé el frente de trabajo, hablé con el residente y firmé el acta." Four events, four steps forward.\n\nThe IMPERFECT is the background. It paints the scene those events happen inside — what was already going on, what things were like, what used to happen habitually. It does not advance the clock: "Llovía, el frente estaba parado y el residente esperaba instrucciones." Nothing moves; you are describing the world at that moment.\n\nA well-formed narrative alternates the two. That alternation is precisely what a B2 examiner is listening for.',
        },
        {
          heading: 'The four background jobs of the imperfect',
          body:
            '1. DESCRIPTION of scenery, weather, states and conditions: "El terreno estaba saturado y no había acceso para la maquinaria."\n\n2. HABITUAL or repeated past action ("used to / would"): "Todos los lunes revisábamos el avance con el cliente." Note that English "would" here is habitual, not conditional — a frequent source of interference.\n\n3. ACTION IN PROGRESS interrupted by an event: "Revisábamos los planos cuando llamó el supervisor." The imperfect is the ongoing frame; the preterite is the interruption. Reverse them and you change the meaning.\n\n4. AGE, TIME, MENTAL AND PHYSICAL STATES: "Eran las seis de la tarde, el equipo estaba cansado y nadie quería seguir."',
        },
        {
          heading: 'The three foreground jobs of the preterite',
          body:
            '1. A SINGLE COMPLETED EVENT: "El municipio emitió la licencia el 12 de marzo."\n\n2. A SEQUENCE of events: "Presentamos el expediente, absolvimos las observaciones y obtuvimos la conformidad."\n\n3. AN ACTION BOUNDED BY A STATED DURATION — this is the one that breaks the textbook rule. If the sentence puts a frame around the period, it is preterite no matter how long it lasted: "Trabajé cinco años en ese consorcio", "La obra estuvo paralizada tres meses", "Vivimos en Lima desde 2019 hasta 2023."',
        },
        {
          heading: 'Verbs that change meaning with the aspect',
          body:
            'Six verbs translate differently depending on which past you choose. These are worth memorising as pairs because they come up in negotiation constantly:\n\n• SABER — sabía = knew (state) / supe = found out (event). "Ya sabía del retraso" vs "Supe del retraso ayer."\n• CONOCER — conocía = was acquainted with / conocí = met for the first time. "Conocí al gerente en la licitación."\n• PODER — podía = was able to, had the capacity / pudo = managed to, succeeded. "Podíamos terminarlo" (we had the capacity) vs "Pudimos terminarlo" (we actually pulled it off).\n• NO PODER — no podía = wasn\'t able to / no pudo = tried and failed. "No pudo entregar a tiempo" is an accusation; "no podía entregar a tiempo" is context.\n• QUERER — quería = wanted / quiso = tried. NO QUISO = refused. "El contratista no quiso firmar" means he refused — strong, and often exactly what you mean in a claim.\n• TENER QUE — tenía que = was supposed to / tuvo que = had to and did. "Tenía que entregar el lunes" (was supposed to, maybe didn\'t) vs "Tuvo que entregar el lunes" (was forced to, and did).',
        },
        {
          heading: 'Time markers that tip you off',
          body:
            'IMPERFECT: siempre, todos los días/lunes, normalmente, generalmente, cada semana, mientras, a menudo, en esa época, antes.\n\nPRETERITE: ayer, anoche, el lunes pasado, en 2019, de repente, entonces, esa vez, un día, finalmente, hace dos semanas.\n\nTreat these as hints, not laws — "siempre" with a preterite is perfectly good when you are framing a closed period: "Siempre cumplió con los plazos" (over the whole finished contract).',
        },
      ],
      contrasts: [
        {
          left: 'Revisábamos los planos cuando llegó el cliente.',
          right: 'Revisamos los planos cuando llegó el cliente.',
          why: 'First: we were already mid-review and he interrupted. Second: his arrival triggered the review — two sequential events. The choice changes who caused what.',
        },
        {
          left: 'El contratista no podía terminar la partida.',
          right: 'El contratista no pudo terminar la partida.',
          why: '"No podía" describes a limitation; "no pudo" states a failure that occurred. In a claim letter the second is an accusation and the first is context.',
        },
        {
          left: 'Cuando trabajaba en Bogotá, coordinaba tres frentes.',
          right: 'Cuando trabajé en Bogotá, coordiné tres frentes.',
          why: 'The imperfect frames it as the ongoing routine of that period; the preterite frames the whole posting as one closed block on your CV. Both correct, different framing.',
        },
      ],
      quiz: [
        {
          id: 'ip1',
          prompt: '___ las siete y todavía ___ en obra cuando ___ la llamada del cliente.',
          options: [
            'Fueron / estuvimos / entró',
            'Eran / estábamos / entró',
            'Eran / estábamos / entraba',
          ],
          answer: 1,
          explanation:
            'ERAN (time = background), ESTÁBAMOS (ongoing state = background), ENTRÓ (the interrupting event = foreground). This is the canonical background/foreground shape.',
          speak: 'Eran las siete y todavía estábamos en obra cuando entró la llamada del cliente.',
        },
        {
          id: 'ip2',
          prompt: '___ cinco años en ese consorcio antes de independizarme.',
          options: ['Trabajaba', 'Trabajé', 'He trabajado'],
          answer: 1,
          explanation:
            'TRABAJÉ. A stated duration puts a frame around the period, so it is foreground preterite despite lasting five years. This is the case the "completed vs. ongoing" rule gets wrong.',
          speak: 'Trabajé cinco años en ese consorcio antes de independizarme.',
        },
        {
          id: 'ip3',
          prompt: 'Ayer ___ que el municipio ya había observado el expediente.',
          options: ['sabía', 'supe', 'sé'],
          answer: 1,
          explanation:
            'SUPE = I found out. "Sabía" would mean I already knew — a state, not the moment of learning.',
          speak: 'Ayer supe que el municipio ya había observado el expediente.',
        },
        {
          id: 'ip4',
          prompt: 'El subcontratista ___ firmar la adenda, así que escalamos el tema.',
          options: ['no quería', 'no quiso', 'no querría'],
          answer: 1,
          explanation:
            'NO QUISO = refused. The preterite of querer in the negative reports an act of refusal, which is what justifies escalating.',
          speak: 'El subcontratista no quiso firmar la adenda, así que escalamos el tema.',
        },
        {
          id: 'ip5',
          prompt: 'Todos los lunes ___ el avance con el cliente, hasta que ___ el formato.',
          options: [
            'revisamos / cambiaron',
            'revisábamos / cambiaron',
            'revisábamos / cambiaban',
          ],
          answer: 1,
          explanation:
            'REVISÁBAMOS (habit = background) … CAMBIARON (the single event that ended the habit = foreground).',
          speak: 'Todos los lunes revisábamos el avance con el cliente, hasta que cambiaron el formato.',
        },
        {
          id: 'ip6',
          prompt: 'La obra ___ paralizada tres meses por falta de licencia.',
          options: ['estaba', 'estuvo', 'era'],
          answer: 1,
          explanation:
            'ESTUVO — the duration is stated and closed, so it is a bounded block: foreground. "Estaba paralizada" without the duration would be scene-setting.',
          speak: 'La obra estuvo paralizada tres meses por falta de licencia.',
        },
      ],
    },
  },
  {
    id: 't-por-para',
    name: 'Por vs. para — full treatment',
    level: 'Breakthrough (B1–B2)',
    order: 6,
    status: 'queued',
    confidence: 2,
    layer: 'accuracy',
    summary: 'Queued next. Cause/exchange/duration/means vs. purpose/recipient/deadline/standard.',
    lesson: {
      sections: [
        {
          heading: 'One question that resolves most cases',
          body:
            'Ask: am I pointing BACKWARD at what caused or motivated this, or FORWARD at what it is aimed at?\n\nBackward — cause, motive, source, the thing already in play → POR.\nForward — purpose, destination, recipient, deadline → PARA.\n\n"Lo hicimos por el cliente" = we did it because of the client / on his behalf (he was the reason). "Lo hicimos para el cliente" = we made it for the client (he receives it). Both are correct sentences that say different things, and in a contract discussion that difference is money.',
        },
        {
          heading: 'The full inventory of POR',
          body:
            '1. CAUSE / MOTIVE: "El retraso fue por las lluvias." "Nos multaron por incumplimiento."\n2. DURATION: "La obra estuvo parada por dos semanas." (Also "durante", also nothing at all.)\n3. EXCHANGE / PRICE: "Cerramos el paquete por USD 480 000." "Cambiamos la partida por otra equivalente."\n4. MEANS / CHANNEL: "Te lo mando por correo." "Coordinamos por WhatsApp."\n5. APPROXIMATE PLACE OR TIME: "La obra queda por la Panamericana Sur." "Pasamos por ahí por la tarde."\n6. AGENT of a passive: "El expediente fue observado por la municipalidad."\n7. ON BEHALF OF / IN PLACE OF: "Firmé por el gerente." "Hablo por el consorcio."\n8. RATE / PER: "Avanzamos un 8% por semana." "Cinco soles por metro cuadrado."\n9. WITH VERBS THAT LOCK IT IN: preocuparse por, luchar por, optar por, preguntar por, disculparse por, felicitar por, votar por.',
        },
        {
          heading: 'The full inventory of PARA',
          body:
            '1. PURPOSE / GOAL — followed by an infinitive: "Contratamos un topógrafo para replantear los ejes." (Different subject → para que + subjuntivo: "para que el municipio nos otorgue la licencia.")\n2. RECIPIENT: "Este informe es para el directorio."\n3. DESTINATION: "Salgo para Arequipa el jueves."\n4. DEADLINE: "Necesito la valorización para el viernes."\n5. STANDARD / COMPARED WITH WHAT IS EXPECTED: "Para una obra de esta envergadura, el plazo es agresivo." "Para ser un edificio de 1970, está en buen estado." This one is very B2 and very useful for hedging.\n6. OPINION: "Para mí, el riesgo está en la cimentación."\n7. EMPLOYMENT: "Trabajo para una consultora de infraestructura."\n8. IMMINENCE — estar para: "El vaciado está para el lunes."',
        },
        {
          heading: 'The pairs that trap you',
          body:
            'These are the minimal pairs to rehearse out loud, because both members exist and mean different things:\n\n• "por el cliente" (because of him / on his behalf) vs "para el cliente" (destined for him).\n• "por dos años" (lasting two years) vs "para dos años" (aimed at a point two years out).\n• "trabajo por él" (I cover his shift) vs "trabajo para él" (he is my boss).\n• "por el viernes" (around Friday) vs "para el viernes" (by Friday, deadline).\n• "estudiar por la noche" (during the evening) vs "estudiar para el examen" (in order to pass it).\n\nA final anchor: PARA MÍ = in my opinion; POR MÍ = as far as I\'m concerned / for my sake.',
        },
      ],
      contrasts: [
        {
          left: 'Lo firmé por el gerente.',
          right: 'Lo firmé para el gerente.',
          why: 'First: I signed in his place, with his authority. Second: I signed it and the document goes to him. In an audit those are very different statements.',
        },
        {
          left: 'El contrato es por dos años.',
          right: 'El contrato es para dos años.',
          why: 'First: it runs for two years — the normal reading. Second: it is intended for a two-year horizon, which is almost never what you mean.',
        },
        {
          left: 'Para una obra de esa envergadura, el plazo es corto.',
          right: 'Por una obra de esa envergadura, el plazo es corto.',
          why: 'Only the first is idiomatic: para = measured against the standard you would expect. The second reads as "because of", which makes no sense here.',
        },
      ],
      quiz: [
        {
          id: 'pp-q1',
          prompt: 'Necesitamos la conformidad ___ el 15 ___ poder valorizar el mes.',
          options: ['por / para', 'para / para', 'para / por'],
          answer: 1,
          explanation: 'PARA el 15 (deadline) … PARA poder valorizar (purpose + infinitive).',
          speak: 'Necesitamos la conformidad para el 15 para poder valorizar el mes.',
        },
        {
          id: 'pp-q2',
          prompt: 'Nos aplicaron una penalidad ___ el retraso en la entrega.',
          options: ['para', 'por', 'de'],
          answer: 1,
          explanation: 'POR el retraso — cause. The penalty exists because of the delay.',
          speak: 'Nos aplicaron una penalidad por el retraso en la entrega.',
        },
        {
          id: 'pp-q3',
          prompt: '___ ser una edificación de los años setenta, la estructura está en buen estado.',
          options: ['Por', 'Para', 'Con'],
          answer: 1,
          explanation:
            'PARA ser… — the "measured against expectations" use. This is a high-value B2 hedging structure in technical reports.',
          speak: 'Para ser una edificación de los años setenta, la estructura está en buen estado.',
        },
        {
          id: 'pp-q4',
          prompt: 'Cerramos el suministro ___ 320 000 soles, pagaderos en tres armadas.',
          options: ['por', 'para', 'en'],
          answer: 0,
          explanation: 'POR — price and exchange.',
          speak: 'Cerramos el suministro por 320 000 soles, pagaderos en tres armadas.',
        },
        {
          id: 'pp-q5',
          prompt: 'Firmé el acta ___ el residente, que estaba de licencia.',
          options: ['para', 'por', 'de'],
          answer: 1,
          explanation: 'POR — in his place, on his behalf. "Para el residente" would mean the document was addressed to him.',
          speak: 'Firmé el acta por el residente, que estaba de licencia.',
        },
        {
          id: 'pp-q6',
          prompt: 'Ajustamos el cronograma ___ que el cliente ___ el adicional sin observaciones.',
          options: ['por / apruebe', 'para / apruebe', 'para / aprueba'],
          answer: 1,
          explanation:
            'PARA QUE + SUBJUNTIVO. Purpose with a change of subject forces "para que" and the subjunctive.',
          speak: 'Ajustamos el cronograma para que el cliente apruebe el adicional sin observaciones.',
        },
      ],
    },
  },
  {
    id: 't-perfect-tenses',
    name: 'Perfect tenses & pluscuamperfecto in reporting',
    level: 'Breakthrough (B1–B2)',
    order: 7,
    status: 'queued',
    confidence: 1,
    layer: 'accuracy',
    summary: 'he entregado / había entregado — sequencing two moments in the past. Ties directly to the participio error.',
  },
  {
    id: 't-relative-clauses',
    name: 'Relative clauses (que, quien, el cual, cuyo)',
    level: 'Breakthrough (B1–B2)',
    order: 8,
    status: 'queued',
    confidence: 1,
    layer: 'accuracy',
    summary: 'Building the long, subordinated sentences that separate B1 from B2 in writing.',
  },
  {
    id: 't-passive-se',
    name: 'Pasiva refleja & impersonal se',
    level: 'Breakthrough (B1–B2)',
    order: 9,
    status: 'queued',
    confidence: 1,
    layer: 'accuracy',
    summary: 'se entregó, se observaron, se viene ejecutando — the default voice of Peruvian technical reporting.',
  },
  {
    id: 't-connectors',
    name: 'Discourse connectors & argument structure',
    level: 'Breakthrough (B1–B2)',
    order: 10,
    status: 'queued',
    confidence: 2,
    layer: 'naturalness',
    summary: 'sin embargo, no obstante, en cuanto a, dado que, siempre y cuando — the B2 exam essay backbone.',
  },
  {
    id: 't-subj-nuance',
    name: 'Subjunctive beyond the triggers (opinion, doubt, concession)',
    level: 'Breakthrough (B1–B2)',
    order: 11,
    status: 'queued',
    confidence: 1,
    layer: 'accuracy',
    summary: 'no creo que, aunque + subjuntivo, el hecho de que — where B2 examiners probe.',
  },
  {
    id: 't-report-register',
    name: 'Register: negotiating, hedging and defending a position',
    level: 'Breakthrough (B1–B2)',
    order: 12,
    status: 'queued',
    confidence: 1,
    layer: 'confidence',
    summary: 'The exam\'s oral task and your actual job description are the same thing here.',
  },
  {
    id: 't-mastery-preview',
    name: 'Mastery preview: nominalisation & legal-contractual register',
    level: 'Mastery (C1–C2)',
    order: 13,
    status: 'queued',
    confidence: 1,
    layer: 'naturalness',
    summary: 'Above the exam line — kept visible as the direction of travel after November.',
  },
];
