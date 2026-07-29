import type { ErrorCategory, Finding } from '../types';

/**
 * Rule-based Spanish error detector.
 *
 * Every rule maps to an entry in the error log via `errorId`, so a hit from a
 * transcript, a written assignment or a role-play turn all feed the same
 * frequency counter and accuracy history. Rules are deliberately conservative:
 * a false positive costs trust, a miss costs one rep.
 */

export interface Rule {
  id: string;
  errorId: string;
  category: ErrorCategory;
  rule: string; // full explanation shown in the correction table
  /** returns findings for a piece of text */
  run: (text: string) => RawHit[];
}

export interface RawHit {
  excerpt: string;
  suggestion: string;
  index: number;
}

/** `\b` fails after an accented vowel (ó is not a \w char), so end-of-word
 *  after a Spanish ending must be asserted explicitly. */
const EOW = '(?![a-záéíóúñü])';

const strip = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Map lookup that tolerates either accented or stripped spelling of the key. */
const look = (map: Record<string, string>, word: string): string | undefined =>
  map[word.toLowerCase()] ?? map[strip(word)];

/** Collect regex matches with a suggestion builder. */
function scan(
  text: string,
  re: RegExp,
  suggest: (m: RegExpExecArray) => string | null,
): RawHit[] {
  const hits: RawHit[] = [];
  const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    const s = suggest(m);
    if (s) hits.push({ excerpt: m[0].trim(), suggestion: s, index: m.index });
    if (m.index === rx.lastIndex) rx.lastIndex++;
  }
  return hits;
}

/* ------------------------------------------------------------------ *
 * 1. Gender / number agreement — the Greek -ma masculine group
 * ------------------------------------------------------------------ */

/** Masculine nouns that look feminine (Greek -ma / -ta origin, plus traps). */
export const FALSE_FEMININE = [
  'tema','problema','sistema','programa','clima','idioma','esquema','diagrama',
  'cronograma','síntoma','dilema','teorema','planeta','día','mapa','panorama',
  'lema','trauma','poema',
];

/** Feminine nouns that look masculine. */
export const FALSE_MASCULINE = ['mano','foto','moto','labor','sede','red','ley','señal','obra'];

const FEM_DET =
  'la|una|esta|esa|aquella|otra|mucha|poca|toda|alguna|ninguna|nuestra|vuestra|cuánta|media|misma';
const FEM_DET_PL =
  'las|unas|estas|esas|aquellas|otras|muchas|pocas|todas|algunas|ningunas|nuestras|varias|cuántas|mismas';

const MASC_MAP: Record<string, string> = {
  la: 'el', una: 'un', esta: 'este', esa: 'ese', aquella: 'aquel', otra: 'otro',
  mucha: 'mucho', poca: 'poco', toda: 'todo', alguna: 'algún', ninguna: 'ningún',
  nuestra: 'nuestro', vuestra: 'vuestro', cuánta: 'cuánto', media: 'medio', misma: 'mismo',
  las: 'los', unas: 'unos', estas: 'estos', esas: 'esos', aquellas: 'aquellos',
  otras: 'otros', muchas: 'muchos', pocas: 'pocos', todas: 'todos', ningunas: 'ningunos',
  nuestras: 'nuestros', varias: 'varios', cuántas: 'cuántos', mismas: 'mismos',
};

const PLURALS = FALSE_FEMININE.map((n) =>
  n.endsWith('a') || n.endsWith('e') || n.endsWith('o') ? n + 's' : n + 'es',
);

