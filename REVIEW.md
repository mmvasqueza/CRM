# REVIEW.md — read this before reviewing any change

Constitution: `02-DOCS/wiki/sdd/constitution.md` (cite as "constitution vX, principle N").

## What failure looks like here

- A new table or column without **RLS policies**, or a policy that lets `sales` see/edit what only `admin` should (P16).
- The Supabase **service-role key** reachable from client code or a `NEXT_PUBLIC_*` var (P15).
- The public lead-intake endpoint missing validation, rate limit, CORS restriction or spam check (P17).
- Role checks done only in the UI, not on the server / in the database (P16).
- PII (names, emails, phones, message bodies) written to logs or error responses (P18).
- A schema change made outside `supabase/migrations/`, or a migration that cannot be rolled back (P4).
- Email / calendar calls blocking the request path instead of running async (P22).
- Unpaginated list queries (P21).
- Tests written after the code, or coverage on changed code below 80% (P7).

## Paths to skip

- `supabase/types.ts` and any generated `*.gen.ts`
- `pnpm-lock.yaml`, `.next/`, `node_modules/`, `coverage/`
- `.rsc/`, `.claude/` (harness, governed separately)

## Nit cap

At most **3** nits per review; drop the rest.

## Always-human paths (never merge without a person)

- `src/features/auth/**`, `src/middleware.ts` — login and role checks
- `supabase/migrations/**` — schema + RLS
- `src/app/api/leads/**` — the public intake endpoint
- `.github/workflows/**`, `vercel.json` — CI and deploy

## Summary format

Start with a count: "N findings: X blockers, Y nits", then the list.
