import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Search, ShoppingBag } from "lucide-react";

import { EditionFooter } from "@/components/store/edition-footer";
import { EditionHeaderServer } from "@/components/store/edition-header-server";
import { EditionFindCard } from "@/components/store/edition-find-card";
import { EditionProductCard } from "@/components/store/edition-product-card";
import { listPublicStories } from "@/lib/data/stories";
import { listPublicProducts } from "@/lib/data/storefront";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "All Finds",
  description: "Browse Sophiee’s original video finds, from fashion and beauty to home and everyday upgrades, with the native TikTok Shop path beside each story.",
  alternates: { canonical: "/products" },
};

const FINDS_PER_PAGE = 12;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const requestedPage = Number.parseInt((await searchParams).page ?? "1", 10);
  const safeRequestedPage = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const [products, allStories] = await Promise.all([listPublicProducts(), listPublicStories()]);
  const totalPages = Math.max(1, Math.ceil(allStories.length / FINDS_PER_PAGE));
  const page = Math.min(safeRequestedPage, totalPages);
  const start = (page - 1) * FINDS_PER_PAGE;
  const stories = allStories.slice(start, start + FINDS_PER_PAGE);
  const rangeStart = allStories.length ? start + 1 : 0;
  const rangeEnd = Math.min(start + stories.length, allStories.length);

  return (
    <main className="edition-page edition-products-index">
      <EditionHeaderServer />
      <section className="edition-products-hero">
        <div>
          <Link className="edition-back" href="/"><ArrowLeft size={16} /> Back to home</Link>
          <p className="edition-eyebrow">SOPHIEE FINDS</p>
          <h1>Finds worth<br /><em>the replay.</em></h1>
          <p>Watch Sophiee try, style and put her favourite finds to the test. Open the original TikTok for the full story, then shop through TikTok when you&apos;re ready.</p>
          <div className="edition-products-hero-actions">
            <Link className="edition-button edition-button--lime" href="#all-finds">Browse the finds <ArrowUpRight size={16} /></Link>
            <Link className="edition-text-action" href="/search"><Search size={15} /> Search the edit</Link>
          </div>
        </div>
        <div className="edition-products-hero-card" aria-label="Featured Sophiee video find" style={{ display: "grid" }}>
          <div className="edition-products-hero-card-image">
            <Image src="/creator-content/sophiee/gym-set.jpg" alt="Sophiee wearing a movement find from an original video" fill sizes="(max-width: 760px) 100vw, 320px" />
            <span className="edition-products-hero-card-stamp">THE EDIT<br /><b>01</b></span>
            <span className="edition-products-hero-card-caption">Seen in motion / Beauty</span>
          </div>
          <div className="edition-products-hero-card-copy">
            <ShoppingBag size={24} />
            <strong>Watch the story.<br />Shop when ready.</strong>
            <small>Video finds from @sopheeeb</small>
          </div>
        </div>
      </section>
      <section className="edition-find-library edition-products-catalogue" id="all-finds">
        <div className="edition-section-heading">
          <div><p className="edition-eyebrow">THE FULL VIDEO EDIT</p><h2>See what made<br /><em>the cut.</em></h2></div>
          <p>{allStories.length ? `Showing ${rangeStart}–${rangeEnd} of ${allStories.length} finds. Watch the original post, then follow its native TikTok Shop path when you're ready.` : "The next find is on its way."}</p>
        </div>
        {stories.length ? <div className="edition-find-grid">{stories.map((story) => <EditionFindCard key={story.id} story={story} />)}</div> : <div className="edition-products-empty"><p>The next find is on its way.</p><span>New stories will appear here as soon as they are ready to share.</span></div>}
        {totalPages > 1 ? <nav className="edition-pagination" aria-label="Finds pagination">
          {page > 1 ? <Link href={`/products?page=${page - 1}`} rel="prev" aria-label="Previous page"><ArrowLeft size={15} /> Previous</Link> : <span className="edition-pagination-disabled"><ArrowLeft size={15} /> Previous</span>}
          <div className="edition-pagination-pages">{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => pageNumber === page
            ? <span key={pageNumber} aria-current="page">{pageNumber}</span>
            : <Link key={pageNumber} href={`/products?page=${pageNumber}`}>{pageNumber}</Link>)}</div>
          {page < totalPages ? <Link href={`/products?page=${page + 1}`} rel="next" aria-label="Next page">Next <ArrowUpRight size={15} /></Link> : <span className="edition-pagination-disabled">Next <ArrowUpRight size={15} /></span>}
        </nav> : null}
      </section>
      {products.length ? <section className="edition-products-library edition-products-library--secondary">
        <div className="edition-section-heading">
          <div><p className="edition-eyebrow">VERIFIED SHOP LINKS</p><h2>Shop the <em>exact find.</em></h2></div>
          <p>{products.length} direct TikTok Shop link{products.length === 1 ? "" : "s"}{products.length === 1 ? " is" : " are"} ready when you want to move from story to checkout.</p>
        </div>
        <div className="edition-product-grid">{products.map((product) => <EditionProductCard key={product.id} product={product} />)}</div>
      </section>
      : <p className="edition-products-link-note">Exact Shop destinations appear here as they are verified. Every story above still opens the original TikTok post, where the creator&apos;s native Shop button is available.</p>}
      <EditionFooter />
    </main>
  );
}