const genderRule: Rule = {
  id: 'gender-ma',
  errorId: 'err-gender-ma',
  category: 'grammar',
  rule:
    'Nouns of Greek origin ending in -ma (and a few others like el día, el mapa, el planeta) are MASCULINE despite the -a ending: el tema, un problema, el sistema, el programa, el clima, el idioma, el cronograma, el esquema, el diagrama, el síntoma. ' +
    'The -a here is not the Spanish feminine marker; it comes from Greek neuter -ma, which Latin absorbed as masculine. Every word that agrees with the noun must be masculine too — article, demonstrative, quantifier and adjective: "este problema técnico", "los mismos temas presupuestales", "un cronograma ajustado". ' +
    'Test yourself on the whole noun phrase, not just the article: "la problema" and "el problema complicada" are the same mistake at different distances.',
  run: (text) => {
    const hits: RawHit[] = [];
    const sg = new RegExp(
      `\\b((?:${FEM_DET})\\s+)?(${FEM_DET})\\s+(${FALSE_FEMININE.join('|')})\\b`,
      'gi',
    );
    hits.push(
      ...scan(text, sg, (m) => {
        const lead = m[1] ? look(MASC_MAP, m[1].trim()) : null;
        const det = look(MASC_MAP, m[2]);
        if (!det) return null;
        return `${lead ? lead + ' ' : ''}${det} ${m[3]}`;
      }),
    );
    const pl = new RegExp(
      `\\b((?:${FEM_DET_PL})\\s+)?(${FEM_DET_PL})\\s+(${PLURALS.join('|')})\\b`,
      'gi',
    );
    hits.push(
      ...scan(text, pl, (m) => {
        const lead = m[1] ? look(MASC_MAP, m[1].trim()) : null;
        const det = look(MASC_MAP, m[2]);
        if (!det) return null;
        return `${lead ? lead + ' ' : ''}${det} ${m[3]}`;
      }),
    );
    // adjective trailing the noun: "el problema complicada"
    const adj = new RegExp(
      `\\b(${FALSE_FEMININE.join('|')})s?\\s+(\\w+)(a|as)\\b`,
      'gi',
    );
    hits.push(
      ...scan(text, adj, (m) => {
        const stem = m[2];
        // only flag adjectives with a clean -o counterpart
        if (!/^(complicad|dificil|nuev|mism|much|poc|tod|distint|complet|clar|important|serious|grav|urgent|principal)/i.test(stem + m[3]))
          return null;
        if (/^(dificil|urgent|important|principal|grav)/i.test(stem)) return null;
        return `${m[1]}${m[0].includes('s ') ? 's' : ''} ${stem}${m[3] === 'as' ? 'os' : 'o'}`;
      }),
    );
    // feminine nouns that look masculine: "el mano", "un obra"
    const fm = new RegExp(`\\b(el|un|este|ese|otro|mucho|todo)\\s+(${FALSE_MASCULINE.join('|')})\\b`, 'gi');
    hits.push(
      ...scan(text, fm, (m) => {
        const inv: Record<string, string> = {
          el: 'la', un: 'una', este: 'esta', ese: 'esa', otro: 'otra',
          mucho: 'mucha', todo: 'toda',
        };
        return inv[strip(m[1])] ? `${inv[strip(m[1])]} ${m[2]}` : null;
      }),
    );
    return hits;
  },
};

/* ------------------------------------------------------------------ *
 * 2. Preterite person endings
 * ------------------------------------------------------------------ */

const preteriteRule: Rule = {
  id: 'preterite-person',
  errorId: 'err-preterite-person',
  category: 'tense',
  rule:
    'In the preterite the person is carried entirely by the ending, and the two singular endings are minimal pairs distinguished only by the stressed vowel: -é/-í for yo, -ó/-ió for él/ella/usted. ' +
    'yo hablé, revisé, coordiné — él habló, revisó, coordinó. yo escribí, cumplí — él escribió, cumplió. ' +
    'Because the written accent falls on the last syllable in both, the only cue is the vowel itself, so a slip changes who did the action: "yo aprobé el presupuesto" (I approved it) vs "él aprobó el presupuesto" (he approved it). ' +
    'When narrating site history, fix the subject in your head first, then choose the vowel: yo → é/í, él → ó/ió.',
  run: (text) => {
    const hits: RawHit[] = [];
    hits.push(
      // -ió is handled below; a stem ending in i here would be that pattern
      ...scan(text, new RegExp(`\\byo\\s+((?:no\\s+)?)(\\w{2,})ó${EOW}`, 'gi'), (m) =>
        m[2].endsWith('i') ? null : `yo ${m[1]}${m[2]}é`),
    );
    hits.push(
      ...scan(
        text,
        new RegExp(
          `\\b(él|ella|usted|el cliente|el ingeniero|la empresa|el contratista)\\s+((?:no\\s+)?)(\\w{2,})é${EOW}`,
          'gi',
        ),
        (m) => `${m[1]} ${m[2]}${m[3]}ó`,
      ),
    );
    hits.push(
      ...scan(text, new RegExp(`\\byo\\s+((?:no\\s+)?)(\\w{2,})ió${EOW}`, 'gi'), (m) => `yo ${m[1]}${m[2]}í`),
    );
    return hits;
  },
};

