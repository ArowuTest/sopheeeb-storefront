import { describe, expect, it } from "vitest";

import { parseImport } from "../../lib/import/parse-import";

describe("parseImport", () => {
  it("parses valid CSV rows as private import drafts", () => {
    const result = parseImport(`affiliate_url,tiktok_post_url,title,collection\nhttps://shop.tiktok.com/view/product/123?affiliate_id=a,https://www.tiktok.com/@tr33shya/video/123,Soft Glow Serum,Beauty`);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      title: "Soft Glow Serum",
      collection: "Beauty",
      status: "ready",
      affiliateUrl: "https://shop.tiktok.com/view/product/123?affiliate_id=a",
    });
  });

  it("keeps malformed rows reviewable and does not mark them ready", () => {
    const result = parseImport(`affiliate_url,tiktok_post_url,title,collection\nhttps://example.com/not-a-shop,https://evil.example/video, ,`);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].status).toBe("needs_attention");
    expect(result.rows[0].errors).toEqual(expect.arrayContaining([
      expect.stringMatching(/TikTok Shop/i), expect.stringMatching(/title/i),
    ]));
  });

  it("keeps a newline-separated link list as individual review rows", () => {
    const result = parseImport("https://shop.tiktok.com/view/product/123?affiliate_id=a\nhttps://not-a-shop.example/item\nhttps://shop.tiktok.com/view/product/456?affiliate_id=b");
    expect(result.rows).toHaveLength(3);
    expect(result.rows.map((row) => row.affiliateUrl)).toEqual([
      "https://shop.tiktok.com/view/product/123?affiliate_id=a",
      "https://not-a-shop.example/item",
      "https://shop.tiktok.com/view/product/456?affiliate_id=b",
    ]);
    expect(result.rows.every((row) => row.status === "needs_attention")).toBe(true);
  });

  it("flags duplicate affiliate links inside the same batch", () => {
    const result = parseImport(`affiliate_url,title\nhttps://shop.tiktok.com/view/product/123?affiliate_id=a,First find\nhttps://shop.tiktok.com/view/product/123?affiliate_id=a,Same find`);

    expect(result.rows[1].status).toBe("needs_attention");
    expect(result.rows[1].errors).toContain("Duplicate affiliate URL in this import batch.");
  });
});
