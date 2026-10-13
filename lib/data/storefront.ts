import "server-only";

import { hasSupabaseConfig } from "../config/env";
import { createPublicSupabaseClient } from "../supabase/server";
import { productCatalogueSelect } from "./product-query";

export interface StorefrontProfile {
  id: string;
  handle: string;
  displayName: string;
  tagline: string | null;
  affiliateDisclosure: string;
}

export type PublicProfileLookup =
  | { state: "unconfigured" | "missing" | "error"; profile: null }
  | { state: "ready"; profile: StorefrontProfile };

export interface StorefrontCollection {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

export interface StorefrontProduct {
  id: string;
  slug: string;
  title: string;
  creatorNote: string | null;
  tags: string[];
  collection: { slug: string; title: string } | null;
  offerId: string | null;
  media: Array<{ id: string; url: string; altText: string; isCover: boolean; mediaType: string; tiktokPostUrl: string | null }>;
}

function matchesProductQuery(product: StorefrontProduct, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).map((term) => term.trim()).filter(Boolean);
  if (!terms.length) return true;
  const haystack = [
    product.id,
    product.slug,
    product.title,
    product.creatorNote,
    ...(product.tags ?? []),
    product.collection?.title,
    product.collection?.slug,
    ...product.media.flatMap((media) => [media.altText, media.tiktokPostUrl, media.url]),
  ].filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function getPublicStorefrontClientOrNull() {
  if (!hasSupabaseConfig()) return null;
  try {
    return createPublicSupabaseClient();
  } catch {
    return null;
  }
}

function creatorHandle() {
  return process.env.NEXT_PUBLIC_CREATOR_HANDLE?.trim().toLowerCase() || "sopheeeb";
}

function mapProduct(row: Record<string, unknown>): StorefrontProduct {
  const collections = Array.isArray(row.collections) ? row.collections[0] : row.collections;
  const offers = Array.isArray(row.product_offers) ? row.product_offers : [];
  const media = Array.isArray(row.product_media) ? row.product_media : [];
  const primaryOffer = offers.find((offer) => offer.is_primary) ?? offers[0];

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    creatorNote: typeof row.creator_note === "string" ? row.creator_note : null,
    tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [],
    collection: collections && typeof collections === "object" ? { slug: String((collections as Record<string, unknown>).slug), title: String((collections as Record<string, unknown>).title) } : null,
    offerId: primaryOffer && typeof primaryOffer === "object" ? String((primaryOffer as Record<string, unknown>).id) : null,
    media: media.map((item) => {
      const entry = item as Record<string, unknown>;
      const id = String(entry.id);
      return { id, url: typeof entry.storage_path === "string" ? `/api/media/${id}` : String(entry.url), altText: String(entry.alt_text ?? ""), isCover: Boolean(entry.is_cover), mediaType: String(entry.media_type), tiktokPostUrl: typeof entry.tiktok_post_url === "string" ? entry.tiktok_post_url : null };
    }),
  };
}

export async function lookupPublicProfile(): Promise<PublicProfileLookup> {
  const supabase = getPublicStorefrontClientOrNull();
  if (!supabase) return { state: "unconfigured", profile: null };
  const { data, error } = await supabase
    .from("public_creator_profiles")
    .select("id, handle, display_name, tagline, affiliate_disclosure")
    .eq("handle", creatorHandle())
    .maybeSingle();
  if (error) return { state: "error", profile: null };
  if (!data) return { state: "missing", profile: null };
  return { state: "ready", profile: { id: data.id, handle: data.handle, displayName: data.display_name, tagline: data.tagline, affiliateDisclosure: data.affiliate_disclosure } };
}

export async function getPublicProfile(): Promise<StorefrontProfile | null> {
  const result = await lookupPublicProfile();
  return result.profile;
}

export async function getPublicCollections(): Promise<StorefrontCollection[]> {
  const profile = await getPublicProfile();
  const supabase = getPublicStorefrontClientOrNull();
  if (!profile || !supabase) return [];
  const { data } = await supabase
    .from("collections")
    .select("id, slug, title, description, image_url, display_order")
    .eq("creator_id", profile.id)
    .eq("status", "published")
    .order("display_order");
  return (data ?? []).map((row) => ({ id: row.id, slug: row.slug, title: row.title, description: row.description, imageUrl: row.image_url, displayOrder: row.display_order }));
}

export async function listPublicProducts(options: { collectionSlug?: string; query?: string; limit?: number } = {}): Promise<StorefrontProduct[]> {
  const profile = await getPublicProfile();
  const supabase = getPublicStorefrontClientOrNull();
  if (!profile || !supabase) return [];
  let query = supabase
    .from("products")
    .select(productCatalogueSelect(options.collectionSlug))
    .eq("creator_id", profile.id)
    .eq("status", "published")
    .eq("product_offers.is_active", true)
    .order("published_at", { ascending: false })
    .order("display_order", { foreignTable: "product_media", ascending: true });
  if (options.collectionSlug) query = query.eq("collections.slug", options.collectionSlug);
  // Search is intentionally applied after mapping so visitors can find a
  // product by title, caption, collection, tag, product id or the TikTok post
  // attached to its media—not just the display title.
  if (options.limit && !options.query) query = query.limit(options.limit);
  const { data } = await query;
  const products = (data ?? []).map((row) => mapProduct(row as unknown as Record<string, unknown>));
  const filtered = options.query ? products.filter((product) => matchesProductQuery(product, options.query!)) : products;
  return options.limit ? filtered.slice(0, options.limit) : filtered;
}

export async function getPublicProduct(slug: string): Promise<StorefrontProduct | null> {
  const profile = await getPublicProfile();
  const supabase = getPublicStorefrontClientOrNull();
  if (!profile || !supabase) return null;
  const { data } = await supabase
    .from("products")
    .select("id, slug, title, creator_note, tags, collections(slug,title), product_offers!inner(id,is_primary,is_active), product_media(id,url,storage_path,alt_text,is_cover,media_type,tiktok_post_url,display_order)")
    .eq("creator_id", profile.id)
    .eq("slug", slug)
    .eq("status", "published")
    .eq("product_offers.is_active", true)
    .maybeSingle();
  return data ? mapProduct(data as unknown as Record<string, unknown>) : null;
}

export interface StorefrontSocialLink {
  id: string;
  platform: "tiktok" | "instagram" | "youtube" | "pinterest" | "website" | "email";
  url: string;
  label: string | null;
}

export async function getPublicSocialLinks(): Promise<StorefrontSocialLink[]> {
  const profile = await getPublicProfile();
  const supabase = getPublicStorefrontClientOrNull();
  if (!profile || !supabase) return [];
  const { data } = await supabase
    .from("social_links")
    .select("id,platform,url,label")
    .eq("creator_id", profile.id)
    .eq("is_visible", true)
    .order("display_order");
  return (data ?? []) as StorefrontSocialLink[];
}
