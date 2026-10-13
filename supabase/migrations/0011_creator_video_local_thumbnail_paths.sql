-- Starter-library thumbnails are site-owned public assets, while creator-added
-- thumbnails can remain secure external HTTPS URLs. Both are safe display values.
alter table public.creator_videos
  drop constraint if exists creator_videos_thumbnail_url_check;

alter table public.creator_videos
  add constraint creator_videos_thumbnail_url_check
  check (thumbnail_url ~ '^(https://|/creator-content/)');
