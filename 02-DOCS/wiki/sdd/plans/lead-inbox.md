---
type: plan
title: Plan — Lead inbox
description: The structure-level implementation plan for the lead inbox — intake, roles, alerts, list, and the website form change.
tags: [sdd, plan]
timestamp: 2026-11-23T15:00:00Z
topic: sdd
slug: lead-inbox
status: draft (autopilot)
---

# Plan — Lead inbox

> Spec: [../specs/lead-inbox.md](../specs/lead-inbox.md) · Constitution: [../constitution.md](../constitution.md) v1.0.0 · Status: draft (autopilot)
> Last updated: 2026-11-23

## 0. Global Constraints

Every task includes these, verbatim. The per-task reviewer reads them first.

- **Runtime:** TypeScript `strict: true`, Node.js 22 LTS (`engines` + `.nvmrc`), pnpm with committed `pnpm-lock.yaml`, `package.json` `"packageManager": "pnpm@<version>"`.
- **Stack:** Next.js App Router on Vercel; Supabase (Postgres, Auth); Tailwind CSS. No other framework, ORM or auth library.
- **Schema:** only through `supabase/migrations/*.sql`. **Every table has RLS enabled** and pgTAP tests in `supabase/tests/*.sql` proving each role's allow *and* deny.
- **Service-role key:** only in server-only modules under `src/lib/supabase/` (import `server-only`). Never in `NEXT_PUBLIC_*`, never in a client component.
- **Validation:** every external input (intake body, server-action args, env vars, query params) parsed with Zod at the boundary.
- **API envelope:** `{ success: boolean, data: T | null, error: { code: string, message: string } | null }` with the matching HTTP status. No stack traces, SQL or internal ids of other people in errors.
- **PII never logged:** logs carry only lead id, request id, outcome code, duration. Never name, email, phone, company, challenge text, IP.
- **Limits:** rate limit 5 submissions per source per 10 minutes; challenge text ≤ 5,000 characters; name/company ≤ 200; phone ≤ 30; list page size 25 (P21 cap 50).
- **Lead statuses:** `new`, `contacted`, `qualified`, `disqualified` (shown as New, Contacted, Qualified, Disqualified). Open = anything but `disqualified`.
- **Enums from the website:** companySize ∈ `micro | pequena | mediana | grande`; service ∈ `gestion | web | apps | ia | automatizacion`; language ∈ `es | en`.
- **Email identity:** compare emails trimmed and lower-cased (`email_normalized`).
- **Roles:** `admin`, `sales`. Roles checked in the database, never trusted from the client.
- **Budgets:** CRM page LCP ≤ 2.5 s; intake p95 ≤ 500 ms; alert sending never inside the intake request's critical path.
- **Times:** invitation link 24 h; alert retries for 24 h, then `failed`; alert first attempt within 2 minutes.
- **Code layout:** `src/features/leads/`, `src/features/auth/`, `src/features/members/`, `src/features/alerts/`; shared in `src/lib/`. Files ≤ 800 lines.
- **Commits:** gitmoji + Conventional Commits, authored by the human; no `Co-Authored-By`, no generated-by footer.
- **Accessibility:** WCAG 2.2 AA, keyboard-only operable, visible focus, labelled fields, usable at 360 px.

## 1. Context & constraints

- Acceptance criteria that shape the design: spec §AC 1–2c (intake + website), 3–5 (abuse), 6/24/25 (merge rule), 11/26 (ownership under bypass and race), 21–23/29 (async alerts), 27 (last admin), 28 (invite expiry).
- Non-functional: P21 (LCP 2.5 s, ≤ 50 rows), P22 (intake p95 500 ms, async email), P17 (intake protections), P18 (PII).
- Constitution in play: P1–4 stack canon, P7–8 TDD + E2E, P9 Zod, P11 envelope, P15–16 secrets + RLS.
- Must not creep into: contacts/companies, pipeline, auto-replies, editing what the enquirer sent, assignment emails, charts, multi-tenant (spec §Non-goals).

## 2. Architecture

