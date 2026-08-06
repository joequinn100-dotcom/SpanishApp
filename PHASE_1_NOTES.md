# Phase 1 — The spine

Status: complete and running. `npm test` → 73 passing. `npm run build` → clean.

```bash
npm install
npm run build && npm start     # http://localhost:3000
npm test
```

The database is created and seeded on first request at `./data/fluencia.db`.
Delete that file to reset; migrations and seed re-run automatically.

---

## What was built

**Persistence.** `better-sqlite3` at `./data/fluencia.db`, WAL, `foreign_keys = ON`,
one connection per process parked on `globalThis` so dev-mode hot reload doesn't
leak handles. A migration runner reads `./migrations/*.sql` in lexical order
against a `schema_migrations` ledger, one transaction per file — a migration that
throws rolls back and is retried on next start rather than being marked done.

**Schema.** `migrations/001_init.sql`, SPEC §2 plus the four additions approved
before the build (documented as deviations below).

**Curriculum.** 92 topics across A1–C2, the SPEC §3 prerequisite graph plus the
edges needed to connect the spine to the A-level topics it assumes, and all 26
errors from §10 with full rule text.

**State machines.** `src/domain/mastery.ts` — pure functions, no database, no
clock. Every §4 transition is one call, which is what makes the grading logic
testable in isolation.

**Search.** In-memory fuzzy match over topics and errors, Cmd-K palette, grouped
by kind. FTS5 was rejected deliberately: it does prefix matching, not typo
tolerance, and §8's requirement (`hubiera` → pluperfect subjunctive, `cuyo` →
relative pronouns) is an alias problem solved by `search_terms`.

**UI.** Curriculum overview by level, topic detail with prerequisites/dependents
and the reason a topic is locked, and the error log with expandable rules.

---

## Deviations from SPEC §2, and why

| # | Change | Forced by |
|---|---|---|
| 1 | Added `quarantine` table | §5's arbiter writes to a quarantine table on round 3; §2 never defined one |
| 2 | Added `topic_state.consolidating_since`, `reviews_passed`, `next_review_at` | §4's "2 clean spaced reviews (+3d, +10d)" gate is unimplementable without them |
| 3 | Added `topic.no_schedule` | §3 lists por/para as a topic, §10 says never schedule it. Seeded and searchable, excluded from routing |
| 4 | Reordered `session` above its referrers; added CHECK constraints on enum columns; added `error.consolidating_since`, `streak.freezes_reset_at` | §2 references `session()` before declaring it; the enums were prose comments with nothing enforcing them |

Topic IDs follow §3's graph form (`b2.mood.subj_imperfecto`), not the `topic.id`
comment in §2 (`b2.subj.imperfecto`). The graph wins because it references IDs by
exact string, and `mood` is a real strand while `subj` is not.

---

## Interpretations where the spec was silent

- **`regressed` is a persistent state**, confirmed before building. §4 draws
  `resolved → regressed → active` but also gives `regressed` its own warm-up
  multiplier of 1.4 — a state you pass through instantly cannot carry a weight.
  A recurred error sits at 1.4× until `clean_streak ≥ 5` promotes it to
  `improving`.
- **A failed review restarts the sequence.** §4 specifies the consolidation gate
  but not its failure path. "Two *clean* spaced reviews" reads as a sequence that
  restarts rather than pauses, so `reviews_passed` resets to 0.
- **A transcript error during consolidation also restarts it**, same reasoning.
  It does not demote the topic — §4 makes only `mastered` regress.
- **`spontaneous_ok` also increments `clean_streak`.** A correct unprompted use
  is a correct production; counting it once would make `improving →
  consolidating` (streak ≥ 12 **and** spontaneous ≥ 2) harder than intended.

---

## Source books

All three arrived and were mapped by section index: Foundations 653pp,
Breakthrough 857pp, Mastery 567pp — 2,077 pages, 15 units each, clean text
layers. `book_ref` values are real unit and subsection references, never guessed;
a test enforces the format.

