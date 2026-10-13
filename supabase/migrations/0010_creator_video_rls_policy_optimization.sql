drop policy if exists "public views published creator videos" on public.creator_videos;
drop policy if exists "owners manage creator videos" on public.creator_videos;
drop policy if exists "anonymous visitors view published creator videos" on public.creator_videos;
drop policy if exists "authenticated viewers access published or owned creator videos" on public.creator_videos;
drop policy if exists "owners insert creator videos" on public.creator_videos;
drop policy if exists "owners update creator videos" on public.creator_videos;
drop policy if exists "owners delete creator videos" on public.creator_videos;

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
