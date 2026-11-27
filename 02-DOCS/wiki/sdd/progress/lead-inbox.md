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
Rows 1–14: decisions taken alone in autopilot, then reviewed by the owner on 2026-11-23 (all answered). Rows 15–17: raised later and answered directly by the owner.

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
| 17 | scope | Owner added WhatsApp + Telegram intake, keyword-built client profiles and a qualification question script | ✅ Separate specs after lead-inbox; WhatsApp first; a bot asks the questions, then hands to a person; specs written on `feat/lead-inbox-foundation`. lead-inbox gains AC31 (enquiry channel) in T006–T007 (2026-11-24) | owner sends the question list + keywords; write `chat-channels`, `client-profile`, `qualification-questions` specs |

## Evidence
_Filled per task during implement: test runs, coverage, E2E, review rounds._

| Task | Evidence | Review | Date |
| --- | --- | --- | --- |
| T001 ✅ | RED: `lint`/`typecheck` fail with no app. GREEN on 49acaea: `lint --max-warnings=0`, `format:check`, `typecheck`, `build` exit 0. Gates proven to fail on mutants (`any`, unused var, unformatted) in `src/`, `tests/` and a root `.mts`. | Tier 2 · 2 rounds · panel correctness+security+tests on 49acaea · 1 should-fix confirmed by finding-verifier and fixed · 0 blockers · L28, L31 parked → queue #15, #16 · owner approved push | 2026-11-23 |
| T002 ✅ | RED: `test:coverage` / `test:e2e` scripts missing. GREEN on 592f5a6: `test:coverage` 2 files, 3 tests, 100 % lines, writes `coverage/coverage-summary.json`; `test:e2e --list` 1 test; `test:e2e` passes (dev server locally; production build under `CI=1`, checked by reviewer). Gates proven to fail: untested file → 23 % lines, threshold error; wrong E2E assertion → exit 1. `.gitignore` build dirs anchored (queue #16). | Tier 1 · 1 round · refuter-tests · 0 findings (nit: CI `retries: 1` can hide flakiness — accepted) | 2026-11-24 |
| T003 ✅ | RED: `expected true to be false` / `expected 3600 to be 86400`. GREEN on de03616: 5 tests (incl. no stray `config.toml`, proven red with one present); `supabase start` (CLI 3.4.0) exit 0, 9 containers healthy; live `/auth/v1/settings` disable_signup=true, anonymous off; `POST /auth/v1/signup` → 422. Lighter stack (edge runtime + analytics off). Windows port reservation fixed on the machine (excluded range 54320–54329). | Tier 2 · 2 rounds · 3 lenses each · L43 intentional (CI db job red until T005, logged) · L44 fixed · L45–L47 intentional/irrelevant · L48 false (concurrent probe) | 2026-11-25 |
| T004 ✅ | RED: 3 files fail, modules missing. GREEN: `src/lib/env.test.ts`, `src/lib/supabase/clients.test.ts`, `admin-guard.test.ts` — 18 tests: missing/invalid var throws with the NAME only (value never echoed); a secret key in a `NEXT_PUBLIC_*` var is refused; admin client imports `server-only` (loading it outside the server throws). `lint`, `typecheck`, `format:check`, `build` exit 0; `test:coverage` 34 tests, 100 % lines/branches. Round-1/2 fixes: key prefix allow-lists (`sb_publishable_` / `sb_secret_`, so a legacy JWT never passes as the browser key), URL http(s) only, values trimmed, `server-only` on the session client too; both new guards proven red by mutants (trim removed, server.ts line 1 removed) and restored by hash. | Tier 2 · 3 rounds · 3 lenses each · L49, L51, L53, L55, L56, L58–L60 fixed · L50, L52, L57 intentional (checked when the first screen uses a client, T016/T019 + E2E) · L54, L61 irrelevant · round 3: 0 findings | 2026-11-25 |
| T005 ✅ | RED: `members` missing, every test errors. GREEN: `supabase db reset` applies `20261125120000_members.sql`; `supabase/tests/members.test.sql` 45/45 ok — active sales reads all members, deactivated member/admin and non-member read none, anon denied table and both helpers, a session without a user id is nobody, no direct writes for authenticated (admins included), last active admin cannot be demoted/deactivated/deleted (`LAST_ADMIN`; also one statement demoting every admin and the cascade from deleting every admin's sign-in account), TRUNCATE refused, `user_id` fixed, `role`/`active` never null, new tables, sequences and functions start closed to anon/authenticated. 13 mutants (default privileges ×3, email check, TRUNCATE trigger, `user_id` check and trigger column, NOT NULL ×2, anon helper grant, null-uid helper, no cascade, trigger without DELETE) all killed, each inside a rolled-back transaction (no file touched). `lint`, `typecheck`, `format:check`, `test:coverage` (34 tests) exit 0. | Tier 2 · 3 rounds · 3 lenses each · L62, L64, L65, L67–L69, L71, L74, L76–L82, L84 fixed · L63, L72 intentional (concurrency not provable single-session; advisory lock + READ COMMITTED documented) · L70 intentional (AC12) · L73 intentional (T022 uses `auth.users.last_sign_in_at`) · L75 intentional (secret key is server-only, T004) · L66 irrelevant (equivalent mutant) · L83 irrelevant (trigger functions cannot be called directly) | 2026-11-26 |
