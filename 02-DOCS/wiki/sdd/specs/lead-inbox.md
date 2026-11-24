---
type: spec
title: Spec — Lead inbox (website leads + team access with roles)
description: WHAT and WHY for the lead inbox — website enquiries become owned, tracked leads that a signed-in team works with roles.
tags: [sdd, spec]
timestamp: 2026-11-22T18:00:00Z
topic: sdd
slug: lead-inbox
branch: feat/lead-inbox
branches: [feat/lead-inbox, feat/lead-inbox-foundation]
status: clarified (approved in autopilot, not item by item)
---

# Spec — Lead inbox (website leads + team access with roles)

> Slug: `lead-inbox` · Status: draft — approved in autopilot · Created: 2026-11-22
> Inherits: [constitution](../constitution.md) v1.0.0
> First of six sub-specs: **lead-inbox** → contacts-companies → sales-pipeline → follow-ups-calendar → email-automation → dashboard.

## Problem & why
Enquiries sent through the contact form on digital-system-pros.vercel.app have no shared,
owned place to land. Nobody can see at a glance which enquiries are new, who is handling each
one, or which were never answered. The owner wants a CRM they **own** — data and product — rather
than renting one (decision 2026-11-22: "Own data and product", possibly resold to clients later),
and this is the first slice that makes it useful: every website enquiry becomes a lead the team can see and act on.

