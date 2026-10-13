import { isTikTokPostUrl } from "./url";

export function getTikTokVideoId(postUrl: string): string | null {
  if (!isTikTokPostUrl(postUrl)) return null;
  const pathname = new URL(postUrl).pathname;
  const match = pathname.match(/\/video\/(\d+)(?:\/)?$/);
  return match?.[1] ?? null;
}

export function createTikTokPlayerUrl(videoId: string): string {
  if (!/^\d+$/.test(videoId)) throw new Error("TikTok player requires a numeric post ID");
  const player = new URL(`https://www.tiktok.com/player/v1/${videoId}`);
  player.searchParams.set("controls", "1");
  // TikTok's official player reliably loads with its native play control.
  // Requesting iframe autoplay can make the player return an error in some
  // browsers, so let the player own the gesture instead.
  player.searchParams.set("autoplay", "0");
  player.searchParams.set("description", "0");
  player.searchParams.set("music_info", "0");
  player.searchParams.set("rel", "0");
  return player.toString();
}
