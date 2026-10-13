-- Explicit Data API grants; RLS remains the authorisation boundary.
grant usage on schema public to anon, authenticated;
grant select on public.collections, public.products, public.product_offers, public.product_media, public.social_links to anon;
grant select, insert, update, delete on public.creator_profiles, public.collections, public.products, public.product_offers, public.product_media, public.social_links, public.import_batches, public.import_rows, public.outbound_clicks to authenticated;

-- Foreign-key indexes flagged by the Supabase performance advisor.
create index if not exists import_batches_creator_id_idx on public.import_batches(creator_id);
create index if not exists import_rows_batch_id_idx on public.import_rows(batch_id);
create index if not exists outbound_clicks_offer_id_idx on public.outbound_clicks(offer_id);
create index if not exists product_media_product_id_idx on public.product_media(product_id);
create index if not exists products_collection_id_idx on public.products(collection_id);
create index if not exists social_links_creator_id_idx on public.social_links(creator_id);

-- Keep user-facing records fresh without trusting browser timestamps.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.creator_profiles add column if not exists updated_at timestamptz not null default now();
alter table public.collections add column if not exists updated_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

drop trigger if exists creator_profiles_updated_at on public.creator_profiles;
create trigger creator_profiles_updated_at before update on public.creator_profiles for each row execute function public.set_updated_at();
drop trigger if exists collections_updated_at on public.collections;
create trigger collections_updated_at before update on public.collections for each row execute function public.set_updated_at();
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();

-- Replace broad, overlapping policies with explicit, indexed ownership checks.
drop policy if exists "profile owner" on public.creator_profiles;
drop policy if exists "public views published profiles" on public.creator_profiles;
drop policy if exists "owners manage their profile" on public.creator_profiles;
create policy "creator profile select own" on public.creator_profiles for select to authenticated using ((select auth.uid()) = id);
create policy "creator profile insert own" on public.creator_profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "creator profile update own" on public.creator_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "creator profile delete own" on public.creator_profiles for delete to authenticated using ((select auth.uid()) = id);

-- Preserve public storefront reads while limiting write operations to the owner.
drop policy if exists "collections public owner" on public.collections;
drop policy if exists "collections owner" on public.collections;
drop policy if exists "public views published collections" on public.collections;
drop policy if exists "owners manage collections" on public.collections;
create policy "collections select published or own" on public.collections for select using (status = 'published' or (select auth.uid()) = creator_id);
create policy "collections insert own" on public.collections for insert to authenticated with check ((select auth.uid()) = creator_id);
create policy "collections update own" on public.collections for update to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);
create policy "collections delete own" on public.collections for delete to authenticated using ((select auth.uid()) = creator_id);

drop policy if exists "products public owner" on public.products;
drop policy if exists "products owner" on public.products;
drop policy if exists "public views published products" on public.products;
drop policy if exists "owners manage products" on public.products;
create policy "products select published or own" on public.products for select using (status = 'published' or (select auth.uid()) = creator_id);
create policy "products insert own" on public.products for insert to authenticated with check ((select auth.uid()) = creator_id);
create policy "products update own" on public.products for update to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);
create policy "products delete own" on public.products for delete to authenticated using ((select auth.uid()) = creator_id);

drop policy if exists "offers public owner" on public.product_offers;
drop policy if exists "offers owner" on public.product_offers;
drop policy if exists "public views active published offers" on public.product_offers;
drop policy if exists "owners manage offers" on public.product_offers;
create policy "offers select public or own" on public.product_offers for select using (is_active and exists(select 1 from public.products p where p.id = product_id and (p.status = 'published' or p.creator_id = (select auth.uid()))));
create policy "offers insert own" on public.product_offers for insert to authenticated with check (exists(select 1 from public.products p where p.id = product_id and p.creator_id = (select auth.uid())));
create policy "offers update own" on public.product_offers for update to authenticated using (exists(select 1 from public.products p where p.id = product_id and p.creator_id = (select auth.uid()))) with check (exists(select 1 from public.products p where p.id = product_id and p.creator_id = (select auth.uid())));
create policy "offers delete own" on public.product_offers for delete to authenticated using (exists(select 1 from public.products p where p.id = product_id and p.creator_id = (select auth.uid())));

drop policy if exists "media public owner" on public.product_media;
drop policy if exists "media owner" on public.product_media;
drop policy if exists "public views media for published products" on public.product_media;
drop policy if exists "owners manage media" on public.product_media;
create policy "media select public or own" on public.product_media for select using (exists(select 1 from public.products p where p.id = product_id and (p.status = 'published' or p.creator_id = (select auth.uid()))));
create policy "media insert own" on public.product_media for insert to authenticated with check (exists(select 1 from public.products p where p.id = product_id and p.creator_id = (select auth.uid())));
create policy "media update own" on public.product_media for update to authenticated using (exists(select 1 from public.products p where p.id = product_id and p.creator_id = (select auth.uid()))) with check (exists(select 1 from public.products p where p.id = product_id and p.creator_id = (select auth.uid())));
create policy "media delete own" on public.product_media for delete to authenticated using (exists(select 1 from public.products p where p.id = product_id and p.creator_id = (select auth.uid())));

drop policy if exists "social public owner" on public.social_links;
drop policy if exists "social owner" on public.social_links;
drop policy if exists "public views enabled social links" on public.social_links;
drop policy if exists "owners manage social links" on public.social_links;
create policy "social links select visible or own" on public.social_links for select using (is_visible or (select auth.uid()) = creator_id);
create policy "social links insert own" on public.social_links for insert to authenticated with check ((select auth.uid()) = creator_id);
create policy "social links update own" on public.social_links for update to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);
create policy "social links delete own" on public.social_links for delete to authenticated using ((select auth.uid()) = creator_id);

drop policy if exists "import batches owner" on public.import_batches;
drop policy if exists "owners manage import batches" on public.import_batches;
create policy "import batches select own" on public.import_batches for select to authenticated using ((select auth.uid()) = creator_id);
create policy "import batches insert own" on public.import_batches for insert to authenticated with check ((select auth.uid()) = creator_id);
create policy "import batches update own" on public.import_batches for update to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);
create policy "import batches delete own" on public.import_batches for delete to authenticated using ((select auth.uid()) = creator_id);

drop policy if exists "import rows owner" on public.import_rows;
drop policy if exists "owners manage import rows" on public.import_rows;
create policy "import rows select own" on public.import_rows for select to authenticated using (exists(select 1 from public.import_batches b where b.id = batch_id and b.creator_id = (select auth.uid())));
create policy "import rows insert own" on public.import_rows for insert to authenticated with check (exists(select 1 from public.import_batches b where b.id = batch_id and b.creator_id = (select auth.uid())));
create policy "import rows update own" on public.import_rows for update to authenticated using (exists(select 1 from public.import_batches b where b.id = batch_id and b.creator_id = (select auth.uid()))) with check (exists(select 1 from public.import_batches b where b.id = batch_id and b.creator_id = (select auth.uid())));
create policy "import rows delete own" on public.import_rows for delete to authenticated using (exists(select 1 from public.import_batches b where b.id = batch_id and b.creator_id = (select auth.uid())));

drop policy if exists "clicks owner" on public.outbound_clicks;
drop policy if exists "owners view their click metrics" on public.outbound_clicks;
create policy "clicks select own offers" on public.outbound_clicks for select to authenticated using (exists(select 1 from public.product_offers o join public.products p on p.id = o.product_id where o.id = offer_id and p.creator_id = (select auth.uid())));
