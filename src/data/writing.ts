/** Written assignments — always graded in-session, never take-home. */
export interface WritingPrompt {
  id: string;
  topicId?: string;
  brief: string;
  mustUse: { label: string; test: RegExp }[];
  minWords: number;
}

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'w-imp-pret',
    topicId: 't-imp-vs-pret',
    brief:
      'Narra en un párrafo (60–100 palabras) qué pasó la semana pasada en una de tus obras: cómo estaba la situación al llegar, qué evento concreto la cambió y qué decidieron. Alterna imperfecto (el contexto) y pretérito (los hechos).',
    minWords: 55,
    mustUse: [
      { label: 'al menos un imperfecto de contexto', test: /\b\w+(aba|abas|ábamos|aban|ía|ías|íamos|ían)\b/i },
      { label: 'al menos dos pretéritos de hecho', test: /\b\w+(ó|é|aron|ieron|amos|imos)\b.*\b\w+(ó|é|aron|ieron|amos|imos)\b/is },
      { label: 'un conector (sin embargo / dado que / de lo contrario…)', test: /\b(sin embargo|no obstante|dado que|de lo contrario|en cuanto a|a fin de|si bien|por consiguiente)\b/i },
    ],
  },
  {
    id: 'w-por-para',
    topicId: 't-por-para',
    brief:
      'Redacta un correo breve (60–100 palabras) al cliente explicando un retraso: la causa, el plazo nuevo y qué necesitas de su parte. Usa por y para al menos dos veces cada uno, con valores distintos.',
    minWords: 55,
    mustUse: [
      { label: 'dos usos de POR', test: /\bpor\b[\s\S]*\bpor\b/i },
      { label: 'dos usos de PARA', test: /\bpara\b[\s\S]*\bpara\b/i },
      { label: 'una fórmula de cortesía profesional', test: /\b(me temo que|le agradecería|quedo atento|permítame|entiendo su posición|estaríamos dispuestos)\b/i },
    ],
  },
  {
    id: 'w-claim',
    brief:
      'Sustenta en un párrafo (70–110 palabras) por qué un sobrecosto no es atribuible a tu equipo. Incluye una condicional (si + imperfecto de subjuntivo → condicional) y una fórmula de matización.',
    minWords: 60,
    mustUse: [
      { label: 'una condicional tipo 2', test: /\bsi\s+\w*(ara|era|iera|áramos|éramos|iéramos|aran|eran|ieran)\b/i },
      { label: 'un condicional en la otra cláusula', test: /\b\w+(ría|rías|ríamos|rían)\b/i },
      { label: 'una fórmula de matización', test: /\b(si bien|lo cierto es que|entiendo|con el debido respeto|cabe señalar|hoy por hoy)\b/i },
    ],
  },
  {
    id: 'w-status',
    brief:
      'Escribe el resumen ejecutivo de un informe de avance (70–110 palabras): avance físico vs. programado, principal riesgo y acción propuesta. Registro formal, impersonal donde corresponda (se presentó, se observó).',
    minWords: 60,
    mustUse: [
      { label: 'una construcción con SE impersonal/pasiva refleja', test: /\bse\s+\w+(ó|aron|ieron|a|an|e|en)\b/i },
      { label: 'vocabulario de obra (avance, partida, ruta crítica…)', test: /\b(avance|partida|ruta crítica|valorización|cronograma|hito|holgura|contingencia|supervisión)\b/i },
      { label: 'un conector formal', test: /\b(cabe señalar|no obstante|en cuanto a|por consiguiente|a fin de|en la medida en que)\b/i },
    ],
  },
  {
    id: 'w-negotiation',
    brief:
      'Defiende por escrito (70–110 palabras) una posición ante un subcontratista que amenaza con paralizar. Incluye una consecuencia contractual y una salida negociada.',
    minWords: 60,
    mustUse: [
      { label: 'una consecuencia contractual', test: /\b(penalidad|incumplimiento|precedente|resolución|carta notarial|acta)\b/i },
      { label: 'una condición (siempre y cuando / en caso de que…)', test: /\b(siempre y cuando|en caso de que|a condición de|sujeto a|salvo que)\b/i },
      { label: 'una propuesta', test: /\b(propongo|proponemos|estaríamos dispuestos|podríamos|sugiero)\b/i },
    ],
  },
];

export function promptFor(topicId?: string): WritingPrompt {
  return (
    WRITING_PROMPTS.find((p) => p.topicId && p.topicId === topicId) ??
    WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)]
  );
}

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}
