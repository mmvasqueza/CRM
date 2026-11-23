# Progress — lead-inbox (evidence)

> Spec: [lead-inbox](../specs/lead-inbox.md) · Branch: `feat/lead-inbox` · Mode: autopilot

## Phase log
| Phase | Result | When |
|-------|--------|------|
| specify | spec written, gate PASS | 2026-11-22 |
| clarify | 7 criteria added (24–30), 8 assumptions recorded, 0 blocking | 2026-11-23 |

## Decision queue
Decisions taken alone in autopilot. Nothing waits on them; the owner confirms or vetoes later.

| # | Kind | Decision | Owner action |
|---|------|----------|--------------|
| 1 | review-after | Repeat enquiry keeps original contact fields; each message stores its own fields | confirm |
| 2 | review-after | Search: partial, case-insensitive on name/email/company; 25 per page | confirm |
| 3 | review-after | Sales claim but cannot release or hand on a lead; admins reassign | confirm |
| 4 | review-after | Last active admin cannot be demoted or deactivated (AC27) | confirm |
| 5 | review-after | Invitations expire after 24 h, re-sendable (AC28) | confirm |
| 6 | review-after | Failed alerts retry 24 h, then marked failed for admins (AC29) | confirm |
| 7 | review-after | Consent label wording + stored version (AC30) — legal review before launch? | confirm wording |
| 8 | review-after | Budgets measured on preview with 1,000 test leads (AC16–17) | confirm |
| 9 | review-after | Screen sketch of the lead list (carried from specify) | approve a sketch |
| 10 | review-after | Constitution ratified provisionally in autopilot (carried) | ratify |

## Evidence
_Filled per task during implement: test runs, coverage, E2E, review rounds._
