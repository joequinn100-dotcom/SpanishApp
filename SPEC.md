# Fluencia v2 — Claude Code Build Spec & Gauntlet Loop Prompt

**Owner:** Cocco · Lima, Peru · infrastructure & construction consultant
**Target:** CEFR B2 certification, Nov–Dec 2026
**Register:** Neutral professional Latin American Spanish (Peruvian/Ecuadorian/Bolivian norms preferred)
**Purpose of this file:** paste Section 1 into Claude Code to start the build. Sections 2–9 are the reference the agent reads as it works. Save this file as `SPEC.md` in the repo root and add `CLAUDE.md` pointing to it.

---

## SECTION 1 — THE MASTER PROMPT (paste this into Claude Code first)

> Copy everything inside the fenced block below into a fresh Claude Code session in an empty directory.

```
You are building "Fluencia" — a Spanish fluency training app for a single user
(an English-speaking construction/infrastructure consultant based in Lima, Peru,
targeting CEFR B2 certification by December 2026, then continuing to C2).

Read SPEC.md in this directory in full before writing any code. It contains the
data model, topic taxonomy, gauntlet loop design, gamification rules, seed data,
and build order. Do not deviate from the schema without telling me why.

BUILD PRINCIPLES — these override any default instinct you have:

1. LOCAL-FIRST AND DURABLE. SQLite via better-sqlite3, file stored at
   ./data/fluencia.db. Every write is a transaction. The database is the product;
   the UI is a window onto it. Never store learning state in localStorage or React
   state alone. On every app start, run migrations from ./migrations/ in order.

2. CONTENT IS GENERATED, THEN VERIFIED, THEN STORED. No lesson content ships to
   the user straight from a model call. Every generated item passes the gauntlet
   loop in SPEC.md §5 before it is written to the content table. Cache aggressively
   — a verified drill is reused forever, not regenerated.

3. THE ERROR LOG IS THE ENGINE. Topic recommendation, drill selection, and the
   timeline all read from the error table. An error is not "resolved" because the
   user got it right once. See SPEC.md §4 for the mastery state machine.

4. SESSION HANDOFF IS A FIRST-CLASS FEATURE. Every session ends by writing a
   handoff JSON (SPEC.md §7) to ./handoffs/ AND rendering it as copyable text.
   Every session starts by reading the most recent handoff. This must work even
   if the database is wiped.

5. BUILD IN THE ORDER GIVEN IN SPEC.md §9. Do not scaffold the whole app. Finish
   Phase 1 completely — working, tested, usable — before starting Phase 2. Show me
   a running app at the end of every phase.

STACK: Next.js (App Router) + TypeScript + Tailwind + better-sqlite3 +
Anthropic SDK (@anthropic-ai/sdk). No auth, no cloud, no user accounts — single
user, runs on localhost. Zustand for UI state only.

TESTING: Vitest. Every gauntlet verifier gets unit tests with deliberately broken
Spanish as fixtures. Every mastery state transition gets a test. I want to be able
to run `npm test` and trust the grading logic.

WORKFLOW: After each phase, write a short PHASE_N_NOTES.md explaining what you
built, what you deferred, and what you're uncertain about. Ask me before making
any decision that would be expensive to reverse.

Start by reading SPEC.md, then give me your build plan for Phase 1 only. Do not
write code until I approve the plan.
```

---

## SECTION 2 — DATA MODEL

