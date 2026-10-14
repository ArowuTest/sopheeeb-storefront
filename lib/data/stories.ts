import "server-only";

import { initialStories, initialStoryCategories } from "./initial-catalogue";
import { shouldUseInitialStoryCatalogue } from "./story-fallback";
import { getPublicCollections, getPublicStorefrontClientOrNull, lookupPublicProfile, type StorefrontCollection } from "./storefront";
import { storyCatalogueSelect } from "./story-query";

export interface StorefrontStory {
  id: string;
  slug: string;
  title: string;
  summary: string;
  altText: string;
  tiktokPostUrl: string;
  thumbnailUrl: string;
  displayOrder: number;
  collection: { slug: string; title: string; imageUrl: string | null };
  linkedProduct: { slug: string; title: string; offerId: string } | null;
  /** Original imported text used for search, never rendered publicly. */
  searchText?: string;
}

export interface StorefrontStoryCollection extends StorefrontCollection {
  storyCount: number;
  coverUrl: string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

const curatedTitleRules: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /toning my body from home/i, title: "A home workout, made simple" },
  { pattern: /rounder glutes|firmer thighs|glutes round|thighs firm/i, title: "A stronger lower-body routine" },
  { pattern: /comfortable sexy free pants/i, title: "The easy-fit pants" },
  { pattern: /makeup bout to really eat|makeup.*eat/i, title: "The makeup brush set" },
  { pattern: /banging body.*comfort of your home/i, title: "A full-body home workout" },
  { pattern: /mop bucket/i, title: "The mop bucket set" },
  { pattern: /luxury plush robe/i, title: "The plush robe" },
  { pattern: /staple in your home decor/i, title: "The home decor upgrade" },
  { pattern: /compact travel size wipes/i, title: "Travel-size wipes" },
  { pattern: /sweetest smell combo|good scent/i, title: "The everyday scent" },
  { pattern: /pilates socks/i, title: "Pilates grip socks" },
  { pattern: /it girl set/i, title: "The IT-girl set" },
  { pattern: /non padded bra|lifts and supports/i, title: "The supportive everyday bra" },
  { pattern: /too cute to spook/i, title: "The seasonal statement piece" },
  { pattern: /everyday gloss/i, title: "The everyday gloss" },
  { pattern: /fresh set/i, title: "The fresh set" },
  { pattern: /animal print/i, title: "The animal-print look" },
  { pattern: /lounge travel set/i, title: "The lounge travel set" },
  { pattern: /no glue wispy/i, title: "No-glue wispy lashes" },
  { pattern: /volume, drama|volume.*durability/i, title: "The volume lash set" },
  { pattern: /live in this everyday/i, title: "The everyday essential" },
  { pattern: /healthy and fresh vj/i, title: "The fresh-feel essential" },
  { pattern: /facial hair got nothing/i, title: "The facial hair remover" },
  { pattern: /living in this jeans/i, title: "The everyday jeans" },
  { pattern: /chic girl top/i, title: "The chic top" },
  { pattern: /skirt for every szn/i, title: "The all-season skirt" },
  { pattern: /bubu gown/i, title: "The statement gown" },
  { pattern: /good tissue/i, title: "The everyday tissue" },
  { pattern: /lip reset/i, title: "The lip reset" },
  { pattern: /favourite auntie/i, title: "The auntie-approved find" },
  { pattern: /period leaks/i, title: "The period-proof essential" },
  { pattern: /breathable waistraiber|breathable waist trainer/i, title: "The breathable waist trainer" },
  { pattern: /tv console/i, title: "The classic TV console" },
  { pattern: /elevating my space|rental friendly/i, title: "The rental-friendly home upgrade" },
  { pattern: /lacey goodness/i, title: "The lace essential" },
  { pattern: /baddest vj reset combo/i, title: "The fresh reset combo" },
  { pattern: /^this set/i, title: "The set" },
  { pattern: /wispy set.*lasts|wispy set.*budget/i, title: "The long-wear wispy set" },
];

