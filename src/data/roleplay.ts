export interface RoleplayTurn {
  /** what the counterpart says */
  line: string;
  /** what you have to do in your reply */
  task: string;
  /** structures the app checks you for, beyond the error detectors */
  expect: { label: string; test: RegExp }[];
  /** a model answer at B2 register, revealed after you answer */
  model: string;
}

export interface Scenario {
  id: string;
  counterpart: string;
  title: string;
  setting: string;
  layer: 'accuracy' | 'speed' | 'naturalness' | 'confidence';
  turns: RoleplayTurn[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'rp-client-overrun',
    counterpart: 'Cliente (gerente de proyectos, minera)',
    title: 'Explicar un sobrecosto al cliente',
    setting:
      'Comité mensual. El avance físico está en 42% contra un 47% programado y el acero subió 12% desde la firma. Tienes que sostener la posición sin perder la relación.',
    layer: 'confidence',
    turns: [
      {
        line: '—Buenos días. Antes de empezar: ¿por qué estamos cinco puntos por debajo de lo programado?',
        task: 'Da la causa principal en pasado, distinguiendo el contexto (imperfecto) del hecho puntual (pretérito). Usa "hace + tiempo" en algún punto.',
        expect: [
          { label: 'una causa con por', test: /\bpor\s+(el|la|los|las|falta|las lluvias|el retraso)/i },
          { label: 'un pretérito de hecho puntual', test: /\b\w+(ó|aron|amos|imos|ieron)\b/i },
        ],
        model:
          'El desfase se explica principalmente por la liberación tardía del frente sur: hace tres semanas todavía no teníamos acceso para la maquinaria pesada, y recién el lunes pasado se levantó la restricción.',
      },
      {
        line: '—Entiendo, pero el contrato es claro. El sobrecosto lo asume ustedes.',
        task: 'Discrepa con cortesía profesional. Usa una fórmula de matización ("entiendo su posición, sin embargo…", "con el debido respeto") y sustenta con un hecho.',
        expect: [
          { label: 'una fórmula de matización', test: /\b(entiendo su posición|con el debido respeto|me temo que|permítame precisar|si bien)\b/i },
          { label: 'un conector adversativo', test: /\b(sin embargo|no obstante|ahora bien)\b/i },
        ],
        model:
          'Entiendo su posición; sin embargo, permítame precisar un punto: la cláusula de reajuste contempla justamente la variación de precios de insumos. El alza del acero está documentada y no es atribuible a nuestra gestión.',
      },
      {
        line: '—¿Y qué propone usted, concretamente?',
        task: 'Haz una propuesta condicional. Usa un condicional Type 2 (si + imperfecto de subjuntivo → condicional) y "siempre y cuando" o "estaríamos dispuestos a".',
        expect: [
          { label: 'condicional o disposición', test: /\b(estaríamos dispuestos|podríamos|habría que|asumiríamos|propondría)\b/i },
          { label: 'una condición', test: /\b(siempre y cuando|si\s+\w+(ara|era|iera)|a condición de|sujeto a)\b/i },
        ],
        model:
          'Estaríamos dispuestos a asumir la mitad del diferencial, siempre y cuando se reconozca la ampliación de plazo de quince días. Si cerráramos ese paquete esta semana, evitaríamos que el impacto llegue a la ruta crítica.',
      },
      {
        line: '—Quince días me parece mucho. ¿Diez?',
        task: 'Cierra el acuerdo o mantén la posición. Usa "dar por cerrado", "llegar a un acuerdo" o "quedamos en + infinitivo".',
        expect: [
          { label: 'lenguaje de cierre', test: /\b(quedamos en|damos por cerrado|llegamos a un acuerdo|cerramos|acordamos)\b/i },
        ],
        model:
          'Doce y damos por cerrado el tema, con el acta firmada hoy mismo. Quedamos en que la valorización de este mes ya incorpora el reajuste.',
      },
    ],
  },
  {
    id: 'rp-site-engineer',
    counterpart: 'Residente de obra',
    title: 'Reporte de avance en obra',
    setting:
      'Estás en obra un martes por la mañana. Llovió el fin de semana y el vaciado de la losa del nivel 3 no se ejecutó.',
    layer: 'naturalness',
    turns: [
      {
        line: '—Ingeniero, buenos días. ¿Le cuento cómo quedó el fin de semana?',
        task: 'Pide el reporte usando un imperativo de usted y una pregunta concreta sobre el vaciado.',
        expect: [
          { label: 'imperativo de usted', test: /\b(cuénteme|dígame|explíqueme|hágame|páseme|revise|indíqueme)\b/i },
        ],
        model:
          'Cuénteme, por favor. ¿Se llegó a vaciar la losa del nivel 3 o quedó pendiente por la lluvia?',
      },
      {
        line: '—No se pudo, ingeniero. Llovió sábado y domingo y el encofrado quedó anegado.',
        task: 'Narra la consecuencia alternando imperfecto (contexto) y pretérito (hecho). Marca el impacto en el cronograma.',
        expect: [
          { label: 'un imperfecto de contexto', test: /\b\w+(aba|ábamos|aban|ía|íamos|ían)\b/i },
          { label: 'un pretérito de hecho', test: /\b\w+(ó|aron|ieron|amos|imos)\b/i },
        ],
        model:
          'Entonces perdimos dos días. Como el encofrado estaba anegado y no había forma de drenar, el vaciado se corrió al sábado siguiente; eso nos come toda la holgura de estructuras.',
      },
      {
        line: '—¿Reprogramamos o metemos turno noche?',
        task: 'Decide y justifica con "dado que", "en la medida en que" o "a fin de". Usa seguir + gerundio o comenzar a + infinitivo.',
        expect: [
          { label: 'un conector causal o final', test: /\b(dado que|a fin de|en la medida en que|puesto que|ya que|para que)\b/i },
          { label: 'seguir + gerundio o comenzar a + inf.', test: /\b(seguimos|sigan|siga|continuamos)\s+\w+(ando|iendo)\b|\b(comenzar|comenzamos|empezamos|empiecen)\s+a\s+\w+[aei]r\b/i },
        ],
        model:
          'Metemos turno noche solo para el vaciado, a fin de no perder el hito de estructuras. Que la cuadrilla de acabados siga trabajando en horario normal; no quiero pagar sobretiempo en una partida que no está en ruta crítica.',
      },
    ],
  },
  {
    id: 'rp-contractor-claim',
    counterpart: 'Contratista (subcontrato de acabados)',
    title: 'Rechazar un adicional sin sustento',
    setting:
      'El subcontratista presenta un adicional por 180 000 soles alegando cambio de alcance. Tú sostienes que estaba incluido.',
    layer: 'confidence',
    turns: [
      {
        line: '—Ese trabajo nunca estuvo en nuestro alcance. Presentamos el adicional la semana pasada y todavía no hay respuesta.',
        task: 'Responde señalando la cláusula. Usa "lo cierto es que" o "si bien" y un pluscuamperfecto o pretérito bien marcado.',
        expect: [
          { label: 'una fórmula de posición', test: /\b(lo cierto es que|si bien|el hecho de que|en realidad|permítame)\b/i },
        ],
        model:
          'Si bien entiendo su lectura, lo cierto es que la partida figura en el numeral 4.3 del contrato que ustedes firmaron. El alcance no cambió; lo que cambió fue la secuencia constructiva.',
      },
      {
        line: '—Entonces no vamos a movilizar hasta que se resuelva.',
        task: 'Reacciona con firmeza. Usa una condicional real ("si + presente, futuro"), y menciona la penalidad o el precedente.',
        expect: [
          { label: 'condicional real', test: /\bsi\s+\w+(a|e|an|en|amos|emos|imos)\b/i },
          { label: 'consecuencia contractual', test: /\b(penalidad|precedente|incumplimiento|resolución|carta notarial|acta)\b/i },
        ],
        model:
          'Si ustedes paralizan, estaremos ante un incumplimiento contractual y tendremos que aplicar la penalidad diaria. Aceptar un adicional sin sustento sentaría un precedente que no podemos permitirnos en este contrato.',
      },
      {
        line: '—Está bien, revisemos el numeral. ¿Podemos vernos el jueves?',
        task: 'Cierra la reunión con "quedamos en + infinitivo" y "después de + infinitivo/sustantivo" — cuidado con el "de".',
        expect: [
          { label: 'quedar en / acordar', test: /\b(quedamos en|acordamos|nos vemos|coordinamos)\b/i },
          { label: 'después DE', test: /\bdespués de\b|\bantes de\b|\buna vez\b/i },
        ],
        model:
          'Quedamos en vernos el jueves a las nueve. Después de revisar el numeral juntos, levantamos un acta con lo que se acuerde, para no volver sobre el mismo tema.',
      },
    ],
  },
  {
    id: 'rp-government',
    counterpart: 'Funcionario municipal',
    title: 'Gestionar una licencia trabada',
    setting:
      'La licencia de edificación lleva siete semanas en trámite. Necesitas destrabarla sin antagonizar a la entidad.',
    layer: 'naturalness',
    turns: [
      {
        line: '—El expediente está en revisión. No le puedo dar una fecha.',
        task: 'Insiste con cortesía. Usa "hace + tiempo + que + presente" y una pregunta indirecta ("quisiera saber si…", "¿habría alguna manera de…?").',
        expect: [
          { label: 'hace + tiempo', test: /\bhace\s+\w+\s+(semanas?|meses|días?|años?)\b/i },
          { label: 'pregunta indirecta / cortesía', test: /\b(quisiera saber|habría alguna|me podría|sería posible|le agradecería)\b/i },
        ],
        model:
          'Hace siete semanas que presentamos el expediente y entiendo que el plazo administrativo es de treinta días hábiles. Quisiera saber si habría alguna manera de conocer el estado de la revisión, aunque sea de manera referencial.',
      },
      {
        line: '—Puede presentar una solicitud de información. Eso demora otros diez días.',
        task: 'Explica el impacto real usando "de lo contrario" o "en caso de que + subjuntivo", y ofrece una alternativa.',
        expect: [
          { label: 'consecuencia o condición', test: /\b(de lo contrario|en caso de que|si no|salvo que)\b/i },
        ],
        model:
          'El problema es que tenemos cien trabajadores movilizados. En caso de que la revisión se extienda diez días más, tendríamos que desmovilizar, con el costo que eso implica. ¿Sería posible una reunión técnica para absolver observaciones directamente?',
      },
      {
        line: '—Déjeme consultarlo con el área. Vuelva el lunes.',
        task: 'Cierra dejando constancia. Usa "a fin de", "dejar constancia" o "cabe señalar que" — registro formal.',
        expect: [
          { label: 'registro formal', test: /\b(a fin de|dejar constancia|cabe señalar|le agradezco|quedo atento)\b/i },
        ],
        model:
          'Se lo agradezco mucho. Voy a dejar constancia por mesa de partes de esta conversación, a fin de que quede registrada la gestión, y quedo atento a lo que me indique el lunes.',
      },
    ],
  },
];
