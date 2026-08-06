import { describe, expect, it } from 'vitest';
import { groupHits, search, type SearchDoc } from './search';
import { TOPICS } from '@/seed';
import { ERRORS } from '@/seed/errors';

const docs: SearchDoc[] = [
  ...TOPICS.map((t) => ({
    id: t.id, kind: 'topic' as const, title: t.nameEn, subtitle: t.nameEs,
    terms: t.searchTerms, status: 'available', href: `/topics/${t.id}`, level: t.level,
  })),
  ...ERRORS.map((e) => ({
    id: e.code, kind: 'error' as const, title: e.labelEn, subtitle: e.right,
    terms: `${e.code}|${e.wrong}|${e.right}`, status: e.status, href: `/errors/${e.code}`,
  })),
];

const topIds = (q: string, n = 3) => search(docs, q, n).map((h) => h.id);

describe('search', () => {
  it('finds pluperfect subjunctive from an inflected form', () => {
    // SPEC §8 names this case explicitly.
    expect(topIds('hubiera')).toContain('b2.mood.subj_pluscuamperfecto');
  });

  it('finds relative pronouns from cuyo', () => {
    expect(topIds('cuyo')).toContain('b1.syntax.relativos');
  });

  it('matches Spanish names as well as English', () => {
    expect(topIds('estilo indirecto')).toContain('b2.syntax.estilo_indirecto');
  });

  it('is accent-insensitive in both directions', () => {
    expect(topIds('preterito')).toContain('b1.verb.preterito');
    expect(topIds('pretérito')).toContain('b1.verb.preterito');
  });

  it('tolerates a dropped letter', () => {
    expect(search(docs, 'subjntivo', 8).map((h) => h.id).some((id) => id.includes('subj'))).toBe(true);
  });

  it('reaches errors by their code and by the wrong form', () => {
    expect(topIds('greek')).toContain('noun.greek_ma');
    expect(search(docs, 'la tema', 5).map((h) => h.id)).toContain('noun.greek_ma');
  });

  it('returns nothing for an empty query', () => {
    expect(search(docs, '   ')).toEqual([]);
  });

  it('respects the limit', () => {
    expect(search(docs, 'e', 5)).toHaveLength(5);
  });

  it('groups results by kind in a stable order', () => {
    const groups = groupHits(search(docs, 'subjuntivo', 30));
    expect(groups.map((g) => g.kind)).toEqual(
      groups.map((g) => g.kind).sort((a, b) => (a === 'topic' ? -1 : b === 'topic' ? 1 : 0)),
    );
  });
});
