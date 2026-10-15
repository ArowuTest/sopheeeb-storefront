import { describe, expect, it } from "vitest";

import { extractTikTokPostUrlsFromProfileHtml } from "../../lib/tiktok/creator-public-posts";

describe("public TikTok profile discovery", () => {
  it("extracts and deduplicates escaped and relative video URLs", () => {
    const html = String.raw`{"a":"https:\\u002F\\u002Fwww.tiktok.com\\u002F@sopheeeb\\u002Fvideo\\u002F123","b":"/@sopheeeb/video/456","c":"/@other/video/999","d":"/@sopheeeb/video/456"}`;
    expect(extractTikTokPostUrlsFromProfileHtml(html)).toEqual([
      "https://www.tiktok.com/@sopheeeb/video/123",
      "https://www.tiktok.com/@sopheeeb/video/456",
    ]);
  });

  it("recovers video URLs from TikTok embedded item data", () => {
    const html = String.raw`{"itemStruct":{"id":"7685745781969554710"},"ItemModule":{"7683923192745905430":{"desc":"A find"}}}`;
    expect(extractTikTokPostUrlsFromProfileHtml(html)).toEqual([
      "https://www.tiktok.com/@sopheeeb/video/7685745781969554710",
      "https://www.tiktok.com/@sopheeeb/video/7683923192745905430",
    ]);
  });

  it("recovers IDs from a hydration payload when TikTok changes its JSON scope", () => {
    const html = `<script type="application/json">${JSON.stringify({
      "webapp.user-detail": { itemList: [{ id: "7696997335771268621", desc: "A new find" }] },
    })}</script>`;
    expect(extractTikTokPostUrlsFromProfileHtml(html)).toEqual([
      "https://www.tiktok.com/@sopheeeb/video/7696997335771268621",
    ]);
  });
});
