-- ============================================================
-- DCF ELECTION VOTING RULES
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- DEFAULT POSITIONS
-- ------------------------------------------------------------

insert into public.election_positions
(name, display_order, active)
values
('Mwenyekiti', 1, true),
('Mwenyekiti Msaidizi', 2, true),
('Katibu', 3, true),
('Katibu Msaidizi', 4, true),
('Mtunza Hazina', 5, true)
on conflict (name) do update
set active = true;

-- ------------------------------------------------------------
-- ONLY ONE VOTE PER MEMBER PER POSITION
-- Already protected by the unique constraint, reinforce it.
-- ------------------------------------------------------------

create unique index if not exists
idx_one_vote_per_member_position
on public.election_votes
(election_id, position_id, voter_user_id);

-- ------------------------------------------------------------
-- MAXIMUM 10 CANDIDATES PER POSITION
-- ------------------------------------------------------------

create or replace function public.dcf_check_max_10_candidates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    candidate_count integer;
begin

    select count(*)
    into candidate_count
    from public.election_candidates
    where election_id = new.election_id
      and position_id = new.position_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

    if candidate_count >= 10 then
        raise exception 'Maximum 10 candidates are allowed for each position';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_max_10_candidates
on public.election_candidates;

create trigger trg_max_10_candidates
before insert or update of election_id, position_id
on public.election_candidates
for each row
execute function public.dcf_check_max_10_candidates();

-- ------------------------------------------------------------
-- CANDIDATE NUMBER MUST BE NUMERIC
-- ------------------------------------------------------------

create or replace function public.dcf_validate_candidate_number()
returns trigger
language plpgsql
as $$
begin

    if trim(coalesce(new.candidate_number,'')) = '' then
        raise exception 'Candidate number is required';
    end if;

    if trim(new.candidate_number) !~ '^[0-9]+$' then
        raise exception 'Candidate number must contain numbers only';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validate_candidate_number
on public.election_candidates;

create trigger trg_validate_candidate_number
before insert or update of candidate_number
on public.election_candidates
for each row
execute function public.dcf_validate_candidate_number();

-- ------------------------------------------------------------
-- RESULTS
--
-- 1. Most votes wins.
-- 2. If votes tie, higher candidate number wins.
-- ------------------------------------------------------------

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
    vote_count bigint,
    winner boolean
)
language sql
stable
security definer
set search_path = public
as $$
    with results as (
        select
            c.id as candidate_id,
            c.election_id,
            c.position_id,
            p.name as position_name,
            c.candidate_number,
            c.full_name,
            c.phone,
            c.photo_url,
            count(v.id)::bigint as vote_count,
            row_number() over (
                partition by c.position_id
                order by
                    count(v.id) desc,
                    case
                        when c.candidate_number ~ '^[0-9]+$'
                        then c.candidate_number::bigint
                        else 0
                    end desc,
                    c.id
            ) as rank_no
        from public.election_candidates c
        join public.election_positions p
          on p.id = c.position_id
        left join public.election_votes v
          on v.candidate_id = c.id
        where c.election_id = p_election_id
        group by
            c.id,
            c.election_id,
            c.position_id,
            p.name,
            p.display_order,
            c.candidate_number,
            c.full_name,
            c.phone,
            c.photo_url
    )
    select
        candidate_id,
        election_id,
        position_id,
        position_name,
        candidate_number,
        full_name,
        phone,
        photo_url,
        vote_count,
        rank_no = 1 as winner
    from results
    order by
        position_name,
        vote_count desc,
        case
            when candidate_number ~ '^[0-9]+$'
            then candidate_number::bigint
            else 0
        end desc;
$$;

grant execute on function public.get_election_results(uuid)
to authenticated;

-- ------------------------------------------------------------
-- OPEN / CLOSE / PUBLISH / UNPUBLISH
-- ADMIN ONLY
-- ------------------------------------------------------------