```sql
-- ============ CURRICULUM ============

CREATE TABLE level (
  id            TEXT PRIMARY KEY,        -- 'A1','A2','B1','B2','C1','C2'
  ordinal       INTEGER NOT NULL
);

CREATE TABLE strand (
  id            TEXT PRIMARY KEY,        -- see §3
  name_en       TEXT NOT NULL,
  name_es       TEXT NOT NULL
);

CREATE TABLE topic (
  id            TEXT PRIMARY KEY,        -- 'b2.subj.imperfecto'
  slug          TEXT UNIQUE NOT NULL,
  name_en       TEXT NOT NULL,
  name_es       TEXT NOT NULL,
  level_id      TEXT NOT NULL REFERENCES level(id),
  strand_id     TEXT NOT NULL REFERENCES strand(id),
  summary       TEXT NOT NULL,           -- one paragraph, what it is & why it matters
  book_ref      TEXT,                    -- 'Breakthrough U7', 'Mastery U5'
  est_minutes   INTEGER DEFAULT 25,
  search_terms  TEXT NOT NULL            -- pipe-delimited aliases for search
);

-- The dependency graph. THIS is what produces "start with X, then Y, then Z".
CREATE TABLE topic_prereq (
  topic_id      TEXT NOT NULL REFERENCES topic(id),
  prereq_id     TEXT NOT NULL REFERENCES topic(id),
  strength      TEXT NOT NULL,           -- 'hard' = blocks | 'soft' = recommended
  PRIMARY KEY (topic_id, prereq_id)
);

-- ============ USER STATE ============

CREATE TABLE topic_state (
  topic_id      TEXT PRIMARY KEY REFERENCES topic(id),
  status        TEXT NOT NULL DEFAULT 'locked',
                -- locked | available | studying | consolidating | mastered
  accuracy      REAL DEFAULT 0,          -- rolling, last 20 attempts
  attempts      INTEGER DEFAULT 0,
  correct       INTEGER DEFAULT 0,
  first_seen    TEXT,
  last_seen     TEXT,
  mastered_at   TEXT,
  spontaneous   INTEGER DEFAULT 0        -- correct uses found in transcripts
);

CREATE TABLE error (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT UNIQUE NOT NULL,    -- 'gender.greek_ma'
  label_en      TEXT NOT NULL,
  wrong_example TEXT NOT NULL,           -- 'la tema'
  right_example TEXT NOT NULL,           -- 'el tema'
  rule          TEXT NOT NULL,           -- the explanation, thorough
  topic_id      TEXT REFERENCES topic(id),
  severity      INTEGER NOT NULL,        -- 1 (cosmetic) .. 5 (blocks comprehension)
  status        TEXT NOT NULL DEFAULT 'active',
                -- active | improving | consolidating | resolved | regressed
  first_logged  TEXT NOT NULL,
  last_occurred TEXT,
  occurrences   INTEGER DEFAULT 0,       -- times committed
  clean_streak  INTEGER DEFAULT 0,       -- consecutive correct productions
  spontaneous_ok INTEGER DEFAULT 0,      -- correct uses in unprompted transcript speech
  resolved_at   TEXT
);

CREATE TABLE error_event (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  error_id      INTEGER NOT NULL REFERENCES error(id),
  session_id    INTEGER REFERENCES session(id),
  source        TEXT NOT NULL,           -- 'drill' | 'transcript' | 'freewrite' | 'roleplay'
  outcome       TEXT NOT NULL,           -- 'committed' | 'avoided'
  evidence      TEXT NOT NULL,           -- the actual sentence
  occurred_at   TEXT NOT NULL
);

-- ============ CONTENT (gauntlet-verified) ============

CREATE TABLE content (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id      TEXT NOT NULL REFERENCES topic(id),
  kind          TEXT NOT NULL,
                -- explanation | drill_conjugation | drill_cloze | drill_transform
                -- | drill_translate | drill_error_spot | roleplay | upgrade_pair
  difficulty    INTEGER NOT NULL,        -- 1..5
  payload       TEXT NOT NULL,           -- JSON, shape depends on kind
  targets_error TEXT,                    -- error.code this drill is designed to catch
  gauntlet_score REAL NOT NULL,
  gauntlet_log  TEXT NOT NULL,           -- JSON: every round's critiques
  verified_at   TEXT NOT NULL,
  retired       INTEGER DEFAULT 0
);

CREATE TABLE attempt (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id    INTEGER NOT NULL REFERENCES content(id),
  session_id    INTEGER NOT NULL REFERENCES session(id),
  user_answer   TEXT NOT NULL,
  correct       INTEGER NOT NULL,
  partial       REAL,                    -- 0..1 for free-response
  feedback      TEXT NOT NULL,
  errors_found  TEXT,                    -- JSON array of error codes
  latency_ms    INTEGER,                 -- feeds the SPEED phase later
  attempted_at  TEXT NOT NULL
);

-- ============ SESSIONS & TRANSCRIPTS ============

CREATE TABLE session (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  kind          TEXT NOT NULL,           -- 'self_study' | 'transcript_review' | 'exam_sim'
  topics        TEXT,                    -- JSON array
  xp_earned     INTEGER DEFAULT 0,
  handoff_json  TEXT,
  handoff_md    TEXT
);

CREATE TABLE transcript (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source        TEXT NOT NULL,           -- 'lorena' | 'self_recording' | 'other'
  class_date    TEXT NOT NULL,
  raw_text      TEXT NOT NULL,
  analysis_json TEXT,                    -- gauntlet-verified analysis
  imported_at   TEXT NOT NULL
);

-- Findings are PROPOSED, not auto-applied. Manual confirmation prevents
-- one-off slips from polluting the log.
CREATE TABLE transcript_finding (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  transcript_id INTEGER NOT NULL REFERENCES transcript(id),
  error_code    TEXT,                    -- null = novel error, needs a new code
  proposed_label TEXT,
  quote         TEXT NOT NULL,
  correction    TEXT NOT NULL,
  explanation   TEXT NOT NULL,
  confidence    REAL NOT NULL,
  decision      TEXT DEFAULT 'pending'   -- pending | accepted | rejected | one_off
);

-- ============ VOCAB ============

CREATE TABLE vocab (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  term          TEXT UNIQUE NOT NULL,
  gloss_en      TEXT NOT NULL,
  category      TEXT NOT NULL,           -- connector | work_noun | verb_pattern
                                         -- | collocation | set_phrase | false_friend
  level_id      TEXT NOT NULL,
  example_es    TEXT NOT NULL,           -- must be construction/consulting context
  stage         TEXT DEFAULT 'new',      -- new | recognizing | using | spontaneous
  ease          REAL DEFAULT 2.5,        -- SM-2
  interval_days INTEGER DEFAULT 0,
  due_at        TEXT
);

-- ============ GAMIFICATION ============

CREATE TABLE streak (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  current       INTEGER DEFAULT 0,
  longest       INTEGER DEFAULT 0,
  last_active   TEXT,
  freezes       INTEGER DEFAULT 2
);

CREATE TABLE xp_event (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    INTEGER REFERENCES session(id),
  amount        INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  occurred_at   TEXT NOT NULL
);

CREATE TABLE achievement (
  code          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  unlocked_at   TEXT
);
```

