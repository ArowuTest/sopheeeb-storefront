/* eslint-disable @next/next/no-img-element -- TikTok supplies dynamic remote oEmbed thumbnail domains. */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";

import { EditionFooter } from "@/components/store/edition-footer";
import { EditionHeaderServer } from "@/components/store/edition-header-server";
import { EditionProductCard } from "@/components/store/edition-product-card";
import { StoryTile } from "@/components/store/story-tile";
import { listPublicStories, listPublicStoryCollections } from "@/lib/data/stories";
import { listPublicProducts } from "@/lib/data/storefront";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  if (slug === "new-in") return { title: "Verified product links" };
  const category = (await listPublicStoryCollections()).find((item) => item.slug === slug);
  return { title: category ? `${category.title} / Sophiee Finds` : "Collection" };
}

const STORIES_PER_PAGE = 50;

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const query = await searchParams;
  const [collections, products] = await Promise.all([listPublicStoryCollections(), listPublicProducts({ collectionSlug: slug === "new-in" ? undefined : slug })]);
  const category = collections.find((item) => item.slug === slug);
  if (!category && slug !== "new-in") notFound();
  const stories = category ? await listPublicStories({ collectionSlug: category.slug }) : [];
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(stories.length / STORIES_PER_PAGE));
  const page = Math.min(Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1, totalPages);
  const visibleStories = stories.slice((page - 1) * STORIES_PER_PAGE, page * STORIES_PER_PAGE);
  const pageHref = (pageNumber: number) => `/collections/${slug}${pageNumber > 1 ? `?page=${pageNumber}` : ""}`;
  const lead = stories[0];
  const title = category?.title ?? "Verified product links";
  const copyBySlug: Record<string, { title: string; description: string }> = {
    fitness: { title: "Movement, made practical.", description: "At-home equipment, routines and try-ons shown in real spaces—so you can see the setup, the movement and the result before you shop." },
    fashion: { title: "Looks that earn a second look.", description: "Outfit videos, proportions and styling details captured in motion—not just a product photo on a white background." },
    beauty: { title: "Beauty, seen in real light.", description: "Routine-led finds and wellness favourites shown on camera, with the texture, finish and everyday context that matter." },
    lifestyle: { title: "The everyday upgrades.", description: "Practical pieces, try-ons and small discoveries that make an ordinary routine feel a little more considered." },
  };
  const editorialCopy = copyBySlug[slug];
  const description = editorialCopy?.description ?? category?.description ?? "The original posts and considered links behind Sophiee’s most-requested finds.";

  return <main className="edition-page edition-category">
    <EditionHeaderServer />
    <section className="edition-category-hero"><div><Link className="edition-back" href="/discover"><ArrowLeft size={16}/> All stories</Link><p className="edition-eyebrow">{category ? "SOPHIEE FINDS" : "SHOP THE EDIT"}</p><h1>{editorialCopy?.title ?? title}</h1><p>{description}</p></div>{lead ? <Link className="edition-category-lead" href={`/watch/${lead.slug}`}><img src={lead.thumbnailUrl} alt={lead.altText}/><span>Start with this find<br/>{lead.title}<ArrowUpRight size={16}/></span></Link> : <div className="edition-category-monogram">SF</div>}</section>
    {stories.length ? <section className="edition-category-stories"><div className="edition-section-heading"><div><p className="edition-eyebrow">ORIGINAL STORIES</p><h2>See it in<br/><em>real context.</em></h2></div><p>Showing {(page - 1) * STORIES_PER_PAGE + 1}–{Math.min(page * STORIES_PER_PAGE, stories.length)} of {stories.length} stories. Every post is a closer look: how it moves, how it wears, and why it made the edit in the first place.</p></div><div className="edition-index-grid">{visibleStories.map((video, index) => <StoryTile key={video.id} video={video} index={(page - 1) * STORIES_PER_PAGE + index} featured={page === 1 && index === 0}/>)}</div>{totalPages > 1 ? <nav className="edition-pagination" aria-label="Collection stories pagination">{page > 1 ? <Link href={pageHref(page - 1)} rel="prev" aria-label="Previous collection page"><ArrowLeft size={15}/> Previous</Link> : <span className="edition-pagination-disabled"><ArrowLeft size={15}/> Previous</span>}<div className="edition-pagination-pages">{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => pageNumber === page ? <span key={pageNumber} aria-current="page">{pageNumber}</span> : <Link key={pageNumber} href={pageHref(pageNumber)}>{pageNumber}</Link>)}</div>{page < totalPages ? <Link href={pageHref(page + 1)} rel="next" aria-label="Next collection page">Next <ArrowUpRight size={15}/></Link> : <span className="edition-pagination-disabled">Next <ArrowUpRight size={15}/></span>}</nav> : null}</section> : null}
    <section className="edition-category-links"><div><p className="edition-eyebrow">EXACT LINKS WHEN VERIFIED</p><h2>Ready to<br/><em>shop next.</em></h2></div>{products.length ? <div className="edition-product-grid">{products.map((product) => <EditionProductCard key={product.id} product={product}/>)}</div> : <div className="edition-empty-link"><strong>The exact Shop links are being connected.</strong><p>{stories.length ? "Start with the original stories above. Direct TikTok Shop links will appear here as each find is verified." : "This collection is ready for its first story and product link."}</p><Link href="/products">Browse the shop edit <ArrowUpRight size={16}/></Link></div>}</section>
    <EditionFooter />
  </main>;
}