create or replace function public.dcf_publish_election(
    p_election_id uuid
)
returns public.elections
language plpgsql
security definer
set search_path = public
as $$
declare
    result_row public.elections;
begin

    if not public.dcf_is_admin() then
        raise exception 'Only administrators can publish elections';
    end if;

    if not exists (
        select 1
        from public.election_candidates c
        where c.election_id = p_election_id
    ) then
        raise exception 'Add candidates before publishing the election';
    end if;

    update public.elections
    set status = 'published',
        published_at = coalesce(published_at, now()),
        closed_at = null
    where id = p_election_id
    returning * into result_row;

    if result_row.id is null then
        raise exception 'Election not found';
    end if;

    return result_row;
end;
$$;

grant execute on function public.dcf_publish_election(uuid)
to authenticated;


create or replace function public.dcf_unpublish_election(
    p_election_id uuid
)
returns public.elections
language plpgsql
security definer
set search_path = public
as $$
declare
    result_row public.elections;
begin

    if not public.dcf_is_admin() then
        raise exception 'Only administrators can unpublish elections';
    end if;

    update public.elections
    set status = 'draft',
        closed_at = null
    where id = p_election_id
    returning * into result_row;

    if result_row.id is null then
        raise exception 'Election not found';
    end if;

    return result_row;
end;
$$;

grant execute on function public.dcf_unpublish_election(uuid)
to authenticated;


create or replace function public.dcf_close_election(
    p_election_id uuid
)
returns public.elections
language plpgsql
security definer
set search_path = public
as $$
declare
    result_row public.elections;
begin

    if not public.dcf_is_admin() then
        raise exception 'Only administrators can close elections';
    end if;

    update public.elections
    set status = 'closed',
        closed_at = coalesce(closed_at, now())
    where id = p_election_id
    returning * into result_row;

    if result_row.id is null then
        raise exception 'Election not found';
    end if;

    return result_row;
end;
$$;

grant execute on function public.dcf_close_election(uuid)
to authenticated;

-- ------------------------------------------------------------
-- AUTO CLOSE
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- ATOMIC MEMBER VOTING
--
-- One candidate per position.
-- A member can vote once for each position.
-- ------------------------------------------------------------

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
    v_candidate uuid;
    v_position uuid;
    inserted_count integer := 0;
    supplied_positions integer;
begin

    if auth.uid() is null then
        raise exception 'Not authenticated';
    end if;

    if not public.dcf_vote_is_open(p_election_id) then
        raise exception 'Voting is closed or not yet open';
    end if;

    if not exists (
        select 1
        from public.members m
        where m.user_id = auth.uid()
    ) then
        raise exception 'Only registered members can vote';
    end if;

    supplied_positions :=
        jsonb_array_length(coalesce(p_votes, '[]'::jsonb));

    if supplied_positions = 0 then
        raise exception 'Select at least one candidate';
    end if;

    for item in
        select *
        from jsonb_array_elements(coalesce(p_votes,'[]'::jsonb))
    loop

        v_candidate := (item->>'candidate_id')::uuid;
        v_position := (item->>'position_id')::uuid;

        -- Candidate must belong to this election and position.
        if not exists (
            select 1
            from public.election_candidates c
            where c.id = v_candidate
              and c.election_id = p_election_id
              and c.position_id = v_position
        ) then
            raise exception 'Invalid candidate selection';
        end if;

        -- Member can only vote once in this position.
        if exists (
            select 1
            from public.election_votes v
            where v.election_id = p_election_id
              and v.position_id = v_position
              and v.voter_user_id = auth.uid()
        ) then
            raise exception 'You have already voted for this position';
        end if;

        insert into public.election_votes(
            election_id,
            position_id,
            candidate_id,
            voter_user_id
        )
        values (
            p_election_id,
            v_position,
            v_candidate,
            auth.uid()
        );

        inserted_count := inserted_count + 1;

    end loop;

    return inserted_count;
end;
$$;

grant execute on function public.cast_election_votes(uuid,jsonb)
to authenticated;