## Cost of not building it
**Verified 2026-11-23: every enquiry is lost today.** The website's contact form
(`src/pages/Contact.tsx` in the site's code) does not send its data anywhere — on submit it waits
1.5 s and shows "¡Gracias! Un especialista se pondrá en contacto en menos de 2 horas", a promise
nothing backs. Each visitor who used the form believes they will be called and is not. Without
this, that continues; and every later module (pipeline, follow-ups, email, dashboard) has no data
to work on. (The only working channel is the WhatsApp link on the same page.)

## The cheapest alternative
A free hosted CRM (HubSpot Free, Zoho, Pipedrive) with its stock web-form connector solves most of
this today with no code. It is not enough because the owner decided to own the data and the product
(possible resale) — a rented CRM gives neither. The objection was raised and overridden on that basis.
A smaller version — the form emailing a shared inbox — gives visibility but no ownership, roles or
history.

## Goals
- Every valid enquiry submitted on the website appears in the CRM as a lead, with nothing lost.
- Only invited team members can get in; there is no public sign-up.
- Each lead can have one owner, and everyone can tell at a glance which leads are new or unowned.
- Admins and sales users have different powers, enforced by the system, not by hiding buttons.

## Non-goals / out of scope
- Contacts and companies as separate records, notes, tags — spec 2 (`contacts-companies`).
- Pipeline board and deals — spec 3. Tasks, reminders, Google Calendar — spec 4.
- Auto-replies to the enquirer, email sequences, and any email other than the new-lead alert — spec 5.
  (The **new-lead alert to the team is IN scope**, moved earlier on 2026-11-23 so the site's
  "contact in under 2 hours" promise can be kept.)
- Charts or metrics — spec 6.
- Importing past enquiries, CSV import/export, bulk actions.
- Social login, two-factor login, self-service sign-up.
- Multi-tenant / reselling to other companies (one organisation only for now).
- Things an agent could add "just in case": lead scoring, AI summaries, chat widgets, a public
  lead-status page, file attachments, per-field audit history. None are asked for.
- Editing what the enquirer sent (name, company, message…): it stays exactly as submitted; team
  notes arrive with spec 2.
- Emails to a member when a lead is assigned to them (only the new-lead alert is in scope).
- A full privacy-policy page on the website and a data-retention schedule (consent wording on the
  form states the purpose; the page and retention rules are a later item).

## Users & context
- **Enquirer** — a visitor on the website (Spanish or English; businesses in Nicaragua) who fills
  in the contact form. Never sees the CRM.
- **Admin** — the owner (and anyone they promote). Invites and removes team members, sets roles,
  assigns leads, can change or delete any lead.
- **Sales** — a team member who works leads. Sees every lead; changes only leads assigned to them.

## What the user can do
- **Enquirer** (anyone, no account): submit the website contact form.
- **Admin** (signed in): invite a person by email as admin or sales; change a member's role;
  deactivate a member; view, search and filter all leads; assign or reassign any lead; change any
  lead's status; permanently delete a lead (privacy request).
- **Sales** (signed in): view, search and filter all leads; claim an unassigned lead for
  themselves; change the status of leads assigned to them. Cannot edit, reassign or delete leads
  owned by someone else; cannot manage members.
- **Not signed in**: cannot see any CRM page or lead data.
- A deactivated member can no longer sign in, and their leads stay in place for reassignment.

## What result they get
- **Enquirer:** after submitting, the form shows a confirmation message; on failure, an error asking
  them to retry. The expected response for an accepted submission is a success indication with no
  lead data echoed back.
- **Team:** a lead list showing, per lead, name, email, received date, status, owner (or
  "Unassigned"), newest first; a lead detail view with everything the enquirer sent.
- *Reference:* no human-approved screen sketch exists yet (autopilot). The checkable reference is
  the acceptance criteria below; a sketch is a **review-after** item for the owner.

## What it must respect
- Constitution v1.0.0, notably P9 (validate all input), P15 (no secret client-side), P16 (role
  rules enforced server-side and in the data layer), P17 (the form intake is the only
  unauthenticated write: validated, rate-limited, website-origin only, spam-protected), P18 (PII:
  minimal collection, never logged, deletable), P20 (WCAG 2.2 AA), P21–22 (budgets).
- Decisions log 2026-11-22: roles `admin`/`sales`; sales sees all, edits assigned; website code is
  owned and the form will send to the CRM; spam protection = honeypot + challenge.
- The website must keep working if the CRM is unreachable: the visitor sees an error, the site does not break.
- The website's existing form layout, fields and bilingual (es/en) texts stay as they are, except
  for the added consent checkbox and replacing the fake success with a real submission.
- Nicaragua's personal-data law (Ley 787) applies: data is collected only with the enquirer's
  explicit consent, and the consent is recorded with the lead.
- **Dependency:** the website lives in its own code base; this spec includes the change to its
  contact form (submit to the CRM, consent checkbox, real success/error states).

## How it proves it
- Each acceptance criterion maps to an automated test (unit/integration) and the critical flows
  (form → lead, login, role limits) to end-to-end tests, per P7–P8. Test run output and coverage
  report are kept in `02-DOCS/wiki/sdd/progress/lead-inbox.md` as evidence.
- A role-permission check runs against the data layer directly (not only through the UI), proving a
  sales user cannot change another user's lead even when bypassing the screens.

## Behaviour
- **Main path:** an enquirer fills in the website form — full name, company, email and biggest
  challenge (required); phone, company size (micro / pequeña / mediana / grande) and service of
  interest (gestión / web / apps / IA / automatización) (optional) — ticks the privacy-consent box
  and submits. The CRM records a lead with status **New**, no owner, the submission time, the site
  language (es/en) and the moment consent was given. The visitor sees the existing "¡Gracias!"
  screen only once the lead is actually recorded. Signed-in team members see it at the top of the
  list, marked New and Unassigned.
- **Consent:** without the box ticked the form cannot be sent and the CRM refuses the submission.
- **New-lead alert:** as soon as a new lead is recorded, every active team member receives an email
  alert with the enquirer's name, company, service of interest, the time, and a link to the lead in
  the CRM (the challenge text and contact details stay inside the CRM, behind sign-in). A repeat
  enquiry alerts the lead's owner, or everyone if it is unassigned. If the alert cannot be sent, the
  lead is still recorded and the visitor still sees success; the failure is retried and visible to admins.
- **Statuses:** New → Contacted → Qualified, or Disqualified. Any status can move to any other.
- **Repeat enquiry:** the same email submitting again while an open lead exists adds the new
  message to that lead (keeping both, timestamped) instead of creating a duplicate.
- **Invitation:** an admin invites an email address; that person gets a sign-in link, sets up
  access, and lands in the CRM with the chosen role.
- **Edge cases:** empty list shows an "no leads yet" message; very long messages are accepted up
  to a limit and refused beyond it; list is paged, never loading everything at once.
- **Error paths:**
  - Invalid form input (missing name/email, malformed email) → the form says which field is wrong; no lead is created.
  - Suspected bot (spam trap filled or challenge failed) → refused; looks like a generic failure to the sender.
  - Too many submissions from one source in a short time → refused with "try again later".
  - Submission from anywhere other than the website → refused.
  - Sales user tries to change a lead they don't own → refused with "only the owner or an admin can change this lead"; nothing changes.
  - Unknown or deactivated person tries to sign in → generic refusal that does not reveal whether the email exists.
  - Error messages never reveal internal details or another person's data.

## Acceptance criteria
1. Given the website form, When a visitor submits valid required fields with consent ticked, Then they see the "¡Gracias!"/"Thank You!" screen and a lead with status New, no owner, every submitted field, the language and the consent time appears at the top of the CRM lead list.
2. Given the website form, When a required field is missing or the email is malformed, Then the visitor sees which field is wrong and no lead is created.
2b. Given the consent box is not ticked, When the visitor (or anything else) submits, Then no lead is created.
2c. Given the CRM is unreachable, When the visitor submits, Then they see an error inviting them to retry or use WhatsApp — never the "¡Gracias!" screen.
3. Given a submission with the spam trap filled or the challenge failed, When it is sent, Then no lead is created.
4. Given one source sends more than the allowed number of submissions in the rate window, When it submits again, Then it is refused and no lead is created.
5. Given a request to the intake from an origin other than the website, When it is sent, Then it is refused and no lead is created.
6. Given an open lead for an email, When the same email submits again, Then no new lead is created and the lead shows both messages with their times.
7. Given a signed-out person, When they open any CRM page, Then they are sent to sign-in and see no lead data.
8. Given an admin, When they invite an email as sales, Then that person can sign in and has sales powers only.
9. Given there is no sign-up, When someone not invited tries to create an account, Then they cannot get in.
10. Given a sales user and an unassigned lead, When they claim it, Then they become its owner.
11. Given a sales user and a lead owned by someone else, When they try to change its status or owner (through the screen or directly against the data), Then it is refused and the lead is unchanged.
12. Given a sales user, When they open the list, Then they see all leads, including others'.
13. Given an admin, When they reassign any lead or change its status, Then the change is saved and shown.
14. Given an admin, When they permanently delete a lead, Then it no longer appears anywhere in the CRM.
15. Given an admin deactivates a member, When that member tries to sign in, Then they are refused, and their leads remain visible with them as owner until reassigned.
16. Given more leads than one page holds, When the list opens, Then it shows one page with a way to reach the next, and the main content renders within 2.5 s (P21).
17. Given valid submissions, When measured, Then 95% of intake requests respond within 500 ms (P22).
18. Given a submission, When the system logs anything about it, Then no name, email, phone or message text appears in logs.
19. Given the list, search and filters, When operated by keyboard only, Then every action is reachable with visible focus (P20).
20. Given the list, When a member searches by name or email or filters by status or owner, Then only matching leads are shown.
21. Given a new lead is recorded, When 2 minutes have passed, Then every active member has received an alert containing name, company, service and a working link to the lead — and no email address, phone or challenge text.
22. Given the alert service is failing, When a visitor submits, Then the lead is still recorded, the visitor sees success, and an admin can see that the alert is pending.
23. Given a repeat enquiry on an owned lead, When it arrives, Then only the owner is alerted.
24. Given the only Disqualified lead for an email, When the same email submits again, Then a new lead is created (a disqualified lead is closed).
25. Given an open lead for `Ana@Example.com `, When `ana@example.com` submits, Then it counts as the same email (case and surrounding spaces ignored).
26. Given two sales users claim the same unassigned lead at the same moment, When both requests arrive, Then exactly one becomes owner and the other is told the lead was already taken.
27. Given there is exactly one active admin, When anyone tries to demote or deactivate that admin, Then it is refused — the CRM can never be left without an admin.
28. Given an invitation older than 24 hours, When the invited person uses its link, Then it is refused and an admin can send a new invitation.
29. Given an alert that keeps failing, When 24 hours of retries have passed, Then it is marked failed and stays visible to admins; the lead is untouched.
30. Given the consent box, When the form is shown, Then its label states in the site's language that the data will be used to answer this enquiry, and the lead records which wording version was accepted.

## Points to clarify
- **suposición tomada** — *(validated by owner 2026-11-23)* alerts go to every active member (admins and sales) by email. *Base:* fastest way to meet the 2-hour promise with a small team. *Riesgo:* with a larger team this becomes noise; per-member preferences would be a later spec.
- **suposición tomada** — *(validated by owner 2026-11-23)* website changes land on the website repo's `Desarrollo` branch via PR. *Base:* owner confirmed 2026-11-23 ("take the Desarrollo").
- **suposición tomada** — *(validated by owner 2026-11-23)* a repeat enquiry keeps the lead's original name/company/phone; each enquiry's own submitted fields are stored with its message. *Base:* "what the enquirer sent stays as sent" (non-goals). *Riesgo:* the list may show an outdated phone; the team sees the newer one in the message history.
- **suposición tomada** — *(validated by owner 2026-11-23)* search matches part of the name, email or company, ignoring case; the list shows 25 leads per page. *Base:* small team, common default. *Riesgo:* low; tunable.
- **suposición tomada** — *(validated by owner 2026-11-23)* sales can claim an unassigned lead but cannot release or hand it on; only an admin reassigns. *Base:* "edit assigned only" decision; fewer powers = fewer mistakes. *Riesgo:* admins become a bottleneck for hand-offs.
- **suposición tomada** — *(validated by owner 2026-11-23)* the last active admin cannot be demoted or deactivated (AC27). *Base:* otherwise nobody could ever manage the team again. *Riesgo:* none known.
- **suposición tomada** — *(validated by owner 2026-11-23)* invitations expire after 24 h and can be re-sent (AC28). *Base:* common safe default for sign-in links. *Riesgo:* low.
- **suposición tomada** — *(validated by owner 2026-11-23)* failed alerts retry for 24 h, then are marked failed for admins (AC29). *Base:* the 2-hour promise is lost long before; endless retries help nobody. *Riesgo:* low.
- **suposición tomada** — *(validated by owner 2026-11-23)* the consent label states the purpose and the accepted wording version is stored with the lead (AC30). *Base:* Ley 787 needs informed, provable consent; no privacy page exists on the site. *Riesgo:* the owner may want legal review of the wording before launch.
- **suposición tomada** — *(validated by owner 2026-11-23: preview + 1,000 test leads; device set by constitution P21)* the 2.5 s (AC16) and 500 ms (AC17) budgets are measured on a preview deployment holding 1,000 test leads: page load via a lab run on a laptop profile with throttled 4G (constitution P21), intake via 100 sequential valid submissions. *Base:* makes P21–22 checkable. *Riesgo:* preview hardware differs from production.
- **suposición tomada** — *(validated by owner 2026-11-23)* lead statuses are New, Contacted, Qualified, Disqualified, freely movable. *Base:* minimal useful set before the pipeline spec. *Riesgo:* spec 3 (pipeline) may want qualified leads to become deals; the set may need to align then.
- **suposición tomada** — *(validated by owner 2026-11-23)* a repeat enquiry merges into the open lead with the same email; a lead counts as "open" unless Disqualified. *Base:* avoids duplicates for the team. *Riesgo:* if the owner wants every enquiry separate, criterion 6 flips.
- **suposición tomada** — *(validated by owner 2026-11-23)* rate limit: at most 5 submissions per source per 10 minutes; message limit 5,000 characters. *Base:* generous for humans, tight for bots. *Riesgo:* low; numbers are tunable.
- **suposición tomada** — *(validated by owner 2026-11-23)* new leads arrive unassigned and are assigned by an admin or claimed by sales (no automatic round-robin). *Base:* the "see all, edit assigned" decision. *Riesgo:* with a large team, admins may want auto-assignment — a later spec.
- **suposición tomada** — *(validated by owner 2026-11-23)* the first admin is the owner, created once during setup; everyone else is invited. *Base:* no public sign-up. *Riesgo:* none known.
- **decisión diferida** — the Blog page's newsletter email box also sends nothing; out of this spec (a later "newsletter" item).
- **decisión diferida** — auto-replying to the enquirer → spec 5 (email-automation).
- **decisión diferida** — a screen sketch of the lead list approved by the owner → review-after item (autopilot).
- **área no formulable** — how leads will relate to contacts and companies in spec 2 (convert a lead into a contact? keep both?). Something is coming; not sharp yet.

## Revisions
- 2026-11-23 — Form fields: the assumed name/email/message replaced by the real form read from the site's code (name*, company*, email*, phone, companySize, service, challenge*) plus consent and language.
- 2026-11-23 — Consent checkbox: owner answered **yes**, required (Ley 787, Nicaragua). Criterion 2b added.
- 2026-11-23 — Finding: the site's form is a stub (fake success). Criterion 2c added; cost section rewritten.
- 2026-11-23 — "Under 2 hours" promise: owner chose to move the new-lead alert into this spec. Criteria 21–23 added.
- 2026-11-23 — Clarify pass (autopilot): criteria 24–30 added; three items moved to non-goals; eight assumptions recorded; `Desarrollo` validated.

## Clarifications
Autopilot pass, 2026-11-23. Each line: gap → decision → why. Every decision is a `review-after`
entry in [progress/lead-inbox.md](../progress/lead-inbox.md); none is blocking.
- Repeat enquiry on a Disqualified lead → new lead (AC24) → "open unless Disqualified" already said so; now testable.
- Same email typed differently → case and spaces ignored (AC25) → otherwise duplicates slip past the merge rule.
- Two sales claim at once → first wins, second told (AC26) → "one owner" must hold under concurrency.
- Last admin removed → refused (AC27) → without it the team could lock itself out.
- Invitation link lifetime → 24 h, re-sendable (AC28) → unstated; a sign-in link must not live forever.
- Alert that never succeeds → 24 h of retries, then failed and shown (AC29) → "retried" had no end.
- What consent means under Ley 787 → purpose stated on the label, wording version stored (AC30) → time alone does not prove what was agreed.
- Can an admin correct what the enquirer typed? → no, out of scope → keeps the record as given; notes come in spec 2.
- Do members get "assigned to you" emails? → no, out of scope → only the new-lead alert was asked for.
- How are P21–22 budgets measured? → preview deployment, 1,000 test leads (assumption) → "fast" must be checkable.
- Points handed over by specify: `Desarrollo` (validated by owner) · alerts to all, statuses, merge rule, rate limit, manual assignment, first admin (validated by owner 2026-11-23, second round) · newsletter, auto-reply, screen sketch (left deferred; the sketch is now owner-requested, task T018) · leads vs contacts (still not formulable; noted).
