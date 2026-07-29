import type { ErrorEntry, Priority, Topic, VocabItem, VocabSection } from '../types';
import { addDays } from '../data/vocab';

/**
 * Parsers for the three source files (error log, syllabus, vocabulary bank).
 * The app ships seeded with their current content; these let a fresh export of
 * any of them be re-imported without touching code.
 *
 * The formats are the ones the files already use — see /seed in the repo.
 */

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48);

function fields(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*-\s*\*{0,2}([A-Za-z0-9ÁÉÍÓÚÑáéíóúñ /]+?)\*{0,2}\s*:\s*(.+)$/);
    if (m) out[m[1].trim().toLowerCase()] = m[2].trim().replace(/^\*+|\*+$/g, '');
  }
  return out;
}

/**
 * ### <title>
 * - Category: grammar
 * - Wrong: la tema
 * - Right: el tema
 * - Priority: HIGH
 * - Status: active
 * - Frequency: 31
 * - First seen: 2026-02-11
 * - Rule: <one or more paragraphs>
 */
export function parseErrorLog(md: string): ErrorEntry[] {
  const blocks = md.split(/^###\s+/m).slice(1);
  const out: ErrorEntry[] = [];
  for (const block of blocks) {
    const [titleLine, ...rest] = block.split('\n');
    const title = titleLine.trim();
    if (!title) continue;
    const f = fields(rest.join('\n'));
    const ruleStart = block.indexOf('- Rule:');
    const rule =
      ruleStart >= 0
        ? block.slice(ruleStart + 7).split(/^###/m)[0].trim()
        : (f.rule ?? '');
    const status = (f.status ?? 'active').toLowerCase();
    out.push({
      id: `err-${slug(title)}`,
      category: (f.category ?? 'grammar') as ErrorEntry['category'],
      title,
      wrong: f.wrong ?? '',
      right: f.right ?? '',
      rule,
      firstSeen: f['first seen'] ?? new Date().toISOString().slice(0, 10),
      frequency: Number(f.frequency ?? 1) || 1,
      priority: ((f.priority ?? 'MED').toUpperCase() as Priority),
      status: (['active', 'improving', 'resolved'].includes(status) ? status : 'active') as ErrorEntry['status'],
      attempts: [],
      detectors: (f.detectors ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      notes: f.notes,
      drills:
        f.wrong && f.right
          ? [{
              id: 'd1',
              prompt: `Corrige: "${f.wrong}"`,
              options: [f.wrong, f.right],
              answer: 1,
              explanation: rule.slice(0, 400),
              speak: f.right,
            }]
          : [],
      upgradePair:
        f.b1 && f.b2 ? { b1: f.b1, b2: f.b2, note: f['upgrade note'] ?? '' } : undefined,
    });
  }
  return out;
}

/**
 * ## Breakthrough (B1–B2)
 * 1. Ser vs. estar — covered — confidence 5 — layer confidence
 *    Summary text on the following indented line.
 */
export function parseSyllabus(md: string): Topic[] {
  const out: Topic[] = [];
  let level: Topic['level'] = 'Breakthrough (B1–B2)';
  let order = 0;
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^##\s+(.*)$/);
    if (h) {
      const t = h[1].trim();
      if (/foundations/i.test(t)) level = 'Foundations (A1–A2)';
      else if (/mastery/i.test(t)) level = 'Mastery (C1–C2)';
      else level = 'Breakthrough (B1–B2)';
      continue;
    }
    const m = lines[i].match(/^\s*\d+\.\s+(.+)$/);
    if (!m) continue;
    // the name itself may contain em dashes, so take the three metadata
    // fields from the end and treat everything before them as the name
    const parts = m[1].split('—').map((s) => s.trim());
    const layerRaw = (parts.length > 3 ? parts[parts.length - 1] : '')
      .replace(/layer\s*/i, '').trim().toLowerCase();
    const conf = Number((parts.length > 3 ? parts[parts.length - 2] : '').match(/\d/)?.[0] ?? 2);
    const statusRaw = (parts.length > 3 ? parts[parts.length - 3] : 'queued').toLowerCase();
    const name = (parts.length > 3 ? parts.slice(0, -3) : parts).join(' — ').trim();
    const summary = (lines[i + 1] ?? '').match(/^\s{3,}(\S.*)$/)?.[1] ?? '';
    out.push({
      id: `t-${slug(name)}`,
      name,
      level,
      order: ++order,
      status: (['covered', 'next', 'queued'].includes(statusRaw) ? statusRaw : 'queued') as Topic['status'],
      confidence: (Math.min(5, Math.max(1, conf)) as Topic['confidence']),
      layer: (['accuracy', 'speed', 'naturalness', 'confidence'].includes(layerRaw)
        ? layerRaw
        : 'accuracy') as Topic['layer'],
      summary,
    });
  }
  return out;
}

/**
 * ## Connectors & discourse markers
 * - sin embargo | however | El plazo es ajustado; sin embargo, es alcanzable.
 * - el cronograma (m) | schedule | El cronograma no contempla las lluvias.
 */
export function parseVocab(md: string, today: string): VocabItem[] {
  const out: VocabItem[] = [];
  let section = 'Connectors & discourse markers' as VocabSection;
  let n = 0;
  for (const line of md.split('\n')) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) {
      section = h[1].trim() as VocabSection;
      continue;
    }
    const m = line.match(/^\s*-\s+(.+)$/);
    if (!m) continue;
    const cols = m[1].split('|').map((s) => s.trim());
    if (cols.length < 2) continue;
    const g = cols[0].match(/\((m|f)\)\s*$/);
    out.push({
      id: `v-imp-${n}`,
      section,
      term: cols[0].replace(/\s*\((m|f)\)\s*$/, ''),
      gender: g ? (g[1] as 'm' | 'f') : undefined,
      gloss: cols[1] ?? '',
      example: cols[2] ?? '',
      ease: 2.5,
      intervalDays: 0,
      due: addDays(today, Math.floor(n / 8)),
      reps: 0,
      lapses: 0,
    });
    n++;
  }
  return out;
}

export type SeedKind = 'errors' | 'syllabus' | 'vocab';

/** Guess which of the three files was pasted, so the user doesn't have to say. */
export function detectKind(md: string): SeedKind | null {
  if (/^-\s*\*{0,2}(wrong|right|priority)\*{0,2}\s*:/im.test(md)) return 'errors';
  if (/^##\s+(Foundations|Breakthrough|Mastery)/im.test(md)) return 'syllabus';
  if (/\|/.test(md) && /^##\s+/m.test(md)) return 'vocab';
  return null;
}
