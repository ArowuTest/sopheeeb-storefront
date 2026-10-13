import { describe, expect, it } from "vitest";

import { productInputSchema } from "../../lib/validation/product";

describe("productInputSchema", () => {
  it("accepts a draft product with a TikTok Shop destination", () => {
    const result = productInputSchema.safeParse({
      title: "Soft Glow Serum",
      slug: "soft-glow-serum",
      creatorNote: "A dewy finish without the sticky layer.",
      collectionId: null,
      affiliateUrl:
        "https://shop.tiktok.com/view/product/172938225?affiliate_id=abc123",
      status: "draft",
      tags: "skin, glow",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an unsafe destination and invalid slug", () => {
    const result = productInputSchema.safeParse({
      title: "X",
      slug: "Not A Slug!",
      creatorNote: "",
      collectionId: null,
      affiliateUrl: "https://example.com/bad",
      status: "published",
      tags: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an archived status without coercing it to draft", () => {
    const result = productInputSchema.safeParse({
      title: "Archived find",
      slug: "archived-find",
      creatorNote: "",
      collectionId: null,
      affiliateUrl: "https://shop.tiktok.com/view/product/172938225?affiliate_id=abc123",
      status: "archived",
      tags: "",
    });
    expect(result).toMatchObject({ success: true });
    if (result.success) expect(result.data.status).toBe("archived");
  });
});
