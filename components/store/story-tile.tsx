/* eslint-disable @next/next/no-img-element -- TikTok supplies dynamic remote oEmbed thumbnail domains. */
import Link from "next/link";
import { ArrowUpRight, Play, ShoppingBag } from "lucide-react";

import type { StorefrontStory } from "@/lib/data/stories";

export function StoryTile({ video, index, featured = false }: { video: StorefrontStory; index?: number; featured?: boolean }) {
  const shopHref = video.linkedProduct ? `/go/${video.linkedProduct.offerId}?src=story-card` : video.tiktokPostUrl;
  return <article className={`edition-story-tile${featured ? " edition-story-tile--featured" : ""}`}>
    <Link className="edition-story-link" href={`/watch/${video.slug}`}>
      <figure className="edition-story-image"><img src={video.thumbnailUrl} alt={video.altText} loading={featured ? "eager" : "lazy"}/><span className="edition-story-category">{video.collection.title}</span><span className="edition-story-play"><Play size={13} fill="currentColor"/></span>{typeof index === "number" ? <figcaption>{String(index + 1).padStart(2, "0")}</figcaption> : null}</figure>
      <div className="edition-story-copy"><p>{video.collection.title} / Original video</p><h3>{video.title}</h3></div>
    </Link>
    <div className="edition-story-actions"><Link href={`/watch/${video.slug}`}><Play size={13} fill="currentColor"/> Play video</Link><a href={shopHref} target="_blank" rel="noreferrer" title={video.linkedProduct ? "Open the exact TikTok Shop destination" : "Open the original TikTok post and use its native Shop button"}><ShoppingBag size={13}/> Buy on TikTok <ArrowUpRight size={14}/></a></div>
  </article>;
}