---

## SECTION 3 — TOPIC TAXONOMY

### Strands

| id | English | Spanish |
|---|---|---|
| `verb` | Verb system | Sistema verbal |
| `mood` | Mood & modality | Modo y modalidad |
| `pron` | Pronouns & clitics | Pronombres y clíticos |
| `noun` | Nouns, gender, articles, agreement | Sustantivos, género, artículos |
| `prep` | Prepositions | Preposiciones |
| `syntax` | Clause structure & subordination | Sintaxis y subordinación |
| `discourse` | Connectors, register, flow | Discurso y conectores |
| `lex` | Vocabulary & collocation | Léxico y colocación |
| `prof` | Professional performance | Desempeño profesional |

### Topics to seed

Every topic below gets a row. The agent should expand each level's list to full
coverage using the three Read2Speak books as the authority (A1–A2 Foundations,
B1–B2 Breakthrough, C1–C2 Mastery, 15 units), but these are the mandatory spine.

**A1** — `noun`: gender basics, plurals, definite/indefinite articles ·
`verb`: presente regular -ar/-er/-ir, ser vs estar, hay, tener/ir/hacer irregulars,
gustar-type verbs, ir a + infinitivo · `pron`: subject pronouns, reflexives basic ·
`prep`: a/de/en/con basics · `lex`: numbers, time, daily routine

**A2** — `verb`: pretérito indefinido regular + core irregulars, imperfecto,
presente progresivo, futuro simple, condicional simple, imperativo afirmativo/negativo ·
`pron`: direct object, indirect object, se lo/se la · `noun`: possessives,
demonstratives, comparatives (más/menos/tan/tanto...que/como) · `prep`: por vs para
(introduction) · `discourse`: y/pero/porque/entonces

