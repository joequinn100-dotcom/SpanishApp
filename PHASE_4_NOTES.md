# Phase 4 — Timeline and the game layer

Status: complete. `npm test` → 321 passing. `npm run build` → clean.

This is the last section of the spec that can be built without an API key, which
makes it the end of **Revision 1**. What is deliberately still missing is listed
at the bottom, and all of it is blocked on the same thing.

---

## The Timeline (`/timeline`)

§8 calls this the centrepiece and names the one number that matters: *at your
current pace you reach B2 threshold on 14 Nov — 17 days before your exam.* That
sentence is now the page's H1, computed from real evidence.

**Velocity** is topics mastered per week over a trailing 28 days, not a lifetime
average — the same reasoning §2 gives for rolling accuracy. A burst three months
ago says nothing about this week.

**Placement is excluded from the velocity sample.** Declaring that you already
knew A1 tells the app where you start, not how fast you learn; counting it would
produce a euphoric projection on day one and a collapsing one in week two.

**The projection refuses to exist when it cannot be honest.** Two cases return
no date and an explanation instead:

- nothing mastered in the window — the pace is *unknown*, not zero, and
  projecting "never" from silence is a fabricated number;
- a pace so slow the answer lands past a two-year horizon, where the arithmetic
  is fine and the answer is meaningless.

**The B2 threshold** is every scheduled topic at B2 and below. C1 and C2 are
past the exam, and including them would make the headline permanently red.

Alongside it: level bands with a production marker, topic nodes at their
projected dates, and the error markers §8 asks for — each with a progress bar
where a clean streak is **capped at half**, because §4 does not accept a streak
alone and a bar that implied otherwise would be exactly the false comfort §4 is
written to prevent.

---

## The game layer

**Daily quest** (`/`, above the fold). 1 warm-up + 1 new item + 5 vocab reviews.
§8: "completable in 12 minutes on a bad day". The bar is small on purpose — a
quest needing a full session is the one that breaks the streak.

**Streak with two freezes a month.** A freeze is spent *silently* to bridge a
missed day. §8's argument is that a broken streak is where these apps lose
users, and a freeze you have to remember to activate is one that never gets used
on the day it was needed. Freezes replenish on a calendar-month boundary.

**Achievements** (`/achievements`). Ten, every one a claim about evidence in the
database: Greek Slayer (the -ma gender error resolved), Después de nada, Si
tuviera, Tender Ready (all B2 professional topics), Past Master, Ten Down, In My
Own Words (20 words used unprompted), Evidence Based, Fortnight, A Thousand
Answers. A test asserts an empty history earns exactly zero — §8's failure mode
is participation badges, and opening the app must earn none of them.

---

## Deviations from SPEC §8

| # | Decision | Why |
|---|---|---|
| 1 | No comprehension marker | §8 wants production *and* comprehension markers converging. Nothing in the app measures comprehension — every signal is production. A second marker would be decoration drawn from the first, so there is one, labelled `production` |
| 2 | Boss fights are the spaced review | §8 wants a 12-item unaided challenge to move consolidating → mastered. §4 wants two clean spaced reviews at +3d and +10d. These conflict; §4 governs mastery, so the review block implements it — unaided, no hints, clean-or-restart. The stakes §8 asks for are there; the framing is §4's |
| 3 | The Gauntlet Run is not built | §8's timed 10-item sprint is a Phase-3 *speed* builder, and speed is meaningless while accuracy on most topics is unmeasured — 7 of 92 topics have drills. It becomes worth building the day generation lands |
| 4 | Level bands are equal-width | Real CEFR bands are not equal in hours. Weighting them would need hour estimates the app does not have, and inventing them would put a false precision under the one number that matters |

---

## Defects found while building

1. **The whole app scrolled sideways on a phone.** Seven nav links plus a search
   button overflowed the header on every route. The bar now wraps and the
   palette collapses to an icon under `lg`.
2. **Six responsive grids had no base column template.** `grid md:grid-cols-2`
   with no `grid-cols-1` leaves an implicit auto-sized column that long content
   pushes wider than the screen. Fixed across every page.
3. **Timeline nodes collapsed into an unreadable smear.** At five topics a week,
   twelve nodes land inside three weeks. `spread()` nudges them apart — the
   position is a week-precision estimate either way, so the nudge costs nothing
   real.

---

## Revision 1 — what is in it

- **Phase 1** — schema, 92 topics, prerequisite graph, 26 errors, mastery state
  machines, search, topic pages.
- **Phase 2** — drill runner, live grading, attempt logging, warm-up selection,
  spaced reviews, session handoff, 73 authored drills.
- **Phase 3** — transcript upload, learner segmentation, rule-based analysis,
  keyboard review, positive findings, "for Lorena".
- **Phase 4** — timeline and projection, daily quest, streak with freezes,
  achievements, XP.
- **Plus**: vocabulary SRS with the top stage withheld, home-page search,
  teaching diagrams, strand identity.

## What Revision 2 needs an API key for

Everything below is blocked on `ANTHROPIC_API_KEY` in a gitignored `.env.local`,
and nothing below can be faked:

1. **The §5 gauntlet.** The 73 authored drills carry `provenance = 'authored'`
   precisely so they can be re-verified the day a key exists.
2. **Content generation.** 7 of 92 topics have drills. This is the single
   biggest limit on the app's usefulness, and generation is the only fix.
3. **Model transcript analysis.** The rules catch 11 of 19 active errors and
   nothing that needs judgement — register, naturalness, a wrong-but-grammatical
   tense choice.
4. **Model-graded free response**, which exact-match cannot do for translation.

Phase 5 (speech, roleplay, mobile build, C1–C2 depth) remains deferred until
after the exam, per §9's own scope note.