const collectionSummary: Record<string, string> = {
  move: "A closer look at the movement, setup and details behind this at-home find.",
  fitness: "A closer look at the movement, setup and details behind this at-home find.",
  wear: "A closer look at the fit, finish and styling that made this piece worth saving.",
  beauty: "A closer look at the beauty find, shown in the routine and in real light.",
  home: "A closer look at the home upgrade and the difference it makes in context.",
  everyday: "A closer look at the practical detail that earned this everyday find a place.",
};

function cleanImportedTitle(rawTitle: string, collectionSlug: string): string {
  const matched = curatedTitleRules.find((rule) => rule.pattern.test(rawTitle));
  if (matched) return matched.title;

  const cleaned = rawTitle
    .replace(/^TikTok video:\s*/i, "")
    .replace(/#[\p{L}\p{N}_-]+/gu, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\uFE0F\u200D]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([?!.,])/g, "$1")
    .replace(/^[\s"'“”]+|[\s"'“”]+$/g, "")
    .trim();

  if (!cleaned || /^[?!.,\s-]+$/.test(cleaned)) {
    const fallbackByCollection: Record<string, string> = {
      move: "The latest movement find",
      wear: "The latest style find",
      beauty: "The latest beauty find",
      home: "The latest home find",
      everyday: "The latest everyday find",
    };
    return fallbackByCollection[collectionSlug] ?? "The latest find";
  }
  if (cleaned.length <= 72) return cleaned;
  const shortened = cleaned.slice(0, 69).replace(/\s+\S*$/, "").trim();
  return `${shortened}…`;
}

function curateStoryCopy(rawTitle: string, rawSummary: string, collectionSlug: string) {
  const title = cleanImportedTitle(rawTitle, collectionSlug);
  const isInternalSummary = rawSummary.trim().toLowerCase().startsWith("imported from the public");
  const summary = isInternalSummary
    ? collectionSummary[collectionSlug] ?? "A closer look at the details behind this Sophiee find."
    : rawSummary.trim().replace(/Tree\$hya/gi, "Sophiee");
  return { title, summary };
}

function mapStory(row: Record<string, unknown>): StorefrontStory | null {
  const collection = asRecord(Array.isArray(row.collections) ? row.collections[0] : row.collections);
  if (!collection) return null;
  const collectionSlug = String(collection.slug);
  const collectionTitle = collectionSlug === "move" ? "Fitness" : String(collection.title);

  const linkedProductRecord = asRecord(Array.isArray(row.linked_product) ? row.linked_product[0] : row.linked_product);
  const offers = linkedProductRecord && Array.isArray(linkedProductRecord.product_offers) ? linkedProductRecord.product_offers : [];
  const primaryOffer = offers
    .map(asRecord)
    .find((offer) => offer?.is_primary === true && offer.is_active === true)
    ?? offers.map(asRecord).find((offer) => offer?.is_active === true);

  const linkedProduct = linkedProductRecord && linkedProductRecord.status === "published" && primaryOffer
    ? {
        slug: String(linkedProductRecord.slug),
        title: String(linkedProductRecord.title),
        offerId: String(primaryOffer.id),
      }
    : null;

  const rawTitle = String(row.title ?? "");
  const rawSummary = String(row.summary ?? "");
  const curated = curateStoryCopy(rawTitle, rawSummary, collectionSlug);
  const rawAltText = String(row.alt_text ?? "");
  const altText = rawAltText && !rawAltText.toLowerCase().startsWith("imported from the public")
    ? cleanImportedTitle(rawAltText, collectionSlug)
    : curated.title;

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: curated.title,
    summary: curated.summary,
    altText,
    tiktokPostUrl: String(row.tiktok_post_url),
    thumbnailUrl: String(row.thumbnail_url),
    displayOrder: Number(row.display_order ?? 0),
    collection: {
      slug: String(collection.slug),
      title: collectionTitle,
      imageUrl: typeof collection.image_url === "string" ? collection.image_url : null,
    },
    linkedProduct,
    searchText: `${rawTitle} ${rawSummary} ${row.slug ?? ""}`,
  };
}

function matchesStoryQuery(story: StorefrontStory, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).map((term) => term.trim()).filter(Boolean);
  if (!terms.length) return true;
  const haystack = [
    story.title,
    story.summary,
    story.altText,
    story.searchText,
    story.slug,
    story.tiktokPostUrl,
    story.collection.title,
    story.collection.slug,
  ].join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export async function listPublicStories(options: { collectionSlug?: string; limit?: number; query?: string } = {}): Promise<StorefrontStory[]> {
  const [profileLookup, supabase] = await Promise.all([lookupPublicProfile(), Promise.resolve(getPublicStorefrontClientOrNull())]);
  if (shouldUseInitialStoryCatalogue(profileLookup.state)) {
    const initial = listInitialStories(options);
    return options.query ? initial.filter((story) => matchesStoryQuery(story, options.query!)) : initial;
  }
  if (profileLookup.state !== "ready" || !supabase) return [];
  const profile = profileLookup.profile;

  let query = supabase
    .from("creator_videos")
    .select(storyCatalogueSelect())
    .eq("creator_id", profile.id)
    .eq("status", "published")
    .eq("collections.status", "published")
    .order("display_order")
    .order("published_at", { ascending: false });

  if (options.collectionSlug) query = query.eq("collections.slug", options.collectionSlug);
  if (options.limit && !options.query) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) return [];
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const stories = rows
    .map((row) => mapStory(row))
    .filter((story): story is StorefrontStory => story !== null);
  const filtered = options.query ? stories.filter((story) => matchesStoryQuery(story, options.query!)) : stories;
  return options.limit ? filtered.slice(0, options.limit) : filtered;
}

export async function getPublicStory(slug: string): Promise<StorefrontStory | null> {
  const [profileLookup, supabase] = await Promise.all([lookupPublicProfile(), Promise.resolve(getPublicStorefrontClientOrNull())]);
  if (shouldUseInitialStoryCatalogue(profileLookup.state)) return initialStories.find((story) => story.slug === slug) ?? null;
  if (profileLookup.state !== "ready" || !supabase) return null;
  const profile = profileLookup.profile;

  const { data, error } = await supabase
    .from("creator_videos")
    .select(storyCatalogueSelect())
    .eq("creator_id", profile.id)
    .eq("status", "published")
    .eq("collections.status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return null;
  const mapped = data ? mapStory(data as unknown as Record<string, unknown>) : null;
  if (mapped) return mapped;
  return null;
}

export async function listPublicStoryCollections(): Promise<StorefrontStoryCollection[]> {
  const [collections, stories] = await Promise.all([getPublicCollections(), listPublicStories()]);
  if (stories.some((story) => story.id.startsWith("initial-"))) return [...initialStoryCategories];
  if (!stories.length) return [];
  if (!collections.length) return uniqueStoryCollections(stories);
  return collections.map((collection) => {
    const collectionStories = stories.filter((story) => story.collection.slug === collection.slug);
    return {
      ...collection,
      title: collection.slug === "move" ? "Fitness" : collection.title,
      description: collection.slug === "move"
        ? (collection.description || "At-home movement and activewear finds that make it easier to get started.")
        : collection.description,
      storyCount: collectionStories.length,
      coverUrl: collection.imageUrl ?? collectionStories[0]?.thumbnailUrl ?? null,
    };
  });
}

function listInitialStories(options: { collectionSlug?: string; limit?: number }) {
  const scoped = options.collectionSlug
    ? initialStories.filter((story) => story.collection.slug === options.collectionSlug)
    : initialStories;
  return options.limit ? scoped.slice(0, options.limit) : [...scoped];
}

function uniqueStoryCollections(stories: StorefrontStory[]): StorefrontStoryCollection[] {
  return Array.from(new Map(stories.map((story) => [story.collection.slug, story.collection])).values()).map((collection, index) => ({
    id: `derived-${collection.slug}`,
    slug: collection.slug,
    title: collection.title,
    description: null,
    imageUrl: collection.imageUrl,
    displayOrder: index,
    storyCount: stories.filter((story) => story.collection.slug === collection.slug).length,
    coverUrl: collection.imageUrl ?? stories.find((story) => story.collection.slug === collection.slug)?.thumbnailUrl ?? null,
  }));
}
