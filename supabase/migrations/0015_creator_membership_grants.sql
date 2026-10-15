-- The membership table is accessed through Supabase PostgREST by both the
-- authenticated owner session and the server-only service client. RLS still
-- decides which rows each caller may use; these grants allow the table
-- operations to reach the RLS policies in the first place.
grant select, insert, update, delete on table public.creator_members to authenticated;
grant select, insert, update, delete on table public.creator_members to service_role;

grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to service_role;