/* ------------------------------------------------------------------ *
 * 3. Subjunctive leaking into past-indicative narration
 * ------------------------------------------------------------------ */

const SUBJ_TO_IND: Record<string, string> = {
  compremos: 'compramos', comprara: 'compró', compraran: 'compraron',
  fueran: 'fueron', fuera: 'fue', fuese: 'fue', fuesen: 'fueron',
  tuviéramos: 'tuvimos', tuvieran: 'tuvieron', tuviera: 'tuvo',
  hiciéramos: 'hicimos', hicieran: 'hicieron', hiciera: 'hizo',
  estuviéramos: 'estuvimos', estuvieran: 'estuvieron', estuviera: 'estuvo',
  pudiéramos: 'pudimos', pudieran: 'pudieron', pudiera: 'pudo',
  llegáramos: 'llegamos', llegaran: 'llegaron', llegara: 'llegó',
  terminemos: 'terminamos', empecemos: 'empezamos', entreguemos: 'entregamos',
  revisemos: 'revisamos', firmemos: 'firmamos', avancemos: 'avanzamos',
  vayamos: 'fuimos', hagamos: 'hicimos', seamos: 'fuimos', tengamos: 'tuvimos',
};

const PAST_MARKER =
  /\b(ayer|anoche|anteayer|la semana pasada|el mes pasado|el año pasado|el lunes pasado|hace \w+|en (19|20)\d\d|el año \d{4}|durante la obra|en la reunión anterior)\b/i;

const SUBJ_TRIGGER =
  /\b(que|si|ojalá|ojala|cuando|aunque|para que|antes de que|después de que|espero|esperaba|quería|quiero|dudo|dudaba|pidió|pidieron|recomendó|sugirió|exigió|como si|a menos que|con tal de que|sin que|tal vez|quizá|quizás)\b/i;

const subjunctiveRule: Rule = {
  id: 'subj-in-past',
  errorId: 'err-subj-past-narration',
  category: 'tense',
  rule:
    'Narrating what actually happened is indicative, not subjunctive. The subjunctive appears only when something licenses it: a subordinating "que" after a verb of wish/doubt/influence (quería que llegaran), a hypothetical "si" (si tuviéramos más plazo), "ojalá", "cuando" pointing at the future, "aunque" conceding something unreal, or "como si". ' +
    'With none of those present, a finished past event takes the preterite: "la semana pasada compramos el material" — not "compremos"; "los planos llegaron tarde" — not "llegaran". ' +
    'The trap is that -ramos/-ran forms feel more "advanced", so they get reached for under pressure. Rule of thumb while narrating a site history: if you could put "ayer" in front of the clause and it still describes a real event, it must be indicative.',
  run: (text) => {
    const hits: RawHit[] = [];
    for (const sentence of splitSentences(text)) {
      if (!PAST_MARKER.test(sentence.text)) continue;
      // remove the past marker before checking for a licensing trigger
      const rest = sentence.text.replace(PAST_MARKER, ' ');
      if (SUBJ_TRIGGER.test(rest)) continue;
      const re = new RegExp(`\\b(${Object.keys(SUBJ_TO_IND).join('|')})\\b`, 'gi');
      hits.push(
        ...scan(sentence.text, re, (m) => look(SUBJ_TO_IND, m[1]) ?? null).map((h) => ({
          ...h,
          index: h.index + sentence.index,
        })),
      );
    }
    return hits;
  },
};

