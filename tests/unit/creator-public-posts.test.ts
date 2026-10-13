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
});
