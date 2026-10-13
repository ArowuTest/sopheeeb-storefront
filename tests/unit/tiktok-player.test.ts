import { describe, expect, it } from "vitest";

import { createTikTokPlayerUrl, getTikTokVideoId } from "../../lib/tiktok/player";

describe("TikTok Embed Player URL", () => {
  it("extracts a numeric post ID from a canonical TikTok post URL", () => {
    expect(getTikTokVideoId("https://www.tiktok.com/@tr33shya/video/7674357859039055126")).toBe("7674357859039055126");
  });

  it("refuses a URL without a canonical numeric post ID", () => {
    expect(getTikTokVideoId("https://www.tiktok.com/@tr33shya")).toBeNull();
    expect(getTikTokVideoId("https://example.com/@tr33shya/video/7674357859039055126")).toBeNull();
  });

  it("builds TikTok's official controllable player URL with native play controls", () => {
    const player = new URL(createTikTokPlayerUrl("7674357859039055126"));
    expect(player.origin).toBe("https://www.tiktok.com");
    expect(player.pathname).toBe("/player/v1/7674357859039055126");
    expect(player.searchParams.get("controls")).toBe("1");
    expect(player.searchParams.get("autoplay")).toBe("0");
    expect(player.searchParams.get("rel")).toBe("0");
  });
});
