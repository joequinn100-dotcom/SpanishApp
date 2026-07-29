# Fluencia

A single-user Spanish fluency trainer built around one person's real error
patterns, vocabulary gaps and professional context — infrastructure and
construction consulting across Latin America, based in Lima.

Not a generic course. The core loop is **diagnose → drill → produce → track the
decay of the error**, and every example sentence lives in a construction,
engineering, client-negotiation or budget context.

**Target:** CEFR B2 exam, Nov–Dec 2026. Current assessment: solid B1 production /
B2 comprehension — range ahead of precision.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm test         # 50 tests over the grammar engine and the seed parsers
```

No auth, no backend. State lives in `localStorage` under `fluencia.state.v1`
and survives between sessions; **Ajustes → Exportar JSON** takes it to another
machine.

## How it works

### The error log is the spine

`src/data/errors.ts` seeds the database with the eleven active fossilised errors
and six resolved ones, with real frequencies and first-seen dates. Each entry
carries a full rule explanation (deliberately long — depth over brevity), drills
in work context, and a B1→B2 upgrade pair.

An error only reaches **resolved** on sustained evidence: four clean reps spread
across at least three separate sessions. One fresh mistake pulls it back into
circulation. Every part of the app writes into the same per-error history, so a
slip in a role-play counts exactly like a slip in a written assignment.

### The detector engine

`src/engine/detectors.ts` holds one rule per logged error pattern. It powers
three things at once: transcript ingestion, written-assignment grading and
live role-play critique. Rules are conservative by design — a false positive
costs trust, a miss costs one rep — and each is pinned by tests in
`detectors.test.ts`, including negative cases proving correct Spanish stays
untouched.

It is a deterministic rule engine, not a language model. It catches *your*
documented patterns with precision; it will not flag an error nobody has logged
yet. That is what transcript ingestion and the manual-entry form are for.

### The session

Five parts, mirroring the shape of a class with Lorena:

1. **Verbos** — conjugate a chosen verb across all seven studied tenses.
2. **Errores** — warm-up pulled live from the top active errors, then a forced
   free-production prompt, because recognition is not production.
3. **Gramática** — the next topic in the Read2Speak Breakthrough sequence, with
   a full lesson, minimal pairs and a quiz that decides whether the topic moves
   up a fluency layer.
4. **Vocabulario** — spaced repetition over the seven-section bank; words not
   used correctly in a while surface first.
5. **Escritura** — graded in-session, never take-home. The text, the correction
   table and a mandatory rewrite are stored together and stay visible in
   Historial.

**Fluency layers.** Each topic tracks where it is: accuracy → speed (timed
drills) → naturalness → work-level confidence. It advances on 80% in the topic
quiz, not on having been "seen".

### Session start

Opening the app resumes the course rather than restarting it: it reads the
current error state, shows what is still active, and proposes today's plan —
warm-up targets plus the next syllabus topic — with the weekly goals generated
automatically from the top active errors.

### Audio

Web Speech API, biased to `es-PE` → `es-MX` → `es-419` and explicitly never
`es-ES`. Items whose spelling misleads an English reader (caiga, hubo, había,
después, valorización) carry a listen-and-repeat control with a note on what
actually goes wrong.

## Seed data

`/seed` holds the three source files in the format the importer reads:

| File | Contents |
| --- | --- |
| `My_Spanish_Error_Log.md` | Every recurring error, priority, root cause, full rule |
| `My_Spanish_Syllabus.md` | Topic sequence, status, confidence and fluency layer |
| `My_Vocabulary_Bank.md` | Seven sections, gender marked on every noun |

The app ships already seeded with this content. **Ajustes → Reimportar archivos
semilla** re-reads any of the three if your own copy moves ahead — merge keeps
existing attempt history, replace swaps the collection. `seedImport.test.ts`
round-trips all three files.

Gender markers in the vocabulary bank are not decoration: they feed the
agreement detector directly, so a wrong marker produces a wrong correction.

## Adding a class transcript

**Transcripciones** takes a pasted transcript, mines only your own lines
(attributed by speaker label), and shows what it found grouped by existing error
with the frequency delta. Nothing is written until you confirm, and individual
hits can be discarded. Anything the engine cannot see yet goes in through the
manual-entry form, which asks for the full rule — not an abbreviation.

## Layout

```
src/
  engine/     detectors, conjugator, SRS + state, speech, seed parsers
  data/       error log, syllabus + lessons, vocabulary bank, role-plays, writing prompts
  components/ dashboard, session (5 parts), error log, vocab, role-play,
              transcripts, progress, history, settings
seed/         the three source files
```
