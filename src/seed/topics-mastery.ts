import type { SeedTopic } from './types';

/**
 * C1–C2. Above the exam line and deferred until after December (SPEC §9,
 * Phase 5), but seeded now so the prerequisite graph terminates properly and
 * search reaches them. Unit references map to Read2Speak Mastery, 15 units.
 */
export const C_TOPICS: SeedTopic[] = [
  /* ---------------- C1 ---------------- */
  {
    id: 'c1.mood.subj_eleccion',
    nameEn: 'Subjunctive as a communicative choice',
    nameEs: 'El subjuntivo como elección',
    level: 'C1',
    strand: 'mood',
    summary:
      'Past B2, the trigger lists stop explaining the data. The organising principle is assertion versus non-assertion: the indicative asserts a proposition, the subjunctive declines to. That is why no creo que and creo que both exist, why el hecho de que takes either mood, and why the choice is often a stance rather than a rule.',
    bookRef: 'Mastery U5.2.1',
    searchTerms: 'subjunctive choice|asserción|no aserción|el hecho de que|no creo que|stance|optional subjunctive',
  },
  {
    id: 'c1.syntax.subordinacion',
    nameEn: 'Elegant subordination',
    nameEs: 'Subordinación compleja',
    level: 'C1',
    strand: 'syntax',
    summary:
      'Building long sentences that stay readable: participial and gerund clauses, relative chains, and the discipline of one idea per clause. Where B2 produces correct short sentences, C1 produces correct long ones — which is what makes technical Spanish sound authored rather than translated.',
    bookRef: 'Mastery U2.2.1',
    searchTerms: 'subordination|subordinación|complex sentences|participial|gerund clause|periodo largo',
  },
  {
    id: 'c1.syntax.enfasis',
    nameEn: 'Cleft sentences, fronting and emphasis',
    nameEs: 'Perífrasis de relativo y orden marcado',
    level: 'C1',
    strand: 'syntax',
    summary:
      'Spanish moves constituents to mark emphasis where English uses stress: lo que necesitamos es tiempo, fue el municipio quien observó el expediente. Word order is information structure, not decoration — and putting the wrong element first is a C1 error that no grammar checker catches.',
    bookRef: 'Mastery U10.2.1',
    searchTerms: 'cleft|fronting|énfasis|lo que|fue... quien|word order|orden de palabras|topicalización',
  },
  {
    id: 'c1.syntax.elipsis',
    nameEn: 'Ellipsis and compression',
    nameEs: 'Elipsis y compresión',
    level: 'C1',
    strand: 'syntax',
    summary:
      'What Spanish lets you leave out. Over-specified subjects, repeated nouns and translation padding are the clearest tells of an advanced non-native, and the fix is subtraction rather than addition.',
    bookRef: 'Mastery U3.2.2',
    searchTerms: 'ellipsis|elipsis|omission|compression|sobreespecificación|padding|redundancy',
  },
  {
    id: 'c1.discourse.registro',
    nameEn: 'The register spectrum',
    nameEs: 'El espectro de registro',
    level: 'C1',
    strand: 'discourse',
    summary:
      'Five levels from intimate to bureaucratic, and the ability to move between them deliberately mid-conversation — the shift from the site to the boardroom to the acta. Register mismatch is the error that most damages professional credibility while remaining perfectly grammatical.',
    bookRef: 'Mastery U8.2.1',
    searchTerms: 'register|registro|formal|informal|shifting|bureaucratic|tuteo|usted',
  },
  {
    id: 'c1.discourse.gestion_turnos',
    nameEn: 'Turn management, backchanneling and repair',
    nameEs: 'Gestión del turno y reparación',
    level: 'C1',
    strand: 'discourse',
    summary:
      'Holding the floor, signalling attention, interrupting acceptably, and repairing your own sentence mid-flow without collapsing it. These are the mechanics that make a speaker sound fluent independently of their grammar.',
    bookRef: 'Mastery U7.2.1',
    searchTerms: 'turn taking|backchannel|repair|interrupción|turnos|reparación|floor',
  },
  {
    id: 'c1.discourse.ironia',
    nameEn: 'Irony and implicit meaning',
    nameEs: 'Ironía y significado implícito',
    level: 'C1',
    strand: 'discourse',
    summary:
      'Understatement, deliberate vagueness and the things a Spanish speaker signals without stating. Comprehension first: missing an implicature in a negotiation is more expensive than any grammar error.',
    bookRef: 'Mastery U3.2.1',
    searchTerms: 'irony|ironía|implicature|understatement|indirect|implícito|sarcasm',
  },
  {
    id: 'c1.lex.precision',
    nameEn: 'Collocational precision and near-synonyms',
    nameEs: 'Precisión léxica y sinónimos próximos',
    level: 'C1',
    strand: 'lex',
    summary:
      'Choosing between words that a dictionary treats as equivalent: incumplir/vulnerar/contravenir, plazo/término/vencimiento. At C1 the question stops being "is this word correct" and becomes "is this the word a specialist would have chosen".',
    bookRef: 'Mastery U11.2.1',
    searchTerms: 'precision|precisión|synonym|sinónimo|collocation|matiz|near-synonym',
  },
  {
    id: 'c1.prof.argumentacion',
    nameEn: 'Argumentation and debate',
    nameEs: 'Argumentación y debate',
    level: 'C1',
    strand: 'prof',
    summary:
      'Building a case, anticipating the counter-argument, conceding tactically and closing. The structural vocabulary of argument — premise, concession, rebuttal — carried in Spanish discourse markers rather than translated from English ones.',
    bookRef: 'Mastery U9.2.1',
    searchTerms: 'argument|argumentación|debate|rebuttal|concession|refutar|premisa',
  },
  {
    id: 'c1.prof.autoridad',
    nameEn: 'Projecting authority and handling interruption',
    nameEs: 'Proyectar autoridad y manejar la interrupción',
    level: 'C1',
    strand: 'prof',
    summary:
      'Sounding certain when you are certain, hedging only where hedging is warranted, and reclaiming the floor after being cut off. Over-hedging is the characteristic failure of a competent non-native and it reads as lack of conviction rather than politeness.',
    bookRef: 'Mastery U14.2.1',
    searchTerms: 'authority|autoridad|confidence|interruption|interrupción|hedging calibration|convicción',
  },

  /* ---------------- C2 ---------------- */
  {
    id: 'c2.discourse.estilo',
    nameEn: 'Stylistic flexibility and rhetoric',
    nameEs: 'Flexibilidad estilística y retórica',
    level: 'C2',
    strand: 'discourse',
    summary:
      'Deliberate control of style: shifting voice for effect, rhetorical structure, and the figures that persuade in Spanish rather than in translated English. The point at which the language becomes an instrument rather than a medium.',
    bookRef: 'Mastery U13.2.1',
    searchTerms: 'style|estilo|rhetoric|retórica|narrative|persuasion|figuras',
  },
  {
    id: 'c2.lex.abstraccion',
    nameEn: 'Abstract and nominalised discourse',
    nameEs: 'Discurso abstracto y nominalizado',
    level: 'C2',
    strand: 'lex',
    summary:
      'Sustained abstraction without becoming unreadable — the register of policy papers, legal opinion and technical standards. The C2 skill is knowing when to come back down.',
    bookRef: 'Mastery U12.2.1',
    searchTerms: 'abstract|abstracción|nominalización|academic|policy|técnico',
  },
  {
    id: 'c2.lex.idiom_regional',
    nameEn: 'Idiom and regional variation',
    nameEs: 'Modismos y variación regional',
    level: 'C2',
    strand: 'lex',
    summary:
      'Peruvian usage against Mexican, Colombian, Chilean and Argentine — comprehension across the region and production in one consistent variety. For multi-country coordination this is comprehension-critical long before it is production-critical.',
    bookRef: 'Mastery U15.2.1',
    searchTerms: 'idiom|modismo|regional|peruano|mexicano|variación|dialect|jerga',
  },
  {
    id: 'c2.prof.registro_legal',
    nameEn: 'Bureaucratic and legal register',
    nameEs: 'Registro burocrático y jurídico',
    level: 'C2',
    strand: 'prof',
    summary:
      'The Spanish of contracts, resolutions and administrative procedure: archaic subjunctives, fixed formulae, and sentences engineered to be unambiguous rather than readable. Reading fluency here is worth more than writing fluency.',
    bookRef: 'Mastery U8.2.1',
    searchTerms: 'legal|jurídico|bureaucratic|burocrático|contrato|resolución|administrative',
  },
  {
    id: 'c1.mood.hipotesis_complejas',
    nameEn: 'Complex and mixed hypotheticals',
    nameEs: 'Hipótesis complejas',
    level: 'C1',
    strand: 'mood',
    summary:
      'Past B2, the three conditional "types" stop describing what people actually say. Time frames mix: «si hubiéramos firmado en marzo, ahora estaríamos avanzando» puts an unreal past against a present consequence, and the reverse pairing exists too. Whole constructions drop si altogether — de haber sabido, «¿y si probáramos otra cosa?», siempre que, a no ser que, en caso de que, con tal de que.\n\nRegret has its own machinery: ojalá + pluperfect subjunctive («ojalá lo hubiera sabido antes») says something different from a plain conditional perfect, because it is an attitude rather than a calculation.\n\nThis sits above the exam line and is scheduled after December, but it is the register that negotiation actually runs in — most of what a consultant needs to say about an alternative that was never taken lives here.',
    bookRef: 'Mastery U6',
    searchTerms: 'hypothetical|hipótesis|mixed conditional|de haber|y si|siempre que|a no ser que|ojalá hubiera|counterfactual|condicional mixto',
  },
];