**B1** — `verb`: **pretérito vs imperfecto** (foreground/background narration),
**presente perfecto** (haber + participio), **pluscuamperfecto** (había hablado),
haber's two jobs (hay/hubo vs he/ha/han) · `mood`: presente de subjuntivo — form
and the WEIRDO triggers, cuando + subjuntivo, ojalá/quizás · `pron`: **se
constructions** (reflexive, reciprocal, impersonal se, passive se, accidental
se — *se me cayó*), leísmo/loísmo · `syntax`: **relative pronouns — que, quien,
el que/la que, lo que, cuyo, donde**, restrictive vs non-restrictive commas ·
`prep`: por vs para full system, verbs with fixed prepositions ·
`discourse`: **connectors tier 1** (sin embargo, por lo tanto, dado que, además,
en cuanto a, de hecho) · `prof`: status updates, reporting progress, site
instructions

**B2** — `mood`: **imperfecto de subjuntivo** (-ara/-iera, both forms), **si +
subjuntivo imperfecto + condicional** (hypothetical conditionals), **perfecto de
subjuntivo** (haya hablado), **pluscuamperfecto de subjuntivo** (hubiera hablado),
si + pluscuamperfecto de subj. + condicional compuesto (counterfactual past),
subjunctive in relative clauses (*busco a alguien que sepa*), subjunctive after
concessives (aunque) · `verb`: futuro perfecto, condicional compuesto, futuro of
probability, **the -remos vs -ríamos vs -áramos collision** · `syntax`: **estilo
indirecto / reported speech** with full tense backshift, sequence of tenses,
passive with ser vs passive se, nominalization · `pron`: full clitic combination
and placement, redundant clitics · `discourse`: **connectors tier 2** (no obstante,
en gran medida, de todas formas, lo cual, tal y como, a raíz de, siempre y cuando),
diplomatic hedging, softening disagreement · `lex`: false friends, delexical verbs
(dar/hacer/tener/poner/echar), work collocations · `prof`: client presentations,
tender language, negotiation, defending a position, chairing a meeting

**C1** — `mood`: subjunctive as a communicative *choice* not a rule ·
`syntax`: elegant subordination, ellipsis, cleft sentences, fronting for emphasis ·
`discourse`: register spectrum (5 levels), backchanneling, repair, topic management,
irony and implicit meaning · `lex`: collocational precision, near-synonym selection,
binomials, hedging calibration · `prof`: argumentation and debate, projecting
authority, handling interruption

**C2** — `discourse`: stylistic flexibility, narrative style, rhetorical devices ·
`lex`: abstract and nominalized discourse, idiom, regional variation ·
`prof`: full real-world integration, bureaucratic and legal register

### Prerequisite chains (mandatory — these drive the timeline)

```
b1.verb.preterito ──┬──> b1.verb.pluscuamperfecto ──> b2.mood.subj_pluscuamperfecto
b1.verb.imperfecto ─┘                                        ▲
b1.verb.presente_perfecto ──> b2.mood.subj_perfecto ─────────┤
b1.mood.subj_presente ──> b2.mood.subj_imperfecto ───────────┴──> b2.mood.si_counterfactual
                                    │
                                    └──> b2.mood.si_hipotetico
b1.pron.od_oi ──> b1.pron.se_constructions ──> b2.pron.clitic_combos
b1.syntax.relativos ──> b2.mood.subj_relativas ──> c1.syntax.subordinacion
b1.verb.preterito + b1.verb.pluscuamperfecto ──> b2.syntax.estilo_indirecto
b1.discourse.conectores_1 ──> b2.discourse.conectores_2 ──> b2.prof.diplomatic
```

The named gaps from your request map as: **imperfecto de subjuntivo → perfecto de
subjuntivo → pluscuamperfecto de subjuntivo** must come after presente de
subjuntivo and after the corresponding indicative compound tenses. **Se
constructions** and **relative pronouns** are B1 and currently unblocked — they can
start immediately. **Connectors** run as a parallel track, not a gated one.

---

## SECTION 4 — MASTERY STATE MACHINE

### Topics

```
locked        → all hard prereqs mastered            → available
available     → first attempt logged                 → studying
studying      → accuracy ≥ 0.80 over ≥ 12 attempts   → consolidating
consolidating → 2 clean spaced reviews (+3d, +10d)
                AND ≥ 1 spontaneous correct use in a
                transcript or freewrite               → mastered
mastered      → any drill failure OR transcript error → studying (logged as regression)
```

### Errors

