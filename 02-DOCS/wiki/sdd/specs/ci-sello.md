---
type: spec
title: Spec — CI merge bar and sello ship gate
description: WHAT and WHY for automated checks on every change and the review-bound ship gate.
tags: [sdd, spec]
timestamp: 2026-11-23T10:00:00Z
topic: sdd
slug: ci-sello
branch: chore/ci-sello
status: draft (approved in autopilot, not item by item)
---

# Spec — CI merge bar and sello ship gate

> Slug: `ci-sello` · Status: draft — approved in autopilot · Created: 2026-11-23
> Inherits: [constitution](../constitution.md) v1.0.0

## Problem & why
The constitution's Definition of Done (lint, types, ≥ 80% coverage, E2E, DB policies, audit, no
secrets) is only words until something checks it on every change. The owner asked for automated
checks split by test type, and for the sello ship gate so nothing ships that was not reviewed.

## Cost of not building it
Every rule in the constitution relies on someone remembering to run it. A secret, a table without
access rules, or a drop in coverage can reach `main` unnoticed — exactly the defects REVIEW.md lists
as the ones that hurt this project.

## The cheapest alternative
Running the checks by hand before each merge. It works until the first busy day; it leaves no
record on the pull request, and it cannot stop a merge.

## Goals
- Every push to `main` and every pull request is checked automatically, one check per test type,
  so a failure names the rule that broke.
- Nothing is committed, pushed or opened as a PR unless its exact content was reviewed.
- Changes to sensitive areas always need a person's approval.

## Non-goals / out of scope
- Deploying to Vercel from CI (Vercel deploys on its own).
- Checks for the website repo (separate code base).
- Branch-protection settings on GitHub (owner sets them in the repo settings; listed as a follow-up).
- Performance budget checks (P21–22) in CI — verified per feature for now.

## Users & context
The owner and future team members opening pull requests; reviewers reading results on the PR.

## What the user can do
Anyone with push access opens a PR and sees each check pass or fail. Only the owner can merge.
Anyone working locally gets refused at commit/push/PR time if the change was not reviewed.

## What result they get
A PR shows separate results: secret scan, spec gate, lint + format, type check, unit + coverage,
database policies, end-to-end, dependency audit, build. Before the app exists, only the secret scan
and spec gate run; the rest are shown as skipped, not failed.

## What it must respect
Constitution P5–P8, P13, P15, P16, P19; REVIEW.md always-human paths; decision 2026-11-23 (sello on,
trunk `main`, per-feature branches).

## How it proves it
Every criterion is proven by an observation that **could have failed**, recorded in
`02-DOCS/wiki/sdd/progress/ci-sello.md`:
- AC1 — the first CI run of this branch's PR: run link, always-on jobs green, app jobs "skipped".
- AC2 — a throw-away PR (never merged) adding a fake-but-secret-shaped token: the secret scan goes red.
- AC3 — `rsc spec gate` on a copy of a spec with a required section removed: `FAIL`, exit 1.
- AC4 — an actual refusal observed: a push of this unreviewed tier-2 change was refused by the sello.
- AC5 — `rsc risk <path>` on each always-human path (tier 2) **and** on ordinary paths (tier 1/0),
  so the patterns are shown both to match and not to over-match.
- Once the app exists, missing preconditions (packageManager, lockfile, Playwright config, Supabase
  config, RLS tests, coverage summary < 80%) fail CI loudly instead of skipping.

## Behaviour
- Main: on push/PR, the always-on checks run; app checks run once the app exists.
- Edge: a repo with no app yet passes with app checks skipped.
- Error: any failing check marks the PR red with the failing check's name; an unreviewed change is
  refused locally with a message saying how to get it reviewed.

## Acceptance criteria
1. Given a PR on a repo with no app yet, When CI runs, Then the secret scan and spec gate run and pass, and every app check shows as skipped.
2. Given a commit containing something shaped like a secret, When CI runs, Then the secret scan fails.
3. Given a spec missing a required section, When CI runs, Then the spec gate fails.
4. Given the sello is on, When a tier-2 change is committed or pushed without a review, Then it is refused.
5. Given a change touching the lead intake, middleware, vercel.json or database migrations/tests, When its risk is scored, Then it is tier 2 and needs human approval.

## Points to clarify
- **suposición tomada** — free GitHub-hosted runners are enough. *Base:* private repo on a personal account gets free minutes. *Riesgo:* the E2E and DB jobs use Docker and minutes; if the free quota runs out, jobs queue or fail.
- **decisión diferida** — GitHub branch protection (require these checks before merge) — owner sets it in repo settings after the first green run.
- **decisión diferida** — CI for the website repo.
- **decisión diferida** — pin third-party actions by commit SHA and the Supabase CLI by version, kept current with Dependabot (review nit, 2026-11-23). Tags are acceptable on a private repo for now.
- **suposición tomada** — coverage is enforced as global line coverage ≥ 80%, not "changed code only". *Base:* measurable in CI with no extra tooling; stricter on average. *Riesgo:* a large untested legacy area would block unrelated PRs — none exists yet.

## Revisions
- 2026-11-23 — Review round 1 (3 refuters, 11 unique findings, 0 blockers): proofs made falsifiable; CI now fails loudly on missing app preconditions; DB job keyed on Supabase config and refuses zero RLS tests; coverage asserted in CI; gitleaks PR permission; main pushes never cancelled; sello patterns extended (proxy.ts, next.config, supabase config/seed, service-role client).
