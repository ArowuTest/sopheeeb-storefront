import Link from "next/link";
import { ArrowLeft, ExternalLink, PackageOpen, Plus, Search, SquarePen } from "lucide-react";

import { BulkDraftToolbar } from "@/components/admin/bulk-draft-toolbar";
import { bulkUpdateProducts } from "../actions";
import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SearchParams = {
  q?: string;
  status?: string;
  error?: string;
  bulk?: string;
  count?: string;
};

type ProductRecord = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  creator_note: string | null;
  created_at: string;
  collections: { title?: string } | null;
  product_offers: Array<{ destination_url: string; is_active: boolean }> | null;
  product_media: Array<{ id: string; is_cover: boolean }> | null;
};

function statusIsValid(value: string | undefined): value is ProductRecord["status"] {
  return value === "draft" || value === "published" || value === "archived";
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await requireCreator();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = statusIsValid(params.status) ? params.status : "all";
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("id,title,slug,status,creator_note,created_at,collections(title),product_offers(destination_url,is_active),product_media(id,is_cover)")
    .eq("creator_id", context.profile.id)
    .order("created_at", { ascending: false });

  const products = (data ?? []) as ProductRecord[];
  const filteredProducts = products.filter((product) => {
    const matchesStatus = status === "all" || product.status === status;
    const haystack = `${product.title} ${product.slug} ${product.creator_note ?? ""}`.toLowerCase();
    return matchesStatus && (!query || haystack.includes(query.toLowerCase()));
  });
  const publishedCount = products.filter((product) => product.status === "published").length;
  const draftCount = products.filter((product) => product.status === "draft").length;
  const linkedCount = products.filter((product) => product.product_offers?.some((offer) => offer.is_active)).length;
  const filteredDraftCount = filteredProducts.filter((product) => product.status === "draft").length;
  const bulkCount = Number.parseInt(params.count ?? "0", 10) || 0;
  const bulkNotice = params.bulk === "publish"
    ? `${bulkCount} product draft${bulkCount === 1 ? "" : "s"} published.`
    : params.bulk === "archive"
      ? `${bulkCount} product draft${bulkCount === 1 ? "" : "s"} archived.`
      : null;

  return (
    <main className="admin-shell admin-products-shell">
      <Link className="back-link" href="/admin">
        <ArrowLeft size={18} />
        Creator Studio
      </Link>

      <header className="admin-header">
        <div>
          <p className="eyebrow">SHOP CATALOGUE</p>
          <h1>Every find, <em>in one place.</em></h1>
          <p className="admin-lede">Keep the exact Shop link, the story behind it and the public publishing state together. Nothing changes on the storefront until you choose to publish.</p>
        </div>
        <Link className="button button-dark" href="/admin/products/new">
          <Plus size={17} />
          Add a find
        </Link>
      </header>

      <section className="product-metrics" aria-label="Product catalogue summary">
        <div><span>All finds</span><strong>{products.length}</strong></div>
        <div><span>Published</span><strong>{publishedCount}</strong></div>
        <div><span>Drafts</span><strong>{draftCount}</strong></div>
        <div><span>With Shop link</span><strong>{linkedCount}</strong></div>
      </section>

      <form className="product-filters" method="get">
        <label>
          <span>Search catalogue</span>
          <div className="product-search-input">
            <Search size={16} />
            <input name="q" defaultValue={query} placeholder="Search title or note" />
          </div>
        </label>
        <label>
          <span>Publishing state</span>
          <select name="status" defaultValue={status}>
            <option value="all">All states</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <button className="button button-outline" type="submit">Filter</button>
        {query || status !== "all" ? <Link className="filter-reset" href="/admin/products">Reset</Link> : null}
      </form>

      {(bulkNotice || params.error === "bulk") ? <div className={`admin-notice${params.error ? " admin-notice--error" : ""}`} role="status">{bulkNotice ? <p>{bulkNotice}</p> : null}{params.error === "bulk" ? <p>Select at least one draft before choosing a bulk action.</p> : null}</div> : null}

      <section className="product-manager" aria-labelledby="product-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR FINDS</p>
            <h2 id="product-list-title">Link it once.<br /><em>Keep it current.</em></h2>
          </div>
          <p>{filteredProducts.length === products.length ? `${products.length} catalogue item${products.length === 1 ? "" : "s"}.` : `${filteredProducts.length} matching item${filteredProducts.length === 1 ? "" : "s"} of ${products.length}.`}</p>
        </div>

        {filteredProducts.length ? (
          <>
          <form id="bulk-products-form" action={bulkUpdateProducts}>
            <BulkDraftToolbar formId="bulk-products-form" group="products" draftCount={filteredDraftCount} itemLabel="product drafts"/>
          </form>
          <div className="product-manager-list">
            {filteredProducts.map((product) => {
              const collection = product.collections;
              const offer = product.product_offers?.find((candidate) => candidate.is_active) ?? product.product_offers?.[0];
              const mediaCount = product.product_media?.length ?? 0;
              return (
                <div key={product.id} className="product-manager-row">
                  <span className="bulk-checkbox-slot">{product.status === "draft" ? <input form="bulk-products-form" data-bulk-group="products" type="checkbox" name="productId" value={product.id} aria-label={`Select ${product.title}`}/> : null}</span>
                  <span className={`status-pill status-pill--${product.status}`}>{product.status}</span>
                  <Link href={`/admin/products/${product.id}`} className="product-manager-copy">
                    <strong>{product.title}</strong>
                    <small>{collection?.title ?? "Uncategorised"} · {mediaCount} media item{mediaCount === 1 ? "" : "s"} · {offer ? "Shop link ready" : "Needs Shop link"}</small>
                  </Link>
                  <span className="product-manager-actions">
                    {offer ? <span className="product-link-ready"><span className="product-link-dot" />Linked</span> : <span className="product-link-missing">Needs link</span>}
                    <Link href={`/admin/products/${product.id}`} className="product-row-edit">Edit <SquarePen size={15} /></Link>
                  </span>
                </div>
              );
            })}
          </div>
          </>
        ) : (
          <div className="admin-card admin-card-wide product-empty-state">
            <PackageOpen size={24} />
            <p className="eyebrow">{products.length ? "NO MATCHES" : "NO FINDS YET"}</p>
            <h2>{products.length ? "Try a different filter." : "Start with the exact item."}</h2>
            <p>{products.length ? "Clear the search or publishing filter to see the rest of the catalogue." : "Add the TikTok Shop URL, then give visitors the note and visual context that make the find useful."}</p>
            {products.length ? <Link className="text-link" href="/admin/products">Show all finds <ExternalLink size={15} /></Link> : <Link className="button button-dark" href="/admin/products/new"><Plus size={17} />Add the first find</Link>}
          </div>
        )}
      </section>
    </main>
  );
}
