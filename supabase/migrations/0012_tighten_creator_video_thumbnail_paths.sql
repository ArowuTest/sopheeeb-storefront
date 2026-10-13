-- Permit HTTPS thumbnails or plain, public image filenames under /creator-content/.
-- The pattern excludes query strings, fragments, encoded traversal and nested paths.
alter table public.creator_videos
  drop constraint if exists creator_videos_thumbnail_url_check;

alter table public.creator_videos
  add constraint creator_videos_thumbnail_url_check
  check (thumbnail_url ~ '^(https://|/creator-content/[A-Za-z0-9][A-Za-z0-9._-]*\.(jpg|jpeg|png|webp|gif|avif)$)');
