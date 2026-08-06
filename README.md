# Fluencia

Spanish fluency training for one person: an English-speaking infrastructure
consultant in Lima, sitting a CEFR **B2 exam on 1 December 2026**.

Not a general language app. Every example sentence lives in construction,
engineering, client negotiation, budget and multi-country coordination context,
the Spanish is neutral Latin American throughout, and the whole system is built
around one idea from `SPEC.md` §4: **the error log is the engine**. What you get
wrong decides what you practise, and nothing is ever marked learned without
evidence that you produced it correctly and unprompted.

## Running it

```bash
npm install
npm run build && npm start        # http://localhost:3000
npm test                          # 321 tests
```

The database creates and seeds itself at `./data/fluencia.db` on first request.
Delete that file to start over; migrations and seed re-run automatically.

Everything is local. There is no account, no cloud, no sync — the database file
*is* the account, which is why closing the laptop mid-session loses nothing and
why the app only works on the machine holding that file.

## What it does

| Route | |
|---|---|
| `/` | Progress, daily quest, streak, search, and the button that starts a session |
| `/timeline` | Where your current pace lands relative to 1 December |
| `/curriculum` | 92 topics across A1–C2, ordered by the prerequisite graph |
| `/topics/[slug]` | One topic: explanation, diagram, prerequisites, related errors |
| `/practice/[id]` | The drill runner |
| `/errors` | The error log — 26 errors, each with a full rule |
| `/transcripts` | Upload a class transcript; review what it found |
| `/vocab` | Vocabulary SRS |
| `/achievements` | Ten awards, each tied to real evidence |

**A session** opens with a warm-up drawn from your live errors (§4 guarantees at
least two items from your top-three highest-severity active errors, every
session), then a spaced review if one is due, then new material. Every answer is
graded with a thorough explanation — the rule, the why, the exceptions — and
every consequence is written in one transaction. Ending a session writes a §7
handoff to `./handoffs/` as JSON and markdown.

**Transcripts** are where the app earns its keep. Paste a class transcript, tell
it which speaker is you, and it proposes what went wrong *and what went right*.
Nothing touches your error log until you accept it, one card at a time, on the
keyboard.

## Repository

```
SPEC.md              the authority — 11 sections, quoted throughout the code
CLAUDE.md            invariants that override default behaviour
PHASE_*_NOTES.md     what was built, what deviated from the spec, and why
migrations/          SQL, applied in order, one transaction per file
src/domain/          pure logic — no database, no clock, no model. Heavily tested
src/lib/             the database side: reads rows, calls domain, writes back
src/app/             routes
src/seed/            the curriculum, the error log, 73 drills, 70 vocabulary cards
```

`src/domain` holds every rule worth arguing about — mastery state machines,
grading, session assembly, SRS scheduling, the timeline projection — as pure
functions, which is what makes them testable without a database and readable
without a debugger.

## Revision 1

Everything in `SPEC.md` that can be built without an API key. Phases 1–4 are
complete; see `PHASE_4_NOTES.md` for the full inventory and the documented
deviations.

## Revision 2 needs a key

Create a gitignored `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Four things are blocked on it, and none can be faked:

1. **The §5 gauntlet** — the three-verifier panel that checks generated content
   for linguistic correctness, regional register and pedagogical fitness. The 73
   authored drills carry `provenance = 'authored'` so they can be re-verified
   the day it runs.
2. **Content generation** — 7 of 92 topics currently have drills. This is the
   single biggest limit on the app, and generation is the only fix.
3. **Model transcript analysis** — the rule-based analyser catches 11 of 19
   active errors and nothing requiring judgement.
4. **Model-graded free response** — exact matching is right for cloze and
   conjugation and increasingly wrong for translation.

Model choice was settled earlier and differs from §5's `claude-sonnet-4-6`,
which is previous-generation: **Opus 5 for the verifier panel, Sonnet 5 for
generation**.

## Source books

The three Read2Speak books decide which topics exist and in what order. They are
**not** a register authority — Foundations carries 85 `vosotros` forms, 623
Castilian /θ/ pronunciation respellings, and `ordenador`/`vale`/`coger`. No
Spanish was lifted from any of them; `npm test` fails if Peninsular Spanish
reaches a single seeded string. The PDFs are gitignored and carry the
purchaser's embedded identifiers.
