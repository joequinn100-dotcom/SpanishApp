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

## Source books

Three books, fifteen units each, forty-five in total: Foundations (A1–A2),
Breakthrough (B1–B2), Mastery (C1–C2).

They are the curriculum authority — they decide which topics exist, in what
order, and which unit each belongs to. Every unit must have at least one topic
citing it; `seed.test.ts` enforces that, with one documented exemption
(Foundations U15 is a consolidation unit with no new grammar).

They are **not** a register authority. Foundations is Peninsular-flavoured (85
`vosotros` forms — it teaches `estáis` in a conjugation table — plus Castilian
/θ/ respellings such as `ambulancia` → "ahm-boo-LAHN-thyah", and
`ordenador`/`vale`/`coger`/`coche`). Never lift Spanish from them; rewrite every
example into neutral Latin American Spanish and into construction/consulting
context. `npm test` enforces this — see the register suite in
`src/seed/seed.test.ts`.

The PDFs are licensed to a single purchaser and carry embedded tracing
identifiers — every page footer is the buyer's own email address. They are
gitignored and must never be committed, and neither may text extracted from
them, which carries the same footer. Extract to a scratchpad outside the repo.
