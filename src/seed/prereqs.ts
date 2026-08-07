import type { SeedPrereq } from './types';

/**
 * The dependency graph (SPEC §3). This is what produces "start with X, then Y".
 *
 * `hard` blocks: a topic stays locked until every hard prerequisite is mastered.
 * `soft` recommends only, and is used to order what is already available.
 *
 * The chains SPEC §3 draws are reproduced exactly; the additional edges below
 * them connect the spine to the A-level topics those chains assume, so nothing
 * dangles.
 */

const hard = (topic: string, prereq: string): SeedPrereq => ({ topic, prereq, strength: 'hard' });
const soft = (topic: string, prereq: string): SeedPrereq => ({ topic, prereq, strength: 'soft' });

export const PREREQS: SeedPrereq[] = [
  /* ---- SPEC §3, chain 1: the past-tense spine into the subjunctive ---- */
  hard('b1.verb.pluscuamperfecto', 'b1.verb.preterito'),
  hard('b1.verb.pluscuamperfecto', 'b1.verb.imperfecto'),
  hard('b2.mood.subj_pluscuamperfecto', 'b1.verb.pluscuamperfecto'),
  hard('b2.mood.subj_perfecto', 'b1.verb.presente_perfecto'),
  hard('b2.mood.subj_pluscuamperfecto', 'b2.mood.subj_imperfecto'),
  hard('b2.mood.subj_perfecto', 'b2.mood.subj_imperfecto'),

  /* ---- chain 2: present subjunctive → imperfect → conditionals ---- */
  hard('b2.mood.subj_imperfecto', 'b1.mood.subj_presente'),
  hard('b2.mood.subj_imperfecto', 'b1.verb.preterito'), // forms derive from 3pl preterite
  hard('b2.mood.si_hipotetico', 'b2.mood.subj_imperfecto'),
  hard('b2.mood.si_counterfactual', 'b2.mood.subj_imperfecto'),
  hard('b2.mood.si_counterfactual', 'b2.mood.subj_pluscuamperfecto'),
  hard('b2.mood.si_counterfactual', 'b2.verb.condicional_compuesto'),

  /* ---- chain 3: object pronouns → se → clitic combination ---- */
  hard('b1.pron.se_constructions', 'b1.pron.od_oi'),
  hard('b2.pron.clitic_combos', 'b1.pron.se_constructions'),
  soft('b2.pron.cliticos_redundantes', 'b1.pron.od_oi'),

  /* ---- chain 4: relatives → subjunctive relatives → C1 subordination ---- */
  hard('b2.mood.subj_relativas', 'b1.syntax.relativos'),
  hard('b2.mood.subj_relativas', 'b1.mood.subj_presente'),
  hard('c1.syntax.subordinacion', 'b2.mood.subj_relativas'),

  /* ---- chain 5: past tenses → reported speech ---- */
  hard('b2.syntax.estilo_indirecto', 'b1.verb.preterito'),
  hard('b2.syntax.estilo_indirecto', 'b1.verb.pluscuamperfecto'),

  /* ---- chain 6: connectors → diplomatic performance ---- */
  hard('b2.discourse.conectores_2', 'b1.discourse.conectores_1'),
  hard('b2.prof.diplomatic', 'b2.discourse.conectores_2'),

  /* ---- A-level foundations the spine assumes ---- */
  hard('b1.verb.preterito', 'a2.verb.preterito_regular'),
  hard('b1.verb.imperfecto', 'a2.verb.imperfecto'),
  hard('b1.verb.pret_vs_imp', 'b1.verb.preterito'),
  hard('b1.verb.pret_vs_imp', 'b1.verb.imperfecto'),
  hard('b1.verb.presente_perfecto', 'a2.verb.presente_perfecto_intro'),
  hard('b1.verb.haber_dos_usos', 'a1.verb.hay'),
  hard('b1.verb.haber_dos_usos', 'b1.verb.presente_perfecto'),
  hard('b1.mood.subj_presente', 'a1.verb.presente_regular'),
  hard('b1.mood.subj_cuando', 'b1.mood.subj_presente'),
  hard('b1.mood.ojala_quizas', 'b1.mood.subj_presente'),
  hard('b1.pron.od_oi', 'a2.pron.od'),
  hard('b1.pron.od_oi', 'a2.pron.oi'),
  hard('b1.pron.od_oi', 'a2.pron.se_lo'),
  hard('b1.syntax.comas_relativas', 'b1.syntax.relativos'),
  hard('a2.pron.se_lo', 'a2.pron.od'),
  hard('a2.pron.se_lo', 'a2.pron.oi'),
  hard('a2.verb.condicional', 'a2.verb.futuro_simple'),
  soft('a2.pron.oi', 'a1.verb.gustar'), // the book introduces the IO pronoun through gustar

  /* ---- B2 verb topics ---- */
  hard('b2.verb.futuro_perfecto', 'a2.verb.futuro_simple'),
  hard('b2.verb.futuro_perfecto', 'b1.verb.presente_perfecto'),
  hard('b2.verb.condicional_compuesto', 'a2.verb.condicional'),
  hard('b2.verb.condicional_compuesto', 'b1.verb.presente_perfecto'),
  hard('b2.verb.futuro_probabilidad', 'a2.verb.futuro_simple'),
  hard('b2.verb.colision_r', 'a2.verb.futuro_simple'),
  hard('b2.verb.colision_r', 'a2.verb.condicional'),
  hard('b2.verb.colision_r', 'b2.mood.subj_imperfecto'),

  /* ---- B2 syntax and mood ---- */
  hard('b2.syntax.secuencia_tiempos', 'b2.mood.subj_imperfecto'),
  hard('b2.syntax.pasiva', 'b1.pron.se_constructions'),
  hard('b2.syntax.nominalizacion', 'b2.discourse.conectores_2'),
  hard('b2.mood.subj_concesivas', 'b1.mood.subj_presente'),

  /* ---- professional strand ---- */
  soft('b1.prof.status_updates', 'b1.verb.pret_vs_imp'),
  soft('b1.prof.reportar_avance', 'b1.prof.status_updates'),
  soft('b1.prof.instrucciones_obra', 'a2.verb.imperativo'),
  hard('b2.prof.presentaciones', 'b2.discourse.conectores_2'),
  hard('b2.prof.negociacion', 'b2.mood.si_hipotetico'),
  soft('b2.prof.negociacion', 'b2.discourse.hedging'),
  hard('b2.prof.defender_posicion', 'b2.discourse.hedging'),
  hard('b2.prof.dirigir_reunion', 'b2.syntax.estilo_indirecto'),
  hard('b2.prof.licitacion', 'b2.mood.subj_relativas'),
  hard('b2.lex.colocaciones_trabajo', 'b2.lex.verbos_delexicales'),

  /* ---- C-level: every entry point anchors to the B2 spine, so a cold start
         never offers C2 before B1 ---- */
  hard('b2.lex.verbos_delexicales', 'b2.lex.falsos_amigos'),
  hard('b2.discourse.hedging', 'b2.discourse.conectores_2'),
  hard('c1.mood.subj_eleccion', 'b2.mood.subj_relativas'),
  hard('c1.mood.subj_eleccion', 'b2.mood.subj_concesivas'),
  hard('c1.syntax.enfasis', 'c1.syntax.subordinacion'),
  hard('c1.syntax.elipsis', 'c1.syntax.subordinacion'),
  hard('c1.discourse.registro', 'b2.discourse.hedging'),
  hard('c1.discourse.gestion_turnos', 'c1.discourse.registro'),
  hard('c1.discourse.ironia', 'c1.discourse.registro'),
  hard('c1.lex.precision', 'b2.lex.colocaciones_trabajo'),
  hard('c1.prof.argumentacion', 'b2.prof.defender_posicion'),
  hard('c1.prof.autoridad', 'c1.prof.argumentacion'),
  hard('c2.discourse.estilo', 'c1.discourse.registro'),
  hard('c2.lex.abstraccion', 'b2.syntax.nominalizacion'),
  hard('c2.lex.idiom_regional', 'c1.lex.precision'),
  hard('c2.prof.registro_legal', 'c2.lex.abstraccion'),

  /* ---- Book units that had no topic until the workbooks were read ---- */
  // Ser/estar with adjectives is the A1 contrast applied to description, so it
  // waits on the basic contrast rather than on the estar-only topic.
  hard('b1.verb.ser_estar_adjetivos', 'a1.verb.ser_estar'),
  soft('b1.verb.ser_estar_adjetivos', 'a1.verb.estar_ubicacion'),

  // The advice spectrum needs both halves of its range: the subjunctive rungs
  // (es importante que, te recomiendo que) and the conditional ones (debería,
  // podría, yo que usted).
  hard('b2.mood.consejo_gradado', 'b1.mood.subj_presente'),
  hard('b2.mood.consejo_gradado', 'a2.verb.condicional'),
  soft('b2.mood.consejo_gradado', 'a2.verb.imperativo'),

  // Emergencies are usted imperatives in the moment and a preterite narrative
  // afterwards; only the first is a hard gate.
  hard('b1.prof.emergencias', 'a2.verb.imperativo'),
  soft('b1.prof.emergencias', 'b1.verb.preterito'),

  // Mixed and si-less hypotheticals sit on top of the counterfactual spine.
  hard('c1.mood.hipotesis_complejas', 'b2.mood.si_counterfactual'),
  hard('c1.mood.hipotesis_complejas', 'b2.verb.condicional_compuesto'),
  soft('c1.mood.hipotesis_complejas', 'b2.mood.subj_pluscuamperfecto'),
];