/* ------------------------------------------------------------------ *
 * 4. Participio vs finite verb
 * ------------------------------------------------------------------ */

const PARTICIPLE_OF: Record<string, string> = {
  avanzó: 'avanzado', avancé: 'avanzado', avanzaron: 'avanzado',
  terminó: 'terminado', terminé: 'terminado', terminaron: 'terminado',
  entregó: 'entregado', entregué: 'entregado', entregaron: 'entregado',
  aprobó: 'aprobado', aprobé: 'aprobado', aprobaron: 'aprobado',
  firmó: 'firmado', firmé: 'firmado', firmaron: 'firmado',
  revisó: 'revisado', revisé: 'revisado', revisaron: 'revisado',
  cambió: 'cambiado', cambié: 'cambiado', cambiaron: 'cambiado',
  empezó: 'empezado', empecé: 'empezado', empezaron: 'empezado',
  construyó: 'construido', construyeron: 'construido',
  hizo: 'hecho', hice: 'hecho', hicieron: 'hecho',
  dijo: 'dicho', dije: 'dicho', dijeron: 'dicho',
  puso: 'puesto', puse: 'puesto', pusieron: 'puesto',
  escribió: 'escrito', escribí: 'escrito', escribieron: 'escrito',
  resolvió: 'resuelto', resolví: 'resuelto', resolvieron: 'resuelto',
  volvió: 'vuelto', volví: 'vuelto', volvieron: 'vuelto',
  abrió: 'abierto', abrí: 'abierto', abrieron: 'abierto',
};

const FINITE_OF: Record<string, string> = {
  avanzado: 'avanzó', terminado: 'terminó', entregado: 'entregó',
  aprobado: 'aprobó', firmado: 'firmó', revisado: 'revisó',
  cambiado: 'cambió', empezado: 'empezó', construido: 'construyó',
  hecho: 'hizo', dicho: 'dijo', puesto: 'puso', escrito: 'escribió',
  resuelto: 'resolvió', vuelto: 'volvió', abierto: 'abrió',
  llegado: 'llegó', pagado: 'pagó', comenzado: 'comenzó',
};

const participleRule: Rule = {
  id: 'participio-form',
  errorId: 'err-participio',
  category: 'grammar',
  rule:
    'Two different forms are being confused. "avanzó" is a finite verb — third person singular preterite — and it is the *only* thing that can be the main verb of a clause on its own: "la obra avanzó un 20% en marzo". ' +
    '"avanzado" is the past participle. It never stands alone as the main verb. It has exactly two jobs: (a) after the auxiliary HABER it forms the perfect tenses, invariable in form — "la obra ha avanzado", "habíamos avanzado"; (b) as an adjective after SER/ESTAR or attached to a noun, where it now agrees in gender and number — "el presupuesto está aprobado", "las partidas aprobadas", "una obra muy avanzada". ' +
    'So the test is: is there an auxiliary? Auxiliary present → participle (ha avanzado). No auxiliary and you are stating an event → finite verb (avanzó). Adjectival use → participle, and it must agree.',
  run: (text) => {
    const hits: RawHit[] = [];
    // "ha avanzó" / "hemos terminó" / "está aprobó"
    const auxRe = new RegExp(
      `\\b(he|has|ha|hemos|han|había|habías|habíamos|habían|estoy|está|están|estaba|estamos|fue|es|son|será|sería)\\s+((?:${Object.keys(PARTICIPLE_OF).join('|')}))${EOW}`,
      'gi',
    );
    hits.push(
      ...scan(text, auxRe, (m) => look(PARTICIPLE_OF, m[2]) ? `${m[1]} ${look(PARTICIPLE_OF, m[2])}` : null),
    );
    // bare participle as main verb: "la obra avanzado un 20%" / "ayer terminado"
    const bareRe = new RegExp(
      `\\b(la obra|el proyecto|el equipo|el cliente|la empresa|el contratista|nosotros|yo|ayer|la semana pasada|el mes pasado)\\s+((?:${Object.keys(FINITE_OF).join('|')}))\\b`,
      'gi',
    );
    hits.push(...scan(text, bareRe, (m) => look(FINITE_OF, m[2]) ? `${m[1]} ${look(FINITE_OF, m[2])}` : null));
    return hits;
  },
};

