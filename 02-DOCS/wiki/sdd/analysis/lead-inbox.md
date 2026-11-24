---
type: analysis
title: Analysis — lead-inbox (constitution ↔ spec ↔ plan ↔ tasks)
description: Pre-implementation consistency gate for the lead inbox.
tags: [sdd, analysis]
timestamp: 2026-11-23T17:00:00Z
topic: sdd
slug: lead-inbox
---

# Analysis — lead-inbox

> Inputs: [constitution](../constitution.md) v1.0.0 · [spec](../specs/lead-inbox.md) (clarified) · [plan + tasks](../plans/lead-inbox.md) T001–T029 · [config](../config.yaml)

**GATE: PASS** — 0 CRITICAL · 0 HIGH · 4 MEDIUM · 4 LOW.

## Coverage map

| REQ | Spec requirement (short) | Plan § | Tasks | Status |
| --- | --- | --- | --- | --- |
| AC1 | Form → lead New/unassigned, all fields, language, consent time | §2, §3, §4 | T012, T020, T025, T027 | covered |
| AC2, 2b | Field errors; no consent → no lead | §3 | T009, T012, T027 | covered |
| AC2c | CRM down → error with WhatsApp, never "¡Gracias!" | §2 | T027 | covered |
| AC3 | Honeypot / challenge → no lead | §3 | T011, T012 | covered |
| AC4 | Rate limit 5 / 10 min | §3 | T007, T012 | covered |
| AC5 | Foreign origin refused | §3 | T011, T012 | covered (browser-only — risk documented, §7) |
| AC6, 24, 25 | Merge rule; disqualified → new; case-insensitive email | §3, §4 | T007, T009, T020 | covered |
| AC7 | Signed out → login, no data | §2 | T017, T026 | covered |
| AC8, 9 | Invite only, sales powers | §3 | T003, T016, T022, T026 | covered |
| AC10, 26 | Claim; concurrent claim → one winner | §3 | T008, T021 | covered |
| AC11 | Sales cannot change others' lead, even directly | §2 top decision | T006, T008, T021, T026 | covered |
| AC12 | Sales sees all | §4 RLS | T005, T006, T019, T026 | covered |
| AC13, 14 | Admin reassign/status; delete | §3 | T008, T021, T026 | covered |
| AC15 | Deactivated refused, leads kept | §3 | T005, T016, T022 | covered |
| AC16 | Paging + LCP ≤ 2.5 s | §0, §5 | T019, T028 | AMBIGUOUS (device — finding 2) |
| AC17 | Intake p95 ≤ 500 ms | §5 | T028 | covered |
| AC18 | No PII in logs | §0 | T010, T012 | covered |
| AC19 | Keyboard + focus | §0 | T024 | covered |
| AC20 | Search / filters | §3 | T019 | covered |
| AC21, 23 | Alert content + recipients | §3 | T007, T013, T025 | covered |
| AC22, 29 | Alert failure visible; 24 h retries | §2, §3 | T014, T015, T023 | covered |
| AC27 | Last admin protected | §3 | T005, T008, T022 | covered |
| AC28 | Invite 24 h | §3 | T003, T022 | covered |
| AC30 | Consent wording + version | §3 | T007, T027 | covered |
| — | Daily keep-alive ping | §7 | T015 | DRIFT (no AC; owner decision #12 — accepted) |

## Findings

| # | Severity | Type | Artifact A (loc) | Artifact B (loc) | Conflict | Resolve in |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | MEDIUM | Contradiction | constitution P10 (domains: leads, contacts, companies, pipeline, tasks, email, dashboard, auth) | plan §0 + tasks (`src/features/members/`, `src/features/alerts/`) | Two feature folders the constitution does not list | plan (move under listed domains) or constitution (MINOR amendment) |
| 2 | MEDIUM | Ambiguity / contradiction | constitution P21 (LCP on "mid-range laptop over 4G") | spec assumption + T028 ("mobile profile") | Two different measurement devices for the same budget | clarify (align the assumption to P21) |
| 3 | MEDIUM | Carrier completeness | tasks T008 Interfaces (error codes) | T016, T019, T021, T022, T023 (no Interfaces block) | Isolated workers on these tasks cannot see the function names / error codes they depend on | tasks |
| 4 | MEDIUM | Constitution letter | constitution P16 ("a table without RLS policies is a blocker") | plan §4 (`intake_rate`: RLS on, no policies = deny all) | Deny-by-absence is safe but violates the letter of P16; a reviewer will flag it | plan (explicit deny policy) |
| 5 | LOW | Wording | constitution P7 ("≥ 80 % on changed code") | CI (global line coverage) | Known; recorded as an assumption in the ci-sello spec | none (accepted) |
| 6 | LOW | Stale status | spec §Points to clarify (assumptions) | progress decision queue (owner confirmed all) | Spec still lists them as unconfirmed assumptions | clarify (mark validated) |
| 7 | LOW | Drift | plan §7 / T015 keep-alive | spec (no criterion) | Small reliability task with no AC | none (owner decision #12) |
| 8 | LOW | Environment | constitution P1 (Node 22) | owner machine (Node 26, no global pnpm) | Local runs differ from CI | none (CI is the bar; noted in config) |

## Recommended routing

- **plan:** #1 — place member management under `src/features/auth/members/` (roles and invites are auth, and that path is already always-human) and alerts under `src/features/email/alerts/` (alerts are email); no constitution change needed. #4 — give `intake_rate` an explicit `using (false)` policy for `anon` and `authenticated`.
- **clarify:** #2 — measure LCP with a laptop profile on throttled 4G, as P21 says. #6 — mark the eight assumptions validated by the owner.
- **tasks:** #3 — add Interfaces blocks to T016, T019, T021, T022, T023.
- After these, re-run analyze once.

## Re-run — 2026-11-23

**GATE: PASS** — 0 CRITICAL · 0 HIGH · 0 MEDIUM · 3 LOW accepted (#5, #7, #8).
- #1 resolved in plan: members → `src/features/auth/members/`, alerts → `src/features/email/alerts/` (T022 now tier 2 by path).
- #2 resolved in spec + T028: laptop profile, throttled 4G (P21).
- #3 resolved in tasks: Interfaces blocks added for T016, T019, T021, T022, T023.
- #4 resolved in plan: `intake_rate` gets an explicit deny policy.
- #6 resolved in spec: the 9 points the owner actually answered are marked validated; the 6 specify-time assumptions are labelled "accepted with the autopilot spec; not individually confirmed"; `rsc spec gate` PASS, 19/19 typed.
- Follow-up 2026-11-23: the owner confirmed those 6 as well (all as recommended); all 15 points are now owner-validated.
- Tier-1 review of this change (round 1): 0 blockers, 2 should-fix, 4 nits — all fixed (overclaimed validation; T021/T022 carriers incl. AC28 re-invite; AC30 storage assertion in T007; counts; config DB reset).
