import { describe, expect, it } from "vitest";

import { initialStories } from "../../lib/data/initial-catalogue";
import { createInitialCollectionSeeds, createInitialStorySeeds, selectMissingInitialStorySeeds } from "../../lib/data/initial-library-seed";

describe("Creator Studio starter library seed", () => {
  it("creates published editable collection and story records for all observed launch posts", () => {
    const collections = createInitialCollectionSeeds("creator-1");
    const collectionIds = Object.fromEntries(collections.map((collection, index) => [collection.slug, `collection-${index}`]));
    const stories = createInitialStorySeeds("creator-1", collectionIds, "2026-09-29T20:00:00.000Z");
    const sourceStories = Object.fromEntries(initialStories.map((story) => [story.slug, story]));

    expect(collections).toHaveLength(5);
    expect(stories).toHaveLength(12);
    expect(stories.every((story) => story.status === "published" && story.creator_id === "creator-1")).toBe(true);
    expect(stories.every((story) => story.collection_id === collectionIds[sourceStories[story.slug].collection.slug])).toBe(true);
  });

  it("requires a collection mapping rather than creating a malformed database story", () => {
    expect(() => createInitialStorySeeds("creator-1", {})).toThrow("Initial story collection is missing");
  });

  it("does not duplicate a starter post already imported under a different slug", () => {
    const collections = createInitialCollectionSeeds("creator-1");
    const collectionIds = Object.fromEntries(collections.map((collection, index) => [collection.slug, `collection-${index}`]));
    const stories = createInitialStorySeeds("creator-1", collectionIds);
    const observedPost = stories[0];

    const missing = selectMissingInitialStorySeeds(stories, {
      slugs: new Set(["a-manually-renamed-story"]),
      tiktokUrls: new Set([observedPost.tiktok_post_url]),
    });

    expect(missing).toHaveLength(11);
    expect(missing.some((story) => story.slug === observedPost.slug)).toBe(false);
  });
});
