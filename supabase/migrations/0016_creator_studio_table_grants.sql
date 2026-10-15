-- Keep PostgREST table privileges explicit for Creator Studio. RLS remains the
-- authority for which rows each role can read or change.
grant select on table
  public.creator_profiles,
  public.collections,
  public.products,
  public.product_offers,
  public.product_media,
  public.social_links,
  public.creator_videos
to anon, authenticated;

grant select, insert, update, delete on table
  public.creator_profiles,
  public.collections,
  public.products,
  public.product_offers,
  public.product_media,
  public.social_links,
  public.creator_videos,
  public.import_batches,
  public.import_rows,
  public.outbound_clicks,
  public.creator_members
to authenticated, service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;
