/**
 * Teaching diagrams.
 *
 * The test every diagram here has to pass: does it show something the prose
 * cannot? A photograph of a construction site would decorate the page without
 * teaching anything about the imperfect subjunctive. A picture of *where the
 * subjunctive sits relative to its trigger* teaches the thing the paragraph is
 * trying to say, and it is the kind of shape that stays in memory when the
 * wording does not.
 *
 * All inline SVG: no network is available, nothing to license, and they inherit
 * the page's colours so they work without a separate dark-mode asset.
 */

import { ReactNode } from 'react';

function Frame({
  caption,
  children,
  height = 150,
}: {
  caption: string;
  children: ReactNode;
  height?: number;
}) {
  return (
    <figure className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 480 ${height}`} className="w-full min-w-[420px]" role="img">
          {children}
        </svg>
      </div>
      <figcaption className="mt-2 text-xs leading-relaxed text-slate-500">{caption}</figcaption>
    </figure>
  );
}

const AXIS = '#334155';
const MUTED = '#64748b';
const TEAL = '#2dd4bf';
const AMBER = '#fbbf24';
const VIOLET = '#a78bfa';
const ROSE = '#fb7185';
const LIME = '#a3e635';

/* ------------------------------------------------------------------ *
 * Tense timeline — where each past tense actually lives
 * ------------------------------------------------------------------ */

export function TenseTimeline() {
  return (
    <Frame
      height={170}
      caption="The preterite is a point, the imperfect is a stretch, and the pluperfect is a point before another point. Spanish makes you choose which shape you mean; English mostly does not, which is why the choice feels arbitrary until you can see it."
    >
      <line x1="20" y1="120" x2="460" y2="120" stroke={AXIS} strokeWidth="2" />
      <polygon points="460,120 452,116 452,124" fill={AXIS} />
      <text x="452" y="140" fill={MUTED} fontSize="11" textAnchor="end">now</text>
      <line x1="400" y1="105" x2="400" y2="135" stroke={MUTED} strokeWidth="2" strokeDasharray="3 3" />

      {/* imperfect: a band */}
      <rect x="60" y="52" width="220" height="16" rx="8" fill={AMBER} opacity="0.25" />
      <rect x="60" y="52" width="220" height="16" rx="8" fill="none" stroke={AMBER} strokeWidth="1.5" />
      <text x="170" y="45" fill={AMBER} fontSize="12" textAnchor="middle">imperfecto — llovía, esperábamos</text>
      <line x1="170" y1="68" x2="170" y2="112" stroke={AMBER} strokeWidth="1" strokeDasharray="2 3" />

      {/* preterite: a point */}
      <circle cx="230" cy="120" r="6" fill={TEAL} />
      <line x1="230" y1="114" x2="230" y2="90" stroke={TEAL} strokeWidth="1.5" />
      <text x="238" y="88" fill={TEAL} fontSize="12">pretérito — llegué</text>

      {/* pluperfect: a point before the point */}
      <circle cx="105" cy="120" r="6" fill={VIOLET} />
      <line x1="105" y1="126" x2="105" y2="148" stroke={VIOLET} strokeWidth="1.5" />
      <text x="97" y="160" fill={VIOLET} fontSize="12" textAnchor="start">pluscuamperfecto — ya había firmado</text>

      <path d="M105 132 Q 168 152 228 132" stroke={VIOLET} strokeWidth="1" fill="none" opacity="0.5" />
    </Frame>
  );
}

/* ------------------------------------------------------------------ *
 * Mood switch — what licenses the subjunctive
 * ------------------------------------------------------------------ */

export function MoodSwitch() {
  return (
    <Frame
      height={190}
      caption="The subjunctive is never chosen for its own sake. Something above it licenses it — a verb of wish, influence, doubt or emotion; a hypothetical si; ojalá; cuando pointing at an unrealised future. With no trigger, the verb is indicative. If you can put «ayer» in front of the clause and it still describes something that really happened, it is indicative."
    >
      <rect x="14" y="70" width="120" height="44" rx="8" fill="none" stroke={AXIS} strokeWidth="1.5" />
      <text x="74" y="88" fill="#e2e8f0" fontSize="12" textAnchor="middle">main clause</text>
      <text x="74" y="104" fill={MUTED} fontSize="11" textAnchor="middle">quiero / dudo / sé</text>

      <line x1="134" y1="92" x2="186" y2="92" stroke={AXIS} strokeWidth="1.5" />
      <text x="160" y="84" fill={MUTED} fontSize="11" textAnchor="middle">que</text>

      <path d="M186 92 L 206 46" stroke={VIOLET} strokeWidth="1.5" fill="none" />
      <path d="M186 92 L 206 144" stroke={TEAL} strokeWidth="1.5" fill="none" />

      <rect x="206" y="24" width="262" height="44" rx="8" fill={VIOLET} opacity="0.12" />
      <rect x="206" y="24" width="262" height="44" rx="8" fill="none" stroke={VIOLET} strokeWidth="1.5" />
      <text x="218" y="42" fill={VIOLET} fontSize="11">SUBJUNCTIVE — a trigger is present</text>
      <text x="218" y="58" fill={MUTED} fontSize="10">quiero que revise · dudo que haya · ojalá llegue</text>

      <rect x="206" y="122" width="262" height="44" rx="8" fill={TEAL} opacity="0.1" />
      <rect x="206" y="122" width="262" height="44" rx="8" fill="none" stroke={TEAL} strokeWidth="1.5" />
      <text x="218" y="140" fill={TEAL} fontSize="11">INDICATIVE — the clause asserts a fact</text>
      <text x="218" y="156" fill={MUTED} fontSize="10">sé que es · creo que llega · porque cambió</text>
    </Frame>
  );
}

/* ------------------------------------------------------------------ *
 * Si-clause frame — the fixed shape
 * ------------------------------------------------------------------ */

export function SiFrame() {
  return (
    <Frame
      height={165}
      caption="A fixed frame, worth memorising as a shape rather than as two rules. The conditional can never appear inside the si-clause — «si tendríamos» is ungrammatical — and that is the single most common English-speaker error here, because English lets «would» into both halves of the sentence."
    >
      <rect x="16" y="40" width="200" height="52" rx="8" fill={VIOLET} opacity="0.12" />
      <rect x="16" y="40" width="200" height="52" rx="8" fill="none" stroke={VIOLET} strokeWidth="1.5" />
      <text x="30" y="60" fill={VIOLET} fontSize="12">si + imperfect subjunctive</text>
      <text x="30" y="80" fill="#e2e8f0" fontSize="13" fontStyle="italic">si tuviéramos más plazo</text>

      <line x1="216" y1="66" x2="258" y2="66" stroke={AXIS} strokeWidth="1.5" />
      <polygon points="258,66 250,62 250,70" fill={AXIS} />

      <rect x="258" y="40" width="206" height="52" rx="8" fill={TEAL} opacity="0.1" />
      <rect x="258" y="40" width="206" height="52" rx="8" fill="none" stroke={TEAL} strokeWidth="1.5" />
      <text x="272" y="60" fill={TEAL} fontSize="12">conditional</text>
      <text x="270" y="80" fill="#e2e8f0" fontSize="12" fontStyle="italic">reforzaríamos la cimentación</text>

      <text x="16" y="122" fill={ROSE} fontSize="12">✗ si tendríamos más plazo</text>
      <text x="258" y="122" fill={MUTED} fontSize="11">tuvieron → tuviéramos</text>
      <text x="258" y="138" fill={MUTED} fontSize="11">(3pl preterite, drop -ron)</text>
    </Frame>
  );
}

/* ------------------------------------------------------------------ *
 * Agreement chain — gender propagating through a noun phrase
 * ------------------------------------------------------------------ */

export function AgreementChain() {
  // Each modifier gets an arc from the noun, so agreement reads as something
  // the noun *does* to the phrase rather than three unrelated endings.
  const modifiers = [
    { label: 'una', x: 54 },
    { label: 'nueva', x: 140 },
  ];
  return (
    <Frame
      height={175}
      caption="Gender belongs to the noun and propagates outward to every word that modifies it, however far away. The error is rarely ignorance of the noun's gender — it is a determiner committed to before the noun was chosen, which makes «un nuevo demostración» one mistake showing up twice. Storing nouns as article + noun removes the guess."
    >
      <text x="54" y="46" fill={AMBER} fontSize="16" fontFamily="Georgia, serif">una</text>
      <text x="140" y="46" fill={AMBER} fontSize="16" fontFamily="Georgia, serif">nueva</text>
      <text x="262" y="46" fill="#e2e8f0" fontSize="16" fontFamily="Georgia, serif">demostración</text>

      <circle cx="300" cy="62" r="4" fill={AMBER} />
      {modifiers.map((m) => (
        <path
          key={m.label}
          d={`M298 64 Q ${(300 + m.x) / 2} 92 ${m.x + 12} 54`}
          stroke={AMBER}
          strokeWidth="1.2"
          fill="none"
          opacity="0.65"
        />
      ))}

      <text x="300" y="112" fill={AMBER} fontSize="12" textAnchor="middle">
        -ión → feminine, and every modifier follows
      </text>

      <line x1="20" y1="130" x2="460" y2="130" stroke={AXIS} strokeWidth="1" />
      <text x="20" y="154" fill={ROSE} fontSize="14" fontFamily="Georgia, serif">
        ✗ un nuevo demostración
      </text>
      <text x="250" y="154" fill={MUTED} fontSize="11">
        one wrong guess, showing up twice
      </text>
    </Frame>
  );
}

/* ------------------------------------------------------------------ *
 * Clitic slots — where object pronouns are allowed to go
 * ------------------------------------------------------------------ */

export function CliticSlots() {
  return (
    <Frame
      height={175}
      caption="Three legal positions and one illegal one. Before a conjugated verb the pronoun stands alone; it attaches only to an infinitive, a gerund or an affirmative command. With a two-verb structure both ends work and the middle never does. When two pronouns meet, indirect comes first — and «le/les» becomes «se» before «lo/la/los/las», so «le lo» is impossible."
    >
      <text x="16" y="32" fill={MUTED} fontSize="11">BEFORE a conjugated verb</text>
      <rect x="16" y="40" width="60" height="30" rx="6" fill={TEAL} opacity="0.15" />
      <rect x="16" y="40" width="60" height="30" rx="6" fill="none" stroke={TEAL} strokeWidth="1.5" />
      <text x="46" y="60" fill={TEAL} fontSize="13" textAnchor="middle" fontFamily="Georgia, serif">lo</text>
      <text x="86" y="60" fill="#e2e8f0" fontSize="13" fontFamily="Georgia, serif">enviamos ayer</text>

      <text x="250" y="32" fill={MUTED} fontSize="11">ATTACHED to an infinitive</text>
      <text x="250" y="60" fill="#e2e8f0" fontSize="13" fontFamily="Georgia, serif">voy a enviar</text>
      <rect x="340" y="40" width="42" height="30" rx="6" fill={TEAL} opacity="0.15" />
      <rect x="340" y="40" width="42" height="30" rx="6" fill="none" stroke={TEAL} strokeWidth="1.5" />
      <text x="361" y="60" fill={TEAL} fontSize="13" textAnchor="middle" fontFamily="Georgia, serif">le</text>

      <line x1="16" y1="88" x2="464" y2="88" stroke={AXIS} strokeWidth="1" />

      <text x="16" y="112" fill={ROSE} fontSize="11">NEVER between the two verbs</text>
      <text x="16" y="134" fill={ROSE} fontSize="13" fontFamily="Georgia, serif">✗ voy le a enviar</text>

      <text x="250" y="112" fill={MUTED} fontSize="11">TWO pronouns: indirect first</text>
      <text x="250" y="134" fill="#e2e8f0" fontSize="13" fontFamily="Georgia, serif">
        se lo di
        <tspan fill={ROSE}>  ✗ le lo di</tspan>
      </text>
    </Frame>
  );
}

/* ------------------------------------------------------------------ *
 * Preposition bridge — same subject vs different subject
 * ------------------------------------------------------------------ */

export function PrepBridge() {
  return (
    <Frame
      height={165}
      caption="Every preposition in Spanish takes the infinitive — no exceptions, and never the gerund that English uses after «after» or «without». A conjugated verb only becomes possible once you insert «que» and build a full clause with its own subject, and that clause then takes the subjunctive. So the choice point is whether the subject changes."
    >
      <text x="16" y="30" fill={MUTED} fontSize="11">SAME subject</text>
      <rect x="16" y="40" width="130" height="34" rx="8" fill="none" stroke={LIME} strokeWidth="1.5" />
      <text x="81" y="62" fill={LIME} fontSize="12" textAnchor="middle">después de</text>
      <line x1="146" y1="57" x2="186" y2="57" stroke={AXIS} strokeWidth="1.5" />
      <polygon points="186,57 178,53 178,61" fill={AXIS} />
      <text x="196" y="62" fill="#e2e8f0" fontSize="14" fontFamily="Georgia, serif">firmar</text>
      <text x="196" y="80" fill={MUTED} fontSize="11">infinitive</text>

      <line x1="16" y1="100" x2="464" y2="100" stroke={AXIS} strokeWidth="1" />

      <text x="16" y="124" fill={MUTED} fontSize="11">DIFFERENT subject</text>
      <rect x="16" y="132" width="160" height="24" rx="8" fill="none" stroke={VIOLET} strokeWidth="1.5" />
      <text x="96" y="149" fill={VIOLET} fontSize="12" textAnchor="middle">después de que</text>
      <text x="188" y="149" fill="#e2e8f0" fontSize="14" fontFamily="Georgia, serif">el cliente firme</text>
      <text x="330" y="149" fill={VIOLET} fontSize="11">← subjunctive</text>
    </Frame>
  );
}

/* ------------------------------------------------------------------ *
 * Registry
 * ------------------------------------------------------------------ */

type Diagram = () => ReactNode;

/**
 * Which diagram belongs to which topic.
 *
 * Keyed by topic id with a strand fallback, so a topic without its own diagram
 * still gets the one that covers its family rather than nothing. Explicit rather
 * than clever: a wrong diagram is worse than no diagram.
 */
const BY_TOPIC: Record<string, Diagram> = {
  'b1.verb.preterito': TenseTimeline,
  'b1.verb.imperfecto': TenseTimeline,
  'b1.verb.pret_vs_imp': TenseTimeline,
  'b1.verb.pluscuamperfecto': TenseTimeline,
  'b1.verb.presente_perfecto': TenseTimeline,
  'a2.verb.preterito_regular': TenseTimeline,
  'a2.verb.imperfecto': TenseTimeline,

  'b1.mood.subj_presente': MoodSwitch,
  'b1.mood.subj_cuando': MoodSwitch,
  'b1.mood.ojala_quizas': MoodSwitch,
  'b2.mood.subj_relativas': MoodSwitch,
  'b2.mood.subj_concesivas': MoodSwitch,
  'c1.mood.subj_eleccion': MoodSwitch,

  'b2.mood.subj_imperfecto': SiFrame,
  'b2.mood.si_hipotetico': SiFrame,
  'b2.mood.si_counterfactual': SiFrame,
  'b2.verb.colision_r': SiFrame,

  'a1.noun.genero': AgreementChain,
  'a1.noun.plurales': AgreementChain,
  'a1.noun.articulos': AgreementChain,
  'a2.noun.demostrativos': AgreementChain,

  'b1.pron.od_oi': CliticSlots,
  'a2.pron.od': CliticSlots,
  'a2.pron.oi': CliticSlots,
  'a2.pron.se_lo': CliticSlots,
  'b2.pron.clitic_combos': CliticSlots,
  'b2.pron.cliticos_redundantes': CliticSlots,
  'b1.pron.se_constructions': CliticSlots,

  'b1.prep.verbos_regimen': PrepBridge,
  'a1.prep.basicas': PrepBridge,
  'b1.prep.por_para_full': PrepBridge,
  'a2.prep.por_para_intro': PrepBridge,
};

const BY_STRAND: Record<string, Diagram> = {
  verb: TenseTimeline,
  mood: MoodSwitch,
  noun: AgreementChain,
  pron: CliticSlots,
  prep: PrepBridge,
};

export function diagramFor(topicId: string, strand: string): Diagram | null {
  return BY_TOPIC[topicId] ?? BY_STRAND[strand] ?? null;
}

/** The error codes whose feedback is worth illustrating, and with what. */
const BY_ERROR: Record<string, Diagram> = {
  'noun.greek_ma': AgreementChain,
  'noun.gender_agreement': AgreementChain,
  'mood.subj_leak_past': MoodSwitch,
  'mood.subj_imperfecto_missing': SiFrame,
  'verb.futuro_vs_condicional': SiFrame,
  'verb.preterito_persona': TenseTimeline,
  'verb.hace_ago': TenseTimeline,
  'prep.despues_de': PrepBridge,
  'prep.buscar_para': PrepBridge,
  'verb.infinitive_after_prep': PrepBridge,
  'pron.io_redundant': CliticSlots,
  'pron.reflexive_dropped': CliticSlots,
  'pron.se_vs_se_accent': CliticSlots,
};

export function diagramForError(code: string): Diagram | null {
  return BY_ERROR[code] ?? null;
}
