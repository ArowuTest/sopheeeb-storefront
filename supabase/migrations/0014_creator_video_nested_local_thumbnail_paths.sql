-- Starter assets are grouped by creator, for example
-- /creator-content/sophiee/wig.jpg. Permit safe nested image paths while
-- retaining the existing HTTPS option used by TikTok oEmbed thumbnails.
alter table public.creator_videos
  drop constraint if exists creator_videos_thumbnail_url_check;

alter table public.creator_videos
  add constraint creator_videos_thumbnail_url_check
  check (
    thumbnail_url ~
    '^(https://.*|/creator-content/[A-Za-z0-9][A-Za-z0-9._-]*(/[A-Za-z0-9][A-Za-z0-9._-]*)*[.](jpg|jpeg|png|webp|gif|avif))$'
  );