-- ------------------------------------------------------------
-- MEMBER ELECTION DATA
-- ------------------------------------------------------------

create or replace function public.dcf_active_election()
returns setof public.elections
language sql
stable
security definer
set search_path = public
as $$
    select *
    from public.elections
    where status in ('published','closed')
    order by created_at desc
    limit 1;
$$;

grant execute on function public.dcf_active_election()
to authenticated;

create or replace function public.dcf_election_ballot(
    p_election_id uuid
)
returns table (
    position_id uuid,
    position_name text,
    position_order integer,
    candidate_id uuid,
    candidate_number text,
    full_name text,
    phone text,
    photo_url text
)
language sql
stable
security definer
set search_path = public
as $$
    select
        p.id,
        p.name,
        p.display_order,
        c.id,
        c.candidate_number,
        c.full_name,
        c.phone,
        c.photo_url
    from public.election_positions p
    join public.election_candidates c
      on c.position_id = p.id
     and c.election_id = p_election_id
    where p.active = true
    order by
        p.display_order,
        case
            when c.candidate_number ~ '^[0-9]+$'
            then c.candidate_number::bigint
            else 0
        end;
$$;

grant execute on function public.dcf_election_ballot(uuid)
to authenticated;

-- ------------------------------------------------------------
-- MEMBER'S OWN VOTES
-- ------------------------------------------------------------

create or replace function public.dcf_my_election_votes(
    p_election_id uuid
)
returns table (
    position_id uuid,
    candidate_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
    select
        v.position_id,
        v.candidate_id
    from public.election_votes v
    where v.election_id = p_election_id
      and v.voter_user_id = auth.uid();
$$;

grant execute on function public.dcf_my_election_votes(uuid)
to authenticated;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

alter table public.election_candidates enable row level security;
alter table public.election_votes enable row level security;
alter table public.elections enable row level security;
alter table public.election_positions enable row level security;

drop policy if exists "candidates_read_authenticated"
on public.election_candidates;

create policy "candidates_read_authenticated"
on public.election_candidates
for select
to authenticated
using (
    public.dcf_is_admin()
    or exists (
        select 1
        from public.elections e
        where e.id = election_id
          and e.status in ('published','closed')
    )
);

drop policy if exists "votes_insert_member"
on public.election_votes;

create policy "votes_insert_member"
on public.election_votes
for insert
to authenticated
with check (
    voter_user_id = auth.uid()
    and public.dcf_vote_is_open(election_id)
);

drop policy if exists "votes_read_own_or_admin"
on public.election_votes;

create policy "votes_read_own_or_admin"
on public.election_votes
for select
to authenticated
using (
    voter_user_id = auth.uid()
    or public.dcf_is_admin()
);

-- Never allow members to edit/delete votes.
drop policy if exists "votes_no_update"
on public.election_votes;

create policy "votes_no_update"
on public.election_votes
for update
to authenticated
using (false);

drop policy if exists "votes_no_delete"
on public.election_votes;

create policy "votes_no_delete"
on public.election_votes
for delete
to authenticated
using (false);

-- ------------------------------------------------------------
-- ADMIN MEMBER PICKER
-- ------------------------------------------------------------

create or replace function public.dcf_election_members_admin()
returns table (
    member_id bigint,
    full_name text,
    phone text,
    email text,
    passport_no text,
    passport_image_url text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin

    if not public.dcf_is_admin() then
        raise exception 'Only administrators can access election member list';
    end if;

    return query
    select
        m.id::bigint,
        coalesce(m.full_name,'')::text,
        coalesce(m.phone,'')::text,
        coalesce(m.email,'')::text,
        coalesce(m.passport_no,'')::text,
        coalesce(m.passport_image_url,'')::text
    from public.members m
    order by lower(coalesce(m.full_name,'')), m.id;

end;
$$;

revoke all
on function public.dcf_election_members_admin()
from public;

grant execute
on function public.dcf_election_members_admin()
to authenticated;
