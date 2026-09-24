-- DCF ONLINE SYSTEM — ELECTION / VOTING MODULE
-- Run this entire file in Supabase SQL Editor.
-- It adds election positions, elections, candidates, votes and secure result RPCs.

create extension if not exists pgcrypto;

create table if not exists public.election_positions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 0,
  active boolean not null default true
);

insert into public.election_positions (name, display_order) values
('Mwenyekiti', 1),
('Mwenyekiti Msaidizi', 2),
('Katibu', 3),
('Katibu Msaidizi', 4),
('Mtunza Hazina', 5)
on conflict (name) do nothing;

create table if not exists public.elections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  closed_at timestamptz,
  check (ends_at > starts_at)
);

create table if not exists public.election_candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  position_id uuid not null references public.election_positions(id),
  member_id uuid references public.members(id) on delete set null,
  passport_no text not null,
  full_name text not null,
  phone text,
  photo_url text,
  candidate_number text not null,
  created_at timestamptz not null default now(),
  unique (election_id, position_id, candidate_number),
  unique (election_id, position_id, passport_no)
);

create table if not exists public.election_votes (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  position_id uuid not null references public.election_positions(id),
  candidate_id uuid not null references public.election_candidates(id) on delete cascade,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (election_id, position_id, voter_user_id)
);

create index if not exists idx_election_candidates_election on public.election_candidates(election_id);
create index if not exists idx_election_candidates_position on public.election_candidates(position_id);
create index if not exists idx_election_votes_election on public.election_votes(election_id);
create index if not exists idx_election_votes_candidate on public.election_votes(candidate_id);
create index if not exists idx_election_votes_voter on public.election_votes(voter_user_id);

-- Admin helper.
create or replace function public.dcf_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and lower(coalesce(p.role,'')) = 'admin'
  );
$$;

grant execute on function public.dcf_is_admin() to authenticated;

