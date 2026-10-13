-- Creator Studio team access.
--
-- The first creator profile remains the owner. Additional people are invited
-- by email, then claimed the first time they authenticate with Supabase Auth.
create type public.creator_member_role as enum ('owner', 'admin');
create type public.creator_member_status as enum ('pending', 'active', 'revoked');

create table public.creator_members (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  role public.creator_member_role not null default 'admin',
  status public.creator_member_status not null default 'pending',
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_members_email_lowercase check (email = lower(email)),
  constraint creator_members_owner_active check (role <> 'owner' or status = 'active')
);

create unique index creator_members_unique_email on public.creator_members(creator_id, email);
create unique index creator_members_unique_user on public.creator_members(creator_id, user_id) where user_id is not null;
create index creator_members_lookup on public.creator_members(email, status);

alter table public.creator_members enable row level security;

create or replace function public.is_creator_member(target_creator_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.creator_members member
    where member.creator_id = target_creator_id
      and member.user_id = auth.uid()
      and member.status = 'active'
  )
  or exists (
    select 1
    from public.creator_profiles profile
    where profile.id = target_creator_id
      and profile.id = auth.uid()
  );
$$;

create or replace function public.is_creator_owner(target_creator_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.creator_profiles profile
    where profile.id = target_creator_id
      and profile.id = auth.uid()
  );
$$;

grant execute on function public.is_creator_member(uuid) to anon, authenticated;
grant execute on function public.is_creator_owner(uuid) to authenticated;

create policy "members view creator team"
on public.creator_members
for select
to authenticated
using (public.is_creator_member(creator_id));

create policy "owners manage creator team"
on public.creator_members
for all
to authenticated
using (public.is_creator_owner(creator_id))
with check (public.is_creator_owner(creator_id));

-- Replace owner-only predicates with the membership helper so admins have the
-- same content-management rights without weakening public visibility rules.
drop policy if exists "owners manage collections" on public.collections;
create policy "members manage collections" on public.collections
for all using (public.is_creator_member(creator_id))
with check (public.is_creator_member(creator_id));

drop policy if exists "owners manage products" on public.products;
create policy "members manage products" on public.products
for all using (public.is_creator_member(creator_id))
with check (public.is_creator_member(creator_id));

drop policy if exists "owners manage offers" on public.product_offers;
create policy "members manage offers" on public.product_offers
for all using (
  exists (
    select 1 from public.products product
    where product.id = product_id
      and public.is_creator_member(product.creator_id)
  )
)
with check (
  exists (
    select 1 from public.products product
    where product.id = product_id
      and public.is_creator_member(product.creator_id)
  )
);

drop policy if exists "owners manage media" on public.product_media;
create policy "members manage media" on public.product_media
for all using (
  exists (
    select 1 from public.products product
    where product.id = product_id
      and public.is_creator_member(product.creator_id)
  )
)
with check (
  exists (
    select 1 from public.products product
    where product.id = product_id
      and public.is_creator_member(product.creator_id)
  )
);

drop policy if exists "owners manage social links" on public.social_links;
create policy "members manage social links" on public.social_links
for all using (public.is_creator_member(creator_id))
with check (public.is_creator_member(creator_id));

drop policy if exists "owners manage import batches" on public.import_batches;
create policy "members manage import batches" on public.import_batches
for all using (public.is_creator_member(creator_id))
with check (public.is_creator_member(creator_id));

drop policy if exists "owners manage import rows" on public.import_rows;
create policy "members manage import rows" on public.import_rows
for all using (
  exists (
    select 1
    from public.import_batches batch
    where batch.id = batch_id
      and public.is_creator_member(batch.creator_id)
  )
)
with check (
  exists (
    select 1
    from public.import_batches batch
    where batch.id = batch_id
      and public.is_creator_member(batch.creator_id)
  )
);

drop policy if exists "owners view their click metrics" on public.outbound_clicks;
create policy "members view creator click metrics" on public.outbound_clicks
for select using (
  exists (
    select 1
    from public.product_offers offer
    join public.products product on product.id = offer.product_id
    where offer.id = offer_id
      and public.is_creator_member(product.creator_id)
  )
);

drop policy if exists "owners insert creator videos" on public.creator_videos;
create policy "members insert creator videos" on public.creator_videos
for insert to authenticated
with check (public.is_creator_member(creator_id));

drop policy if exists "owners update creator videos" on public.creator_videos;
create policy "members update creator videos" on public.creator_videos
for update to authenticated
using (public.is_creator_member(creator_id))
with check (public.is_creator_member(creator_id));

drop policy if exists "owners delete creator videos" on public.creator_videos;
create policy "members delete creator videos" on public.creator_videos
for delete to authenticated
using (public.is_creator_member(creator_id));

-- Keep the existing profile owner policy, but let team members see the public
-- profile and let the owner remain the only person who can edit identity data.
