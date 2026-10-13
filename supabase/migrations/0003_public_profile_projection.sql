-- Public callers never need direct access to a creator's private contact fields.
create or replace view public.public_creator_profiles
with (security_invoker = false)
as
select
  id,
  handle,
  display_name,
  tagline,
  profile_image_url,
  affiliate_disclosure,
  case when contact_visible then contact_email else null end as contact_email
from public.creator_profiles;

grant select on public.public_creator_profiles to anon, authenticated;
