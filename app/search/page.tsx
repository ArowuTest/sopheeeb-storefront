import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Search } from "lucide-react";

import { EditionFooter } from "@/components/store/edition-footer";
import { EditionHeaderServer } from "@/components/store/edition-header-server";
import { EditionProductCard } from "@/components/store/edition-product-card";
import { StoryTile } from "@/components/store/story-tile";
import { listPublicStories } from "@/lib/data/stories";
import { listPublicProducts } from "@/lib/data/storefront";

export const metadata: Metadata = {
  title: "Search the Edit",
  description: "Search Sophiee’s video stories, captions, categories, TikTok IDs and verified product links.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim() ?? "";
  const [products, videos] = query
    ? await Promise.all([listPublicProducts({ query }), listPublicStories({ query })])
    : [[], []];
  const hasResults = products.length > 0 || videos.length > 0;
  return <main className="edition-page edition-search"><EditionHeaderServer/><section className="edition-search-hero"><Link className="edition-back" href="/"><ArrowLeft size={16}/> Back to home</Link><p className="edition-eyebrow">FIND THE LINK YOU SAW</p><h1>Search the<br/><em>whole edit.</em></h1><p>Search product names, captions, categories, TikTok IDs and keywords such as gym, fitness or bra.</p><form className="edition-search-form"><label htmlFor="edition-search">Search videos and verified products</label><div><input id="edition-search" name="q" defaultValue={query} placeholder="Try gym, fitness, bra or a TikTok ID"/><button type="submit"><Search size={17}/> Find it</button></div></form></section>{query && hasResults ? <section className="edition-search-results"><p className="edition-eyebrow">RESULTS FOR “{query}”</p>{videos.length ? <div className="edition-search-result-group"><h2>Videos</h2><div className="edition-index-grid">{videos.map((video, index) => <StoryTile key={video.id} video={video} index={index}/>)}</div></div> : null}{products.length ? <div className="edition-search-result-group"><h2>Verified products</h2><div className="edition-product-grid">{products.map((product) => <EditionProductCard key={product.id} product={product}/>)}</div></div> : null}</section> : <section className="edition-search-empty"><p>{query ? `Nothing matched “${query}” yet.` : "Search the video library or exact product links."}</p><span>{query ? "Try a shorter keyword, a TikTok video ID, or browse the full library." : "Search works across published videos, captions, categories, IDs and verified products."}</span><Link href="/discover">Open the video library <ArrowUpRight size={16}/></Link></section>}<EditionFooter /></main>;
}
