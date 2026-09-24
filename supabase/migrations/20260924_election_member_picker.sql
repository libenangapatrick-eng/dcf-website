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
        coalesce(m.full_name, '')::text,
        coalesce(m.phone, '')::text,
        coalesce(m.email, '')::text,
        coalesce(m.passport_no, '')::text,
        coalesce(m.passport_image_url, '')::text
    from public.members m
    order by lower(coalesce(m.full_name, '')), m.id;
end;
$$;

revoke all on function public.dcf_election_members_admin() from public;
grant execute on function public.dcf_election_members_admin() to authenticated;
