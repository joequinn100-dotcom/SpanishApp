/**
 * Deterministic transcript analysis (SPEC §6, without the model call).
 *
 * §6's pipeline ends in a model analysis verified by the gauntlet. That needs an
 * API key. Until there is one, these rules do the same job for the subset of
 * errors that are mechanically detectable — and they do it with no false
 * confidence: every finding carries a `confidence` well below 1 and lands as
 * `pending`, exactly as a model finding would. Nothing auto-applies.
 *
 * Two regex traps govern the whole file, both learned the hard way:
 *
 *   1. `\b` does not work after an accented vowel. `ó` is not a `\w` character,
 *      so `/(\w{2,})ó\b/` never matches — the word boundary is already there.
 *      Use the explicit end-of-word guard below instead.
 *   2. Combining marks must be written as `̀-ͯ` escapes. A literal
 *      combining-mark range in source is invisible and gets mangled by editors.
 */

export interface Finding {
  kind: 'error' | 'positive';
  /** Existing error code where one matches; null means "no rule owns this". */
  errorCode: string | null;
  /** For positives: the topic the correct use is evidence for. */
  topicId: string | null;
  quote: string;
  correction: string;
  explanation: string;
  /** 0..1. Rules never claim certainty; the human decides. */
  confidence: number;
  /** true = looks like a pattern, false = looks like a slip, null = can't tell. */
  systematic: boolean | null;
  start: number;
  end: number;
}

/** End of word, accent-safe. See trap 1 above. */
const EOW = '(?![a-záéíóúñü])';

const strip = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ------------------------------------------------------------------ *
 * Error rules
 * ------------------------------------------------------------------ */

interface Rule {
  code: string;
  /** Global, case-insensitive. Group 0 is quoted; the fix builds the correction. */
  pattern: RegExp;
  fix: (m: RegExpExecArray) => string | null;
  explain: string;
  confidence: number;
  systematic: boolean | null;
}

/** Greek -ma masculines, the closed set from the error log. */
const GREEK_MA =
  'tema|problema|sistema|programa|esquema|diagrama|cronograma|clima|idioma|síntoma|dilema|teorema';

/** Feminine nouns this learner reliably treats as masculine, and the reverse. */
const FEM_ION = 'demostración|fusión|licitación|valorización|supervisión|instalación|ampliación';

