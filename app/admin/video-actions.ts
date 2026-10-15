"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCreator } from "@/lib/auth/creator";
import { canonicalTikTokPostUrl, parseTikTokStoryImport } from "@/lib/import/story-import";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { creatorPublicTikTokPosts, extractTikTokPostUrlsFromProfileHtml } from "@/lib/tiktok/creator-public-posts";
import { fetchTikTokOEmbed } from "@/lib/tiktok/oembed";
import { getTikTokVideoId } from "@/lib/tiktok/player";
import { validateAffiliateUrl } from "@/lib/validation/affiliate-url";
import { makeSlug } from "@/lib/validation/product";
import { creatorVideoInputSchema, type CreatorVideoInput } from "@/lib/validation/creator-video";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function storyError(path: string, code: string): never {
  return redirect(`${path}?error=${encodeURIComponent(code)}`);
}

function refreshStorySurfaces(collectionSlug?: string) {
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath("/sitemap.xml");
  if (collectionSlug) revalidatePath(`/collections/${collectionSlug}`);
}

async function verifyOwnerReferences(creatorId: string, collectionId: string, linkedProductId: string | null) {
  const supabase = await createServerSupabaseClient();
  const { data: collection } = await supabase
    .from("collections")
    .select("id,slug")
    .eq("id", collectionId)
    .eq("creator_id", creatorId)
    .maybeSingle();
  if (!collection) return { collection: null, error: "collection" } as const;

  if (linkedProductId) {
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", linkedProductId)
      .eq("creator_id", creatorId)
      .maybeSingle();
    if (!product) return { collection: null, error: "product" } as const;
  }

  return { collection, error: null } as const;
}

type PreparedStory = {
  input: CreatorVideoInput;
  collectionSlug: string;
  createdProductId?: string;
};

async function upsertStoryProductLink({
  creatorId,
  collectionId,
  postUrl,
  title,
  summary,
  status,
  linkedProductId,
  linkedProductUrl,
}: {
  creatorId: string;
  collectionId: string;
  postUrl: string;
  title: string;
  summary: string;
  status: CreatorVideoInput["status"];
  linkedProductId: string | null;
  linkedProductUrl: string;
}): Promise<{ linkedProductId: string | null; createdProductId?: string } | { error: string }> {
  if (!linkedProductUrl) return { linkedProductId };

  const affiliate = validateAffiliateUrl(linkedProductUrl);
  if (!affiliate.ok) return { error: "product-url" };

  const supabase = await createServerSupabaseClient();
  let productId = linkedProductId;
  let createdProductId: string | undefined;

  if (productId) {
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("creator_id", creatorId)
      .maybeSingle();
    if (!product) return { error: "product" };
  } else {
    const videoId = getTikTokVideoId(postUrl) ?? "";
    const baseSlug = makeSlug(title) || "tiktok-find";
    const slug = `${baseSlug.slice(0, 68)}-${videoId.slice(-8) || Date.now().toString(36)}`.slice(0, 80);
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        creator_id: creatorId,
        collection_id: collectionId,
        title,
        slug,
        creator_note: summary || null,
        tags: [],
        status: status === "published" ? "published" : "draft",
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !product) return { error: "product-save" };
    productId = product.id;
    createdProductId = product.id;
  }

  const { data: existingOffer } = await supabase
    .from("product_offers")
    .select("id")
    .eq("product_id", productId)
    .eq("platform", "tiktok_shop")
    .eq("is_primary", true)
    .maybeSingle();
  const offerResult = existingOffer
    ? await supabase.from("product_offers").update({ destination_url: affiliate.value, is_active: true }).eq("id", existingOffer.id)
    : await supabase.from("product_offers").insert({ product_id: productId, platform: "tiktok_shop", destination_url: affiliate.value, is_primary: true, is_active: true });
  if (offerResult.error) {
    if (createdProductId) await supabase.from("products").delete().eq("id", createdProductId).eq("creator_id", creatorId);
    return { error: "offer-save" };
  }

  return { linkedProductId: productId, createdProductId };
}

