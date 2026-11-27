-- T005 — team members, role/active helpers, row-level security and the last-admin guard.
-- Spec lead-inbox AC12 (sales sees everyone), AC15 (deactivated members are denied),
-- AC27 (the CRM can never be left without an active admin). Constitution P4, P16.

-- Closed by default ------------------------------------------------------------------------------
-- Supabase grants visitors (anon) and signed-in users (authenticated) full access to every NEW
-- table and function in `public`. Switch that off once, here, so each later migration must grant
-- exactly what it needs (plan: no INSERT/UPDATE/DELETE for anon or authenticated on any table).
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
-- Postgres also lets everyone (PUBLIC) run every new function, and a per-schema rule cannot take
-- that away: only this global one can. Without it any later function is callable by visitors.
alter default privileges revoke execute on functions from public;

-- Members ---------------------------------------------------------------------------------------
create table public.members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  -- lower-case, no whitespace anywhere (spaces, tabs, line breaks), not empty
  email      text not null unique check (email = lower(email) and email ~ '^\S+$'),
  role       text not null check (role in ('admin', 'sales')),
  active     boolean not null default true,
  invited_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.members is
  'One row per CRM team member. Written only through the member functions (T008) and invites.';

alter table public.members enable row level security;

-- Nobody writes the table directly: not visitors, not signed-in users, not even admins.
-- Changes go through security-definer functions that check the caller (T008).
revoke all on table public.members from anon, authenticated;
grant select on table public.members to authenticated;

-- Helpers (used by every table's policies) ------------------------------------------------------
-- security definer: they read members without being blocked by members' own policy.
-- search_path is empty so no object can be swapped in under an unqualified name.
create function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.user_id = (select auth.uid()) and m.active
  );
$$;

create function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.user_id = (select auth.uid()) and m.active and m.role = 'admin'
  );
$$;

revoke execute on function public.is_active_member() from public, anon;
revoke execute on function public.is_active_admin() from public, anon;
grant execute on function public.is_active_member() to authenticated;
grant execute on function public.is_active_admin() to authenticated;

-- Policies ----------------------------------------------------------------------------------------
create policy "active members read all members"
  on public.members
  for select
  to authenticated
  using ((select public.is_active_member()));

-- Last active admin -------------------------------------------------------------------------------
-- Row triggers fire for every writer, the table owner and service role included. Together with
-- the TRUNCATE block below and the fixed user_id, no insert, update, delete or truncate can remove
-- the last active admin. (Schema changes by the owner, such as disabling the trigger, are outside
-- this guard: only migrations do those.)
-- The advisory lock serialises admin changes: two admins demoting each other at the same moment
-- cannot both succeed (the second sees the first's committed change once it gets the lock). This
-- relies on the default READ COMMITTED isolation; the member functions (T008) must keep it.
create function public.members_keep_an_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A member row belongs to one sign-in account for life; moving it would carry the role along.
  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'IMMUTABLE_USER_ID' using errcode = 'P0001';
  end if;

  if old.role = 'admin' and old.active
     and (tg_op = 'DELETE' or new.role <> 'admin' or not new.active) then
    perform pg_advisory_xact_lock(hashtext('public.members.active_admins'));
    if not exists (
      select 1 from public.members m
      where m.role = 'admin' and m.active and m.user_id <> old.user_id
    ) then
      raise exception 'LAST_ADMIN' using errcode = 'P0001';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

revoke execute on function public.members_keep_an_admin() from public, anon, authenticated;

create trigger members_keep_an_admin
  before update of user_id, role, active or delete on public.members
  for each row
  execute function public.members_keep_an_admin();

-- TRUNCATE skips row triggers, so it is refused outright (members leave one row at a time).
create function public.members_refuse_truncate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'TRUNCATE_FORBIDDEN' using errcode = 'P0001';
end;
$$;

revoke execute on function public.members_refuse_truncate() from public, anon, authenticated;

create trigger members_refuse_truncate
  before truncate on public.members
  for each statement
  execute function public.members_refuse_truncate();
