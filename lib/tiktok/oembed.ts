import "server-only";

import { isTikTokPostUrl } from "./url";

export { isTikTokPostUrl } from "./url";

export interface TikTokOEmbed {
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnailUrl: string;
  html: string;
}

export async function fetchTikTokOEmbed(postUrl: string): Promise<TikTokOEmbed | null> {
  if (!isTikTokPostUrl(postUrl)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(postUrl)}`, { signal: controller.signal, cache: "no-store", headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const value: unknown = await response.json();
    if (!value || typeof value !== "object") return null;
    const payload = value as Record<string, unknown>;
    if (typeof payload.thumbnail_url !== "string" || typeof payload.title !== "string") return null;
    return { title: payload.title, authorName: typeof payload.author_name === "string" ? payload.author_name : "TikTok", authorUrl: typeof payload.author_url === "string" ? payload.author_url : postUrl, thumbnailUrl: payload.thumbnail_url, html: typeof payload.html === "string" ? payload.html : "" };
  } catch { return null; } finally { clearTimeout(timeout); }
}