async function storyInput(formData: FormData): Promise<PreparedStory | { error: string }> {
  const context = await requireCreator();
  const canonicalPostUrl = canonicalTikTokPostUrl(text(formData, "tiktokPostUrl"));
  if (!canonicalPostUrl) return { error: "post-url" };

  const requestedTitle = text(formData, "title");
  const requestedThumbnail = text(formData, "thumbnailUrl");
  const oembed = requestedTitle && requestedThumbnail ? null : await fetchTikTokOEmbed(canonicalPostUrl);
  const title = requestedTitle || oembed?.title.trim().slice(0, 140) || "";
  const thumbnailUrl = requestedThumbnail || oembed?.thumbnailUrl || "";
  const linkedProductId = text(formData, "linkedProductId") || null;
  const result = creatorVideoInputSchema.safeParse({
    title,
    slug: makeSlug(text(formData, "slug") || title),
    summary: text(formData, "summary"),
    altText: text(formData, "altText") || title,
    tiktokPostUrl: canonicalPostUrl,
    thumbnailUrl,
    collectionId: text(formData, "collectionId"),
    linkedProductId,
    status: text(formData, "status"),
    displayOrder: text(formData, "displayOrder") || "0",
  });
  if (!result.success) return { error: "details" };

  const references = await verifyOwnerReferences(context.profile.id, result.data.collectionId, result.data.linkedProductId);
  if (!references.collection) return { error: references.error ?? "references" };
  const productLink = await upsertStoryProductLink({
    creatorId: context.profile.id,
    collectionId: result.data.collectionId,
    postUrl: result.data.tiktokPostUrl,
    title: result.data.title,
    summary: result.data.summary,
    status: result.data.status,
    linkedProductId: result.data.linkedProductId,
    linkedProductUrl: text(formData, "linkedProductUrl"),
  });
  if ("error" in productLink) return { error: productLink.error };
  return {
    input: { ...result.data, linkedProductId: productLink.linkedProductId },
    collectionSlug: references.collection.slug,
    createdProductId: productLink.createdProductId,
  };
}

export async function createStory(formData: FormData) {
  const context = await requireCreator();
  const prepared = await storyInput(formData);
  if ("error" in prepared) storyError("/admin/videos/new", prepared.error);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("creator_videos").insert({
    creator_id: context.profile.id,
    collection_id: prepared.input.collectionId,
    linked_product_id: prepared.input.linkedProductId,
    slug: prepared.input.slug,
    title: prepared.input.title,
    summary: prepared.input.summary,
    alt_text: prepared.input.altText,
    tiktok_post_url: prepared.input.tiktokPostUrl,
    thumbnail_url: prepared.input.thumbnailUrl,
    status: prepared.input.status,
    display_order: prepared.input.displayOrder,
    published_at: prepared.input.status === "published" ? new Date().toISOString() : null,
  }).select("id").single();
  if (error || !data) {
    if (prepared.createdProductId) await supabase.from("products").delete().eq("id", prepared.createdProductId).eq("creator_id", context.profile.id);
    storyError("/admin/videos/new", "save");
  }

  refreshStorySurfaces(prepared.collectionSlug);
  revalidatePath("/admin/videos");
  revalidatePath("/admin");
  redirect(`/admin/videos/${data.id}`);
}

