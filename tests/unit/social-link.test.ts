import { describe, expect, it } from "vitest";

import { socialLinkSchema } from "../../lib/validation/social-link";

describe("socialLinkSchema", () => {
  it("accepts a configured Instagram profile", () => {
    expect(
      socialLinkSchema.safeParse({
        platform: "instagram",
        url: "https://www.instagram.com/tricia_omorose/",
        label: "",
        isVisible: true,
        displayOrder: 0,
      }).success,
    ).toBe(true);
  });

  it("requires a label for a custom website link", () => {
    expect(
      socialLinkSchema.safeParse({
        platform: "website",
        url: "https://example.com",
        label: "",
        isVisible: true,
        displayOrder: 0,
      }).success,
    ).toBe(false);
  });
});
