/**
 * Dump the data the field reference is built from.
 *
 * The conjugations come straight out of the engine rather than being retyped,
 * so the page a learner bookmarks cannot drift from what the drills will mark
 * them against. Run this, then `python3 scripts/build-reference.py`.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { TENSES, PERSONS, PERSON_LABELS, fullTable } from '../src/domain/conjugation';
import { VERB_BY_INFINITIVE } from '../src/domain/verbs';
import { VOCAB } from '../src/seed/vocab';

/** Three regular models, the irregular core, and the domain's own verbs. */
const SHOW = [
  'trabajar', 'romper', 'cumplir',
  'ser', 'estar', 'ir', 'tener', 'hacer', 'poder', 'decir', 'venir', 'saber', 'dar', 'ver',
  'entregar', 'aprobar', 'firmar', 'llegar', 'pedir', 'seguir', 'empezar', 'volver',
  'construir', 'conseguir',
];

const verbs = SHOW.map((inf) => {
  const v = VERB_BY_INFINITIVE.get(inf);
  if (!v) throw new Error(`Reference lists ${inf}, which is not in the lexicon.`);
  const t = fullTable(v);
  return {
    inf: v.infinitive,
    en: v.en,
    irregular: !!(v.irregular || v.preteriteStem || v.futureStem || v.yo || v.stemChange),
    tenses: TENSES.map((ti) => ({ id: ti.id, forms: PERSONS.map((p) => t[ti.id][p]) })),
  };
});

const out = join(process.cwd(), 'docs');
mkdirSync(out, { recursive: true });
writeFileSync(
  join(out, 'reference-data.json'),
  JSON.stringify({
    tenses: TENSES.map((t) => ({
      id: t.id, en: t.en, es: t.es, mood: t.mood,
      level: t.level, compound: t.compound, use: t.use,
    })),
    persons: PERSONS,
    personLabels: PERSONS.map((p) => PERSON_LABELS[p]),
    verbs,
    vocab: VOCAB.map((v) => ({
      term: v.term, gloss: v.gloss, category: v.category, level: v.level, example: v.example,
    })),
  }),
);
console.log(`${verbs.length} verbs × ${TENSES.length} tenses, ${VOCAB.length} lexicon entries.`);
