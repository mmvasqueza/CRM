# Progress — ci-sello (evidence)

| AC | Evidence | Result | When |
|----|----------|--------|------|
| AC1 | First CI run on the PR | _pending — repo push after review_ | — |
| AC2 | Throw-away PR with a secret-shaped token | _pending — after first green run_ | — |
| AC3 | `rsc spec gate` on `ci-sello.md` copy with "The cheapest alternative" removed | `FAIL broken.md — missing section(s): cheapest`, exit 1 | 2026-11-23 |
| AC4 | `git push -u origin main` with this tier-2 change unreviewed | Refused: "sello: this change is risk tier 2 and has no review" | 2026-11-23 |
| AC5 | `rsc risk <path>` | tier 2: `src/app/api/leads/route.ts`, `src/middleware.ts`, `src/proxy.ts`, `vercel.json`, `next.config.ts`, `supabase/migrations/0001_init.sql`, `supabase/config.toml`, `src/lib/supabase/admin.ts`, `src/features/auth/actions.ts` · tier 1: `src/features/leads/list.tsx` · tier 0: `README.md` | 2026-11-23 |

**Fail-loud steps, run locally from the parsed workflow against fixture folders (2026-11-23):**
- App preconditions: no `packageManager` → exit 1 · no lockfile → 1 · no Playwright config → 1 · no `supabase/config.toml` → 1 · all present → 0.
- Coverage assert: pct `"Unknown"` → 1 · `null` → 1 · `79.9` → 1 · `80` → 0 · `95` → 0 · no summary → 1.
- RLS guard: no `supabase/tests/*.sql` → 1 · one present → 0. (It proves tests exist, not that they are meaningful — that is the reviewer's job per REVIEW.md.)
- Near-miss paths stay tier 1: `src/lib/supabase-x.ts`, `next.config.json`, `src/features/leads/list.tsx`. Now tier 2: root `middleware.ts`, `src/middleware.js`, `src/utils/supabase/admin.ts`, `src/lib/supabase.ts`, `src/lib/supabase/client.ts` (whole client folder on purpose).

Other checks: workflow YAML parses (js-yaml 4.1.0); job `if`/`needs` graph verified; `sello-config.json` valid JSON and accepted by `rsc risk`.

## Review
- Round 1 — 3 refuters (correctness, security, tests): 12 reported → 11 unique → 0 blockers, 5 should-fix (all fixed), 4 questions (2 fixed, 2 answered by fixes), 3 nits (1 fixed, 1 deferred: SHA pinning, 1 accepted: author email in a private repo).
- Round 2 — same 3 lenses on the divergence only: 7 reported → 5 unique → 0 blockers, 1 should-fix (coverage passed on non-numeric pct — fixed), 4 questions (path-pattern reach — fixed; whole Supabase client folder tier 2 — intentional; RLS stub tests — accepted, reviewer's job; missing negative runs — added above). Ledger advisory "AC1 evidence gap" was an author tagging error: those findings belong to P7/P16, not AC1.
