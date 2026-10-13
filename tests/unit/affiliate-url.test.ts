import { describe, expect, it } from "vitest";

import {
  normalizeClickSource,
  validateAffiliateUrl,
} from "../../lib/validation/affiliate-url";

describe("validateAffiliateUrl", () => {
  it("accepts a TikTok Shop destination without changing its affiliate parameters", () => {
    const raw =
      "https://shop.tiktok.com/view/product/172938225?affiliate_id=abc123&share_token=keep-me";

    expect(validateAffiliateUrl(raw)).toEqual({ ok: true, value: raw });
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,hello",
    "ftp://shop.tiktok.com/item/1",
    "https://example.com/product/1",
    "https://www.tiktok.com/@tr33shya/video/123456",
    "https://tiktok.com/@tr33shya",
    "https://vm.tiktok.com/short-link",
    "https://127.0.0.1/internal",
    "http://localhost:3000/secret",
  ])("rejects unsafe or unsupported destinations: %s", (raw) => {
    expect(validateAffiliateUrl(raw)).toMatchObject({ ok: false });
  });
});

describe("normalizeClickSource", () => {
  it.each([
    ["tiktok", "tiktok"],
    ["Instagram", "instagram"],
    ["newsletter", "newsletter"],
    ["untrusted-value", "direct"],
    [null, "direct"],
  ])("normalizes %s to %s", (source, expected) => {
    expect(normalizeClickSource(source)).toBe(expected);
  });
});
