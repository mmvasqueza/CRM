# Progress — lead-inbox (evidence)

> Spec: [lead-inbox](../specs/lead-inbox.md) · Branch: `feat/lead-inbox` · Mode: autopilot

## Phase log
| Phase | Result | When |
|-------|--------|------|
| specify | spec written, gate PASS | 2026-11-22 |
| clarify | 7 criteria added (24–30), 8 assumptions recorded, 0 blocking | 2026-11-23 |
| clarify (owner check) | Owner confirmed the 6 specify-time assumptions as recommended: alerts to all active members; statuses New/Contacted/Qualified/Disqualified; repeat enquiry merges into the open lead; 5 per 10 min and 5,000 chars; new leads unassigned, team claims; owner is first admin | 2026-11-23 |
| plan | [plan](../plans/lead-inbox.md) written; 11 build steps; 4 owner actions before launch | 2026-11-23 |
| tasks | 29 tasks (T001–T029) appended to the plan; all 30 criteria covered; 12 tier-2 tasks; delivery in 4 PRs | 2026-11-23 |
| sdd-init | `config.yaml` written (strict TDD; Vitest, Playwright, pgTAP; autopilot) | 2026-11-23 |
| analyze | GATE PASS — 4 medium found and resolved, 1 low resolved, 3 low accepted ([report](../analysis/lead-inbox.md)) | 2026-11-23 |

## Decision queue
Decisions taken alone in autopilot, then reviewed by the owner on 2026-11-23 (all 14 answered).

| # | Kind | Decision | Owner answer (2026-11-23) | Still to do |
|---|------|----------|---------------------------|-------------|
| 1 | review-after | Repeat enquiry keeps original contact fields; each message stores its own fields | ✅ Keep original | — |
| 2 | review-after | Search: partial, case-insensitive on name/email/company; 25 per page | ✅ Partial, 25/page | — |
| 3 | review-after | Sales claim but cannot release or hand on a lead; admins reassign | ✅ Only admins reassign | — |
| 4 | review-after | Last active admin cannot be demoted or deactivated (AC27) | ✅ Block it | — |
| 5 | review-after | Invitations expire after 24 h, re-sendable (AC28) | ✅ 24 hours | — |
| 6 | review-after | Failed alerts retry 24 h, then marked failed for admins (AC29) | ✅ 24 hours | — |
| 7 | review-after | Consent label wording + stored version (AC30) | ✅ Use the drafted wording; legal review optional later | draft wording in the website task |
| 8 | review-after | Budgets measured on preview with 1,000 test leads (AC16–17) | ✅ Preview, 1,000 test leads | — |
| 9 | review-after | Screen sketch of the lead list | ✅ Sketch first | owner approves a sketch before build step 7 |
| 10 | review-after | Constitution ratified provisionally in autopilot | ✅ Ratified as is (v1.0.0 final) | — |
| 11 | launch-blocker | Email provider for alerts | ✅ Resend | owner creates account + verifies sending domain (guided) |
| 12 | launch-blocker | Supabase plan (free pauses after ~7 idle days) | ✅ Free + daily keep-alive ping | owner creates project (guided); ping added to the plan |
| 13 | launch-blocker | CRM production URL | ✅ Free `*.vercel.app` address | set when the Vercel project is created |
| 14 | launch-blocker | Cloudflare Turnstile widget | ✅ Owner creates it with a click-by-click guide | at the website step |
| 15 | review-after | Security headers (CSP, frame-ancestors, Referrer-Policy, nosniff) — no task in the plan sets them (T001 review, ledger L28) | ✅ Add a task: T030 in PR C (2026-11-23) | build T030 |
| 16 | review-after | Prettier skips app code in nested `dist/`, `out/`, `coverage/` folders because `.gitignore` entries are unanchored (T001 review, ledger L31) | ✅ Fix in T002: anchor `/dist/`, `/out/`, `/coverage/` (2026-11-23) | in the T002 commit |

## Evidence
_Filled per task during implement: test runs, coverage, E2E, review rounds._

| Task | Evidence | Review | Date |
| --- | --- | --- | --- |
| T001 ✅ | RED: `lint`/`typecheck` fail with no app. GREEN on 49acaea: `lint --max-warnings=0`, `format:check`, `typecheck`, `build` exit 0. Gates proven to fail on mutants (`any`, unused var, unformatted) in `src/`, `tests/` and a root `.mts`. | Tier 2 · 2 rounds · panel correctness+security+tests on 49acaea · 1 should-fix confirmed by finding-verifier and fixed · 0 blockers · L28, L31 parked → queue #15, #16 · owner approved push | 2026-11-23 |
| T002 ✅ | RED: `test:coverage` / `test:e2e` scripts missing. GREEN on 592f5a6: `test:coverage` 2 files, 3 tests, 100 % lines, writes `coverage/coverage-summary.json`; `test:e2e --list` 1 test; `test:e2e` passes (dev server locally; production build under `CI=1`, checked by reviewer). Gates proven to fail: untested file → 23 % lines, threshold error; wrong E2E assertion → exit 1. `.gitignore` build dirs anchored (queue #16). | Tier 1 · 1 round · refuter-tests · 0 findings (nit: CI `retries: 1` can hide flakiness — accepted) | 2026-11-24 |
