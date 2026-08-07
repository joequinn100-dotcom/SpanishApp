/**
 * The overnight pre-generation job (SPEC §5, cost control).
 *
 * Run from cron, not from the app:
 *
 *   0 3 * * *  cd /path/to/SpanishApp && npm run pregenerate >> ./data/pregen.log 2>&1
 *
 * §5: "Sessions should never wait on generation." A gauntlet run is five API
 * calls with up to three verification rounds behind it, so the only acceptable
 * place for it is a process nobody is sitting in front of.
 *
 * Exits 0 on a run that did its job, found nothing to do, or found no API key —
 * none of those should page anyone at 3am. Exits 1 only when generation was
 * attempted and failed, which is the case worth noticing in the morning.
 */
import { getDb } from '../src/db';
import { createGauntletClient, gauntletAvailable } from '../src/lib/anthropic';
import { pregenerate, pregenerationPlan } from '../src/lib/pregenerate';

async function main() {
  const db = getDb();
  const dry = process.argv.includes('--dry-run');

  if (dry) {
    const plan = pregenerationPlan(db);
    if (plan.length === 0) {
      console.log('Nothing to do: every recommended topic is already stocked.');
      return 0;
    }
    for (const t of plan) {
      console.log(`${t.topicId}  have ${t.have}, want ${t.want} more  (${t.level})`);
    }
    return 0;
  }

  if (!gauntletAvailable()) {
    console.log('No ANTHROPIC_API_KEY set — nothing generated. Set it in .env.local.');
    return 0;
  }

  const report = await pregenerate(db, { client: createGauntletClient(), now: () => new Date() });

  console.log(`outcome: ${report.outcome}`);
  for (const t of report.perTopic) {
    console.log(
      `  ${t.topicId}: ${t.accepted} accepted, ${t.quarantined} quarantined` +
        (t.error ? `  ERROR: ${t.error}` : ''),
    );
  }
  console.log(
    `${report.accepted} items accepted, ${report.quarantined} quarantined, ${report.batches} batches.`,
  );
  if (report.quarantined > 0) {
    console.log('Quarantined items are never served. Review them before regenerating.');
  }

  return report.outcome === 'failed' ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