```
active        → clean_streak ≥ 5                     → improving
improving     → clean_streak ≥ 12 AND spontaneous_ok ≥ 2 → consolidating
consolidating → 21 days with zero occurrences        → resolved
any           → new occurrence                       → resets clean_streak to 0;
                                                        resolved → regressed → active
```

**This is the rule that matters:** *cuando* + subjunctive was only marked resolved
because it appeared correctly in spontaneous speech *and* the rule was explained
unprompted. That is the standard. Getting it right in a drill immediately after
being taught it proves nothing.

### Warm-up selection algorithm

Every session opens with 6–10 warm-up items chosen by weight:

```
weight = severity × log(1 + occurrences) × recency_decay(last_occurred) × status_multiplier

status_multiplier: active 1.0 | regressed 1.4 | improving 0.6 | consolidating 0.3
recency_decay: 1.0 if <7d, 0.7 if <21d, 0.4 if <60d, 0.15 otherwise
```

Guarantee at least 2 items from the top-3 highest-severity active errors every
single session, regardless of the topic being studied.

---

## SECTION 5 — THE GAUNTLET LOOP

### Purpose

The failure mode of AI language tutors is confidently wrong grammar. The gauntlet
exists to make wrong content statistically unlikely to reach the user, and to make
every piece of content that *does* reach the user carry an audit trail.

### Architecture

```
GENERATOR ──> VERIFIER PANEL (3 independent, parallel) ──> ARBITER
     ▲                                                        │
     └──────────────── REVISER (with critiques) <─────────────┘
                        max 3 rounds, then quarantine
```

All calls use `claude-sonnet-4-6`. Each verifier is a *separate* API call with its
own system prompt and no sight of the others' output — independence is the whole
point. Do not ask one model to "check all five criteria," it will rubber-stamp.

### Verifier 1 — LINGUISTIC CORRECTNESS

```
You are a Spanish linguistics examiner. You will be shown a piece of Spanish
learning content. Your ONLY job is to find errors in the Spanish itself and in
any grammatical claims made about it.

Check, in this order:
1. Is every Spanish sentence grammatical? Quote and correct any that is not.
2. Is every conjugated form actually the form it is labelled as? Verify morphology
   character by character. (-remos vs -ríamos vs -áramos are commonly confused.)
3. Is every grammatical explanation TRUE? Not simplified — true. Flag any
   explanation that is technically false even if pedagogically convenient.
4. Are the stated exceptions real, and are any major exceptions omitted?
5. Is the answer key correct for every item?

You must assume the content is wrong until you have verified each claim. Reviewers
who find nothing are not being thorough. If genuinely nothing is wrong, say so
explicitly and state what you checked.

Output JSON only:
{"pass": bool, "score": 0-10, "issues": [{"severity":"critical|major|minor",
"quote":"...", "problem":"...", "fix":"..."}]}
Any critical issue forces pass=false.
```

### Verifier 2 — REGIONAL REGISTER

```
You are a Peruvian Spanish editor preparing material for a professional adult
learner in Lima who works in infrastructure consulting across Latin America.

Flag anything that is:
- Peninsular rather than Latin American (vosotros, os, coger in the wrong sense,
  ordenador, móvil, vale, tío, chungo, molar, "haber + participio" used where
  Latin America prefers the simple preterite)
- Regionally marked to a country other than Peru/Ecuador/Bolivia/Colombia/Mexico
  in a way that would sound foreign in Lima (vos forms, che, pibe, platicar, chido,
  guagua in the wrong sense)
- Wrong register for the context: too colloquial for a client meeting, or stiff
  and bookish where natural speech is wanted
- Textbook Spanish that no working professional actually says

Output JSON only:
{"pass": bool, "score": 0-10, "issues":[{"quote":"...", "problem":"...",
"fix":"...", "why":"..."}]}
```

### Verifier 3 — PEDAGOGICAL FITNESS

