import type { MetadataRoute } from "next";

import { listPublicStories, listPublicStoryCollections } from "@/lib/data/stories";
import { listPublicProducts } from "@/lib/data/storefront";
import { siteUrl } from "@/lib/config/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, stories, products] = await Promise.all([listPublicStoryCollections(), listPublicStories(), listPublicProducts()]);
  const base = siteUrl;
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/discover`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/products`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    ...collections.map((collection) => ({ url: `${base}/collections/${collection.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...stories.map((story) => ({ url: `${base}/watch/${story.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((product) => ({ url: `${base}/products/${product.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
