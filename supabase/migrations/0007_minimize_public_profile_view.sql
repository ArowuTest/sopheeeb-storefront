drop view public.public_creator_profiles;
create view public.public_creator_profiles
with (security_invoker = true)
as
select id, handle, display_name, tagline, profile_image_url, affiliate_disclosure
from public.creator_profiles;

grant select on public.public_creator_profiles to anon, authenticated;
