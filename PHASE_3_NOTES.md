# Phase 3 — Transcript ingestion, and visuals

Status: both running. `npm test` → 215 passing. `npm run build` → clean.

Two things you asked for:

1. **An upload box for class transcripts** that says what to work on, what you
   got wrong, how to fix it, and what went well.
2. **Visuals in the modules**, so the curriculum is not 92 identical grey rows.

---

## 1. Transcripts

`/transcripts` — paste a transcript or drop in a `.txt` / `.md` / `.vtt`. Then:

**It asks who you are.** SPEC §6: *"segment into learner utterances only —
Lorena's speech is context, not evidence."* This is the step that matters most
and it is not a nicety. If the teacher's turns were analysed as yours, her
*corrections* would be logged as your errors, and her correct Spanish would
resolve errors you never fixed. The app shows the speakers it found, guesses the
quieter one is you (a language class is mostly the teacher talking), and waits.
If it cannot tell, it analyses nothing rather than analysing everything.

**It proposes findings, and nothing else.** CLAUDE.md: *"Never auto-apply a
transcript finding."* Ingest writes to `transcript` and `transcript_finding`
only — a test asserts that the whole `error` table is byte-identical before and
after an upload, and that `error_event` is still empty.

**You review them with the keyboard.** A / O / R, per §6, one card at a time:

- **Accept** — real. Logs a `committed` event and advances the error machine.
- **One-off** — it happened, but it was a slip. Logs the event so the history has
  no holes, and leaves the error state alone. This is the button that stops a bad
  day from poisoning the log.
- **Reject** — the analysis is wrong. Leaves no trace at all.

**It finds what went right too.** §6 calls this *"the half that lets you ever
finish anything"*, and it is correct: §4 will not mark an error resolved or a
topic mastered without spontaneous evidence, so without positive findings the app
can start things and never finish them. Accepting a positive logs
`spontaneous_ok`, which is exactly the evidence the gates require. In the test
run, one accepted «si tuviéramos más plazo» took `b2.mood.subj_imperfecto` from
0 to 1 spontaneous uses.

**And it gives you the three things to raise with Lorena.** Also §6. The
selection criterion is not "worst errors" — it is errors whose evidence is
written-only. An error you avoid in drills but commit in speech needs live
spoken correction, and that is the one thing a text app cannot provide.

### The analysis is rules, not the model

§6's pipeline ends in a model analysis verified by the §5 gauntlet. That needs an
`ANTHROPIC_API_KEY`, and there is not one. So `src/domain/detectors.ts` does the
job deterministically for the subset of your errors that are mechanically
detectable — 11 error rules and 5 positive rules, each carrying a real confidence
well under 1, each landing as `pending`.

On a 70-word sample it found 5 errors and 2 positives, and reported nothing on
clean Spanish. What it **cannot** do is catch anything that needs judgement:
register, naturalness, a wrong-but-grammatical tense choice, a novel error with
no rule written for it. The page says so in the header (*"rule-based analysis,
not the §5 gauntlet"*) and every finding is stored with
`provenance = 'rules'`, so the model can re-analyse and the two never get
confused.

### Deviations from SPEC §6 / §2

| # | Change | Why |
|---|---|---|
| 1 | `transcript_finding.kind` (`error` \| `positive`) | §6 demands positive findings, and a positive has no correction. They cannot share a row shape that assumes one |
| 2 | `transcript_finding.systematic` | §6 asks the analysis to flag systematic vs one-off. That flag is what the One-off button is deciding about |
| 3 | `transcript_finding.topic_id` | A positive finding is evidence about a topic, not about an error code |
| 4 | `provenance`, `decided_at`, `offset_start/end` | So a finding can say where it came from, when it was decided, and where in the text it sits |
| 5 | `transcript.learner_text`, `title`, `reviewed_at` | The segmented learner-only text is stored rather than recomputed, so findings' offsets stay valid if segmentation later changes |
| 6 | **Merge (§6's fourth button) is not built** | It needs a picker over the whole error log, and the rules analyser only ever proposes codes that already exist — so there is nothing to merge into yet. It becomes necessary the moment the model can propose novel errors |

---

## 2. Visuals

**Strand identity.** Each of §3's nine strands gets a drawn glyph and a colour —
verb is an arrow of time, mood is a fork, prep is a bridge, prof is a building.
They appear on the curriculum list, the home page, the topic header and the drill
runner. The point is not decoration: 92 identically-styled rows are unreadable,
and colour-coding by strand makes "three verb topics open and no pronoun ones" a
fact you can see rather than count.

**Six teaching diagrams**, in `src/components/diagrams/`:

| Diagram | Shows |
|---|---|
| Tense timeline | The preterite as a point, the imperfect as a stretch, the pluperfect as a point before a point |
| Mood switch | What licenses the subjunctive, and that with no trigger the verb is indicative |
| Si-frame | The fixed si + imperfect subjunctive → conditional shape, and that «si tendríamos» is impossible |
| Agreement chain | Gender propagating outward from the noun to every modifier |
| Clitic slots | Three legal pronoun positions and the one illegal one |
| Prep bridge | Same subject takes an infinitive; different subject takes «que» and the subjunctive |

They are mapped to topics explicitly with a strand-level fallback, so a topic
without its own diagram gets its family's rather than nothing — a wrong diagram
is worse than no diagram. On the topic page the diagram sits above the fold. In
the drill runner it appears **only when the answer was wrong**: getting it right
means the shape is already there.

**Why drawn, not photographed.** Three reasons, in order of weight. A picture of
a hard hat teaches nothing about the imperfect subjunctive, whereas a picture of
where the subjunctive sits relative to its trigger teaches the thing the
paragraph is trying to say. Stock photography carries licensing obligations this
app has no way to honour. And there is no network available to the page, so every
asset would have to be embedded anyway. Inline SVG also inherits the page colours,
so there is no separate dark-mode asset to maintain.

---

## Defects the tests caught

1. **The speaker-label regex shredded ordinary prose.** «Revisamos tres puntos:
   el plazo, el costo…» parsed as a speaker named "Revisamos tres puntos".
   Spanish uses colons mid-sentence constantly. Fixed with a frequency pass: a
   label is real if it recurs at line-start, or if it is one or two words.
2. **The doler rule flagged correct Spanish.** It matched `(me|te|se|nos)
   duele`, but only «se duele» is wrong — «me duele la espalda» is the correct
   form. Reporting correct Spanish as an error is the one failure that would make
   the review UI useless, so this was the worst bug in the batch.
3. **A positive-finding explanation was under 300 characters**, failing §11's
   depth requirement.

And two found by eye in the browser, not by the suite: two SVG labels overflowed
their canvas, and the agreement diagram's arcs collided with the error line
underneath.

---

## Uncertain — worth your input

**1. The detectors cover 11 of your 19 active errors.** The rest need judgement
rather than pattern-matching — subjunctive leak in the general case, redundant
object pronouns, participle-versus-finite confusion. Those are model work.

**2. `.docx` and `.pdf` upload are not wired.** §6 lists them; the box takes
plain text formats only. PDF extraction is a real dependency and I did not want
to add one for a format you may never use. If your class transcripts arrive as
Word documents, say so and it is a small job.

**3. Diagrams cover 5 strands of 9.** Discourse, lexis, syntax and the
professional strand have no diagram — partly because they are less diagrammable,
partly because I stopped at the ones that map onto your actual error log.
