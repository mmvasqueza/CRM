-- T005 — members table, role/active helpers, RLS and the last-admin guard (AC12, AC15, AC27).
-- Runs with `supabase test db`; everything happens inside one transaction that is rolled back.
begin;
create extension if not exists pgtap with schema extensions;

select plan(45);

-- Fixtures (as the table owner: RLS does not apply, triggers do).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@example.com'),
  ('00000000-0000-0000-0000-0000000000a2', 'sales@example.com'),
  ('00000000-0000-0000-0000-0000000000a3', 'gone@example.com'),
  ('00000000-0000-0000-0000-0000000000a4', 'second-admin@example.com'),
  ('00000000-0000-0000-0000-0000000000a5', 'new@example.com'),
  ('00000000-0000-0000-0000-0000000000a6', 'old-admin@example.com');

insert into public.members (user_id, email, role, active) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@example.com', 'admin', true),
  ('00000000-0000-0000-0000-0000000000a2', 'sales@example.com', 'sales', true),
  ('00000000-0000-0000-0000-0000000000a3', 'gone@example.com', 'sales', false),
  ('00000000-0000-0000-0000-0000000000a6', 'old-admin@example.com', 'admin', false);

-- Shape ---------------------------------------------------------------------------------------
select has_table('public', 'members', 'members table exists');
select col_is_pk('public', 'members', 'user_id', 'one row per auth user');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.members'::regclass),
  'row-level security is enabled on members'
);
select throws_ok(
  $$insert into public.members (user_id, email, role)
    values ('00000000-0000-0000-0000-0000000000a5', 'new@example.com', 'owner')$$,
  '23514', null, 'a role other than admin or sales is refused'
);
select throws_ok(
  $$insert into public.members (user_id, email, role)
    values ('00000000-0000-0000-0000-0000000000a5', 'New@Example.com', 'sales')$$,
  '23514', null, 'an email that is not lower-case and trimmed is refused'
);
select throws_ok(
  $$insert into public.members (user_id, email, role)
    values ('00000000-0000-0000-0000-0000000000a5', ' new@example.com', 'sales')$$,
  '23514', null, 'an email with a leading space is refused'
);
select throws_ok(
  $$insert into public.members (user_id, email, role)
    values ('00000000-0000-0000-0000-0000000000a5', E'new@example.com\t', 'sales')$$,
  '23514', null, 'an email with a tab is refused'
);
select throws_ok(
  $$insert into public.members (user_id, email, role)
    values ('00000000-0000-0000-0000-0000000000a5', 'sales@example.com', 'sales')$$,
  '23505', null, 'two members cannot share an email'
);
select throws_ok(
  $$insert into public.members (user_id, email, role)
    values ('00000000-0000-0000-0000-0000000000ff', 'ghost@example.com', 'sales')$$,
  '23503', null, 'a member must belong to an existing sign-in account'
);

-- Active sales member (AC12: sees everyone; no direct writes) ------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);

select is((select count(*)::int from public.members), 4,
  'an active sales member reads every member');
select ok(public.is_active_member(), 'is_active_member() is true for an active sales member');
select ok(not public.is_active_admin(), 'is_active_admin() is false for a sales member');
select throws_ok(
  $$update public.members set role = 'admin'
    where user_id = '00000000-0000-0000-0000-0000000000a2'$$,
  '42501', null, 'a sales member cannot promote themself by writing the table'
);
select throws_ok(
  $$insert into public.members (user_id, email, role)
    values ('00000000-0000-0000-0000-0000000000a5', 'new@example.com', 'admin')$$,
  '42501', null, 'a sales member cannot add a member by writing the table'
);
select throws_ok($$delete from public.members$$, '42501', null,
  'a sales member cannot delete members');

-- Active admin: reads, but writes only through the member functions (T008) ----------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select ok(public.is_active_admin(), 'is_active_admin() is true for an active admin');
select ok(public.is_active_member(), 'an active admin is also an active member');
select throws_ok(
  $$update public.members set active = false
    where user_id = '00000000-0000-0000-0000-0000000000a2'$$,
  '42501', null, 'even an admin cannot write the table directly'
);

-- Deactivated member (AC15: RLS denies them) ----------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);

select is((select count(*)::int from public.members), 0,
  'a deactivated member reads no members');
select ok(not public.is_active_member(), 'is_active_member() is false once deactivated');

select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a6","role":"authenticated"}', true);

select ok(not public.is_active_admin(), 'a deactivated admin loses admin rights');
select is((select count(*)::int from public.members), 0,
  'a deactivated admin reads no members');

-- Signed-in user who is not a member --------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a5","role":"authenticated"}', true);

select is((select count(*)::int from public.members), 0,
  'a signed-in user without a member row reads no members');

-- Signed out (anon) ---------------------------------------------------------------------------
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok($$select count(*) from public.members$$, '42501', null,
  'a signed-out visitor cannot read members');
select throws_ok($$select public.is_active_member()$$, '42501', null,
  'a signed-out visitor cannot call is_active_member()');
