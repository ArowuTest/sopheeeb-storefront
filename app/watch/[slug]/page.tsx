import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ExternalLink, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";

import { EditionFooter } from "@/components/store/edition-footer";
import { EditionHeaderServer } from "@/components/store/edition-header-server";
import { StoryTile } from "@/components/store/story-tile";
import { TikTokPlayer } from "@/components/store/tiktok-player";
import { getPublicStory, listPublicStories } from "@/lib/data/stories";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const video = await getPublicStory((await params).slug);
  return video ? { title: video.title, description: video.summary || `Watch Sophiee’s original ${video.collection.title} TikTok video.` } : { title: "Video not found" };
}

export default async function WatchStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const video = await getPublicStory((await params).slug);
  if (!video) notFound();
  const related = (await listPublicStories({ collectionSlug: video.collection.slug })).filter((item) => item.id !== video.id).slice(0, 3);
  return <main className="edition-page edition-watch">
    <EditionHeaderServer />
    <article className="edition-watch-article"><Link className="edition-back" href={`/collections/${video.collection.slug}`}><ArrowLeft size={16}/> Back to {video.collection.title}</Link><div className="edition-watch-hero"><TikTokPlayer postUrl={video.tiktokPostUrl} title={video.title} className="edition-watch-player" priority/><div className="edition-watch-mobile-shop">{video.linkedProduct ? <Link className="edition-button edition-button--lime edition-watch-shop" href={`/go/${video.linkedProduct.offerId}?src=video`}><ShoppingBag size={16}/> Get {video.linkedProduct.title} <ArrowUpRight size={15}/></Link> : <a className="edition-external-video edition-watch-tiktok-shop" href={video.tiktokPostUrl} target="_blank" rel="noreferrer">Open TikTok to shop <ExternalLink size={15}/></a>}</div><div className="edition-watch-copy"><p className="edition-eyebrow">ORIGINAL TIKTOK / {video.collection.title.toUpperCase()}</p><h1>{video.title}</h1><p>{video.summary || "Watch the original TikTok here for the full context."}</p><p className="edition-watch-direction">Press play to watch the original TikTok without leaving this page.</p><a className={`edition-external-video${video.linkedProduct ? "" : " edition-watch-tiktok-shop"}`} href={video.tiktokPostUrl} target="_blank" rel="noreferrer">{video.linkedProduct ? "Open in TikTok" : "Open TikTok to shop"} <ExternalLink size={15}/></a>{video.linkedProduct ? <Link className="edition-button edition-button--lime edition-watch-shop" href={`/go/${video.linkedProduct.offerId}?src=video`}><ShoppingBag size={16}/> Get {video.linkedProduct.title} <ArrowUpRight size={15}/></Link> : null}<small>{video.linkedProduct ? "This Shop button leads to the exact product connected to this video." : "TikTok may show the creator’s native Shop button inside the original post on mobile."}</small></div></div></article>
    <section className="edition-watch-link"><span>04</span><div><p className="edition-eyebrow">PRODUCT LINK</p><h2>Looking for<br/><em>this item?</em></h2></div><p>{video.linkedProduct ? `The exact ${video.linkedProduct.title} is linked above.` : "Open the original TikTok post to see any native Shop button attached to the video."}</p>{video.linkedProduct ? <Link href={`/go/${video.linkedProduct.offerId}?src=video-panel`}>Open the exact TikTok Shop link <ArrowUpRight size={16}/></Link> : <a href={video.tiktokPostUrl} target="_blank" rel="noreferrer">Open the TikTok post <ExternalLink size={16}/></a>}</section>
    {related.length ? <section className="edition-watch-related"><div className="edition-section-heading"><div><p className="edition-eyebrow">MORE FROM {video.collection.title.toUpperCase()}</p><h2>Watch these<br/><em>next.</em></h2></div></div><div className="edition-story-row">{related.map((item, index) => <StoryTile key={item.id} video={item} index={index}/>)}</div></section> : null}
    <EditionFooter />
  </main>;
}
