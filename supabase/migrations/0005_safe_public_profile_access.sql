-- Public product routes need a handle lookup, but never an email address or owner-only fields.
revoke all on public.creator_profiles from anon;
grant select (id, handle, display_name, tagline, profile_image_url, affiliate_disclosure) on public.creator_profiles to anon;

drop policy if exists "creator profile select own" on public.creator_profiles;
create policy "creator profile public display fields" on public.creator_profiles for select to anon using (true);
create policy "creator profile select own" on public.creator_profiles for select to authenticated using ((select auth.uid()) = id);

alter view public.public_creator_profiles set (security_invoker = true);