/* ------------------------------------------------------------------ *
 * 5. después without de
 * ------------------------------------------------------------------ */

const despuesRule: Rule = {
  id: 'despues-de',
  errorId: 'err-despues-de',
  category: 'grammar',
  rule:
    '"Después" on its own is an adverb meaning "afterwards": "Revisamos los planos y después firmamos." It cannot take a complement directly. ' +
    'The moment something follows it — a noun, a pronoun, an infinitive or a clause — you need the preposition DE: después DE la reunión, después DE eso, después DE revisar los planos, después DE que el cliente apruebe el presupuesto. ' +
    'Note the contraction with the masculine article: después del comité, después del pago. And note the two ways to complement it: después de + INFINITIVE when the subject is the same ("después de firmar, salimos"), después de que + CLAUSE when the subject changes ("después de que el cliente firme, empezamos"). ' +
    'Same pattern for its opposite: antes de la reunión, antes de firmar, antes de que llegue el material.',
  run: (text) =>
    scan(
      text,
      /\bdespués\s+(?!de\b|del\b|,|\.|$)((?:el|la|los|las|un|una|mi|su|tu|nuestro|nuestra|eso|esto|esa|este|ese|que)\b[^,.;!?]{0,25}|\w+[aei]r\b)/gi,
      (m) => `después de ${m[1].trim()}`.replace('de el ', 'del '),
    ),
};

/* ------------------------------------------------------------------ *
 * 6. para vs por (duration)
 * ------------------------------------------------------------------ */

const porParaRule: Rule = {
  id: 'para-duration',
  errorId: 'err-para-por-duration',
  category: 'grammar',
  rule:
    'Duration — how long something lasts — is POR, never PARA: "trabajamos en el proyecto POR tres meses", "la obra estuvo parada POR dos semanas". (In much of Latin America "durante" or simply nothing at all is even more natural: "trabajamos tres meses en el proyecto".) ' +
    'PARA with a time expression means a DEADLINE, not a stretch of time: "necesito el informe PARA el viernes" = by Friday. So "el contrato es para dos años" says the contract is *destined for* two years from now, while "el contrato es por dos años" says it *runs for* two years — a real difference in a negotiation. ' +
    'The wider split behind this: POR = cause, motive, exchange, means, duration, approximate location ("por el retraso", "por USD 50.000", "por correo", "por la zona sur"). PARA = purpose, recipient, destination, deadline, standard ("para reducir costos", "para el cliente", "para Lima", "para el viernes", "para un edificio de esa antigüedad").',
  run: (text) =>
    scan(
      text,
      /\bpara\s+((?:un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|varios|varias|muchos|muchas|\d+)\s+(?:minutos?|horas?|días?|semanas?|meses|años?))\b/gi,
      (m) => `por ${m[1]}`,
    ),
};

/* ------------------------------------------------------------------ *
 * 7. dropped reflexive pronouns
 * ------------------------------------------------------------------ */

const REFLEXIVE = [
  'relajar','sentir','quedar','acordar','preocupar','reunir','mudar','levantar',
  'acostumbrar','enfocar','comprometer','encargar','dedicar','olvidar','ir',
  'dar cuenta','despertar','concentrar','adaptar','equivocar','apurar','quejar',
];

