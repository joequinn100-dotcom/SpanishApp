/**
 * Apply pending migrations and seed the curriculum.
 *
 * `npm run db:migrate`. The app calls `getDb()` which migrates on first open,
 * so this exists for the case where you want that to happen deliberately —
 * before a deploy, or after pulling a branch that added a migration — rather
 * than on whichever request happens to arrive first.
 */
import { appliedMigrations, getDb } from '../src/db';
import { seed } from '../src/seed';

const before = new Set(appliedMigrations(getDb()).map((m) => m.name));
const db = getDb();
const after = appliedMigrations(db);
const applied = after.filter((m) => !before.has(m.name));

for (const m of applied) console.log(`applied ${m.name}`);
if (applied.length === 0) console.log('No pending migrations.');

seed(db);
console.log('Seed complete.');
