-- ============================================================
-- FIX DCF ELECTION CANDIDATE UNIQUE CONSTRAINT
-- Passport must NOT determine candidate uniqueness.
-- member_id determines candidate identity.
-- ============================================================

-- 1. Remove the WRONG passport-based unique constraint
alter table public.election_candidates
drop constraint if exists election_candidates_election_id_position_id_passport_no_key;

-- 2. Remove possible old unique indexes based on passport
drop index if exists public.election_candidates_election_id_position_id_passport_no_key;

drop index if exists public.idx_election_candidates_passport;

-- 3. Prevent the SAME MEMBER from being added twice
--    to the SAME position in the SAME election.
create unique index if not exists
election_candidates_election_position_member_key
on public.election_candidates
(
    election_id,
    position_id,
    member_id
);

-- 4. Candidate number should also be unique within
--    one position of one election.
create unique index if not exists
election_candidates_election_position_number_key
on public.election_candidates
(
    election_id,
    position_id,
    candidate_number
);

-- 5. Maximum 10 candidates per position
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
      and id <> coalesce(
          new.id,
          '00000000-0000-0000-0000-000000000000'::uuid
      );

    if candidate_count >= 10 then
        raise exception
        'Nafasi hii tayari ina wagombea 10. Maximum ni wagombea 10 kwa kila nafasi.';
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

-- 6. Make sure candidate number is numeric
create or replace function public.dcf_validate_candidate_number()
returns trigger
language plpgsql
as $$
begin

    if trim(coalesce(new.candidate_number,'')) = '' then
        raise exception 'Namba ya mgombea inahitajika';
    end if;

    if trim(new.candidate_number) !~ '^[0-9]+$' then
        raise exception 'Namba ya mgombea lazima iwe namba tu';
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

-- ============================================================
-- DONE
-- ============================================================