```text
 Website (Vite/React, other repo)                         Team browser
 Contact form + Turnstile widget + honeypot                    |
        | HTTPS POST JSON (CORS: site origin only)             | HTTPS (session cookie)
        v                                                      v
 [ Intake route  /api/leads ] ----------------------> [ Next.js app: pages + server actions ]
   Zod · origin · honeypot · Turnstile verify              proxy guard → /login when signed out
   rate limit · submit_enquiry() via service role          lead list/detail · members · alerts panel
        |                         \                                  |
        | after(): send alerts     \ Cloudflare Turnstile (EXT)      | user-scoped Supabase client (RLS)
        v                                                            v
 [ Alert dispatcher ] --HTTPS--> [ Email provider (EXT) ]   [ Supabase Postgres (EXT) ]
   claims due jobs, sends,          Resend (recommended)       tables + RLS + RPC functions
   backoff, marks failed                                       pg_cron → /api/alerts/dispatch (retries)
        ^------------------------------------------------------------'
                                                            [ Supabase Auth (EXT) ] invite · magic link
```

- **Intake route** (internal) — the only unauthenticated write; turns a website request into one call to `submit_enquiry`.
- **Database layer** (external service, our schema) — tables, RLS, and SECURITY DEFINER functions that hold every rule that must survive a bypass: merge, claim, status, assign, delete, last-admin, rate limit.
- **Alert dispatcher** (internal) — sends due alert jobs; idempotent; first attempt via `after()` right after the intake response, retries via a scheduled call.
- **App pages + server actions** (internal) — signed-in UI; call the database with the *user's* session, so RLS applies.
- **Proxy guard** (internal) — redirects signed-out requests to `/login`; a convenience, not the security boundary (RLS is).
- **Auth** (external) — Supabase invite + email magic link; public sign-up disabled.
- **Website form change** (internal, other repo, branch `Desarrollo`) — real submission, consent, honeypot, Turnstile, success/error states.

**Top architectural decision: business rules live in Postgres functions behind RLS, not in the Next.js layer.**
AC11 requires the refusal to hold "directly against the data", AC26 requires one winner under
concurrent claims, AC6/24/25 require no duplicate lead under concurrent submissions, and AC27
requires an admin always exists. Each is a race or a bypass that only the database can close
atomically. The trade-off: logic split between SQL and TypeScript, tested with pgTAP — accepted
because the alternative (checks in route handlers) is exactly what a direct API call skips.
Authenticated users get **no direct UPDATE/DELETE** on `leads`; they call the functions.

**Second decision: alerts through an outbox table, not sent inline.** The intake commits the lead and
its `alert_jobs` rows in one transaction, returns, then `after()` dispatches. A failed send leaves a
`pending` job that a `pg_cron` job (every 2 min, via `pg_net` to `/api/alerts/dispatch` with a shared
secret) retries. Chosen over Vercel Cron because Vercel's free plan only runs cron jobs daily.

## 3. Interfaces & contracts

