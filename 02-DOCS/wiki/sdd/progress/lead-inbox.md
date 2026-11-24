# Progress — lead-inbox (evidence)

> Spec: [lead-inbox](../specs/lead-inbox.md) · Branch: `feat/lead-inbox` · Mode: autopilot

## Phase log
| Phase | Result | When |
|-------|--------|------|
| specify | spec written, gate PASS | 2026-11-22 |
| clarify | 7 criteria added (24–30), 8 assumptions recorded, 0 blocking | 2026-11-23 |
| plan | [plan](../plans/lead-inbox.md) written; 11 build steps; 4 owner actions before launch | 2026-11-23 |
| tasks | 29 tasks (T001–T029) appended to the plan; all 30 criteria covered; 11 tier-2 tasks; delivery in 4 PRs | 2026-11-23 |

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

## Evidence
_Filled per task during implement: test runs, coverage, E2E, review rounds._
