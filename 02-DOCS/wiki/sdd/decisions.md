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
| 2026-11-22 | Sello ship gate (`.rsc/sello-config.json`) left OFF | on · off | Creating the config opts into a commit/PR gate — a separate decision for the owner. |
