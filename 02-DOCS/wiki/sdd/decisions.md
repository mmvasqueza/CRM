# SDD decisions log (append-only)

| Date | Decision | Options considered | Why |
|------|----------|--------------------|-----|
| 2026-11-22 | Constitution v1.0.0 ratified | — | Project kickoff; owner ratified explicitly. |
| 2026-11-22 | Stack: Next.js (App Router) + Supabase on Vercel | Next.js + Supabase · Next.js + Neon/Prisma/Auth.js · Next.js + FastAPI | Least wiring; Auth + Postgres + RLS in one service; same host as the website. |
| 2026-11-22 | Users: team with roles (`admin`, `sales`) | Single admin · team equal access · team with roles | Owner wants role-based permissions and record ownership. |
| 2026-11-22 | Quality bar: TDD, ≥ 80% coverage on changed code, E2E for critical flows | TDD 80% · critical paths only | Owner choice; matches global rules. |
| 2026-11-22 | Website integration: site code is owned (non-Next.js) → form posts to a CRM HTTP endpoint | API endpoint · webhook · email | Owner controls the site code. |
| 2026-11-22 | Spam protection: honeypot + Cloudflare Turnstile | captcha · honeypot only · Turnstile | Free, low-friction; proposed in draft, not objected to. |
| 2026-11-22 | Build custom CRM rather than hosted (HubSpot/Zoho/Pipedrive) | custom · hosted · hybrid · don't build | Owner: own the data and product (possible resale). Objection raised and overridden. |
| 2026-11-22 | Split CRM into 6 sub-specs; first = `lead-inbox` | lead inbox first · foundation first · one big spec | Delivers value from day one (website → leads) with login/roles. |
| 2026-11-22 | Sales role: sees all leads, edits only assigned | all/assigned · assigned only · all/all | Owner choice. |
| 2026-11-22 | Chain runs in autopilot | gated · autopilot | Owner choice; spec recorded as "approved in autopilot". |
| 2026-11-22 | ~~Sello ship gate left OFF~~ superseded 2026-11-23 | on · off | Creating the config opts into a commit/PR gate — a separate decision for the owner. |
| 2026-11-23 | Finding: website contact form is a stub — submits nowhere, shows fake "¡Gracias!" | — | Read from the live bundle (`src/pages/Contact.tsx`). All enquiries to date were lost. Raises lead-inbox urgency. |
| 2026-11-23 | Privacy-consent checkbox required on the form | yes · no | Owner: yes. Audience is Nicaraguan businesses → Ley 787. |
| 2026-11-23 | Spec fields = the real form (name, company, email, phone, companySize, service, challenge) + consent + language | assumed fields · real fields | Owner asked to check the site. |
| 2026-11-23 | Initial commit directly on `main`, then one branch per feature/chore off `main` (no long-lived `dev`) | per-feature · `dev` integration branch | Owner allowed either; per-feature matches P13 and keeps PRs small. |
| 2026-11-23 | Sello ship gate ON (project scope), trunk `main`, extra always-human paths: lead intake, middleware, vercel.json, supabase migrations/tests | on · off | Owner: turn it on. |
| 2026-11-23 | New-lead team alert moved from spec 5 into `lead-inbox` | keep text, alert later · soften text · move alert earlier | Owner: move alert earlier, so "contact in under 2 hours" is keepable. |
| 2026-11-23 | Remotes: CRM → github.com/mmvasqueza/CRM; website → github.com/mmvasqueza/DigitalSystemPro (private, cloned to `../DigitalSystemPro`) | — | Owner provided. Website: Vite + React + npm; `@supabase/supabase-js` already a dependency, unused. |
| 2026-11-23 | Review agents (3 refuters) may be spawned for every tier-2 change | yes · no | Owner: OK. |
| 2026-11-23 | GitHub Actions CI: one job per test type (secrets, spec gate, lint/format, typecheck, unit+coverage, DB/RLS, E2E, audit, build); app jobs skip until `package.json` exists | single job · per-type jobs | Owner asked for different test types; per-type jobs show exactly which bar failed. |
