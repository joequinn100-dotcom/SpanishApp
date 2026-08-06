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

The three Read2Speak books are the curriculum authority — they decide which
topics exist, in what order, and which unit each belongs to. They are **not** a
register authority: Foundations is Peninsular-flavoured (85 `vosotros` forms,
Castilian /θ/ pronunciation respellings, `ordenador`/`vale`/`coger`). Never lift
Spanish from them. `npm test` enforces this — see `src/seed/__tests__/register`.

The PDFs are licensed to a single purchaser and carry embedded tracing
identifiers. They are gitignored and must never be committed.
