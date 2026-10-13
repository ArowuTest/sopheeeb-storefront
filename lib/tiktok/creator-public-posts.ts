/**
 * Public TikTok post URLs observed on @sopheeeb during the Creator Studio
 * discovery pass. These are post URLs only, never product URLs. The sync
 * action re-fetches official oEmbed metadata at runtime and remains
 * idempotent by canonical post URL.
 */
export const creatorPublicTikTokPosts = [
  "https://www.tiktok.com/@sopheeeb/video/7685745781969554710",
  "https://www.tiktok.com/@sopheeeb/video/7683923192745905430",
  "https://www.tiktok.com/@sopheeeb/video/7688835207943720214",
  "https://www.tiktok.com/@sopheeeb/video/7691411847072845078",
  "https://www.tiktok.com/@sopheeeb/video/7685517811254381846",
  "https://www.tiktok.com/@sopheeeb/video/7686222853515103510",
  "https://www.tiktok.com/@sopheeeb/video/7682083035663043862",
  "https://www.tiktok.com/@sopheeeb/video/7691671469272681750",
  "https://www.tiktok.com/@sopheeeb/video/7683566384013462806",
  "https://www.tiktok.com/@sopheeeb/video/7682808145139453187",
  "https://www.tiktok.com/@sopheeeb/video/7669527376505703702",
  "https://www.tiktok.com/@sopheeeb/video/7671284331960159491",
  "https://www.tiktok.com/@sopheeeb/video/7691605860899917078",
  "https://www.tiktok.com/@sopheeeb/video/7687741997943213334",
  "https://www.tiktok.com/@sopheeeb/video/7649127021372624150",
] as const;

export function extractTikTokPostUrlsFromProfileHtml(html: string, handle = "sopheeeb"): string[] {
  const normalized = html
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
  const escapedHandle = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:https?:)?//(?:www\\.)?tiktok\\.com/@${escapedHandle}/video/\\d+|/@${escapedHandle}/video/\\d+`, "gi");
  const urls = new Set<string>();
  for (const match of normalized.matchAll(pattern)) {
    const value = match[0].startsWith("/") ? `https://www.tiktok.com${match[0]}` : match[0].startsWith("//") ? `https:${match[0]}` : match[0];
    urls.add(value.replace(/\/$/, ""));
  }
  return [...urls];
}
