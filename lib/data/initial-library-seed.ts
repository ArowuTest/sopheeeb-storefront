import { initialStories, initialStoryCategories } from "./initial-catalogue";

export interface InitialCollectionSeed {
  creator_id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  status: "published";
}

export interface InitialStorySeed {
  creator_id: string;
  collection_id: string;
  slug: string;
  title: string;
  summary: string;
  alt_text: string;
  tiktok_post_url: string;
  thumbnail_url: string;
  status: "published";
  display_order: number;
  published_at: string;
}

export function createInitialCollectionSeeds(creatorId: string): InitialCollectionSeed[] {
  return initialStoryCategories.map((category) => ({
    creator_id: creatorId,
    slug: category.slug,
    title: category.title,
    description: category.description,
    image_url: category.imageUrl,
    display_order: category.displayOrder,
    status: "published",
  }));
}

export function createInitialStorySeeds(
  creatorId: string,
  collectionIds: Readonly<Record<string, string>>,
  publishedAt = new Date().toISOString(),
): InitialStorySeed[] {
  return initialStories.map((story) => {
    const collectionId = collectionIds[story.collection.slug];
    if (!collectionId) throw new Error(`Initial story collection is missing: ${story.collection.slug}`);

    return {
      creator_id: creatorId,
      collection_id: collectionId,
      slug: story.slug,
      title: story.title,
      summary: story.summary,
      alt_text: story.altText,
      tiktok_post_url: story.tiktokPostUrl,
      thumbnail_url: story.thumbnailUrl,
      status: "published",
      display_order: story.displayOrder,
      published_at: publishedAt,
    };
  });
}

export function selectMissingInitialStorySeeds(
  seeds: readonly InitialStorySeed[],
  existing: { slugs: ReadonlySet<string>; tiktokUrls: ReadonlySet<string> },
): InitialStorySeed[] {
  return seeds.filter((story) => !existing.slugs.has(story.slug) && !existing.tiktokUrls.has(story.tiktok_post_url));
}