export async function updateStory(formData: FormData) {
  const context = await requireCreator();
  const id = text(formData, "id");
  if (!id) storyError("/admin/videos", "story");
  const prepared = await storyInput(formData);
  if ("error" in prepared) storyError(`/admin/videos/${id}`, prepared.error);

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("creator_videos")
    .select("collection_id,published_at")
    .eq("id", id)
    .eq("creator_id", context.profile.id)
    .maybeSingle();
  if (!existing) storyError("/admin/videos", "story");

  const { data: updatedStory, error } = await supabase.from("creator_videos").update({
    collection_id: prepared.input.collectionId,
    linked_product_id: prepared.input.linkedProductId,
    slug: prepared.input.slug,
    title: prepared.input.title,
    summary: prepared.input.summary,
    alt_text: prepared.input.altText,
    tiktok_post_url: prepared.input.tiktokPostUrl,
    thumbnail_url: prepared.input.thumbnailUrl,
    status: prepared.input.status,
    display_order: prepared.input.displayOrder,
    published_at: prepared.input.status === "published" ? existing.published_at ?? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("creator_id", context.profile.id).select("id").maybeSingle();
  if (error || !updatedStory) {
    if (prepared.createdProductId) await supabase.from("products").delete().eq("id", prepared.createdProductId).eq("creator_id", context.profile.id);
    storyError(`/admin/videos/${id}`, "save");
  }

  refreshStorySurfaces(prepared.collectionSlug);
  revalidatePath("/admin/videos");
  revalidatePath("/admin");
  redirect(`/admin/videos/${id}?saved=1`);
}

export async function archiveStory(formData: FormData) {
  const context = await requireCreator();
  const id = text(formData, "id");
  if (!id) storyError("/admin/videos", "story");
  const supabase = await createServerSupabaseClient();
  const { data: story } = await supabase
    .from("creator_videos")
    .select("collections(slug)")
    .eq("id", id)
    .eq("creator_id", context.profile.id)
    .maybeSingle();
  const collection = story?.collections as unknown as { slug?: string } | null;
  const { data: archived, error } = await supabase
    .from("creator_videos")
    .update({ status: "archived", published_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", context.profile.id)
    .select("id")
    .maybeSingle();
  if (error || !archived) storyError("/admin/videos", "archive");
  refreshStorySurfaces(collection?.slug);
  revalidatePath("/admin/videos");
  revalidatePath("/admin");
  redirect("/admin/videos");
}

export async function updateStoryOrder(formData: FormData) {
  const context = await requireCreator();
  const id = text(formData, "id");
  const rawOrder = Number.parseInt(text(formData, "displayOrder") || "0", 10);
  if (!id || !Number.isFinite(rawOrder) || rawOrder < 0 || rawOrder > 100000) storyError("/admin/videos", "order");
  const supabase = await createServerSupabaseClient();
  const { data: updatedStory, error } = await supabase
    .from("creator_videos")
    .update({ display_order: rawOrder, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", context.profile.id)
    .select("id")
    .maybeSingle();
  if (error || !updatedStory) storyError("/admin/videos", "order");
  revalidatePath("/admin/videos");
  revalidatePath("/discover");
  revalidatePath("/products");
  redirect("/admin/videos?saved=order");
}

export async function bulkUpdateStories(formData: FormData) {
  const context = await requireCreator();
  const action = text(formData, "action");
  const storyIds = [...new Set(formData.getAll("storyId").map(String).filter(Boolean))].slice(0, 100);
  if (!storyIds.length || !["publish", "archive"].includes(action)) storyError("/admin/videos", "bulk");

  const supabase = await createServerSupabaseClient();
  const update = action === "publish"
    ? { status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    : { status: "archived", published_at: null, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("creator_videos")
    .update(update)
    .eq("creator_id", context.profile.id)
    .eq("status", "draft")
    .in("id", storyIds)
    .select("id");
  if (error) storyError("/admin/videos", "bulk");

  revalidatePath("/admin/videos");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath("/products");
  revalidatePath("/collections/[slug]", "page");
  redirect(`/admin/videos?bulk=${action}&count=${data?.length ?? 0}`);
}

export async function importTikTokStoryDrafts(formData: FormData) {
  const context = await requireCreator();
  const collectionId = text(formData, "collectionId");
  const references = await verifyOwnerReferences(context.profile.id, collectionId, null);
  if (!references.collection) storyError("/admin/videos", "collection");

  const parsed = parseTikTokStoryImport(text(formData, "urls"));
  const supabase = await createServerSupabaseClient();
  const { data: existing } = parsed.accepted.length
    ? await supabase.from("creator_videos").select("tiktok_post_url").eq("creator_id", context.profile.id).in("tiktok_post_url", parsed.accepted.map((entry) => entry.postUrl))
    : { data: [] as Array<{ tiktok_post_url: string }> };
  const existingUrls = new Set((existing ?? []).map((story) => story.tiktok_post_url));
  const failedLines = [...parsed.errors.map((entry) => entry.line)];
  let imported = 0;

  for (const entry of parsed.accepted) {
    if (existingUrls.has(entry.postUrl)) {
      failedLines.push(entry.line);
      continue;
    }
    const metadata = await fetchTikTokOEmbed(entry.postUrl);
    const videoId = getTikTokVideoId(entry.postUrl);
    const title = metadata?.title.trim().slice(0, 140) || "";
    const thumbnailUrl = metadata?.thumbnailUrl || "";
    if (!metadata || !videoId || !title || !thumbnailUrl) {
      failedLines.push(entry.line);
      continue;
    }
    const slug = `${makeSlug(title).slice(0, 70) || "tiktok-video"}-${videoId.slice(-8)}`;
    const { error } = await supabase.from("creator_videos").insert({
      creator_id: context.profile.id,
      collection_id: collectionId,
      slug,
      title,
      summary: "",
      alt_text: `TikTok video: ${title}`.slice(0, 240),
      tiktok_post_url: entry.postUrl,
      thumbnail_url: thumbnailUrl,
      status: "draft",
      display_order: imported,
    });
    if (error) {
      failedLines.push(entry.line);
      continue;
    }
    imported += 1;
  }

  revalidatePath("/admin/videos");
  redirect(`/admin/videos?imported=${imported}&failed=${[...new Set(failedLines)].sort((a, b) => a - b).join(",")}`);
}

function categorySlugForCaption(caption: string): "fitness" | "fashion" | "beauty" | "lifestyle" {
  const value = caption.toLowerCase();
  if (/(fitness|gym|squat|abmachine|resistanceband|pilates|pilatessocks)/.test(value)) return "fitness";
  if (/(dress|pants|skirt|jacket|fashion|loungewear|bra|intimates|jeans|top|shirt|gown|capri|yogaset)/.test(value)) return "fashion";
  if (/(lip|lash|perfume|fragrance|bodymist|probiotic|intimatehealth|feminine|phbalance|shaver)/.test(value)) return "beauty";
  return "lifestyle";
}

function titleFromCaption(caption: string) {
  return caption.replace(/\s+#\S+/g, "").replace(/\s{2,}/g, " ").trim().slice(0, 140);
}

async function mapWithConcurrency<T, R>(items: readonly T[], concurrency: number, fn: (item: T) => Promise<R>) {
  const result: R[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      result[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return result;
}

type TikTokDiscoveryResult = {
  urls: string[];
  status: "found" | "empty" | "unavailable";
};

function tiktokPostTimestamp(url: string): number {
  const videoId = getTikTokVideoId(url);
  if (!videoId) return 0;
  try {
    // TikTok video IDs contain the creation timestamp in their high bits.
    // This is only used for deterministic ordering; no date is shown to users.
    return Number(BigInt(videoId) >> BigInt(32));
  } catch {
    return 0;
  }
}

async function discoverCreatorPublicTikTokPosts(handle: string): Promise<TikTokDiscoveryResult> {
  const variants = [
    `https://www.tiktok.com/@${encodeURIComponent(handle)}`,
    `https://www.tiktok.com/@${encodeURIComponent(handle)}?lang=en`,
    `https://www.tiktok.com/@${encodeURIComponent(handle)}?is_copy_url=1&is_from_webapp=v1`,
  ];
  const urls = new Set<string>();
  let sawSuccessfulResponse = false;
  for (const profileUrl of variants) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(profileUrl, {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          accept: "text/html,application/xhtml+xml",
          "accept-language": "en-US,en;q=0.9",
          "user-agent": "Mozilla/5.0 (compatible; SophieeFindsStorefront/1.0)",
        },
      });
      if (!response.ok) continue;
      sawSuccessfulResponse = true;
      for (const url of extractTikTokPostUrlsFromProfileHtml(await response.text(), handle)) urls.add(url);
      if (urls.size >= 200) break;
    } catch {
      // Try the next public profile representation; TikTok can vary by region.
    } finally {
      clearTimeout(timeout);
    }
  }
  return { urls: [...urls].slice(0, 200), status: urls.size ? "found" : sawSuccessfulResponse ? "empty" : "unavailable" };
}

async function fetchTikTokOEmbedWithRetry(url: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const metadata = await fetchTikTokOEmbed(url);
    if (metadata) return metadata;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  return null;
}

export async function syncCreatorPublicTikTokPosts() {
  const context = await requireCreator();
  const supabase = await createServerSupabaseClient();
  const [{ data: collections }, { data: existingStories }] = await Promise.all([
    supabase.from("collections").select("id,slug").eq("creator_id", context.profile.id).neq("status", "archived"),
    supabase.from("creator_videos").select("tiktok_post_url").eq("creator_id", context.profile.id),
  ]);
  if (!collections?.length) storyError("/admin/videos", "collection");

  const existingUrls = new Set((existingStories ?? []).map((story) => story.tiktok_post_url));
  const collectionMap = new Map((collections ?? []).map((collection) => [collection.slug, collection.id]));
  if (!collectionMap.has("fitness") && collectionMap.has("move")) {
    collectionMap.set("fitness", collectionMap.get("move")!);
  }
  const fallbackCollection = collections[0].id;
  const discovery = await discoverCreatorPublicTikTokPosts(context.profile.handle);
  const discoveredUrls = discovery.urls;
  const allPublicPosts = [...new Set([
    ...discoveredUrls,
    ...creatorPublicTikTokPosts.filter((url) => url.includes("@sopheeeb")),
  ])]
    .sort((left, right) => tiktokPostTimestamp(right) - tiktokPostTimestamp(left))
    .slice(0, 200);
  const candidates = allPublicPosts.filter((url) => !existingUrls.has(url));
  const metadata = await mapWithConcurrency(candidates, 3, async (url) => ({ url, data: await fetchTikTokOEmbedWithRetry(url) }));
  let imported = 0;
  let failed = 0;

  for (const entry of metadata) {
    const caption = entry.data?.title?.trim() ?? "";
    const thumbnailUrl = entry.data?.thumbnailUrl ?? "";
    if (!caption || !thumbnailUrl) {
      failed += 1;
      continue;
    }
    const categorySlug = categorySlugForCaption(caption);
    const collectionId = collectionMap.get(categorySlug) ?? fallbackCollection;
    const videoId = getTikTokVideoId(entry.url);
    if (!videoId) {
      failed += 1;
      continue;
    }
    const title = titleFromCaption(caption) || "TikTok find";
    const slug = `${makeSlug(title).slice(0, 68) || "tiktok-find"}-${videoId.slice(-8)}`;
    const { error } = await supabase.from("creator_videos").insert({
      creator_id: context.profile.id,
      collection_id: collectionId,
      slug,
      title,
      summary: "Watch the original TikTok for the full demo, then use its native Shop button when you are ready to buy.",
      alt_text: `TikTok video: ${title}`.slice(0, 240),
      tiktok_post_url: entry.url,
      thumbnail_url: thumbnailUrl,
      status: "draft",
      display_order: imported,
    });
    if (error) failed += 1;
    else imported += 1;
  }

  revalidatePath("/admin/videos");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect(`/admin/videos?publicSync=${imported}&failed=${failed}&syncTotal=${allPublicPosts.length}&discovered=${discoveredUrls.length}&discovery=${discovery.status}`);
}