```
You are a CEFR assessment specialist reviewing a drill for a learner at
{{level}} working toward B2 certification.

Check:
1. DIFFICULTY MATCH — does this actually sit at {{level}}? Too easy wastes the
   session; too hard produces guessing, not learning.
2. TARGET ISOLATION — does the item test {{target_structure}}, or can the learner
   get it right/wrong for an unrelated reason? A cloze that also requires unknown
   vocabulary is a broken cloze.
3. DISCRIMINATION — would a learner who has NOT mastered {{target_structure}}
   plausibly get this wrong? If the correct answer is guessable from context or
   English, the item is worthless.
4. DOMAIN FIT — the learner is a construction/infrastructure consultant. Every
   example must sit in that world: site work, tenders, budgets, contractors,
   client meetings, delays, approvals, multi-country coordination. Reject
   generic textbook contexts (going to the beach, ordering coffee, my family).
5. EXPLANATION DEPTH — this learner has explicitly rejected abbreviated
   explanations. Does the explanation give the underlying rule and the WHY, not
   just the surface pattern?

Output JSON only:
{"pass": bool, "score": 0-10, "issues":[{"criterion":"...", "problem":"...",
"fix":"..."}]}
```

### Arbiter

```
Given three independent verifier reports, decide:
- ACCEPT if all three pass AND mean score ≥ 8.0 AND no critical issues
- REVISE if any fail or mean < 8.0, and rounds_used < 3 — emit a consolidated,
  deduplicated, prioritized critique for the reviser
- QUARANTINE if rounds_used = 3 and still failing — write to the quarantine table
  with full history, never show to the user, surface in an admin view

Verifier 1 has veto power. Content with a critical linguistic issue can never be
accepted regardless of the other two scores.
```

### Cost control (important — this is where naive implementations get expensive)

- One gauntlet run ≈ 5 API calls. **Generate in batches of 10 items per call** and
  verify the batch as a unit; per-item verification is 10× the cost for no gain.
- **Cache forever.** Verified content is permanent. Only regenerate when a drill is
  retired for over-familiarity (seen 6+ times with 100% accuracy).
- **Pre-generate overnight.** A background job fills the content pool for the next
  3 recommended topics while you sleep. Sessions should never wait on generation.
- **Skip the gauntlet for grading**, which is a live single call with a strict
  rubric — but log every grading disagreement (user disputes the mark) for review.

---

## SECTION 6 — TRANSCRIPT INGESTION