const reflexiveRule: Rule = {
  id: 'reflexive-drop',
  errorId: 'err-reflexive-drop',
  category: 'grammar',
  rule:
    'Pronominal verbs carry their pronoun everywhere; it is part of the verb, not an optional extra. The pronoun agrees with the subject: me relajo, te relajas, se relaja, nos relajamos, se relajan. ' +
    'With an infinitive after another verb you have two legal positions and both are correct: "quiero relajarme" (attached) or "me quiero relajar" (fronted) — what is not legal is "quiero relajar", which means "I want to relax [something else]". ' +
    'The same applies across the whole family you use at work: reunirme con el cliente, encargarme de la licitación, comprometerme con la fecha, darme cuenta del error, enfocarme en el cronograma, quedarme en obra, acordarme del acta. ' +
    'Many of these change meaning without the pronoun — "quedar" = to arrange to meet / to be left, "quedarse" = to stay; "acordar" = to agree on, "acordarse de" = to remember. Dropping the pronoun does not just sound off, it says something different.',
  run: (text) =>
    scan(
      text,
      new RegExp(
        `(?<!\\b(?:me|te|se|nos)\\s)\\b(quiero|queria|quería|necesito|debo|puedo|voy a|tengo que|prefiero|intento|espero|me gusta|para|sin)\\s+(${REFLEXIVE.join('|')})(?:r)?\\b(?!\\s*(me|te|se|nos))`,
        'gi',
      ),
      (m) => {
        const v = strip(m[2]);
        if (!/r$/.test(m[2])) return null;
        if (/\b(me|te|se|nos)\b/i.test(m[0].replace(m[2], ''))) return null;
        return `${m[1]} ${v}me`;
      },
    ),
};

/* ------------------------------------------------------------------ *
 * 8. una otra vez
 * ------------------------------------------------------------------ */

const otraVezRule: Rule = {
  id: 'un-otro',
  errorId: 'err-un-otro',
  category: 'grammar',
  rule:
    'Spanish never puts the indefinite article before otro/otra/otros/otras. "Otro" already contains the "an" of "another": otra vez (another time / again), otro problema (another problem), otras opciones (other options). ' +
    '"Una otra vez" is a direct calque of English "another time" and marks you instantly as a non-native. ' +
    'Same restriction with: otro medio día, otra semana más. The article IS possible with the definite article, which changes the meaning to "the other": el otro contratista (the other contractor, a specific one), la otra propuesta. ' +
    'And to say "one more" rather than "another", use "un/una … más": una semana más, un mes más.',
  run: (text) =>
    scan(text, /\b(un|una|unos|unas)\s+(otro|otra|otros|otras)\b/gi, (m) => m[2]),
};

/* ------------------------------------------------------------------ *
 * 9. hace + time ("ago")
 * ------------------------------------------------------------------ */

const NUM = 'un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|varios|varias|\\d+';
const UNIT = 'minutos?|horas?|días?|semanas?|meses|años?';

const haceRule: Rule = {
  id: 'hace-ago',
  errorId: 'err-hace-ago',
  category: 'grammar',
  rule:
    '"Ago" is expressed with HACE placed BEFORE the time expression, not after it: hace dos semanas, hace tres meses, hace un año. English word order ("two weeks ago") produces "dos semanas atrás", which exists but is marked and regional — hace + tiempo is the neutral professional default. ' +
    'The verb of the sentence goes in the preterite: "Entregamos el expediente hace dos semanas." ' +
    'Two related patterns worth locking in at the same time: (a) "hace + tiempo + QUE + presente" = how long something has been going on and still is — "hace tres meses que trabajamos en ese proyecto" (we have been working on it for three months); (b) "desde hace + tiempo" for the same idea with the verb first — "trabajamos en ese proyecto desde hace tres meses". ' +
    'Do not mix these with "por/durante", which measure a finished stretch rather than distance back from now.',
  run: (text) => {
    const hits: RawHit[] = [];
    hits.push(
      ...scan(text, new RegExp(`\\b((?:${NUM})\\s+(?:${UNIT}))\\s+atrás\\b`, 'gi'), (m) => `hace ${m[1].toLowerCase()}`),
    );
    hits.push(
      ...scan(text, new RegExp(`\\bantes\\s+(?:de\\s+)?((?:${NUM})\\s+(?:${UNIT}))\\b`, 'gi'), (m) => `hace ${m[1].toLowerCase()}`),
    );
    hits.push(
      ...scan(text, new RegExp(`\\b((?:${NUM})\\s+(?:${UNIT}))\\s+pasados?\\b`, 'gi'), (m) => `hace ${m[1].toLowerCase()}`),
    );
    return hits;
  },
};

