import { describe, expect, it } from "vitest";
import { isTikTokPostUrl } from "../../lib/tiktok/url";

describe("isTikTokPostUrl", () => {
  it("accepts TikTok video and short-link hosts over HTTPS", () => {
    expect(isTikTokPostUrl("https://www.tiktok.com/@tr33shya/video/123")) .toBe(true);
    expect(isTikTokPostUrl("https://vm.tiktok.com/ZM123")) .toBe(true);
  });
  it("refuses non-TikTok and unsafe schemes", () => {
    expect(isTikTokPostUrl("https://example.com/video/123")).toBe(false);
    expect(isTikTokPostUrl("javascript:alert(1)")).toBe(false);
  });
});
