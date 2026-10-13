import { describe, expect, it } from "vitest";

import { creatorVideoInputSchema } from "../../lib/validation/creator-video";

const validVideo = {
  title: "Pilates board session",
  slug: "pilates-board-session",
  summary: "A full at-home session showing the board in use.",
  altText: "Creator using a Pilates board at home",
  tiktokPostUrl: "https://www.tiktok.com/@tr33shya/video/7688697187869396246",
  thumbnailUrl: "https://example.com/thumbnail.jpg",
  collectionId: "34d4912a-0ec2-4ddb-b6c2-9cd99c383d73",
  linkedProductId: null,
  status: "draft",
  displayOrder: 10,
};

describe("creatorVideoInputSchema", () => {
  it("accepts a canonical TikTok post with a same-owner record reference shape", () => {
    expect(creatorVideoInputSchema.safeParse(validVideo).success).toBe(true);
  });

  it("accepts a site-owned thumbnail path but rejects insecure or arbitrary local values", () => {
    expect(creatorVideoInputSchema.safeParse({ ...validVideo, thumbnailUrl: "/creator-content/abs-machine.jpg" }).success).toBe(true);
    expect(creatorVideoInputSchema.safeParse({ ...validVideo, thumbnailUrl: "http://example.com/thumbnail.jpg" }).success).toBe(false);
    expect(creatorVideoInputSchema.safeParse({ ...validVideo, thumbnailUrl: "/other-path/thumbnail.jpg" }).success).toBe(false);
    expect(creatorVideoInputSchema.safeParse({ ...validVideo, thumbnailUrl: "/creator-content/../api/admin" }).success).toBe(false);
    expect(creatorVideoInputSchema.safeParse({ ...validVideo, thumbnailUrl: "/creator-content/abs-machine.jpg?cache=1" }).success).toBe(false);
    expect(creatorVideoInputSchema.safeParse({ ...validVideo, thumbnailUrl: "/creator-content/abs-machine.jpg#crop" }).success).toBe(false);
    expect(creatorVideoInputSchema.safeParse({ ...validVideo, thumbnailUrl: "/creator-content/abs-machine.svg" }).success).toBe(false);
  });

  it.each([
    "https://vm.tiktok.com/ZM123",
    "https://www.tiktok.com/@tr33shya",
    "https://example.com/@tr33shya/video/7688697187869396246",
    "javascript:alert(1)",
  ])("rejects a non-canonical playable TikTok post URL: %s", (tiktokPostUrl) => {
    const result = creatorVideoInputSchema.safeParse({ ...validVideo, tiktokPostUrl });
    expect(result.success).toBe(false);
  });

  it("requires a category collection and rejects an oversized summary", () => {
    const result = creatorVideoInputSchema.safeParse({
      ...validVideo,
      collectionId: "",
      summary: "x".repeat(601),
    });
    expect(result.success).toBe(false);
  });

  it("rejects unsupported publication states and non-UUID linked products", () => {
    const result = creatorVideoInputSchema.safeParse({
      ...validVideo,
      status: "queued",
      linkedProductId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