/* ------------------------------------------------------------------ *
 * 10 & 11. ojalá que / como si
 * ------------------------------------------------------------------ */

const ojalaRule: Rule = {
  id: 'ojala-que',
  errorId: 'err-ojala-como-si',
  category: 'grammar',
  rule:
    'OJALÁ is itself the subordinator — it comes from Arabic "law šā llāh" (if God wills) — so it is followed directly by the subjunctive with no "que": "Ojalá lleguen los materiales el lunes", "Ojalá el cliente apruebe el adicional". ' +
    'The tense you pick sets how likely you think it is: ojalá + presente de subjuntivo = still possible (ojalá firmen mañana); ojalá + imperfecto de subjuntivo = unlikely or contrary to fact (ojalá tuviéramos más plazo — but we don\'t); ojalá + pluscuamperfecto = regret about the past (ojalá hubiéramos revisado el diseño antes). ' +
    'COMO SI works the other way round: the SI is obligatory and it always takes imperfect or pluperfect subjunctive, never the present — "habla como si fuera el residente de obra", "reaccionaron como si no hubieran leído el contrato".',
  run: (text) => {
    const hits: RawHit[] = [];
    hits.push(...scan(text, /\bojal[áa]\s+que\b/gi, (m) => m[0].replace(/\s+que$/i, '')));
    hits.push(
      ...scan(
        text,
        /\bcomo\s+(fuera|fuese|tuviera|tuviese|estuviera|hubiera|pudiera|fueran|tuvieran|estuvieran|hubieran)\b/gi,
        (m) => `como si ${m[1]}`,
      ),
    );
    return hits;
  },
};

/* ------------------------------------------------------------------ *
 * 12. Collocations & verb patterns
 * ------------------------------------------------------------------ */

const collocationRule: Rule = {
  id: 'collocation',
  errorId: 'err-collocations',
  category: 'collocation',
  rule:
    'Three verb patterns that are fixed in Spanish and cannot be assembled from English logic:\n\n' +
    '• COMENZAR / EMPEZAR + A + infinitivo. The "a" is obligatory: "comenzamos a excavar en abril", "empezaron a reclamar el adicional". Without it the sentence is ungrammatical, not just odd.\n\n' +
    '• SEGUIR / CONTINUAR + GERUNDIO, never + infinitivo. "seguimos trabajando", "el cliente sigue insistiendo en el mismo cambio". English "continue to do" maps to a gerund here.\n\n' +
    '• ACABAR CON vs TERMINAR. "terminar (algo)" = to finish a task: "terminamos el expediente técnico". "acabar con (algo)" = to put an end to / wipe out: "acabar con los retrasos", "la lluvia acabó con el avance de la semana". "acabar de + infinitivo" is a third, unrelated pattern meaning "to have just done": "acabo de hablar con el supervisor". Using "acabar con" where you mean "terminar" says you destroyed the thing.',
  run: (text) => {
    const hits: RawHit[] = [];
    hits.push(
      ...scan(
        text,
        /\b(comenzar|comenzamos|comenzó|comencé|comienzan?|empezar|empezamos|empezó|empecé|empiezan?|comenzaron|empezaron)\s+(?!a\b|de\b)(\w+[aei]r)\b/gi,
        (m) => `${m[1]} a ${m[2]}`,
      ),
    );
    hits.push(
      ...scan(
        text,
        /\b(seguir|sigo|sigue|seguimos|siguen|seguí|siguió|seguimos|continuar|continúa|continúan|continuamos)\s+(?:a\s+)?(\w+)(ar|er|ir)\b/gi,
        (m) => {
          const stem = m[2];
          const ger = m[3] === 'ar' ? `${stem}ando` : `${stem}iendo`;
          return `${m[1]} ${ger}`;
        },
      ),
    );
    hits.push(
      ...scan(
        text,
        /\bacab(?:ar|amos|é|ó|aron)\s+con\s+(el|la|los|las)\s+(informe|expediente|reporte|documento|presupuesto|diseño|trabajo|plano|planos|acta)\b/gi,
        (m) => m[0].replace(/acab(ar|amos|é|ó|aron)\s+con/i, (x) => x.split(/\s+/)[0].replace(/^acab/i, 'termin')),
      ),
    );
    return hits;
  },
};

