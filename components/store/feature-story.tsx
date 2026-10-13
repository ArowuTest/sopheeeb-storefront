/* eslint-disable @next/next/no-img-element -- TikTok supplies dynamic remote oEmbed thumbnail domains. */
import Link from "next/link";
import { ArrowUpRight, Play, ShoppingBag } from "lucide-react";

import type { StorefrontStory } from "@/lib/data/stories";

export function FeatureStory({ video, eyebrow, title, body }: { video: StorefrontStory; eyebrow: string; title: string; body: string }) {
  const shopHref = video.linkedProduct ? `/go/${video.linkedProduct.offerId}?src=feature-story` : video.tiktokPostUrl;
  return <article className="edition-feature-story">
    <div className="edition-feature-copy"><p className="edition-eyebrow">{eyebrow}</p><h2>{title}</h2><p>{body}</p><Link className="edition-inline-action" href={`/watch/${video.slug}`}><span><Play size={14} fill="currentColor"/> Watch the video</span><ArrowUpRight size={16}/></Link><a className="edition-inline-action edition-feature-shop" href={shopHref} target="_blank" rel="noreferrer"><span><ShoppingBag size={14}/> Buy on TikTok</span><ArrowUpRight size={16}/></a></div>
    <Link className="edition-feature-image" href={`/watch/${video.slug}`}><img src={video.thumbnailUrl} alt={video.altText}/><span>{video.collection.title}<br/>{video.title}</span></Link>
  </article>;
}