**The books are a curriculum authority, not a register authority.** Foundations
carries 85 `vosotros` forms, 64 `-áis/-éis` endings, 623 Castilian /θ/
pronunciation respellings (*recibir* → "rreh-thee-BEER"), plus `ordenador`,
`vale` and `coger`. SPEC §11 forbids all of it. No Spanish was lifted from any
book; every example is authored. A four-test suite (`register: no Peninsular
Spanish reaches the seed`) fails the build if any of it appears in a seeded
string.

**Three topics have `book_ref: null`** because no book in the set covers them:
`cuyo` appears zero times across all 2,077 pages despite §3 listing it under B1
relatives; B2-level clitic combination is only treated at A2 depth; and leísmo is
absent. Those summaries are authored rather than sourced.

The PDFs are gitignored — they carry the purchaser's embedded identifiers.

---

## Defects the tests caught

Worth recording, because these are the ones that would have been expensive later:

1. **`a1.verb.preguntas` had strand `syntax`** — id prefix and column disagreed.
2. **`a1.verb.gustar` depended on an A2 topic**, inverting the level order. The
   book teaches gustar (U6) before object pronouns (U14), so the edge was
   reversed.
3. **Two resolved errors had rules under 300 characters**, failing §11's depth
   requirement.
4. **The register test fired on my own summary**, which used the word `vosotros`
   to say it doesn't exist in Latin American usage. Reworded rather than
   exempted — a strict test with no carve-outs is worth more than a lenient one.
5. **Every C1 and C2 topic was `available` from a cold start**, because I had
   wired them with only soft prerequisites. C2 bureaucratic register was open
   while B1 preterite narration was locked. Found by eye in the curriculum view,
   not by the suite — so two invariant tests were added to catch the class.

A cascade collision in the scaffold also cost a rebuild: `create-next-app`'s
`globals.css` styles `body` with **unlayered** CSS, which beats Tailwind's
layered utilities, silently overriding `bg-slate-950` and the font pairing.
`globals.css` is now a proper `@theme` + `@layer base` file.

---

## Deferred to later phases (per §9)

No Anthropic SDK, no gauntlet, no drill runner, no grading, no transcript
pipeline, no XP/streaks/timeline. `content`, `attempt`, `quarantine`,
`transcript*`, `vocab`, `xp_event` and `achievement` exist and are empty.

Session handoff is **Phase 2** per §9, though Build Principle 4 calls it
first-class — flagging the tension rather than resolving it unilaterally.

---

## Uncertain — worth your input before Phase 2

**1. Topic state starts cold, so the app thinks you know nothing.** Everything
seeds `locked`, then unlocks to `available` where the graph permits: A1 all open,
B1 8 of 20 open, B2 2 of 28, C-level fully locked. That is a correct cold start
but not *your* position — §10's resolved errors and the §7 handoff's "B1+
production / B2 comprehension" say you're well past A1. Phase 2 needs either a
placement pass or a manual "mark mastered" action. I did not invent mastery
state, because guessing it wrong would corrupt the one table everything reads.

**2. `occurrences` are estimates, not measurements.** §10 gives volume in prose
("highest by volume", "10+/week", "6+ instances"), so I calibrated counts from
those notes. They matter because §4's weight formula multiplies by
`log(1 + occurrences)`. Real events overwrite them from the first session.

**3. §5 pins `claude-sonnet-4-6`, which is previous-generation.** `claude-sonnet-5`
is current and materially stronger on exactly the reasoning the verifier panel
does. Phase 2 decision, not mine to make silently.

**4. §3 asks for "full coverage" expansion from the books.** Phase 1 ships the
~92-topic spine read from §3 directly. Now that all three books are indexed, the
expansion can land as migration 002 — but the unit structures suggest something
closer to 200 topics, which is a scope call worth making deliberately.