```text
POST /api/leads   (public; CORS: INTAKE_ALLOWED_ORIGINS only; OPTIONS preflight answered)
  body: { name, company, email, phone?, companySize?, service?, challenge, language,
          consent: true, consentVersion, turnstileToken, website /* honeypot, must be "" */ }
  -> 201 { success:true, data:null, error:null }          lead created or merged (no lead data echoed)
  -> 400 VALIDATION  { error.fields: [field names] }       Zod failure, consent ≠ true, too long
  -> 403 ORIGIN | SPAM                                     origin not allowed; honeypot filled; Turnstile failed
                                                           (SPAM body identical to a generic failure)
  -> 429 RATE_LIMITED                                      > 5 per source / 10 min
  -> 500 INTERNAL                                          anything else; generic message
  - order of checks: origin → body size → Zod → honeypot → rate limit → Turnstile → submit
  - rate-limit key: sha256(client IP + RATE_LIMIT_SALT); raw IP never stored or logged
  - honeypot / Turnstile failures still count against the rate limit

db.submit_enquiry(input) -> { lead_id, merged: bool, alert_recipients: uuid[] }   (service role only)
  - normalizes email; finds an open lead with that email_normalized FOR UPDATE
  - open lead found  → inserts enquiry, bumps last_enquiry_at; recipients = owner, or all active if unassigned
  - none / only disqualified → inserts lead (status new, owner null) + first enquiry; recipients = all active members
  - inserts one alert_job per recipient in the same transaction
  - partial unique index on email_normalized WHERE status <> 'disqualified' guarantees one open lead per email

db.rate_limit_hit(key_hash, limit 5, window 10 min) -> allowed: bool   (service role only; atomic)

db.claim_lead(lead_id) -> ok | ALREADY_TAKEN | NOT_FOUND           caller: active sales/admin
  - single UPDATE … WHERE owner_id IS NULL; zero rows → ALREADY_TAKEN (AC26)
db.set_lead_status(lead_id, status) -> ok | FORBIDDEN | NOT_FOUND   admin: any; sales: owner_id = caller
db.assign_lead(lead_id, member_id | null) -> ok | FORBIDDEN | INACTIVE_MEMBER   admin only
db.delete_lead(lead_id) -> ok | FORBIDDEN                           admin only; cascades enquiries + alert jobs
db.set_member_role(member_id, role) / db.set_member_active(member_id, bool) -> ok | FORBIDDEN | LAST_ADMIN
  - LAST_ADMIN when the change would leave zero active admins (also enforced by trigger)

members.invite(email, role) -> ok | ALREADY_MEMBER | INVALID          admin server action
  - Supabase Auth admin invite (service role); members row status invited; link expires in 24 h
  - deactivate also bans the auth user, so existing sessions stop at next refresh

alerts.dispatch(limit 20) -> { sent, retried, failed }
  - claims due jobs with FOR UPDATE SKIP LOCKED (two dispatchers never send the same job)
  - email contains: name, company, service, received time, link `${APP_URL}/leads/<id>`
    and NEVER email, phone or challenge text (AC21)
  - on error: attempts+1, next_attempt_at = now + backoff (1, 2, 5, 10, 30, 60 min…);
    first attempt older than 24 h → status failed (AC29)
POST /api/alerts/dispatch  (header Authorization: Bearer ALERTS_DISPATCH_SECRET) -> 200 counts | 401

leads.list({ page, q?, status?, owner? }) -> { rows ≤ 25, total, page }   user session, RLS
  - newest first by created_at; q matches part of name, email or company, case-insensitive
```

## 4. Data model & flow

**Entities**

- **members** — user_id (auth user), email, role (`admin|sales`), active, invited_at, created_at. One row per team member.
- **leads** — id, email_normalized, name, company, phone, company_size, service, language, status, owner_id → members, consent_at, consent_version, created_at, last_enquiry_at. Contact fields are the first enquiry's, kept as sent.
- **enquiries** — id, lead_id → leads (cascade), name, company, phone, company_size, service, challenge, language, consent_at, consent_version, submitted_at. One per submission; the lead detail shows them all.
- **alert_jobs** — id, lead_id → leads (cascade), recipient_id → members, kind (`new_lead|repeat_enquiry`), status (`pending|sent|failed`), attempts, next_attempt_at, first_attempt_at, last_error_code. Admin-readable only.
- **intake_rate** — key_hash, window_start, count. Service role only; old rows purged by pg_cron daily.

RLS summary: `members`, `leads`, `enquiries` readable by active members; `alert_jobs` readable by
active admins; `intake_rate` no access for `anon`/`authenticated`. No INSERT/UPDATE/DELETE grants to
`anon` or `authenticated` on any table — all writes go through the functions in §3.

**Primary flow** (spec §Behaviour main path)

1. Website form posts JSON to `/api/leads` →
2. route checks origin, size, Zod, honeypot, rate limit, Turnstile →
3. calls `submit_enquiry` with the service-role client: lead + enquiry + alert jobs in one transaction →
4. responds 201; `after()` calls `alerts.dispatch` for the new jobs →
5. team members receive the alert; signed-in members see the lead at the top of `/leads` as New, Unassigned.

