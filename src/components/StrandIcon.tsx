/**
 * A glyph and a colour for each of the nine strands (SPEC §3).
 *
 * Visual identity, not decoration: the curriculum is 92 items long, and a list
 * of 92 identically-styled rows is unreadable. Colour-coding by strand is what
 * lets you see at a glance that you have three verb topics open and no
 * pronoun ones — which is a real fact about your study balance that the numbers
 * alone do not surface.
 *
 * Drawn rather than imported: no network is available to a published page, and
 * a stock photo of a hard hat teaches nothing about the imperfect subjunctive.
 */

export const STRAND_STYLE: Record<string, { fg: string; bg: string; ring: string; label: string }> = {
  verb: { fg: 'text-teal-300', bg: 'bg-teal-500/10', ring: 'border-teal-700/50', label: 'Verb system' },
  mood: { fg: 'text-violet-300', bg: 'bg-violet-500/10', ring: 'border-violet-700/50', label: 'Mood & modality' },
  pron: { fg: 'text-sky-300', bg: 'bg-sky-500/10', ring: 'border-sky-700/50', label: 'Pronouns & clitics' },
  noun: { fg: 'text-amber-300', bg: 'bg-amber-500/10', ring: 'border-amber-700/50', label: 'Nouns & agreement' },
  prep: { fg: 'text-lime-300', bg: 'bg-lime-500/10', ring: 'border-lime-700/50', label: 'Prepositions' },
  syntax: { fg: 'text-rose-300', bg: 'bg-rose-500/10', ring: 'border-rose-700/50', label: 'Clause structure' },
  discourse: { fg: 'text-cyan-300', bg: 'bg-cyan-500/10', ring: 'border-cyan-700/50', label: 'Discourse & flow' },
  lex: { fg: 'text-orange-300', bg: 'bg-orange-500/10', ring: 'border-orange-700/50', label: 'Vocabulary' },
  prof: { fg: 'text-indigo-300', bg: 'bg-indigo-500/10', ring: 'border-indigo-700/50', label: 'Professional' },
};

const FALLBACK = { fg: 'text-slate-300', bg: 'bg-slate-500/10', ring: 'border-slate-700', label: '' };

export function strandStyle(strand: string) {
  return STRAND_STYLE[strand] ?? FALLBACK;
}

/** Each glyph is a picture of what the strand *does*, not an abstract mark. */
function Glyph({ strand }: { strand: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (strand) {
    case 'verb': // an arrow of time: the tense system
      return (
        <>
          <path d="M3 12h18" {...p} />
          <path d="M16 7l5 5-5 5" {...p} />
          <circle cx="8" cy="12" r="2" {...p} />
        </>
      );
    case 'mood': // a fork: indicative or subjunctive
      return (
        <>
          <path d="M4 20V9a5 5 0 015-5h1" {...p} />
          <path d="M20 20V9a5 5 0 00-5-5h-1" {...p} />
          <path d="M12 4v16" {...p} strokeDasharray="2 3" />
        </>
      );
    case 'pron': // a substitution: a token standing in for a phrase
      return (
        <>
          <rect x="3" y="8" width="7" height="8" rx="2" {...p} />
          <path d="M12 12h4" {...p} />
          <path d="M14 10l2 2-2 2" {...p} />
          <circle cx="19.5" cy="12" r="2" {...p} />
        </>
      );
    case 'noun': // agreement: two shapes matching
      return (
        <>
          <circle cx="7" cy="8" r="3" {...p} />
          <circle cx="17" cy="8" r="3" {...p} />
          <path d="M7 13v3a2 2 0 002 2h6a2 2 0 002-2v-3" {...p} />
        </>
      );
    case 'prep': // a bridge between two things
      return (
        <>
          <path d="M3 16h18" {...p} />
          <path d="M6 16V9M18 16V9" {...p} />
          <path d="M6 9c3-3 9-3 12 0" {...p} />
        </>
      );
    case 'syntax': // nesting: a clause inside a clause
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" {...p} />
          <rect x="7" y="9" width="10" height="6" rx="1.5" {...p} />
        </>
      );
    case 'discourse': // connected turns
      return (
        <>
          <path d="M4 7h9a3 3 0 010 6H8l-3 3V7z" {...p} />
          <path d="M16 11h4v6l-2.5-2H14" {...p} />
        </>
      );
    case 'lex': // a lexicon
      return (
        <>
          <path d="M4 5.5A1.5 1.5 0 015.5 4H11v16H5.5A1.5 1.5 0 014 18.5v-13z" {...p} />
          <path d="M20 5.5A1.5 1.5 0 0018.5 4H13v16h5.5a1.5 1.5 0 001.5-1.5v-13z" {...p} />
        </>
      );
    case 'prof': // a site: what all of this is for
      return (
        <>
          <path d="M3 20h18" {...p} />
          <path d="M6 20V10l6-4 6 4v10" {...p} />
          <path d="M10 20v-5h4v5" {...p} />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="7" {...p} />;
  }
}

export function StrandIcon({ strand, className = 'h-4 w-4' }: { strand: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <Glyph strand={strand} />
    </svg>
  );
}

/** Icon in a tinted chip — the form used on cards and list rows. */
export function StrandBadge({ strand, label }: { strand: string; label?: string }) {
  const s = strandStyle(strand);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${s.ring} ${s.bg} ${s.fg}`}
      title={s.label}
    >
      <StrandIcon strand={strand} className="h-3 w-3" />
      {label ?? null}
    </span>
  );
}
