import Link from 'next/link';
import { TENSES } from '@/domain/conjugation';
import { VERBS } from '@/domain/verbs';
import { TenseTrainer } from '@/components/TenseTrainer';

export const dynamic = 'force-dynamic';

/**
 * The tense trainer.
 *
 * Every other route in the app is driven by what the error log and the
 * prerequisite graph say you should do next, which is right for a curriculum
 * and wrong for the moment before a site meeting when you know you are shaky on
 * the imperfect subjunctive and want twenty of them now.
 *
 * The material is generated rather than stored: `domain/conjugation.ts` can
 * produce every form of every verb in the lexicon, so this screen never runs
 * out and never repeats itself into memorisation. Nothing here needs an API
 * key — a conjugation is rule-governed, and the rules are tested.
 */
export default function TensesPage() {
  const byMood = {
    indicativo: TENSES.filter((t) => t.mood === 'indicativo'),
    subjuntivo: TENSES.filter((t) => t.mood === 'subjuntivo'),
    imperativo: TENSES.filter((t) => t.mood === 'imperativo'),
  };

  return (
    <>
      <div className="mb-6 flex items-baseline gap-4">
        <h1 className="text-2xl font-semibold">Tenses</h1>
        <span className="text-sm text-slate-500">
          {TENSES.length} tenses · {VERBS.length} verbs · every form generated and tested
        </span>
        <div className="flex-1" />
        <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-300">
          ← Progress
        </Link>
      </div>

      <p className="mb-6 max-w-[70ch] text-sm leading-relaxed text-slate-400">
        Pick a tense and drill it until it is automatic, or open the table to see the whole
        paradigm at once. Every sentence is a site or meeting sentence, and every explanation
        gives the rule, the derivation and the trap that sits next to it.
      </p>

      <TenseTrainer moods={byMood} verbs={VERBS.map((v) => ({ infinitive: v.infinitive, en: v.en }))} />
    </>
  );
}