**Pipeline:** paste or upload (txt/pdf/docx) → extract → segment into learner
utterances only (Lorena's speech is context, not evidence) → analysis call →
gauntlet verification of the analysis → write to `transcript_finding` as
**pending** → review UI.

**Analysis prompt must produce, per finding:** exact quote, correction, thorough
explanation, proposed error code (matched against existing codes first), confidence
0–1, and a flag for whether it looks systematic or like a one-off slip.

**It must ALSO produce positive findings** — structures used *correctly and
unprompted*. These are what move errors from consolidating to resolved and topics
from consolidating to mastered. Most implementations forget this half and it is the
half that lets you ever finish anything.

**Review UI:** a card stack. Each finding gets four buttons — Accept (log it),
One-off (log the event, don't create/escalate the error), Reject (analysis is
wrong), Merge (into an existing error code). Nothing auto-applies. Keyboard driven:
A / O / R / M, so 40 findings take three minutes.

**Output of a transcript review:** an updated error log, a recomputed
recommendation, and a "what to raise with Lorena next class" list — the 3 things
the app cannot fix alone because they need live spoken correction.

---

## SECTION 7 — SESSION HANDOFF

Written at session end to `./handoffs/YYYY-MM-DD-HHMM.json`, mirrored as markdown,
and shown on screen with a Copy button. Read automatically at next session start.

```json
{
  "version": 2,
  "session_id": 47,
  "ended_at": "2026-08-05T21:40:00-05:00",
  "duration_min": 34,
  "level_estimate": { "production": "B1+", "comprehension": "B2", "delta": "+0.1 since 2026-07-16" },
  "worked_on": [
    { "topic_id": "b2.mood.subj_imperfecto", "accuracy": 0.72, "attempts": 18, "status": "studying" }
  ],
  "errors_committed": [
    { "code": "verb.futuro_vs_condicional", "count": 3, "evidence": ["preferiríamos el hormigón"] }
  ],
  "errors_avoided": [
    { "code": "prep.despues_de", "clean_streak": 9, "status": "improving" }
  ],
  "vocab_promoted": ["a raíz de", "siempre y cuando"],
  "xp": 340,
  "streak": 11,
  "next_recommendation": {
    "primary": "b2.mood.subj_imperfecto",
    "why": "72% accuracy, below the 80% consolidation gate; -ríamos intrusion in 3 of 18 items",
    "then": ["b2.mood.si_hipotetico", "b1.verb.presente_perfecto"],
    "why_that_order": "si-conditionals are the payoff structure for imperfect subjunctive and lock it in through use; presente perfecto is an unblocked B1 gap that is a hard prereq for perfecto de subjuntivo"
  },
  "for_lorena": [
    "Ask her to push me into si-clauses in speech — I can write them but I default to indicative when speaking"
  ],
  "resume_prompt": "Continue my Spanish fluency training. Review my latest transcript and continue from my error log."
}
```

---

## SECTION 8 — GAMIFICATION & THE TIMELINE

### What actually makes this compulsive (and what doesn't)

Duolingo's loop works on streak anxiety and variable reward. That works on a
15-year-old with no goal. For an adult with a certification date, the addictive
mechanic is **visible convergence on a target**. Build for that.

**The Timeline — the centrepiece screen.** A horizontal track from today to the
December exam date. On it:

- Six level bands (A1→C2) as background zones, with a marker showing where the
  system currently estimates you sit — split into a production marker and a
  comprehension marker, because they differ and seeing them converge is motivating.
- Topic nodes plotted at their projected mastery date, computed from current
  velocity (topics mastered per week) and the prerequisite graph.
- A projection line: "at your current pace you reach B2 threshold on 14 Nov —
  17 days before your exam." This number moving is the single most motivating
  thing in the app. Recompute it after every session and animate the change.
- Error markers that visibly *fall off* the timeline as they resolve. Watching
  "la tema" disappear after eight weeks is the reward.

**Other mechanics, in priority order:**

1. **Streak with 2 freezes/month.** Non-negotiable minimum: 1 warm-up = streak kept.
   Make the minimum genuinely small (3 minutes) so the streak never breaks for
   travel or a bad week. A broken streak is where these apps lose users.
2. **XP with meaningful weights** — 10 per correct drill, 25 for a first-time
   correct on an active error, 100 for an error reaching *consolidating*, 250 for
   *resolved*, 500 for a topic reaching *mastered*. Weight toward error extinction,
   not volume. Otherwise you'll farm easy drills.
3. **The Gauntlet Run** — a timed 10-item mixed-topic sprint drawn only from your
   active error list. Three lives. Leaderboard against your own past runs. This is
   the Phase-3 speed builder and it should feel like a game, not a test.
4. **Boss fights** — to move a topic from consolidating to mastered you must clear
   a 12-item unaided challenge with no hints and no retries. Failing sends the
   topic back to studying. Real stakes make mastery mean something.
5. **Achievements tied to your actual history** — "Greek Slayer" (Greek -ma gender
   resolved), "Después de nada" (30 days clean on bare *después*), "Cold Start"
   (open a roleplay in under 5 seconds), "Tender Ready" (clear all B2 `prof` topics).
6. **Daily quest**: 1 warm-up + 1 new topic segment + 5 vocab reviews. Small,
   completable in 12 minutes on a bad day.

**Search.** Instant fuzzy search over topic name (en + es), search_terms aliases,
error labels, vocab terms, and grammatical forms — typing *hubiera* must land on
pluscuamperfecto de subjuntivo, typing *cuyo* on relative pronouns. Cmd-K, results
grouped by Topic / Error / Vocab, each with its current mastery state and a
"drill this now" action.

---

## SECTION 9 — BUILD ORDER

**Phase 1 — The spine (build first, ship before anything else).**
SQLite + migrations + full topic taxonomy seeded + prerequisite graph + error table
seeded with §10 data + mastery state machines with tests + Cmd-K search + the
topic detail page. No AI yet — content can be stubbed. At the end of Phase 1 you
should be able to browse every topic, see its state, and search. *This is the
foundation everything reads from; getting the schema wrong here is the expensive
mistake.*

**Phase 2 — Practice loop.** Gauntlet loop implemented and tested + content
generation and caching + drill runner UI + live grading + attempt logging + warm-up
selection algorithm + session handoff read/write. At the end of Phase 2 the app is
genuinely usable and could replace your homework.

**Phase 3 — Transcript engine.** Upload/paste, analysis, gauntlet verification of
analysis, pending-findings review UI, positive-finding detection, "for Lorena"
output. This is what makes it *yours* rather than a generic app.

**Phase 4 — Timeline & game layer.** The timeline screen, projection maths, XP,
streaks, boss fights, gauntlet runs, achievements.

**Phase 5 — Deferred until after the B2 exam.** Speech (TTS with es-PE/es-MX voice
at rate 0.83, STT for spoken drills), roleplay engine with cold-start timing, mobile
build, C1–C2 content generation at depth.

**Ruthless scope note:** Phases 1–3 are what move your exam result. Phase 4 is what
keeps you opening the app. Phase 5 is what makes it feel finished. If time runs
short before December, Phase 5 is what gets cut — not Phase 3.

---

## SECTION 10 — SEED DATA (error log as of Aug 2026)

Priority order. Severity 1–5.

| code | wrong | right | severity | note |
|---|---|---|---|---|
| `noun.gender_agreement` | un nuevo demostración, muchas choques, un fusión | una nueva demostración, muchos choques, una fusión | 4 | highest by volume |
| `noun.greek_ma` | la tema, una problema, la idioma | el tema, un problema, el idioma | 4 | -ma/-ema Greek nouns are masculine |
| `verb.preterito_persona` | hablé (for él) | habló | 5 | yo/él collision, changes meaning |
| `mood.subj_leak_past` | compremos, fueran (in narration) | compramos, fueron | 4 | subjunctive intruding into past indicative |
| `verb.participio_adj` | muy avanzó | muy avanzado | 3 | 6+ instances |
| `prep.despues_de` | después la reunión | después de la reunión | 3 | 10+/week |
| `pron.reflexive_dropped` | voy a relajar | voy a relajarme | 3 | |
| `lex.una_otra_vez` | una otra vez | otra vez | 2 | never un/una before otro/otra |
| `verb.hace_ago` | (omitted) | hace tres semanas | 3 | |
| `verb.futuro_vs_condicional` | preferiríamos (meaning will prefer) | preferiremos | 4 | -remos vs -ríamos collision |
| `mood.subj_imperfecto_missing` | preferirá (in si-clause) | prefiriera | 5 | tense not yet acquired |
| `pron.body_part_article` | lava tus manos, me duele mi cabeza | lávate las manos, me duele la cabeza | 3 | |
| `pron.doler_le` | se duele la rodilla | le duele la rodilla | 3 | gustar-type verb |
| `pron.se_vs_se_accent` | no sé lo digas | no se lo digas | 3 | |
| `verb.infinitive_after_prep` | para regresaré | para regresar | 3 | |
| `pron.personal_a` | ¿conoces Capo? | ¿conoces a Capo? | 2 | |
| `verb.perfecto_gerundio` | he hablando | he hablado | 4 | participle not gerund |
| `pron.io_redundant` | no digas a mi esposo | no le digas a mi esposo | 3 | |
| `prep.buscar_para` | buscar para ingredientes | buscar ingredientes | 3 | anglicism |

**Note on por/para:** the rule is understood (por = exchange/duration/cause,
para = purpose/direction/deadline). This does NOT need a taught lesson — only
occasional warm-up reinforcement for conversational slips. Do not schedule it as a
topic.

**Resolved — seed as `resolved` for the timeline's "cleared" track:** missing *que*
before subjunctive · *en punto* vs *a tiempo* · dropped object pronoun *me* ·
command pronoun placement · irregular & reflexive commands · **cuando + subjuntivo**
(the model case: correct spontaneous production *and* unprompted rule explanation) ·
*más de* + number.

---

## SECTION 11 — CLAUDE.md (create this in the repo root)

```markdown
# Fluencia

Read SPEC.md before any task. Key invariants:

- Never write learning state anywhere but SQLite.
- Never show the user content that hasn't passed the gauntlet (SPEC.md §5).
- Never auto-apply a transcript finding. Findings are proposed; the user confirms.
- Never mark an error resolved without spontaneous evidence (SPEC.md §4).
- Every Spanish example lives in construction/infrastructure consulting context.
- Neutral Latin American Spanish. No vosotros, ever.
- Explanations are thorough. The user has explicitly rejected abbreviated grammar
  explanations. Give the rule, the why, and the exceptions.

Run `npm test` before declaring any task complete.
```
