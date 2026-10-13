import "server-only";

import { createInitialCollectionSeeds, createInitialStorySeeds, selectMissingInitialStorySeeds } from "@/lib/data/initial-library-seed";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export interface InitialLibraryAdoption {
  collectionsAdded: number;
  storiesAdded: number;
  totalStories: number;
}

/**
 * Makes the launch preview library owned by the authenticated creator. The write
 * is idempotent: existing creator records are never replaced, and each starter
 * story intentionally has no linked product until the creator selects one.
 */
export async function adoptInitialLibraryForCreator(creatorId: string): Promise<InitialLibraryAdoption> {
  const supabase = createServiceSupabaseClient();
  const collectionSeeds = createInitialCollectionSeeds(creatorId);

  const { data: existingCollections, error: existingCollectionsError } = await supabase
    .from("collections")
    .select("id,slug")
    .eq("creator_id", creatorId)
    .in("slug", collectionSeeds.map((collection) => collection.slug));
  if (existingCollectionsError) throw new Error("Could not inspect starter collections.");

  const existingCollectionSlugs = new Set((existingCollections ?? []).map((collection) => collection.slug));
  const missingCollections = collectionSeeds.filter((collection) => !existingCollectionSlugs.has(collection.slug));
  if (missingCollections.length) {
    const { error: insertCollectionsError } = await supabase.from("collections").insert(missingCollections);
    if (insertCollectionsError) throw new Error("Could not create starter collections.");
  }

  const { data: collections, error: collectionsError } = await supabase
    .from("collections")
    .select("id,slug")
    .eq("creator_id", creatorId)
    .in("slug", collectionSeeds.map((collection) => collection.slug));
  if (collectionsError || !collections) throw new Error("Could not load starter collections.");

  const collectionIds = Object.fromEntries(collections.map((collection) => [collection.slug, collection.id]));
  if (Object.keys(collectionIds).length !== collectionSeeds.length) throw new Error("Starter collections are incomplete.");

  const { data: existingStories, error: existingStoriesError } = await supabase
    .from("creator_videos")
    .select("slug,tiktok_post_url")
    .eq("creator_id", creatorId);
  if (existingStoriesError) throw new Error("Could not inspect Creator Studio stories.");

  const storySeeds = createInitialStorySeeds(creatorId, collectionIds);
  const existingSlugs = new Set((existingStories ?? []).map((story) => story.slug));
  const existingTikTokUrls = new Set((existingStories ?? []).map((story) => story.tiktok_post_url));
  const missingStories = selectMissingInitialStorySeeds(storySeeds, { slugs: existingSlugs, tiktokUrls: existingTikTokUrls });
  if (missingStories.length) {
    const { error: insertStoriesError } = await supabase.from("creator_videos").insert(missingStories);
    if (insertStoriesError) throw new Error("Could not add the starter videos.");
  }

  const { count: totalStories, error: totalStoriesError } = await supabase
    .from("creator_videos")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", creatorId);
  if (totalStoriesError) throw new Error("Could not confirm Creator Studio stories.");

  return {
    collectionsAdded: missingCollections.length,
    storiesAdded: missingStories.length,
    totalStories: totalStories ?? 0,
  };
}
