import { describe, expect, it } from "vitest";

import { buildSafeAffiliateRedirect } from "../../lib/affiliate/redirect";

describe("buildSafeAffiliateRedirect", () => {
  it("returns a verified destination and normalised source for a TikTok Shop offer", () => {
    expect(
      buildSafeAffiliateRedirect(
        "https://shop.tiktok.com/view/product/123?affiliate_id=hello&share_token=keep",
        "Instagram",
      ),
    ).toEqual({
      destination: "https://shop.tiktok.com/view/product/123?affiliate_id=hello&share_token=keep",
      source: "instagram",
    });
  });

  it("never returns a destination for an unsupported or unsafe link", () => {
    expect(buildSafeAffiliateRedirect("https://example.com/products/1", "tiktok")).toBeNull();
    expect(buildSafeAffiliateRedirect("javascript:alert(1)", "tiktok")).toBeNull();
  });
});
