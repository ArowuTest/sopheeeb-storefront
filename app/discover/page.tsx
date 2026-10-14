import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { EditionFooter } from "@/components/store/edition-footer";
import { EditionHeaderServer } from "@/components/store/edition-header-server";
import { StoryTile } from "@/components/store/story-tile";
import { listPublicStories, listPublicStoryCollections } from "@/lib/data/stories";

export const metadata: Metadata = { title: "The Edit", description: "Watch Sophiee’s original videos and discover the products, routines and looks behind the scroll." };

const STORIES_PER_PAGE = 50;

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const params = await searchParams;
  const requestedCategory = params.category;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const [categories, allStories] = await Promise.all([listPublicStoryCollections(), listPublicStories()]);
  const activeCategory = typeof requestedCategory === "string" ? categories.find((category) => category.slug === requestedCategory) : undefined;
  const filteredStories = activeCategory ? allStories.filter((story) => story.collection.slug === activeCategory.slug) : allStories;
  const totalPages = Math.max(1, Math.ceil(filteredStories.length / STORIES_PER_PAGE));
  const page = Math.min(Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1, totalPages);
  const videos = filteredStories.slice((page - 1) * STORIES_PER_PAGE, page * STORIES_PER_PAGE);
  const pageHref = (pageNumber: number) => `/discover?${new URLSearchParams({ ...(activeCategory ? { category: activeCategory.slug } : {}), ...(pageNumber > 1 ? { page: String(pageNumber) } : {}) }).toString()}`;

  return <main className="edition-page edition-index">
    <EditionHeaderServer />
    <section className="edition-index-hero"><div><p className="edition-eyebrow"><span>●</span> SOPHIEE FINDS</p><h1>Watch the story<br/><em>behind the find.</em></h1><p>Fashion, home, beauty, fitness and everyday upgrades—shown in motion, in real spaces, with the details that make a find worth saving.</p></div><figure><Image src="/creator-content/sophiee/profile.jpg" alt="Sophiee in a polished blue look" fill priority sizes="(max-width: 768px) 72vw, 25vw"/><figcaption>See it in context.<br/>Then choose your link.</figcaption></figure></section>
    <section className="edition-index-content">
      <nav className="edition-filter" aria-label="Filter videos by category">
        <Link href="/discover" aria-current={!activeCategory ? "page" : undefined}>All stories</Link>
        {categories.map((category) => <Link key={category.slug} href={`/discover?category=${category.slug}`} aria-current={activeCategory?.slug === category.slug ? "page" : undefined}>{category.title}</Link>)}
      </nav>
      <div className="edition-section-heading edition-index-heading">
        <div><p className="edition-eyebrow">{activeCategory ? `${activeCategory.title} / The edit` : "BROWSE THE EDIT"}</p><h2>{activeCategory?.title ?? "Find your next favourite."}</h2></div>
        <p>{filteredStories.length ? `Showing ${(page - 1) * STORIES_PER_PAGE + 1}–${Math.min(page * STORIES_PER_PAGE, filteredStories.length)} of ${filteredStories.length} stories. ${activeCategory?.description ?? "Browse every original post in one considered edit."}` : "Start with the category that brought you here, or browse every original post in one considered edit."}</p>
      </div>
      {videos.length ? <div className="edition-index-grid">{videos.map((video, index) => <StoryTile key={video.id} video={video} index={(page - 1) * STORIES_PER_PAGE + index} featured={page === 1 && index === 0} />)}</div> : <div className="edition-empty-library"><p>This edit is still being prepared.</p><span>Visit Sophiee&apos;s TikTok for the latest posts while this category is updated.</span></div>}
      {totalPages > 1 ? <nav className="edition-pagination" aria-label="Stories pagination">
        {page > 1 ? <Link href={pageHref(page - 1)} rel="prev"><ArrowLeft size={15} /> Previous</Link> : <span className="edition-pagination-disabled"><ArrowLeft size={15} /> Previous</span>}
        <div className="edition-pagination-pages">{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => pageNumber === page ? <span key={pageNumber} aria-current="page">{pageNumber}</span> : <Link key={pageNumber} href={pageHref(pageNumber)}>{pageNumber}</Link>)}</div>
        {page < totalPages ? <Link href={pageHref(page + 1)} rel="next">Next <ArrowUpRight size={15} /></Link> : <span className="edition-pagination-disabled">Next <ArrowUpRight size={15} /></span>}
      </nav> : null}
    </section>
    <section className="edition-index-rule"><span>03</span><div><p className="edition-eyebrow">A BETTER WAY TO SHOP</p><h2>Watch first. <em>Choose well.</em></h2></div><p>Play the original video here, then open TikTok when you are ready to use Sophiee&apos;s native Shop link.</p><Link href="/products">See the shop edit <ArrowUpRight size={16}/></Link></section>
    <EditionFooter />
  </main>;
}
