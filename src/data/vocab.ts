import type { VocabItem, VocabSection } from '../types';

type Seed = [VocabSection, string, string, string, ('m' | 'f')?];

/** The 7-section vocabulary bank, staged into spaced repetition on first run. */
const SEED: Seed[] = [
  // 1 ─ Connectors & discourse markers
  ['Connectors & discourse markers', 'sin embargo', 'however', 'El plazo es ajustado; sin embargo, es alcanzable si liberan el frente esta semana.'],
  ['Connectors & discourse markers', 'no obstante', 'nevertheless (more formal)', 'No obstante lo anterior, mantenemos la reserva por contingencias.'],
  ['Connectors & discourse markers', 'en cuanto a', 'as regards / when it comes to', 'En cuanto al presupuesto, la desviación se concentra en estructuras.'],
  ['Connectors & discourse markers', 'dado que', 'given that', 'Dado que el municipio aún no emite la licencia, proponemos reprogramar el inicio.'],
  ['Connectors & discourse markers', 'siempre y cuando', 'provided that (+ subjuntivo)', 'Podemos cumplir la fecha, siempre y cuando el cliente apruebe el adicional esta semana.'],
  ['Connectors & discourse markers', 'de lo contrario', 'otherwise', 'Necesitamos la conformidad el viernes; de lo contrario, perdemos la valorización del mes.'],
  ['Connectors & discourse markers', 'a fin de', 'in order to (formal)', 'Ajustamos la secuencia constructiva a fin de recuperar cinco días.'],
  ['Connectors & discourse markers', 'por consiguiente', 'consequently', 'El suelo resultó más blando de lo previsto; por consiguiente, hay que rediseñar la cimentación.'],
  ['Connectors & discourse markers', 'cabe señalar que', 'it is worth noting that', 'Cabe señalar que el retraso no es atribuible al contratista.'],
  ['Connectors & discourse markers', 'en la medida en que', 'insofar as', 'En la medida en que se liberen los frentes, el avance se normaliza.'],
  ['Connectors & discourse markers', 'a partir de', 'as of / on the basis of', 'A partir de la próxima valorización aplicamos el nuevo formato.'],
  ['Connectors & discourse markers', 'por lo que respecta a', 'as far as … is concerned', 'Por lo que respecta a la seguridad, no hay observaciones pendientes.'],

  // 2 ─ Work & project nouns (gender marked)
  ['Work & project nouns (gender marked)', 'el cronograma', 'schedule', 'El cronograma contractual no contempla los días de lluvia.', 'm'],
  ['Work & project nouns (gender marked)', 'el expediente técnico', 'technical dossier / design package', 'El expediente técnico regresó con doce observaciones.', 'm'],
  ['Work & project nouns (gender marked)', 'la valorización', 'progress billing / monthly valuation', 'La valorización de junio se presentó fuera de plazo.', 'f'],
  ['Work & project nouns (gender marked)', 'el adicional', 'variation / change order', 'El adicional N.º 3 sigue sin aprobación del cliente.', 'm'],
  ['Work & project nouns (gender marked)', 'la partida', 'work item / budget line', 'La partida de acabados concentra el mayor riesgo de sobrecosto.', 'f'],
  ['Work & project nouns (gender marked)', 'el metrado', 'quantity take-off', 'El metrado de acero está subestimado en un 8%.', 'm'],
  ['Work & project nouns (gender marked)', 'la licitación', 'tender / bid process', 'Nos presentamos a la licitación con dos socios locales.', 'f'],
  ['Work & project nouns (gender marked)', 'el sobrecosto', 'cost overrun', 'El sobrecosto acumulado ya supera el 6% del contrato.', 'm'],
  ['Work & project nouns (gender marked)', 'la ampliación de plazo', 'extension of time', 'Sustentamos la ampliación de plazo con el registro de lluvias.', 'f'],
  ['Work & project nouns (gender marked)', 'el residente de obra', 'site manager', 'El residente de obra levantó las observaciones en dos días.', 'm'],
  ['Work & project nouns (gender marked)', 'la supervisión', 'the supervising engineer / client\'s rep', 'La supervisión observó el vaciado por falta de curado.', 'f'],
  ['Work & project nouns (gender marked)', 'el acta', 'minutes / formal record (fem. noun, masc. article)', 'El acta de la reunión la firmamos todos los asistentes.', 'f'],
  ['Work & project nouns (gender marked)', 'la contingencia', 'contingency', 'Consumimos la mitad de la contingencia en el primer trimestre.', 'f'],
  ['Work & project nouns (gender marked)', 'el hito', 'milestone', 'El hito de estructuras es el 30 de septiembre.', 'm'],
  ['Work & project nouns (gender marked)', 'la envergadura', 'scale / magnitude', 'Para una obra de esta envergadura, el equipo es reducido.', 'f'],
  ['Work & project nouns (gender marked)', 'el alcance', 'scope', 'El alcance no incluye el equipamiento electromecánico.', 'm'],
  ['Work & project nouns (gender marked)', 'la penalidad', 'liquidated damages / penalty', 'La penalidad diaria es del 0,5% del monto contractual.', 'f'],
  ['Work & project nouns (gender marked)', 'el desembolso', 'disbursement', 'El desembolso está condicionado a la conformidad de la supervisión.', 'm'],
  ['Work & project nouns (gender marked)', 'la obra', 'the works / construction site', 'La obra está paralizada desde el martes.', 'f'],
  ['Work & project nouns (gender marked)', 'el plazo', 'deadline / term', 'El plazo contractual vence el 12 de diciembre.', 'm'],

  // 3 ─ Collocations
  ['Collocations', 'levantar observaciones', 'to close out / clear review comments', 'Levantamos las observaciones de la supervisión en 48 horas.'],
  ['Collocations', 'cumplir con el plazo', 'to meet the deadline', 'Vamos a cumplir con el plazo, pero sin holgura.'],
  ['Collocations', 'ajustar el presupuesto', 'to adjust the budget', 'Habría que ajustar el presupuesto antes de firmar la adenda.'],
  ['Collocations', 'asumir el sobrecosto', 'to absorb the overrun', 'El cliente no está dispuesto a asumir el sobrecosto.'],
  ['Collocations', 'liberar el frente de trabajo', 'to release the work area', 'Hasta que no liberen el frente, no podemos movilizar la cuadrilla.'],
  ['Collocations', 'someter a aprobación', 'to submit for approval', 'Sometimos el rediseño a aprobación del cliente el lunes.'],
  ['Collocations', 'dar por cerrado', 'to consider closed', 'Damos por cerrado el tema del acceso vehicular.'],
  ['Collocations', 'tomar cartas en el asunto', 'to step in / take action', 'Si el proveedor vuelve a fallar, tendremos que tomar cartas en el asunto.'],
  ['Collocations', 'sentar un precedente', 'to set a precedent', 'Aceptar ese adicional sin sustento sentaría un mal precedente.'],
  ['Collocations', 'acabar con los retrasos', 'to put an end to the delays', 'Reforzamos la cuadrilla para acabar con los retrasos de acabados.'],
  ['Collocations', 'llegar a un acuerdo', 'to reach an agreement', 'Llegamos a un acuerdo sobre el reajuste de precios.'],
  ['Collocations', 'poner sobre la mesa', 'to put on the table', 'Puse sobre la mesa el tema de la penalidad.'],

  // 4 ─ Verb patterns
  ['Verb patterns', 'comenzar a + infinitivo', 'to begin doing (the "a" is obligatory)', 'Comenzamos a excavar apenas llegó la licencia.'],
  ['Verb patterns', 'seguir + gerundio', 'to keep doing (never + infinitivo)', 'Seguimos negociando el alcance del adicional.'],
  ['Verb patterns', 'acabar de + infinitivo', 'to have just done', 'Acabo de hablar con la supervisión.'],
  ['Verb patterns', 'volver a + infinitivo', 'to do again', 'El cliente volvió a solicitar el mismo cambio.'],
  ['Verb patterns', 'dejar de + infinitivo', 'to stop doing', 'Dejamos de trabajar en el turno noche por seguridad.'],
  ['Verb patterns', 'ponerse a + infinitivo', 'to set about doing', 'Nos pusimos a revisar el metrado línea por línea.'],
  ['Verb patterns', 'encargarse de + sustantivo/infinitivo', 'to take charge of', 'Me encargo yo de la coordinación con el municipio.'],
  ['Verb patterns', 'darse cuenta de que', 'to realise that', 'Nos dimos cuenta de que el plano estaba desactualizado.'],
  ['Verb patterns', 'estar a punto de + infinitivo', 'to be about to', 'Estábamos a punto de vaciar cuando paró la lluvia.'],
  ['Verb patterns', 'venir + gerundio', 'to have been doing (ongoing)', 'Venimos advirtiendo este riesgo desde marzo.'],
  ['Verb patterns', 'llevar + tiempo + gerundio', 'to have spent X time doing', 'Llevamos tres semanas esperando la conformidad.'],
  ['Verb patterns', 'quedar en + infinitivo', 'to agree to do', 'Quedamos en revisarlo el jueves.'],

  // 5 ─ Negotiation & hedging
  ['Negotiation & hedging', 'me temo que', 'I\'m afraid that', 'Me temo que la fecha del 30 ya no es realista.'],
  ['Negotiation & hedging', 'habría que evaluar', 'we would need to assess', 'Habría que evaluar el impacto en la ruta crítica antes de comprometernos.'],
  ['Negotiation & hedging', 'en principio', 'in principle / tentatively', 'En principio sí, pero sujeto a la conformidad del cliente.'],
  ['Negotiation & hedging', 'no descartaría', 'I wouldn\'t rule out', 'No descartaría un escenario de dos semanas adicionales.'],
  ['Negotiation & hedging', 'entiendo su posición, sin embargo…', 'I understand your position, however…', 'Entiendo su posición; sin embargo, el sustento contractual es claro.'],
  ['Negotiation & hedging', 'permítame precisar', 'let me clarify', 'Permítame precisar un punto sobre el alcance.'],
  ['Negotiation & hedging', 'estaríamos dispuestos a', 'we would be willing to', 'Estaríamos dispuestos a asumir la mitad del sobrecosto.'],
  ['Negotiation & hedging', 'sujeto a', 'subject to', 'La propuesta es válida por 15 días, sujeta a disponibilidad de acero.'],
  ['Negotiation & hedging', 'a reserva de', 'pending / subject to', 'Firmamos el acta a reserva de la revisión legal.'],
  ['Negotiation & hedging', 'con el debido respeto', 'with all due respect', 'Con el debido respeto, esa interpretación no se sostiene contractualmente.'],
  ['Negotiation & hedging', 'hoy por hoy', 'as things stand today', 'Hoy por hoy, el riesgo principal es el suministro de acero.'],
  ['Negotiation & hedging', 'de mi parte', 'on my end / from my side', 'De mi parte, no hay objeción al cambio de secuencia.'],

  // 6 ─ Site & technical
  ['Site & technical', 'el vaciado', 'concrete pour', 'El vaciado de la losa se reprogramó para el sábado.', 'm'],
  ['Site & technical', 'el encofrado', 'formwork', 'El encofrado llegó incompleto y perdimos medio día.', 'm'],
  ['Site & technical', 'la cimentación', 'foundations', 'La cimentación tuvo que rediseñarse por el estudio de suelos.', 'f'],
  ['Site & technical', 'el replanteo', 'setting out', 'El replanteo topográfico no coincide con el plano de arquitectura.', 'm'],
  ['Site & technical', 'la cuadrilla', 'work crew', 'Reforzamos la cuadrilla de acabados con seis operarios.', 'f'],
  ['Site & technical', 'la ruta crítica', 'critical path', 'Ese atraso sí impacta la ruta crítica.', 'f'],
  ['Site & technical', 'el acero de refuerzo', 'reinforcing steel', 'El acero de refuerzo subió un 12% desde la firma del contrato.', 'm'],
  ['Site & technical', 'la holgura', 'float / slack', 'Ya no queda holgura en la partida de estructuras.', 'f'],
  ['Site & technical', 'el estudio de suelos', 'geotechnical survey', 'El estudio de suelos se hizo con solo dos calicatas.', 'm'],
  ['Site & technical', 'la conformidad', 'sign-off / acceptance', 'Sin la conformidad de la supervisión no se paga la valorización.', 'f'],
  ['Site & technical', 'el avance físico', 'physical progress', 'El avance físico está en 42% contra un 47% programado.', 'm'],
  ['Site & technical', 'la paralización', 'work stoppage', 'La paralización duró once días calendario.', 'f'],

  // 7 ─ Sentence builders
  ['Sentence builders', 'lo que más me preocupa es que + subjuntivo/indicativo', 'what worries me most is that', 'Lo que más me preocupa es que el municipio no responda a tiempo.'],
  ['Sentence builders', 'no es que… sino que…', 'it\'s not that… but rather that…', 'No es que el contratista no quiera avanzar, sino que no tiene el frente liberado.'],
  ['Sentence builders', 'por más que + subjuntivo', 'no matter how much', 'Por más que reforcemos la cuadrilla, sin licencia no hay avance.'],
  ['Sentence builders', 'de haberlo sabido, habríamos…', 'had we known, we would have…', 'De haberlo sabido, habríamos incluido una cláusula de reajuste.'],
  ['Sentence builders', 'el hecho de que + subjuntivo', 'the fact that', 'El hecho de que el cliente haya observado el expediente no nos exime del plazo.'],
  ['Sentence builders', 'a medida que + subjuntivo/indicativo', 'as / in step with', 'A medida que se liberen los frentes, iremos movilizando cuadrillas.'],
  ['Sentence builders', 'lo cierto es que', 'the fact of the matter is', 'Lo cierto es que el diseño llegó tarde a obra.'],
  ['Sentence builders', 'si bien… , …', 'although / while it\'s true that', 'Si bien el avance es menor al programado, la calidad no se ha comprometido.'],
  ['Sentence builders', 'tan pronto como + subjuntivo', 'as soon as', 'Tan pronto como emitan la licencia, movilizamos.'],
  ['Sentence builders', 'en caso de que + subjuntivo', 'in the event that', 'En caso de que se extienda la paralización, activamos el plan de contingencia.'],
];

export function seedVocab(today: string): VocabItem[] {
  return SEED.map(([section, term, gloss, example, gender], i) => ({
    id: `v-${i}`,
    section,
    term,
    gender,
    gloss,
    example,
    ease: 2.5,
    intervalDays: 0,
    // stagger the first wave so day one isn't 80 cards
    due: addDays(today, Math.floor(i / 8)),
    reps: 0,
    lapses: 0,
  }));
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Nouns with a marked gender, fed to the data-driven gender detector. */
export function genderNouns(vocab: VocabItem[]): { term: string; gender: 'm' | 'f' }[] {
  return vocab
    .filter((v) => v.gender)
    .map((v) => ({
      term: v.term.replace(/^(el|la|los|las)\s+/i, ''),
      gender: v.gender as 'm' | 'f',
    }))
    .filter((v) => /^[\wáéíóúñ]+$/i.test(v.term));
}