const RULES: Rule[] = [
  {
    code: 'noun.greek_ma',
    pattern: new RegExp(`\\b(la|una|esta|esa|aquella|otra)\\s+(${GREEK_MA})\\b`, 'gi'),
    fix: (m) => `${{ la: 'el', una: 'un', esta: 'este', esa: 'ese', aquella: 'aquel', otra: 'otro' }[m[1].toLowerCase()] ?? 'el'} ${m[2]}`,
    explain:
      'This noun belongs to the closed Greek -ma group, which is masculine despite the -a: el tema, el problema, el sistema, el programa, el cronograma, el clima, el idioma, el esquema, el diagrama, el síntoma, el dilema, el teorema. They came into Spanish from Greek neuter nouns in -ma that Latin absorbed as masculine, so the -a here is the tail of a Greek ending rather than the Spanish feminine marker.\n\nThe set is closed and short, which is what makes it learnable as a list. Plenty of other -ma nouns are ordinary feminines — la cama, la firma, la forma, la norma, la víctima, la plataforma — so the test is etymological rather than phonetic.',
    confidence: 0.92,
    systematic: true,
  },
  {
    code: 'noun.gender_agreement',
    pattern: new RegExp(`\\b(un|el|este|ese|nuevo|mucho|todo|otro)\\s+(${FEM_ION})\\b`, 'gi'),
    fix: (m) => {
      const map: Record<string, string> = {
        un: 'una', el: 'la', este: 'esta', ese: 'esa',
        nuevo: 'nueva', mucho: 'mucha', todo: 'toda', otro: 'otra',
      };
      return `${map[m[1].toLowerCase()] ?? m[1]} ${m[2]}`;
    },
    explain:
      'Nouns ending in -ión are feminine effectively without exception: la demostración, la fusión, la licitación, la valorización, la supervisión, la instalación, la ampliación. Because the ending is predictable, so is the article — this is one of the few gender questions that never has to be memorised word by word.\n\nAgreement runs through the whole noun phrase, not just the article: «una nueva demostración», never «un nuevo demostración». The error usually appears because the determiner is committed to before the noun is chosen, which makes it a planning problem rather than a knowledge one.',
    confidence: 0.9,
    systematic: true,
  },
  {
    code: 'prep.despues_de',
    pattern: new RegExp(`\\bdespu[eé]s\\s+(?!de\\b|que\\b|,|\\.|$)([a-záéíóúñü]+)`, 'gi'),
    fix: (m) => `después de ${m[1]}`,
    explain:
      'Después is an adverb, so it needs «de» before any complement — a noun, a pronoun or an infinitive: después de la inspección, después de firmar, después de eso.\n\nBare «después» is correct only when nothing follows it: «primero vaciamos la losa y después revisamos». The same pattern governs a whole family — antes de, dentro de, cerca de, lejos de, además de, a pesar de. English attaches its complement directly ("after the inspection"), so there is nothing in the source to translate the «de» from.\n\nWhen a full clause with its own verb follows, the form is «después de que», and that clause takes the subjunctive when it points at an unrealised future.',
    confidence: 0.85,
    systematic: true,
  },
  {
    code: 'prep.buscar_para',
    pattern: /\b(busc|esper|pag|pid|mir)(o|as|a|amos|an|ando|é|aste|ó|amos|aron|aba|ábamos)\s+(por|para)\b/gi,
    fix: (m) => `${m[1]}${m[2]}`,
    explain:
      'These verbs carry the English particle inside their own meaning, so the preposition is not just unnecessary but wrong. Buscar is "look for", esperar is "wait for", pedir is "ask for", pagar is "pay for", mirar is "look at" — all take a direct object with no preposition at all: buscamos un proveedor, esperamos la respuesta, pagamos el material.\n\nThe mirror error also exists and is worth guarding against at the same time: some Spanish verbs demand a preposition where English has none — entrar en, depender de, confiar en, asistir a, responder a. Neither language can be used as a guide for the other, which is why verb government has to be learned verb by verb.',
    confidence: 0.8,
    systematic: true,
  },
  {
    code: 'lex.una_otra_vez',
    pattern: /\b(un|una)\s+(otro|otra)\b/gi,
    fix: (m) => m[2],
    explain:
      'Otro and otra never take an indefinite article. «Otra reunión», «otro plano», «otra vez» — never «una otra reunión».\n\nThe reason is that «otro» already contains the indefiniteness «un» would supply, and Spanish treats them as competing for the same slot. English "another" is an + other fused into one word, so the article is hidden and nothing warns you off adding a second one.\n\nThe definite article is perfectly normal and changes the meaning: «el otro plano» is the other of a known pair, «otro plano» is one more.',
    confidence: 0.95,
    systematic: true,
  },
  {
    code: 'verb.hace_ago',
    pattern: /\bhacen\s+(\d+|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(minutos?|horas?|d[ií]as?|semanas?|meses|años?)\b/gi,
    fix: (m) => `hace ${m[1]} ${m[2]}`,
    explain:
      'In the "ago" construction, «hace» is impersonal and invariable however much time follows: hace tres semanas, hace seis meses, hace dos años. It never becomes «hacen».\n\nThe temptation comes from reading the time expression as the subject. It is not — the construction has no subject at all, like «hay» or «llueve».\n\nA related redundancy to avoid: «hace seis meses atrás» stacks two markers of pastness. Pick one, and in neutral Latin American Spanish that is «hace».',
    confidence: 0.93,
    systematic: true,
  },
  {
    code: 'verb.perfecto_gerundio',
    pattern: new RegExp(`\\b(he|has|ha|hemos|han|hab[ií]a|hab[ií]an|habr[aá]|hayan?)\\s+([a-záéíóúñü]{3,}(?:ando|iendo))${EOW}`, 'gi'),
    fix: (m) => {
      const g = m[2];
      const stem = g.replace(/(ando|iendo)$/i, '');
      return `${m[1]} ${g.toLowerCase().endsWith('ando') ? `${stem}ado` : `${stem}ido`}`;
    },
    explain:
      'The perfect tense is «haber» plus the participle, never the gerund: he revisado, hemos enviado, había llegado.\n\nThe confusion comes from English, where "have been reviewing" puts an -ing form after "have". But English gets there through two auxiliaries — have + been + reviewing — and Spanish builds that meaning with «estar»: «hemos estado revisando». The gerund attaches to estar, not to haber.\n\nBoth exist and mean different things. «Hemos revisado» reports a finished result; «hemos estado revisando» reports something ongoing. In a status update the first is usually what you want. Note also that after haber the participle never agrees: «hemos revisado la valorización», not «revisada».',
    confidence: 0.9,
    systematic: true,
  },
  {
    code: 'verb.infinitive_after_prep',
    pattern: new RegExp(`\\b(para|sin|antes de|despu[eé]s de|al|por)\\s+([a-záéíóúñü]{3,}(?:amos|emos|imos|as|es|an|en|o|as))${EOW}(?=\\s)`, 'gi'),
    fix: () => null,
    explain:
      'Every preposition in Spanish takes the infinitive: para iniciar, sin firmar, antes de revisar, al llegar, por no avisar. There are no exceptions.\n\nWhere English uses "-ing" after a preposition ("before starting", "without signing"), Spanish uses the bare infinitive. A conjugated verb only becomes possible when you insert «que» and build a full clause with its own subject — «para que el cliente inicie los trabajos» — and that clause then takes the subjunctive.\n\nThat is the choice point: same subject takes preposition + infinitive; different subject takes «que» + a conjugated verb.',
    confidence: 0.55,
    systematic: null,
  },
  {
    code: 'pron.doler_le',
    // Only «se» is wrong here. «me/te/nos duele» are the correct first- and
    // second-person forms, and flagging them would report correct Spanish as
    // an error — the one failure mode that would make the review UI useless.
    pattern: /\bse\s+(duele|duelen)\b/gi,
    fix: (m) => `le ${m[1]}`,
    explain:
      'Doler follows the gustar pattern: the body part is the grammatical subject and the person who feels it is an indirect object. So the pronoun is «le», never «se» — «le duelen las rodillas», the knees hurt to him.\n\n«Se duele» does exist but means something else entirely: «dolerse de» is to lament or complain about something, and it is rare and literary.\n\nThe verb agrees with the body part rather than the person: le duele la espalda, le duelen las rodillas. That is the most common slip in the whole gustar family, because English makes the person the subject and Spanish does not.',
    confidence: 0.7,
    systematic: null,
  },
  {
    code: 'pron.body_part_article',
    pattern: /\b(me|te|se|nos|le|les)\s+([a-záéíóúñü]+[oóé])\s+(su|mi|tu|nuestra?|sus|mis|tus)\s+(mano|manos|espalda|cabeza|pierna|piernas|brazo|brazos|rodilla|rodillas|ojo|ojos|pie|pies)\b/gi,
    fix: (m) => `${m[1]} ${m[2]} ${/s$/.test(m[4]) ? 'las' : 'la'} ${m[4]}`,
    explain:
      'Spanish uses the definite article with body parts and personal effects, not the possessive, because the reflexive or indirect object pronoun has already said whose they are: «se lastimó la mano», «me duele la espalda», «le rompieron los lentes».\n\nThe information is carried once. «Se» already identifies the owner, so «su» repeats it, and Spanish treats that repetition as marked — it sounds either emphatic or foreign.\n\nThe same pattern extends to clothing and worn equipment: «se puso el casco», not «se puso su casco».',
    confidence: 0.75,
    systematic: null,
  },
  {
    code: 'mood.subj_leak_past',
    pattern: new RegExp(
      `\\b(ayer|anoche|la semana pasada|el mes pasado|el año pasado|anteayer)\\b[^.!?\\n]{0,60}?\\b([a-záéíóúñü]{3,}(?:ramos|ran|ras|ra|semos|sen|ses|se))${EOW}`,
      'gi',
    ),
    fix: () => null,
    explain:
      'Narrating what actually happened is indicative. The subjunctive appears only when something licenses it: a subordinating que after a verb of wish, influence, doubt or emotion; a hypothetical si; ojalá; cuando pointing at an unrealised future; aunque conceding something unreal; or como si.\n\nWith none of those present, a finished past event takes the preterite: «la semana pasada compramos el material», not «compremos»; «los planos llegaron tarde», not «llegaran».\n\nThe mechanism is worth naming, because it is not ignorance: the -ramos and -ran forms feel more advanced and get reached for under pressure as a marker of sophistication. The diagnostic is mechanical — if you could put «ayer» in front of the clause and it would still describe something that really happened, the verb is indicative.',
    confidence: 0.5,
    systematic: null,
  },
];

/* ------------------------------------------------------------------ *
 * Positive rules — §6's "half that lets you ever finish anything"
 * ------------------------------------------------------------------ */

interface PositiveRule {
  topicId: string;
  errorCode: string | null;
  pattern: RegExp;
  explain: string;
  confidence: number;
}

const POSITIVES: PositiveRule[] = [
  {
    topicId: 'b2.mood.subj_imperfecto',
    errorCode: 'mood.subj_imperfecto_missing',
    pattern: new RegExp(
      // Unaccented variants are included because some PDFs arrive with the
      // diacritics stripped by the producing tool. «tuvieramos» is still the
      // learner using the imperfect subjunctive, and the finding is proposed
      // rather than applied, so the human settles any doubt.
      `\\bsi\\s+[^.!?\\n]{0,40}?\\b([a-záéíóúñü]{3,}(?:ara|aras|[áa]ramos|aran|iera|ieras|i[ée]ramos|ieran))${EOW}`,
      'gi',
    ),
    explain:
      'Imperfect subjunctive in a si-clause, used unprompted. This is the structure the error log records as not yet acquired, and it is the highest-severity gap you have — so an unprompted correct use is exactly the evidence §4 requires before anything can be marked resolved.\n\nThe frame is fixed: si + imperfect subjunctive in the hypothesis, conditional in the consequence. Si tuviéramos más plazo, reforzaríamos. The half that English speakers get wrong is putting «would» in both clauses, because English allows it — «si tendríamos» is ungrammatical in Spanish and this instance shows you did not do that.\n\nThe form itself derives from the third-person plural preterite with no exceptions anywhere in the language: tuvieron → tuviéramos, fueron → fuéramos, pudieron → pudiéramos.',
    confidence: 0.8,
  },
  {
    topicId: 'b1.mood.subj_cuando',
    errorCode: 'mood.cuando_subj',
    pattern: new RegExp(
      `\\bcuando\\s+([a-záéíóúñü]{3,}(?:e|es|emos|en|a|as|amos|an))${EOW}\\s`,
      'gi',
    ),
    explain:
      'Cuando + subjunctive pointing at an unrealised future. This error was marked resolved on exactly this kind of evidence, so each fresh instance confirms it is holding rather than merely dormant.',
    confidence: 0.55,
  },
  {
    topicId: 'b1.verb.preterito',
    errorCode: 'verb.preterito_persona',
    pattern: new RegExp(
      `\\b(él|ella|usted|el (?:cliente|supervisor|contratista|proveedor|ingeniero))\\s+[^.!?\\n]{0,20}?\\b([a-záéíóúñü]{2,}(?:ó|ió))${EOW}`,
      'gi',
    ),
    explain:
      'A third-person preterite with an explicit third-person subject — the exact contrast this error collapses. Getting «el supervisor aprobó» right while the yo form is available to be confused with it is real evidence, because the two differ only in the stressed vowel.',
    confidence: 0.7,
  },
  {
    topicId: 'b2.discourse.conectores_2',
    errorCode: null,
    pattern:
      /\b(sin embargo|no obstante|por lo tanto|por consiguiente|en consecuencia|siempre y cuando|a pesar de que|dado que|en la medida en que)\b/gi,
    explain:
      'A B2-band discourse connector used in running speech. These are what separate a B1 speaker stringing clauses together from a B2 speaker signalling the relationship between them, and they are directly assessed in the exam\'s spoken and written tasks.',
    confidence: 0.85,
  },
  {
    topicId: 'b1.syntax.relativos',
    errorCode: null,
    pattern: /\bcuy[oa]s?\b/gi,
    explain:
      'Correct use of «cuyo», the possessive relative. Most speakers at this level avoid it entirely and reach for the spoken workaround «que su», which is not accepted in writing — so an unprompted «cuyo» is a strong B2 marker on its own.',
    confidence: 0.9,
  },
];

/* ------------------------------------------------------------------ *
 * Running them
 * ------------------------------------------------------------------ */

/** Preserve the original casing pattern when substituting a correction. */
function matchCase(original: string, replacement: string): string {
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return replacement.toUpperCase();
  }
  if (/^[A-ZÁÉÍÓÚÑ]/.test(original)) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/** A window of surrounding text, so a quote is readable in context. */
function sentenceAround(text: string, start: number, end: number): [string, number, number] {
  let a = start;
  let b = end;
  while (a > 0 && !/[.!?\n]/.test(text[a - 1])) a--;
  while (b < text.length && !/[.!?\n]/.test(text[b])) b++;
  return [text.slice(a, b).trim(), a, b];
}

/**
 * Analyse a learner's text.
 *
 * Every result is a *proposal*. Nothing here writes to the error log — that only
 * happens when the human presses Accept in the review UI (CLAUDE.md: "Never
 * auto-apply a transcript finding").
 */
export function analyze(text: string): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.pattern.exec(text)) !== null) {
      if (m[0].length === 0) {
        rule.pattern.lastIndex++;
        continue;
      }
      const [quote, a, b] = sentenceAround(text, m.index, m.index + m[0].length);
      const key = `${rule.code}:${a}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // One finding per sentence per rule — but the correction has to repair
      // *every* instance in that sentence. «Tenemos una problema con la
      // programa» is one finding and two mistakes, and a correction that fixed
      // only the first would be shown to the learner as the right answer while
      // still being wrong.
      let correction = '';
      if (rule.fix(m) !== null) {
        const local = new RegExp(rule.pattern.source, rule.pattern.flags);
        correction = quote.replace(local, (...args) => {
          const groups = args.slice(0, -2) as unknown as RegExpExecArray;
          const fixedHere = rule.fix(groups);
          return fixedHere === null ? groups[0] : matchCase(groups[0], fixedHere);
        });
      }

      findings.push({
        kind: 'error',
        errorCode: rule.code,
        topicId: null,
        quote,
        correction: correction === quote ? '' : correction,
        explanation: rule.explain,
        confidence: rule.confidence,
        systematic: rule.systematic,
        start: a,
        end: b,
      });
    }
  }

  for (const rule of POSITIVES) {
    rule.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.pattern.exec(text)) !== null) {
      if (m[0].length === 0) {
        rule.pattern.lastIndex++;
        continue;
      }
      const [quote, a, b] = sentenceAround(text, m.index, m.index + m[0].length);
      const key = `+${rule.topicId}:${a}`;
      if (seen.has(key)) continue;
      seen.add(key);

      findings.push({
        kind: 'positive',
        errorCode: rule.errorCode,
        topicId: rule.topicId,
        quote,
        correction: '',
        explanation: rule.explain,
        confidence: rule.confidence,
        systematic: null,
        start: a,
        end: b,
      });
    }
  }

  return findings.sort((x, y) => x.start - y.start);
}

/** Rough word count of the learner's own production — a session-over-session metric. */
export function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

export { strip };
