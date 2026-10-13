/* eslint-disable @next/next/no-img-element -- TikTok supplies dynamic remote thumbnails. */
import Link from "next/link";
import { ArrowUpRight, Play, ShoppingBag } from "lucide-react";

import type { StorefrontStory } from "@/lib/data/stories";

export function EditionFindCard({ story }: { story: StorefrontStory }) {
  const shopHref = story.linkedProduct
    ? `/go/${story.linkedProduct.offerId}?src=story-card`
    : story.tiktokPostUrl;
  const shopLabel = story.linkedProduct ? "Shop exact item" : "Buy on TikTok";
  return <article className="edition-find-card">
    <Link className="edition-find-card-image" href={`/watch/${story.slug}`}>
      <img src={story.thumbnailUrl} alt={story.altText} loading="lazy" />
      <span>{story.collection.title}</span>
      <b><Play size={14} fill="currentColor" /> Watch the find</b>
    </Link>
    <div className="edition-find-card-copy">
      <p className="edition-eyebrow">{story.collection.title} / Featured on TikTok</p>
      <Link href={`/watch/${story.slug}`}><h3>{story.title}</h3></Link>
      <p className="edition-find-card-summary">{story.summary || "See the item in motion, in its real setting, before you decide."}</p>
      <div className="edition-find-card-actions">
        <Link href={`/watch/${story.slug}`}>Play video <ArrowUpRight size={14} /></Link>
        <a href={shopHref} target="_blank" rel="noreferrer"><ShoppingBag size={14} /> {shopLabel}</a>
      </div>
    </div>
  </article>;
}
