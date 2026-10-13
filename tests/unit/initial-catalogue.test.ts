import { describe, expect, it } from "vitest";

import { initialStoryCategories, initialStories } from "../../lib/data/initial-catalogue";

describe("initial creator catalogue", () => {
  it("restores an observed public preview library across Sophiee’s content categories", () => {
    expect(initialStories).toHaveLength(12);
    expect(new Set(initialStories.map((story) => story.collection.slug))).toEqual(new Set(["wear", "home", "beauty", "move", "everyday"]));
    expect(initialStoryCategories).toHaveLength(5);
  });

  it("keeps every preview story as an original TikTok video without an invented Shop CTA", () => {
    for (const story of initialStories) {
      expect(story.tiktokPostUrl).toMatch(/^https:\/\/www\.tiktok\.com\/@sopheeeb\/video\/\d+$/);
      expect(story.linkedProduct).toBeNull();
    }
  });
});