- Consistency: steps 3's writes are one transaction. Alert delivery is eventually consistent (≤ 2 min first try, retries 24 h).
- Migration impact: new schema only; nothing existing. One-time bootstrap: the owner's admin row, created by a seed for local/CI and by a documented one-off SQL for production.

## 5. Testing strategy

| Acceptance criterion | Level | Asserts | Fakes |
| --- | --- | --- | --- |
| 1 form → lead | e2e (CRM) + unit (website) | 201 then lead New/unassigned with all fields, language, consent time, top of list | Turnstile test secret "always pass"; mail adapter = capture |
| 2, 2b invalid / no consent | unit (Zod) + integration (route) | 400 with field names; zero rows | — |
| 2c CRM unreachable | unit (website form) | error state with retry + WhatsApp, never success screen | fetch rejected / 500 |
| 3 honeypot / challenge | integration (route) | 403, zero rows | Turnstile test secret "always fail" |
| 4 rate limit | pgTAP + integration | 6th call in window refused; zero new rows | — |
| 5 foreign origin | integration (route) | 403, zero rows; preflight lacks allow header | — |
| 6, 24, 25 merge rule | pgTAP | same/odd-cased email merges; disqualified → new lead; concurrent submits → one open lead | — |
| 7 signed out | e2e | every CRM path redirects to /login; no lead data in response | — |
| 8, 9 invite only | integration + e2e | invited sales can sign in with sales powers; sign-up endpoint refused | local Supabase mail catcher |
| 10, 26 claim | pgTAP | claim sets owner; concurrent claims → one ALREADY_TAKEN | — |
| 11 bypass | pgTAP (as sales JWT) | direct UPDATE/DELETE and RPC on others' lead refused, row unchanged | — |
| 12 sales sees all | pgTAP + e2e | sales SELECT returns all leads | — |
| 13, 14 admin assign / delete | pgTAP + e2e | change saved; deleted lead, enquiries, jobs gone | — |
| 15 deactivate | integration + pgTAP | sign-in refused; leads keep owner; RLS denies inactive | — |
| 16 paging + LCP | e2e + lab measurement | 25 rows + next link; LCP ≤ 2.5 s on preview, 1,000 leads | — |
| 17 intake p95 | measurement script | p95 ≤ 500 ms over 100 sequential submissions on preview | Turnstile test keys |
| 18 no PII in logs | unit | logger rejects/strips PII keys; route logs contain none of the submitted values | captured logger sink |
| 19 keyboard | e2e (Playwright keyboard) + axe | all list actions reachable, focus visible, no axe violations | — |
| 20 search/filter | integration (query) + e2e | only matching rows | — |
| 21, 23 alert content/recipients | unit (template) + pgTAP (recipients) + e2e | recipients right; body has name/company/service/link, lacks email/phone/challenge | mail adapter = capture |
| 22, 29 alert failure | unit (dispatcher) + integration | lead kept, 201; job pending → failed after 24 h; visible in admin panel | mail adapter that throws; clock injected |
| 27 last admin | pgTAP | demote/deactivate of last admin → LAST_ADMIN | — |
| 28 invite expiry | config assertion + integration | auth OTP/invite expiry = 86400 s; expired link refused | local Supabase |
| 30 consent wording | unit (website) + pgTAP | label text per language; consent_version stored | — |