/* ------------------------------------------------------------------ *
 * 13. Vocabulary-bank gender check (data driven)
 * ------------------------------------------------------------------ */

export function makeVocabGenderRule(
  nouns: { term: string; gender: 'm' | 'f' }[],
): Rule {
  const fem = nouns.filter((n) => n.gender === 'f').map((n) => n.term);
  const masc = nouns.filter((n) => n.gender === 'm').map((n) => n.term);
  return {
    id: 'vocab-gender',
    errorId: 'err-gender-ma',
    category: 'vocab',
    rule:
      'Gender is stored with the word in your vocabulary bank for a reason: it is not predictable from the ending often enough to guess. Learn every new work noun as article + noun as a single unit — "el cronograma", "la licitación", "el expediente", "la valorización", "el adicional", "la partida" — and rehearse it that way, because every adjective, demonstrative and quantifier in the phrase inherits that gender.',
    run: (text) => {
      const hits: RawHit[] = [];
      if (masc.length) {
        const re = new RegExp(`\\b(la|una|esta|esa|otra|nuestra)\\s+(${masc.join('|')})\\b`, 'gi');
        hits.push(...scan(text, re, (m) => look(MASC_MAP, m[1]) ? `${look(MASC_MAP, m[1])} ${m[2]}` : null));
      }
      if (fem.length) {
        const inv: Record<string, string> = {
          el: 'la', un: 'una', este: 'esta', ese: 'esa', otro: 'otra', nuestro: 'nuestra',
        };
        const re = new RegExp(`\\b(el|un|este|ese|otro|nuestro)\\s+(${fem.join('|')})\\b`, 'gi');
        hits.push(...scan(text, re, (m) => inv[strip(m[1])] ? `${inv[strip(m[1])]} ${m[2]}` : null));
      }
      return hits;
    },
  };
}

/* ------------------------------------------------------------------ */

export const BASE_RULES: Rule[] = [
  genderRule,
  preteriteRule,
  subjunctiveRule,
  participleRule,
  despuesRule,
  porParaRule,
  reflexiveRule,
  otraVezRule,
  haceRule,
  ojalaRule,
  collocationRule,
];

/** Keep the replacement's capitalisation in step with what it replaces. */
function matchCase(original: string, suggestion: string): string {
  const first = original[0];
  if (!first || !suggestion) return suggestion;
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    return suggestion[0].toUpperCase() + suggestion.slice(1);
  }
  return suggestion;
}

export function splitSentences(text: string): { text: string; index: number }[] {
  const out: { text: string; index: number }[] = [];
  const re = /[^.!?¿¡\n]+[.!?\n]?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].trim()) out.push({ text: m[0], index: m.index });
  }
  return out;
}

/** Run every rule over a text and return findings sorted by position. */
export function analyze(text: string, extraRules: Rule[] = []): Finding[] {
  const rules = [...BASE_RULES, ...extraRules];
  const findings: Finding[] = [];
  const seen = new Set<string>();
  for (const rule of rules) {
    let hits: RawHit[] = [];
    try {
      hits = rule.run(text);
    } catch {
      hits = [];
    }
    for (const h of hits) {
      const key = `${h.index}:${h.excerpt.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        detectorId: rule.id,
        errorId: rule.errorId,
        excerpt: h.excerpt,
        suggestion: matchCase(h.excerpt, h.suggestion),
        rule: rule.rule,
        category: rule.category,
        index: h.index,
      });
    }
  }
  return findings.sort((a, b) => a.index - b.index);
}

/** Apply every suggested correction to produce a clean version of the text. */
export function applyCorrections(text: string, findings: Finding[]): string {
  let out = text;
  for (const f of [...findings].sort((a, b) => b.index - a.index)) {
    out = out.slice(0, f.index) + f.suggestion + out.slice(f.index + f.excerpt.length);
  }
  return out;
}