select throws_ok($$select public.is_active_admin()$$, '42501', null,
  'a signed-out visitor cannot call is_active_admin()');

-- Signed in, but the token names no user (auth.uid() is null) --------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);

select ok(not public.is_active_member() and not public.is_active_admin(),
  'a session without a user id is neither a member nor an admin');

-- Last active admin (AC27), checked even for the table owner --------------------------------
reset role;

select throws_ok(
  $$update public.members set role = 'sales'
    where user_id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'LAST_ADMIN', 'demoting the last active admin is refused'
);
select throws_ok(
  $$update public.members set active = false
    where user_id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'LAST_ADMIN', 'deactivating the last active admin is refused'
);
select throws_ok(
  $$delete from public.members where user_id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'LAST_ADMIN', 'removing the last active admin is refused'
);

insert into public.members (user_id, email, role, active) values
  ('00000000-0000-0000-0000-0000000000a4', 'second-admin@example.com', 'admin', false);

select throws_ok(
  $$update public.members set role = 'sales'
    where user_id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'LAST_ADMIN', 'a deactivated admin does not count as a remaining admin'
);

update public.members set active = true
  where user_id = '00000000-0000-0000-0000-0000000000a4';

-- Two active admins now: one statement still cannot remove both.
select throws_ok(
  $$update public.members set role = 'sales' where role = 'admin' and active$$,
  'P0001', 'LAST_ADMIN', 'demoting every admin in one statement is refused'
);
select throws_ok(
  $$delete from auth.users where id in ('00000000-0000-0000-0000-0000000000a1',
                                       '00000000-0000-0000-0000-0000000000a4')$$,
  'P0001', 'LAST_ADMIN', 'removing the sign-in accounts of every admin is refused (cascade)'
);

select lives_ok(
  $$update public.members set role = 'sales'
    where user_id = '00000000-0000-0000-0000-0000000000a1'$$,
  'an admin can be demoted while another active admin remains'
);
select throws_ok(
  $$update public.members set active = false
    where user_id = '00000000-0000-0000-0000-0000000000a4'$$,
  'P0001', 'LAST_ADMIN', 'the remaining admin is now the last one and is protected'
);
select is(
  (select count(*)::int from public.members where role = 'admin' and active),
  1, 'exactly one active admin remains'
);
-- A null would slip past the guard's comparisons, so role and active can never be null.
select throws_ok(
  $$update public.members set active = null
    where user_id = '00000000-0000-0000-0000-0000000000a4'$$,
  '23502', null, 'active can never be emptied (it would hide the last admin from the guard)'
);
select throws_ok(
  $$update public.members set role = null
    where user_id = '00000000-0000-0000-0000-0000000000a4'$$,
  '23502', null, 'role can never be emptied (it would hide the last admin from the guard)'
);

-- No owner-level bypass of the guard --------------------------------------------------------
select throws_ok($$truncate public.members$$, 'P0001', 'TRUNCATE_FORBIDDEN',
  'emptying the whole table at once is refused (it would skip the per-row guard)');
select throws_ok(
  $$update public.members set user_id = '00000000-0000-0000-0000-0000000000a5'
    where user_id = '00000000-0000-0000-0000-0000000000a4'$$,
  'P0001', 'IMMUTABLE_USER_ID', 'a member row cannot be moved to another sign-in account'
);

insert into public.members (user_id, email, role) values
  ('00000000-0000-0000-0000-0000000000a5', 'new@example.com', 'sales');
select ok(
  (select active from public.members where user_id = '00000000-0000-0000-0000-0000000000a5'),
  'a new member starts active'
);

delete from auth.users where id = '00000000-0000-0000-0000-0000000000a3';
select is(
  (select count(*)::int from public.members where user_id = '00000000-0000-0000-0000-0000000000a3'),
  0, 'removing a sign-in account removes its member row'
);

-- Tables created by later migrations start closed (no anon/authenticated access) ------------
create table public.zz_default_privileges_probe (id int);
select ok(
  not has_table_privilege('anon', 'public.zz_default_privileges_probe', 'select, insert, update, delete')
  and not has_table_privilege('authenticated', 'public.zz_default_privileges_probe', 'select, insert, update, delete'),
  'a new table grants nothing to anon or authenticated until a migration says so'
);
create sequence public.zz_default_privileges_seq;
select ok(
  not has_sequence_privilege('anon', 'public.zz_default_privileges_seq', 'usage, select, update')
  and not has_sequence_privilege('authenticated', 'public.zz_default_privileges_seq', 'usage, select, update'),
  'a new sequence grants nothing to anon or authenticated until a migration says so'
);
create function public.zz_default_privileges_fn() returns int language sql as 'select 1';
select ok(
  not has_function_privilege('anon', 'public.zz_default_privileges_fn()', 'execute')
  and not has_function_privilege('authenticated', 'public.zz_default_privileges_fn()', 'execute'),
  'a new function cannot be called by anon or authenticated until a migration says so'
);

select * from finish();
rollback;
