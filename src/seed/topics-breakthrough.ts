import type { SeedTopic } from './types';

/**
 * B1–B2 — the learner's working level and the whole exam target.
 *
 * Unit references verified against Read2Speak Breakthrough (15 units, section
 * index extracted). Two topics carry bookRef: null because no book in the set
 * covers them — `cuyo` appears zero times across all three volumes, and B2-level
 * clitic combination is only treated at A2 depth.
 *
 * IDs here are load-bearing: the prerequisite graph in SPEC §3 references them
 * by exact string, and a typo silently breaks topic routing.
 */
export const B_TOPICS: SeedTopic[] = [
  /* ---------------- B1 · verb ---------------- */
  {
    id: 'b1.verb.preterito',
    nameEn: 'Preterite narration',
    nameEs: 'El pretérito en la narración',
    level: 'B1',
    strand: 'verb',
    summary:
      'The preterite is the foreground of a past narrative: it reports the events on the timeline, each one advancing the clock. Llegué a obra, revisé el frente, hablé con el residente y firmé el acta — four events, four steps forward. It also takes any action given a stated duration, however long: trabajé cinco años en ese consorcio is preterite precisely because the five years are framed and closed.',
    bookRef: 'Breakthrough U2.2.1',
    searchTerms: 'preterite|pretérito|indefinido|narration|hablé|habló|foreground|past events',
  },
  {
    id: 'b1.verb.imperfecto',
    nameEn: 'Imperfect: background and habit',
    nameEs: 'El imperfecto: fondo y costumbre',
    level: 'B1',
    strand: 'verb',
    summary:
      'The imperfect is the background. It paints the scene events happen inside — what was already going on, what things were like, what used to happen — and it does not advance the clock. Four jobs: description of states, habitual action, an action in progress that something interrupts, and age/time/mental states.',
    bookRef: 'Breakthrough U2.2.2',
    searchTerms: 'imperfect|imperfecto|hablaba|era|había|background|used to|habitual|mientras',
  },
  {
    id: 'b1.verb.pret_vs_imp',
    nameEn: 'Preterite vs. imperfect: foreground and background',
    nameEs: 'Pretérito frente a imperfecto',
    level: 'B1',
    strand: 'verb',
    summary:
      'Not "completed vs. uncompleted" — that description fails the moment you say trabajé cinco años. The rule that predicts native usage is narrative role: preterite for the events, imperfect for the scenery they sit in. A well-formed account alternates the two, and that alternation is exactly what a B2 examiner listens for. Six verbs also change meaning with the aspect: sabía/supe, conocía/conocí, podía/pudo, quería/quiso, no quiso (refused), tenía que/tuvo que.',
    bookRef: 'Breakthrough U2.2.3',
    searchTerms: 'preterite vs imperfect|pretérito vs imperfecto|foreground|background|supe|conocí|quiso|aspect',
  },
  {
    id: 'b1.verb.presente_perfecto',
    nameEn: 'Present perfect',
    nameEs: 'Pretérito perfecto compuesto',
    level: 'B1',
    strand: 'verb',
    summary:
      'haber + participio, for events inside a period the speaker still counts as open, and for experience without a date: hemos entregado tres expedientes este mes. The participle after haber never agrees — it is invariable. Register note the book does not give: Peruvian and broader Latin American usage prefers the simple preterite far more than Peninsular Spanish does, so reach for entregamos ayer rather than hemos entregado ayer.',
    bookRef: 'Breakthrough U7.2.1',
    searchTerms: 'present perfect|pretérito perfecto|he hablado|hemos entregado|haber participio|experience',
  },
  {
    id: 'b1.verb.pluscuamperfecto',
    nameEn: 'Pluperfect',
    nameEs: 'Pretérito pluscuamperfecto',
    level: 'B1',
    strand: 'verb',
    summary:
      'había + participio: the past of the past. It marks an event as already complete before another past moment — cuando llegué, el equipo ya había desmovilizado. Indispensable for claims and incident narratives, where the order of events is the argument, and a hard prerequisite for the pluperfect subjunctive.',
    bookRef: 'Breakthrough U2.2.4',
    searchTerms: 'pluperfect|pluscuamperfecto|había hablado|past of the past|ya había',
  },
  {
    id: 'b1.verb.haber_dos_usos',
    nameEn: "Haber's two jobs: hay/hubo vs. he/ha/han",
    nameEs: 'Los dos usos de haber',
    level: 'B1',
    strand: 'verb',
    summary:
      'One verb, two unrelated jobs. As an existential it is invariable and always third-person singular — hay tres observaciones, hubo un retraso, never hubieron. As an auxiliary it conjugates fully and carries the perfect tenses. Treating them as one paradigm produces the classic hubieron problemas, which marks a speaker instantly.',
    bookRef: 'Breakthrough U2.2.4',
    searchTerms: 'haber|hay|hubo|había|he|ha|han|hubieron|existential|auxiliary',
  },

  /* ---------------- B1 · mood ---------------- */
  {
    id: 'b1.mood.subj_presente',
    nameEn: 'Present subjunctive: form and triggers',
    nameEs: 'Presente de subjuntivo: forma y disparadores',
    level: 'B1',
    strand: 'mood',
    summary:
      'Built from the yo form of the present indicative with the opposite vowel, which is why the -go irregulars carry through (tengo → tenga, digo → diga). The subjunctive is not a tense but a mood: it appears when a clause is not being asserted as fact — after wishes, influence, doubt, emotion, impersonal judgement and denial. The gateway to everything at B2.',
    bookRef: 'Breakthrough U3.2.1',
    searchTerms: 'subjunctive|subjuntivo|presente|hable|tenga|sea|WEIRDO|que|espero que|dudo que',
  },
  {
    id: 'b1.mood.subj_cuando',
    nameEn: 'Cuando + subjunctive',
    nameEs: 'Cuando + subjuntivo',
    level: 'B1',
    strand: 'mood',
    summary:
      'CUANDO pointing at an unrealised future takes the subjunctive — cuando llegue el material, empezamos. Pointing at a habit or a completed fact it takes the indicative. The same split governs the whole family of time conjunctions: en cuanto, tan pronto como, hasta que, después de que. Resolved in this log, and the model case for what resolution means: correct spontaneous production plus an unprompted explanation of the rule.',
    bookRef: 'Breakthrough U14.2.9',
    searchTerms: 'cuando|subjunctive|subjuntivo|cuando llegue|en cuanto|hasta que|tan pronto como',
  },
  {
    id: 'b1.mood.ojala_quizas',
    nameEn: 'Ojalá, quizás and independent subjunctive',
    nameEs: 'Ojalá, quizás y el subjuntivo independiente',
    level: 'B1',
    strand: 'mood',
    summary:
      'OJALÁ is itself the subordinator — from Arabic law šā llāh — so it takes the subjunctive directly with no que. The tense sets the odds: present subjunctive for still possible, imperfect for contrary to fact, pluperfect for regret. quizás/tal vez/probablemente take either mood, and the choice signals how committed the speaker is.',
    bookRef: 'Breakthrough U14.2.5',
    searchTerms: 'ojalá|quizás|tal vez|probablemente|independent subjunctive|wishes',
  },

  /* ---------------- B1 · pron ---------------- */
  {
    id: 'b1.pron.od_oi',
    nameEn: 'Object pronouns consolidated',
    nameEs: 'Pronombres de objeto: consolidación',
    level: 'B1',
    strand: 'pron',
    summary:
      'Direct and indirect object pronouns working together under pressure: correct choice, correct order (indirect before direct), correct placement, and the redundant doubling Spanish requires — le entregué el acta al supervisor. English-speaking learners consistently under-use the redundant pronoun, which is an active error in this log.',
    bookRef: 'Foundations U14',
    searchTerms: 'object pronouns|OD|OI|lo|la|le|les|se lo|placement|doubling|redundant',
  },
  {
    id: 'b1.pron.se_constructions',
    nameEn: 'The se constructions',
    nameEs: 'Los valores de se',
    level: 'B1',
    strand: 'pron',
    summary:
      'One form, six unrelated jobs: reflexive (se lava), reciprocal (se reunieron), pronominal marking a verb that simply takes it (se dio cuenta), impersonal (se trabaja los sábados), passive (se entregaron los planos), and the accidental or de-agentive se that removes blame — se me cayó, se nos pasó la fecha. That last one is the most useful and least taught: it is how Spanish reports a problem without assigning fault, which is a negotiation tool.',
    bookRef: 'Breakthrough U12.2.2',
    searchTerms: 'se|reflexive|impersonal|passive se|pasiva refleja|se me cayó|reciprocal|accidental se',
  },
  {
    id: 'b1.pron.leismo',
    nameEn: 'Leísmo and loísmo',
    nameEs: 'Leísmo y loísmo',
    level: 'B1',
    strand: 'pron',
    summary:
      'Peninsular Spanish tolerates le for a masculine person as a direct object; Latin American Spanish generally does not, and Peruvian usage keeps lo/la for direct and le for indirect. Worth knowing because a learner who absorbs leísmo from a Spanish-produced textbook will sound imported in Lima.',
    bookRef: null,
    searchTerms: 'leísmo|loísmo|laísmo|le|lo|la|dialect|regional',
  },

  /* ---------------- B1 · syntax ---------------- */
  {
    id: 'b1.syntax.relativos',
    nameEn: 'Relative pronouns',
    nameEs: 'Los relativos',
    level: 'B1',
    strand: 'syntax',
    summary:
      'que is the workhorse; quien is only for people and mostly after a preposition; el que/la que/los que disambiguate when two nouns compete; lo que refers to a whole idea rather than a noun; donde replaces en el que for places; cuyo is the possessive relative and agrees with the thing possessed, not the owner — la empresa cuyos plazos incumplimos. Relative clauses are the main way a B1 speaker stops producing short flat sentences.',
    bookRef: null,
    searchTerms: 'relative|relativos|que|quien|el que|lo que|cuyo|cuya|donde|relative clause',
  },
  {
    id: 'b1.syntax.comas_relativas',
    nameEn: 'Restrictive vs. non-restrictive clauses',
    nameEs: 'Especificativas y explicativas',
    level: 'B1',
    strand: 'syntax',
    summary:
      'The comma carries meaning. Los contratistas que incumplieron el plazo fueron sancionados says only the late ones were; los contratistas, que incumplieron el plazo, fueron sancionados says all of them were, and adds that they were late. In a contract letter that comma is the difference between naming a subset and accusing everyone.',
    bookRef: null,
    searchTerms: 'restrictive|non-restrictive|especificativa|explicativa|comma|coma|relative clause',
  },

  /* ---------------- B1 · prep ---------------- */
  {
    id: 'b1.prep.por_para_full',
    nameEn: 'Por vs. para: full system',
    nameEs: 'Por y para: sistema completo',
    level: 'B1',
    strand: 'prep',
    summary:
      'POR covers cause, motive, duration, exchange, means, agent, approximate place, rate and "on behalf of". PARA covers purpose, recipient, destination, deadline, standard-of-comparison and opinion. SPEC §10 records this rule as already understood, so the topic is seeded for search and occasional warm-up reinforcement of conversational slips, and is never scheduled as a lesson.',
    bookRef: 'Foundations U4',
    searchTerms: 'por|para|por vs para|duration|purpose|deadline|cause|exchange|para el viernes',
    noSchedule: true,
  },
  {
    id: 'b1.prep.verbos_regimen',
    nameEn: 'Verbs with fixed prepositions',
    nameEs: 'Verbos con régimen preposicional',
    level: 'B1',
    strand: 'prep',
    summary:
      'Which preposition a verb takes is arbitrary and has to be learned with the verb: contar con, encargarse de, insistir en, comprometerse a, depender de, quedar en. English interference produces buscar para in place of plain buscar — an active error in this log — because English "look for" carries a particle that Spanish does not.',
    bookRef: 'Breakthrough U10.2.2',
    searchTerms: 'verb preposition|régimen|contar con|encargarse de|insistir en|depender de|buscar',
  },

  /* ---------------- B1 · discourse & prof ---------------- */
  {
    id: 'b1.discourse.conectores_1',
    nameEn: 'Connectors tier 1',
    nameEs: 'Conectores nivel 1',
    level: 'B1',
    strand: 'discourse',
    summary:
      'sin embargo, por lo tanto, dado que, además, en cuanto a, de hecho. The first set that lets a speaker structure an argument rather than merely chain clauses, and the point where written Spanish starts sounding organised rather than spoken.',
    bookRef: 'Breakthrough U4.2.2',
    searchTerms: 'connectors|conectores|sin embargo|por lo tanto|dado que|además|en cuanto a|de hecho',
  },
  {
    id: 'b1.prof.status_updates',
    nameEn: 'Status updates',
    nameEs: 'Reportes de estado',
    level: 'B1',
    strand: 'prof',
    summary:
      'The weekly professional obligation: what was planned, what happened, what the gap is, what happens next. Leans on preterite/imperfect alternation for the narrative and on the impersonal se for the neutral register a written report expects.',
    bookRef: 'Breakthrough U10.2.7',
    searchTerms: 'status|estado|reporte|update|avance|progress|informe',
  },
  {
    id: 'b1.prof.reportar_avance',
    nameEn: 'Reporting physical progress',
    nameEs: 'Reportar el avance físico',
    level: 'B1',
    strand: 'prof',
    summary:
      'Percentages, planned versus actual, critical path impact and the vocabulary of valorización, partida, hito and holgura. The register is impersonal and quantified: el avance físico se sitúa en 42% frente a un 47% programado.',
    bookRef: 'Breakthrough U10.2.1',
    searchTerms: 'avance|progress|valorización|partida|hito|ruta crítica|holgura|physical progress',
  },
  {
    id: 'b1.prof.instrucciones_obra',
    nameEn: 'Site instructions',
    nameEs: 'Instrucciones en obra',
    level: 'B1',
    strand: 'prof',
    summary:
      'Giving clear instructions on site: usted imperatives, hay que and tener que for obligation of different strengths, and the sequencing language that keeps a work front from being blocked. Directness here is professional, not rude — the softening register belongs in the client meeting, not the vaciado.',
    bookRef: 'Breakthrough U5.2.3',
    searchTerms: 'instructions|instrucciones|obra|site|imperative|hay que|tener que|deber',
  },

  /* ---------------- B2 · mood ---------------- */
  {
    id: 'b2.mood.subj_imperfecto',
    nameEn: 'Imperfect subjunctive',
    nameEs: 'Imperfecto de subjuntivo',
    level: 'B2',
    strand: 'mood',
    summary:
      'Built mechanically from the third-person plural preterite: tuvieron → tuviera, fueron → fuera, hicieron → hiciera. Both the -ra and -se sets are correct; -ra dominates in Latin America. Every preterite irregularity carries through, which makes this tense a direct test of whether the preterite is genuinely secure. SPEC §10 records it as not yet acquired at severity 5 — the highest-priority gap in the log.',
    bookRef: 'Breakthrough U14.2.2',
    searchTerms: 'imperfect subjunctive|imperfecto de subjuntivo|tuviera|fuera|hiciera|-ara|-iera|-ase|-iese|prefiriera',
  },
  {
    id: 'b2.mood.si_hipotetico',
    nameEn: 'Hypothetical conditionals (Type 2)',
    nameEs: 'Condicionales hipotéticas',
    level: 'B2',
    strand: 'mood',
    summary:
      'si + imperfect subjunctive, then conditional: si tuviéramos dos semanas más, cerraríamos el expediente sin observaciones. The conditional never goes inside the si-clause — si tendríamos is the error the structure exists to prevent. This is the payoff structure for the imperfect subjunctive: it is what makes the form worth acquiring, because it is how you negotiate a position you have not committed to.',
    bookRef: 'Breakthrough U14.2.2',
    searchTerms: 'si|conditional|hypothetical|type 2|si tuviera|condicional|hipotética|if I had',
  },
  {
    id: 'b2.mood.subj_perfecto',
    nameEn: 'Perfect subjunctive',
    nameEs: 'Pretérito perfecto de subjuntivo',
    level: 'B2',
    strand: 'mood',
    summary:
      'haya + participio: the subjunctive of the present perfect, for a completed event inside a still-open frame that a trigger puts under doubt, emotion or judgement — me alegra que hayan levantado las observaciones. Requires both the present subjunctive and the present perfect to be secure.',
    bookRef: 'Mastery U5.2.6',
    searchTerms: 'perfect subjunctive|perfecto de subjuntivo|haya|hayan|haya hablado|haya llegado',
  },
  {
    id: 'b2.mood.subj_pluscuamperfecto',
    nameEn: 'Pluperfect subjunctive',
    nameEs: 'Pluscuamperfecto de subjuntivo',
    level: 'B2',
    strand: 'mood',
    summary:
      'hubiera (or hubiese) + participio, for an unreal past: something that did not happen, or a judgement passed on something that did. Ojalá hubiéramos revisado el diseño antes. It is the engine of the counterfactual conditional and of professional regret, which is the register in which claims and lessons-learned are written.',
    bookRef: 'Breakthrough U14.2.3',
    searchTerms: 'pluperfect subjunctive|pluscuamperfecto de subjuntivo|hubiera|hubiese|hubiera hablado|counterfactual',
  },
  {
    id: 'b2.mood.si_counterfactual',
    nameEn: 'Counterfactual conditionals (Type 3)',
    nameEs: 'Condicionales irreales del pasado',
    level: 'B2',
    strand: 'mood',
    summary:
      'si + pluperfect subjunctive, then conditional perfect: si hubiéramos incluido una cláusula de reajuste, no habríamos asumido el sobrecosto. This is how you argue about a past that cannot be changed — the grammar of a claim, a post-mortem, and an assignment of contractual responsibility. Mixed conditionals cross the time frames: si hubiéramos firmado entonces, hoy estaríamos ejecutando.',
    bookRef: 'Breakthrough U14.2.3',
    searchTerms: 'counterfactual|type 3|si hubiera|habría|condicional compuesto|irreal|past unreal|mixed conditional',
  },
  {
    id: 'b2.mood.subj_relativas',
    nameEn: 'Subjunctive in relative clauses',
    nameEs: 'Subjuntivo en oraciones de relativo',
    level: 'B2',
    strand: 'mood',
    summary:
      'The mood inside a relative clause reports whether the antecedent is known to exist. Busco a un ingeniero que sabe alemán means a specific person; busco un ingeniero que sepa alemán means anyone who fits. The indicative asserts existence, the subjunctive suspends it — which in a tender document is the difference between naming a supplier and stating a requirement.',
    bookRef: 'Mastery U5.2.5',
    searchTerms: 'subjunctive relative|relativas|busco a alguien que|que sepa|antecedent|antecedente',
  },
  {
    id: 'b2.mood.subj_concesivas',
    nameEn: 'Subjunctive after concessives (aunque)',
    nameEs: 'Subjuntivo tras concesivas',
    level: 'B2',
    strand: 'mood',
    summary:
      'AUNQUE takes the indicative for a conceded fact and the subjunctive for a hypothetical or for information the speaker declines to treat as news: aunque llueve, vaciamos (it is raining) against aunque llueva, vaciamos (rain or not). The same split runs through a pesar de que, por más que and si bien. A precise negotiating instrument.',
    bookRef: 'Mastery U5.2.4',
    searchTerms: 'aunque|concessive|concesiva|a pesar de que|por más que|si bien|even if|even though',
  },

  /* ---------------- B2 · verb ---------------- */
  {
    id: 'b2.verb.futuro_perfecto',
    nameEn: 'Future perfect',
    nameEs: 'Futuro perfecto',
    level: 'B2',
    strand: 'verb',
    summary:
      'habré + participio: an event that will already be finished by a future deadline — para diciembre habremos cerrado el expediente. Also carries probability about the recent past: ya habrán recibido el acta, they will have received it by now.',
    bookRef: 'Mastery U4.2.7',
    searchTerms: 'future perfect|futuro perfecto|habré|habremos|habrá terminado|will have',
  },
  {
    id: 'b2.verb.condicional_compuesto',
    nameEn: 'Conditional perfect',
    nameEs: 'Condicional compuesto',
    level: 'B2',
    strand: 'verb',
    summary:
      'habría + participio: what would have happened. It is the main clause of the counterfactual conditional and, on its own, the standard way to voice a professional regret or an unrealised alternative — habríamos evitado la penalidad.',
    bookRef: 'Breakthrough U7.2.6',
    searchTerms: 'conditional perfect|condicional compuesto|habría|habríamos|would have',
  },
  {
    id: 'b2.verb.futuro_probabilidad',
    nameEn: 'Future and conditional of probability',
    nameEs: 'Futuro y condicional de probabilidad',
    level: 'B2',
    strand: 'verb',
    summary:
      'The future tense used for a present guess — esa viga pesará unos 800 kilos — and the conditional for a guess about the past. Nothing about the future is involved; it is pure epistemic hedging, and it is one of the most native-sounding things an intermediate speaker can start doing.',
    bookRef: 'Mastery U4.2.5',
    searchTerms: 'probability|probabilidad|future of probability|pesará|serán|estará|conjecture|guess',
  },
  {
    id: 'b2.verb.colision_r',
    nameEn: 'The -remos / -ríamos / -áramos collision',
    nameEs: 'La colisión de las formas en -r-',
    level: 'B2',
    strand: 'verb',
    summary:
      'Three families share the -r- signal and are separated by one or two letters: future preferiremos (we will prefer), conditional preferiríamos (we would prefer), imperfect subjunctive prefiriéramos (that we preferred). They mean entirely different things, they collide under speaking pressure, and the log records preferiríamos used for a plain future at severity 4. Drilling them as a contrast set is more effective than drilling each alone.',
    bookRef: 'Breakthrough U1.2.1',
    searchTerms: '-remos|-ríamos|-áramos|-éramos|future vs conditional|colisión|preferiremos|preferiríamos|prefiriéramos',
  },

  /* ---------------- B2 · syntax ---------------- */
  {
    id: 'b2.syntax.estilo_indirecto',
    nameEn: 'Reported speech',
    nameEs: 'Estilo indirecto',
    level: 'B2',
    strand: 'syntax',
    summary:
      'Reporting what someone said, with the full tense backshift: present → imperfect, preterite → pluperfect, future → conditional, imperative → imperfect subjunctive. Pronouns, possessives, and time and place deictics all shift with it. This is the grammar of minutes, of an acta, and of any sentence beginning "the client said that" — which is most of a consultant\'s written output.',
    bookRef: 'Breakthrough U12.2.3',
    searchTerms: 'reported speech|estilo indirecto|backshift|dijo que|indirect speech|acta|me pidió que',
  },
  {
    id: 'b2.syntax.secuencia_tiempos',
    nameEn: 'Sequence of tenses',
    nameEs: 'Consecutio temporum',
    level: 'B2',
    strand: 'syntax',
    summary:
      'The tense of the main verb constrains which subjunctive the subordinate clause can take. A present-tense trigger takes the present or perfect subjunctive; a past-tense trigger takes the imperfect or pluperfect. Pido que entreguen against pedí que entregaran. Getting this wrong is what makes an otherwise correct subjunctive land in the wrong decade.',
    bookRef: 'Mastery U4.2.9',
    searchTerms: 'sequence of tenses|consecutio|secuencia de tiempos|pedí que|entregaran|backshift subjunctive',
  },
  {
    id: 'b2.syntax.pasiva',
    nameEn: 'Passive with ser vs. passive se',
    nameEs: 'Pasiva con ser y pasiva refleja',
    level: 'B2',
    strand: 'syntax',
    summary:
      'The ser passive names or implies an agent and is comparatively rare in speech: el expediente fue observado por la municipalidad. The pasiva refleja has no agent and is the default voice of Peruvian technical writing: se observó el expediente, se entregaron los planos. Choosing between them is choosing whether to name who did it — a decision with consequences in a claim.',
    bookRef: 'Breakthrough U12.2.1',
    searchTerms: 'passive|pasiva|ser + participio|pasiva refleja|se entregó|se observaron|impersonal',
  },
  {
    id: 'b2.syntax.nominalizacion',
    nameEn: 'Nominalisation',
    nameEs: 'Nominalización',
    level: 'B2',
    strand: 'syntax',
    summary:
      'Turning verbs into nouns to compress and formalise: la obra avanzó poco becomes el avance de la obra fue limitado. It is the single most reliable register lift in written Spanish, and it is what separates a B1 report from a B2 one. Overused it becomes bureaucratic, which is its C1 failure mode.',
    bookRef: 'Mastery U12.2.1',
    searchTerms: 'nominalisation|nominalización|el avance|la ejecución|register|formal|abstract',
  },

  /* ---------------- B2 · pron ---------------- */
  {
    id: 'b2.pron.clitic_combos',
    nameEn: 'Clitic combination and placement',
    nameEs: 'Combinación y colocación de clíticos',
    level: 'B2',
    strand: 'pron',
    summary:
      'Full control of pronoun clusters: fixed order (se, then second person, then first, then third), the le → se repair before lo/la, and placement with infinitives, gerunds and commands where both positions are legal — quiero entregárselo or se lo quiero entregar, but never a split. No book in this set treats this above A2 depth, so the content here is authored rather than sourced.',
    bookRef: null,
    searchTerms: 'clitic|clíticos|se lo|entregárselo|placement|colocación|pronoun order|combination',
  },
  {
    id: 'b2.pron.cliticos_redundantes',
    nameEn: 'Redundant clitics',
    nameEs: 'Duplicación de clíticos',
    level: 'B2',
    strand: 'pron',
    summary:
      'Spanish routinely doubles an object with its pronoun where English would find it redundant: le entregué el acta al residente, a mí me parece. With a fronted object it is obligatory, not optional. Omitting it — no digas a mi esposo — is an active error in this log and reads as unmistakably foreign.',
    bookRef: null,
    searchTerms: 'redundant|duplicación|doubling|le dije a|a mí me|clitic doubling',
  },

  /* ---------------- B2 · discourse ---------------- */
  {
    id: 'b2.discourse.conectores_2',
    nameEn: 'Connectors tier 2',
    nameEs: 'Conectores nivel 2',
    level: 'B2',
    strand: 'discourse',
    summary:
      'no obstante, en gran medida, de todas formas, lo cual, tal y como, a raíz de, siempre y cuando. The register that makes written Spanish sound professionally formed rather than merely correct. Several govern mood — siempre y cuando always takes the subjunctive — so they carry grammar with them and cannot be dropped in as vocabulary.',
    bookRef: 'Breakthrough U15.2.1',
    searchTerms: 'connectors|conectores|no obstante|siempre y cuando|a raíz de|lo cual|de todas formas|tal y como',
  },
  {
    id: 'b2.discourse.hedging',
    nameEn: 'Diplomatic hedging and softening disagreement',
    nameEs: 'Matización y desacuerdo diplomático',
    level: 'B2',
    strand: 'discourse',
    summary:
      'me temo que, habría que evaluar, en principio, no descartaría, entiendo su posición, sin embargo. The grammar of disagreeing without damage: conditional for distance, impersonal for depersonalising a criticism, and understatement in place of contradiction. In a client meeting this is not politeness decoration — it is how a position survives being rejected.',
    bookRef: 'Breakthrough U13.2.1',
    searchTerms: 'hedging|matización|me temo que|habría que|diplomatic|disagreement|softening|no descartaría',
  },

  /* ---------------- B2 · lex ---------------- */
  {
    id: 'b2.lex.falsos_amigos',
    nameEn: 'False friends',
    nameEs: 'Falsos amigos',
    level: 'B2',
    strand: 'lex',
    summary:
      'Words that look like their English cognate and are not: actual (current, not actual), eventualmente (possibly, not eventually), asistir (to attend), pretender (to intend), realizar (to carry out), sensible (sensitive), constipado. In technical writing these produce sentences that parse correctly and mean something else, which is worse than an obvious error.',
    bookRef: 'Mastery U1.2.3',
    searchTerms: 'false friends|falsos amigos|actual|eventualmente|asistir|pretender|realizar|sensible',
  },
  {
    id: 'b2.lex.verbos_delexicales',
    nameEn: 'Delexical verbs: dar, hacer, tener, poner, echar',
    nameEs: 'Verbos delexicales',
    level: 'B2',
    strand: 'lex',
    summary:
      'Five near-empty verbs that carry an enormous share of idiomatic Spanish: dar de baja, hacer constar, tener en cuenta, poner en marcha, echar un vistazo. Which verb pairs with which noun is arbitrary and not derivable from English, so these are learned as whole units or not at all.',
    bookRef: 'Mastery U11.2.1',
    searchTerms: 'delexical|dar|hacer|tener|poner|echar|dar de baja|tener en cuenta|poner en marcha',
  },
  {
    id: 'b2.lex.colocaciones_trabajo',
    nameEn: 'Work collocations',
    nameEs: 'Colocaciones profesionales',
    level: 'B2',
    strand: 'lex',
    summary:
      'The fixed pairings of this learner\'s working world: levantar observaciones, cumplir con el plazo, asumir el sobrecosto, liberar el frente, someter a aprobación, dar por cerrado, sentar un precedente. Collocation violation is the error that survives longest, because every individual word is right.',
    bookRef: 'Mastery U11.2.1',
    searchTerms: 'collocation|colocación|levantar observaciones|cumplir plazo|liberar frente|dar por cerrado',
  },

  /* ---------------- B2 · prof ---------------- */
  {
    id: 'b2.prof.presentaciones',
    nameEn: 'Client presentations',
    nameEs: 'Presentaciones ante el cliente',
    level: 'B2',
    strand: 'prof',
    summary:
      'Structuring and delivering a case to a client: signposting, sequencing, handling the question that follows, and returning to the thread after an interruption. Draws on tier-2 connectors and the impersonal register, and is the closest daily analogue to the B2 exam\'s monologue task.',
    bookRef: 'Breakthrough U10.2.7',
    searchTerms: 'presentation|presentación|cliente|client|monologue|exponer|sustentar',
  },
  {
    id: 'b2.prof.licitacion',
    nameEn: 'Tender and contract language',
    nameEs: 'Lenguaje de licitación y contrato',
    level: 'B2',
    strand: 'prof',
    summary:
      'The register of bases, propuesta, adenda, penalidad, ampliación de plazo and adicional — highly nominalised, heavily impersonal, and full of subjunctive in relative clauses because it specifies requirements rather than describing facts.',
    bookRef: null,
    searchTerms: 'tender|licitación|contrato|bases|propuesta|adenda|penalidad|adicional|ampliación de plazo',
  },
  {
    id: 'b2.prof.negociacion',
    nameEn: 'Negotiation',
    nameEs: 'Negociación',
    level: 'B2',
    strand: 'prof',
    summary:
      'Making a conditional offer, attaching a condition, conceding without collapsing, and closing. Runs almost entirely on structures from the mood strand: hypothetical conditionals for offers, siempre y cuando for conditions, the conditional for distance from a number you have not agreed to.',
    bookRef: 'Breakthrough U5.2.6',
    searchTerms: 'negotiation|negociación|estaríamos dispuestos|siempre y cuando|acuerdo|concesión|cerrar',
  },
  {
    id: 'b2.prof.defender_posicion',
    nameEn: 'Defending a position',
    nameEs: 'Defender una posición',
    level: 'B2',
    strand: 'prof',
    summary:
      'Holding a line under pressure: citing the contractual basis, conceding the valid part of the objection, and restating without escalating. si bien… , lo cierto es que…, con el debido respeto. The B2 exam tests this directly, and so does every claim meeting.',
    bookRef: 'Breakthrough U13.2.2',
    searchTerms: 'defend|defender|posición|argument|sustento|si bien|lo cierto es que|rebuttal',
  },
  {
    id: 'b2.prof.dirigir_reunion',
    nameEn: 'Chairing a meeting',
    nameEs: 'Dirigir una reunión',
    level: 'B2',
    strand: 'prof',
    summary:
      'Opening, allocating turns, cutting off a digression, summarising an agreement and assigning actions. Needs discourse management more than new grammar, and produces the acta — which is where reported speech becomes unavoidable.',
    bookRef: 'Breakthrough U15.2.4',
    searchTerms: 'meeting|reunión|chair|dirigir|acta|turnos|agenda|resumir|acuerdos',
  },
  {
    id: 'b2.prof.diplomatic',
    nameEn: 'Diplomatic professional performance',
    nameEs: 'Desempeño diplomático',
    level: 'B2',
    strand: 'prof',
    summary:
      'The integration topic: sustaining hedged, register-appropriate Spanish across a whole difficult exchange rather than in single sentences. Delivering bad news, refusing without a flat no, and keeping a relationship intact while holding a position. This is where the connector and hedging work has to become automatic.',
    bookRef: 'Breakthrough U13.2.4',
    searchTerms: 'diplomatic|diplomático|bad news|malas noticias|refusal|rechazo|register|tacto',
  },
];