-- Keep candidate data synchronized from the member record when desired.
create or replace function public.dcf_member_by_passport(p_passport text)
returns table (
  member_id uuid,
  full_name text,
  phone text,
  photo_url text,
  passport_no text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.full_name,
    m.phone,
    coalesce(m.passport_image_url, m.photo_url, m.avatar_url, '') as photo_url,
    m.passport_no
  from public.members m
  where lower(trim(coalesce(m.passport_no,''))) = lower(trim(p_passport))
  limit 1;
$$;

grant execute on function public.dcf_member_by_passport(text) to authenticated;

-- Aggregate results only. It never returns voter identities.
create or replace function public.get_election_results(p_election_id uuid)
returns table (
  candidate_id uuid,
  election_id uuid,
  position_id uuid,
  position_name text,
  candidate_number text,
  full_name text,
  phone text,
  photo_url text,
  vote_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.election_id,
    c.position_id,
    p.name,
    c.candidate_number,
    c.full_name,
    c.phone,
    c.photo_url,
    count(v.id)::bigint
  from public.election_candidates c
  join public.election_positions p on p.id = c.position_id
  left join public.election_votes v on v.candidate_id = c.id
  where c.election_id = p_election_id
  group by c.id, c.election_id, c.position_id, p.name,
           c.candidate_number, c.full_name, c.phone, c.photo_url, p.display_order
  order by p.display_order, count(v.id) desc, c.candidate_number;
$$;

grant execute on function public.get_election_results(uuid) to authenticated;

-- Security: members may vote only while the election is published and within time.
create or replace function public.dcf_vote_is_open(p_election uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.elections e
    where e.id = p_election
      and e.status = 'published'
      and now() >= e.starts_at
      and now() < e.ends_at
  );
$$;

grant execute on function public.dcf_vote_is_open(uuid) to authenticated;

alter table public.elections enable row level security;
alter table public.election_positions enable row level security;
alter table public.election_candidates enable row level security;
alter table public.election_votes enable row level security;

drop policy if exists "elections_read_authenticated" on public.elections;
create policy "elections_read_authenticated"
on public.elections for select to authenticated
using (status in ('published','closed') or public.dcf_is_admin());

drop policy if exists "elections_admin_insert" on public.elections;
create policy "elections_admin_insert"
on public.elections for insert to authenticated
with check (public.dcf_is_admin());

drop policy if exists "elections_admin_update" on public.elections;
create policy "elections_admin_update"
on public.elections for update to authenticated
using (public.dcf_is_admin())
with check (public.dcf_is_admin());

drop policy if exists "elections_admin_delete" on public.elections;
create policy "elections_admin_delete"
on public.elections for delete to authenticated
using (public.dcf_is_admin());

drop policy if exists "positions_read_authenticated" on public.election_positions;
create policy "positions_read_authenticated"
on public.election_positions for select to authenticated
using (active or public.dcf_is_admin());

drop policy if exists "positions_admin_all" on public.election_positions;
create policy "positions_admin_all"
on public.election_positions for all to authenticated
using (public.dcf_is_admin())
with check (public.dcf_is_admin());

drop policy if exists "candidates_read_authenticated" on public.election_candidates;
create policy "candidates_read_authenticated"
on public.election_candidates for select to authenticated
using (
  public.dcf_is_admin()
  or exists (
    select 1 from public.elections e
    where e.id = election_id and e.status in ('published','closed')
  )
);

drop policy if exists "candidates_admin_insert" on public.election_candidates;
create policy "candidates_admin_insert"
on public.election_candidates for insert to authenticated
with check (public.dcf_is_admin());

drop policy if exists "candidates_admin_update" on public.election_candidates;
create policy "candidates_admin_update"
on public.election_candidates for update to authenticated
using (public.dcf_is_admin())
with check (public.dcf_is_admin());

drop policy if exists "candidates_admin_delete" on public.election_candidates;
create policy "candidates_admin_delete"
on public.election_candidates for delete to authenticated
using (public.dcf_is_admin());

drop policy if exists "votes_read_own_or_admin" on public.election_votes;
create policy "votes_read_own_or_admin"
on public.election_votes for select to authenticated
using (voter_user_id = auth.uid() or public.dcf_is_admin());

drop policy if exists "votes_insert_member" on public.election_votes;
create policy "votes_insert_member"
on public.election_votes for insert to authenticated
with check (
  voter_user_id = auth.uid()
  and public.dcf_vote_is_open(election_id)
  and exists (
    select 1 from public.members m
    where m.user_id = auth.uid()
  )
  and exists (
    select 1 from public.election_candidates c
    where c.id = candidate_id
      and c.election_id = election_votes.election_id
      and c.position_id = election_votes.position_id
  )
);

-- Votes are immutable: no update/delete from the client.
drop policy if exists "votes_no_update" on public.election_votes;
create policy "votes_no_update"
on public.election_votes for update to authenticated
using (false);

drop policy if exists "votes_no_delete" on public.election_votes;
create policy "votes_no_delete"
on public.election_votes for delete to authenticated
using (false);


-- Atomic voting RPC: all selected positions are inserted together or none are.
create or replace function public.cast_election_votes(
  p_election_id uuid,
  p_votes jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  inserted_count integer := 0;
  v_candidate uuid;
  v_position uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.dcf_vote_is_open(p_election_id) then
    raise exception 'Voting is closed or not yet open';
  end if;

  if not exists (select 1 from public.members m where m.user_id = auth.uid()) then
    raise exception 'Only registered members can vote';
  end if;

  for item in select * from jsonb_array_elements(coalesce(p_votes,'[]'::jsonb))
  loop
    v_candidate := (item->>'candidate_id')::uuid;
    v_position := (item->>'position_id')::uuid;

    if exists (
      select 1 from public.election_votes
      where election_id = p_election_id
        and position_id = v_position
        and voter_user_id = auth.uid()
    ) then
      raise exception 'You have already voted for one or more selected positions';
    end if;

    if not exists (
      select 1
      from public.election_candidates c
      where c.id = v_candidate
        and c.election_id = p_election_id
        and c.position_id = v_position
    ) then
      raise exception 'Invalid candidate selection';
    end if;

    insert into public.election_votes(election_id,position_id,candidate_id,voter_user_id)
    values(p_election_id,v_position,v_candidate,auth.uid());

    inserted_count := inserted_count + 1;
  end loop;

  return inserted_count;
end;
$$;

grant execute on function public.cast_election_votes(uuid,jsonb) to authenticated;

-- Automatic closing function. The frontend also checks time on every load.
create or replace function public.auto_close_dcf_elections()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.elections
  set status = 'closed',
      closed_at = coalesce(closed_at, now())
  where status = 'published'
    and ends_at <= now();
end;
$$;

-- If pg_cron is enabled in this Supabase project, run this once:
-- select cron.schedule(
--   'dcf-auto-close-elections',
--   '* * * * *',
--   $$select public.auto_close_dcf_elections();$$
-- );
