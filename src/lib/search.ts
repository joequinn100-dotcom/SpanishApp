/**
 * Instant search over topics, errors and (later) vocab — SPEC §8.
 *
 * The corpus is a few hundred rows, so this runs in memory rather than through
 * FTS5. That is a deliberate choice: FTS5 does prefix matching, not typo
 * tolerance, and the requirement here is that typing `hubiera` lands on
 * pluperfect subjunctive and `cuyo` on relative pronouns — an alias problem
 * solved by search_terms, plus fuzzy tolerance for half-remembered spellings.
 */

export type SearchKind = 'topic' | 'error' | 'vocab';

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  /** Primary label shown in the palette. */
  title: string;
  /** Secondary label — Spanish name, or the correction for an error. */
  subtitle: string;
  /** Pipe-delimited aliases and inflected forms. */
  terms: string;
  /** Current mastery state, shown inline so search doubles as a status view. */
  status: string;
  href: string;
  level?: string;
}

export interface SearchHit extends SearchDoc {
  score: number;
  matched: string;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Ordered-subsequence test: does every character of `q` appear in order? */
function subsequenceScore(q: string, target: string): number | null {
  let ti = 0;
  let gaps = 0;
  let lastHit = -1;
  for (const ch of q) {
    const found = target.indexOf(ch, ti);
    if (found === -1) return null;
    if (lastHit >= 0 && found > lastHit + 1) gaps += found - lastHit - 1;
    lastHit = found;
    ti = found + 1;
  }
  // Prefer tight matches near the start of the string.
  return 20 - Math.min(gaps, 15) - Math.min(target.length / 20, 4);
}

function fieldScore(q: string, field: string, weight: number): { score: number; matched: string } | null {
  const n = normalize(field);
  if (!n) return null;
  if (n === q) return { score: 100 * weight, matched: field };
  if (n.startsWith(q)) return { score: 80 * weight, matched: field };

  // Alias fields are pipe-delimited; score the best individual alias, so a long
  // alias list never dilutes a strong single match.
  if (field.includes('|')) {
    let best: { score: number; matched: string } | null = null;
    for (const part of field.split('|')) {
      const p = normalize(part);
      if (!p) continue;
      let s: number | null = null;
      if (p === q) s = 95;
      else if (p.startsWith(q)) s = 75;
      else if (p.includes(q)) s = 55;
      if (s !== null && (!best || s * weight > best.score)) {
        best = { score: s * weight, matched: part.trim() };
      }
    }
    if (best) return best;
  }

  if (n.includes(q)) return { score: 60 * weight, matched: field };
  const sub = subsequenceScore(q, n);
  if (sub !== null) return { score: sub * weight, matched: field };
  return null;
}

export function search(docs: SearchDoc[], query: string, limit = 20): SearchHit[] {
  const q = normalize(query);
  if (!q) return [];

  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const candidates = [
      fieldScore(q, doc.title, 1.0),
      fieldScore(q, doc.subtitle, 0.9),
      fieldScore(q, doc.terms, 0.85),
      fieldScore(q, doc.id, 0.5),
    ].filter((c): c is { score: number; matched: string } => c !== null);

    if (!candidates.length) continue;
    const best = candidates.reduce((a, b) => (b.score > a.score ? b : a));
    hits.push({ ...doc, score: best.score, matched: best.matched });
  }

  return hits
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/** Palette results are grouped Topic / Error / Vocab (SPEC §8). */
export function groupHits(hits: SearchHit[]): { kind: SearchKind; label: string; hits: SearchHit[] }[] {
  const order: { kind: SearchKind; label: string }[] = [
    { kind: 'topic', label: 'Topics' },
    { kind: 'error', label: 'Errors' },
    { kind: 'vocab', label: 'Vocabulary' },
  ];
  return order
    .map(({ kind, label }) => ({ kind, label, hits: hits.filter((h) => h.kind === kind) }))
    .filter((g) => g.hits.length > 0);
}
