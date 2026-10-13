-- Creator profile creation is service-mediated after verified ADMIN_EMAIL checks.
drop policy if exists "creator profile insert own" on public.creator_profiles;

-- A product must never reference another creator's collection.
create or replace function public.assert_product_collection_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.collection_id is not null and not exists (
    select 1 from public.collections c where c.id = new.collection_id and c.creator_id = new.creator_id
  ) then
    raise exception 'Product collection must belong to the same creator';
  end if;
  return new;
end;
$$;

drop trigger if exists products_collection_owner on public.products;
create trigger products_collection_owner
before insert or update of creator_id, collection_id on public.products
for each row execute function public.assert_product_collection_owner();

-- Uploaded media remains private in Storage. Public product pages use a short-lived signed redirect.
alter table public.product_media add column if not exists storage_path text;
update storage.buckets set public = false where id = 'creator-media';
drop policy if exists "creator media public read" on storage.objects;
create policy "creator media owner select" on storage.objects for select to authenticated using (bucket_id = 'creator-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
