create table public.creator_videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete restrict,
  linked_product_id uuid references public.products(id) on delete set null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 140),
  summary text not null default '' check (char_length(summary) <= 600),
  alt_text text not null default '' check (char_length(alt_text) <= 240),
  tiktok_post_url text not null check (tiktok_post_url ~ '^https://(www\.)?tiktok\.com/@[^/?#]+/video/[0-9]+/?(\?.*)?$'),
  thumbnail_url text not null check (thumbnail_url ~ '^https://'),
  status public.product_status not null default 'draft',
  display_order integer not null default 0 check (display_order between 0 and 10000),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_id, slug),
  unique (creator_id, tiktok_post_url)
);

create index creator_videos_creator_status_order_index on public.creator_videos (creator_id, status, published_at desc, display_order);
create index creator_videos_collection_status_order_index on public.creator_videos (collection_id, status, display_order);
create index creator_videos_linked_product_index on public.creator_videos (linked_product_id) where linked_product_id is not null;

alter table public.creator_videos enable row level security;

grant select on table public.creator_videos to anon, authenticated;
grant insert, update, delete on table public.creator_videos to authenticated;

create policy "anonymous visitors view published creator videos"
on public.creator_videos
for select
to anon
using (
  status = 'published'
  and exists (
    select 1
    from public.collections collection
    where collection.id = collection_id
      and collection.status = 'published'
  )
);

create policy "authenticated viewers access published or owned creator videos"
on public.creator_videos
for select
to authenticated
using (
  creator_id = (select auth.uid())
  or (
    status = 'published'
    and exists (
      select 1
      from public.collections collection
      where collection.id = collection_id
        and collection.status = 'published'
    )
  )
);

create policy "owners insert creator videos"
on public.creator_videos
for insert
to authenticated
with check (creator_id = (select auth.uid()));

create policy "owners update creator videos"
on public.creator_videos
for update
to authenticated
using (creator_id = (select auth.uid()))
with check (creator_id = (select auth.uid()));

create policy "owners delete creator videos"
on public.creator_videos
for delete
to authenticated
using (creator_id = (select auth.uid()));

create or replace function public.assert_creator_video_references_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.collections collection
    where collection.id = new.collection_id
      and collection.creator_id = new.creator_id
  ) then
    raise exception 'Creator video collection must belong to the same creator';
  end if;

  if new.linked_product_id is not null and not exists (
    select 1
    from public.products product
    where product.id = new.linked_product_id
      and product.creator_id = new.creator_id
  ) then
    raise exception 'Creator video product must belong to the same creator';
  end if;

  return new;
end;
$$;

create trigger creator_videos_reference_owner
before insert or update of creator_id, collection_id, linked_product_id
on public.creator_videos
for each row execute function public.assert_creator_video_references_owner();
