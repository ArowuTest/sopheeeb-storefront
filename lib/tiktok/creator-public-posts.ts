/**
 * Public TikTok post URLs observed on @sopheeeb during the Creator Studio
 * discovery pass. These are post URLs only, never product URLs. The sync
 * action re-fetches official oEmbed metadata at runtime and remains
 * idempotent by canonical post URL.
 */
export const creatorPublicTikTokPosts = [
  "https://www.tiktok.com/@sopheeeb/video/7692446726233312534",
  "https://www.tiktok.com/@sopheeeb/video/7591626585778720022",
  "https://www.tiktok.com/@sopheeeb/video/7696272333408881942",
  "https://www.tiktok.com/@sopheeeb/video/7696257190256135427",
  "https://www.tiktok.com/@sopheeeb/video/7696239965499460866",
  "https://www.tiktok.com/@sopheeeb/video/7696223028857834774",
  "https://www.tiktok.com/@sopheeeb/video/7696197266889116950",
  "https://www.tiktok.com/@sopheeeb/video/7696183923788762390",
  "https://www.tiktok.com/@sopheeeb/video/7696170043649953046",
  "https://www.tiktok.com/@sopheeeb/video/7696119065110170902",
  "https://www.tiktok.com/@sopheeeb/video/7696059730250452227",
  "https://www.tiktok.com/@sopheeeb/video/7695901409526451478",
  "https://www.tiktok.com/@sopheeeb/video/7695886149818092822",
  "https://www.tiktok.com/@sopheeeb/video/7695866139200556310",
  "https://www.tiktok.com/@sopheeeb/video/7695847668991544598",
  "https://www.tiktok.com/@sopheeeb/video/7695830364086045975",
  "https://www.tiktok.com/@sopheeeb/video/7695812556396563735",
  "https://www.tiktok.com/@sopheeeb/video/7695797882972163350",
  "https://www.tiktok.com/@sopheeeb/video/7695753482673982742",
  "https://www.tiktok.com/@sopheeeb/video/7695692787450236182",
  "https://www.tiktok.com/@sopheeeb/video/7695679043101854998",
  "https://www.tiktok.com/@sopheeeb/video/7695536999041748246",
  "https://www.tiktok.com/@sopheeeb/video/7695530787411660054",
  "https://www.tiktok.com/@sopheeeb/video/7695525206953151766",
  "https://www.tiktok.com/@sopheeeb/video/7695509313661521174",
  "https://www.tiktok.com/@sopheeeb/video/7695503035597999382",
  "https://www.tiktok.com/@sopheeeb/video/7695480687889075478",
  "https://www.tiktok.com/@sopheeeb/video/7695458416059239702",
  "https://www.tiktok.com/@sopheeeb/video/7695439790539279638",
  "https://www.tiktok.com/@sopheeeb/video/7695426470377704726",
  "https://www.tiktok.com/@sopheeeb/video/7695404703525489942",
  "https://www.tiktok.com/@sopheeeb/video/7695401009165700354",
  "https://www.tiktok.com/@sopheeeb/video/7695384675933539606",
  "https://www.tiktok.com/@sopheeeb/video/7695366041450417431",
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

  const videoIdPatterns = [
    /"itemStruct"\s*:\s*\{\s*"id"\s*:\s*"(\d{12,24})"/g,
    /"itemInfo"\s*:\s*\{\s*"itemStruct"\s*:\s*\{\s*"id"\s*:\s*"(\d{12,24})"/g,
    /"ItemModule"\s*:\s*\{\s*"(\d{12,24})"\s*:/g,
  ];
  for (const idPattern of videoIdPatterns) {
    for (const match of normalized.matchAll(idPattern)) {
      urls.add(`https://www.tiktok.com/@${handle}/video/${match[1]}`);
    }
  }
  return [...urls];
}