- E2E line: the four constitution flows (lead capture, login, role access) plus alerts, against local Supabase in CI.
- Must be real, never mocked: Postgres + RLS (pgTAP and integration run against `supabase start`), Zod schemas, the route's check order.
- Faked at the edge only: email provider (adapter interface with a capture fake), Turnstile (Cloudflare's official test secrets), clock in the dispatcher.

## 6. Sequencing & dependencies

1. **Scaffold** — Next.js + TS strict + Tailwind, pnpm, ESLint/Prettier, Vitest (json-summary coverage), Playwright, `supabase init` (sign-up off, invite expiry 24 h), env schema, CI preconditions met — depends on: none — serial. *Tier 2 (next.config, supabase/config.toml).*
2. **Schema + RLS + functions** — tables, partial unique index, RLS, `submit_enquiry`, `rate_limit_hit`, claim/status/assign/delete, member functions, last-admin trigger, seed; pgTAP for AC 4, 6, 10–15, 24–27 — depends on: #1 — serial. *Tier 2.*
3. **Intake domain** — Zod schema, email normalization, PII-safe logger, Turnstile verifier, origin check — depends on: #1 — parallel with #2.
4. **Intake route** `/api/leads` — wires #3 to `submit_enquiry`; integration tests AC 2–5, 18 — depends on: #2, #3 — serial. *Tier 2.*
5. **Alert dispatcher** — mail adapter + Resend implementation, template, dispatch with backoff, `/api/alerts/dispatch`, pg_cron schedule migration, `after()` hook in #4 — depends on: #2, #4 — serial. AC 21–23, 29.
6. **Auth + guard** — login (magic link), callback, proxy guard, sign-out, deactivated refusal — depends on: #1, #2 — parallel with #4/#5. *Tier 2 (src/features/auth, proxy).*
7. **Leads UI** — list (paging, search, filters), detail with enquiries, claim / status / assign / delete actions, empty state — depends on: #2, #6 — parallel with #5. AC 12–14, 16, 19, 20.
8. **Members + alerts admin UI** — invite, role, deactivate, alerts panel (pending/failed) — depends on: #6, #5 — serial. AC 8, 15, 22, 27, 28.
9. **E2E suite** — lead capture, login, role access, alert — depends on: #4–#8 — serial.
10. **Website form** (DigitalSystemPro, branch off `Desarrollo`) — submit, consent + version, honeypot, Turnstile widget, success/error with WhatsApp, unit tests — depends on: #4 contract only — parallel with #5–#9. AC 1, 2, 2c, 30.
11. **Budgets** — preview deploy, 1,000 test leads, LCP and p95 measurements recorded — depends on: #9, #10 — serial. AC 16–17.

- Parallel candidates: #2 ∥ #3; #5 ∥ #6 ∥ #7 after their deps; #10 once #4's contract is fixed.
- Hard ordering: nothing touches data before #2 (RLS first, P16); the website must not ship (#10 merge) before the CRM intake is deployed, or the form errors for every visitor.

## 7. Risks & open decisions

**Risks** (ranked)

| Risk | Trigger | Impact | Mitigation |
| --- | --- | --- | --- |
| Supabase free project pauses after ~7 days with no traffic | quiet week | intake fails → every enquiry errors (2c shows WhatsApp, but leads are lost) | owner chose free + daily keep-alive ping (2026-11-23): a daily scheduled request that touches the database, added in build step 5 |
| Email provider not set up (account, verified sending domain) | launch day | alerts never arrive; AC21 unmet | dispatcher behind an adapter; jobs wait as `pending` and are visible; owner action before launch |
| Origin header is spoofable by non-browser clients | scripted abuse | AC5 holds for browsers only | Turnstile + rate limit are the real gate; documented honestly in review |
| Website repo has no test tooling | task #10 | website change ships untested | add Vitest + Testing Library as dev deps there, minimal config; checked by its own PR review |
| Website deployed before CRM intake | merge order | form shows error for everyone | ordering rule in §6; website PR merged only after CRM is live |
| pg_cron / pg_net availability on the chosen plan | setup | no retries | both are available on Supabase free; fallback: daily Vercel cron + `after()` first attempt |
| Magic-link mail in local/CI | e2e | flaky login tests | use local Supabase mail catcher (Inbucket/Mailpit) API in tests |
| Coverage < 80 % because SQL logic is not counted by Vitest | CI | unit job red | keep TS glue thin and tested; SQL proven by pgTAP job |

**Open decisions** (owner actions, none blocking the build — they block launch)

- Email provider account: **Resend recommended** (simple API, free tier 3,000/month); needs a verified sending domain. Closes when the owner creates it. Decision queue #11.
- Supabase project (region; free vs Pro given the pause risk). Closes when the owner creates the project. Decision queue #12.
- CRM production URL (Vercel default `*.vercel.app` or a subdomain) — needed for alert links and `APP_URL`. Decision queue #13.
- Cloudflare Turnstile site — owner creates a free widget for the website domain. Decision queue #14.
