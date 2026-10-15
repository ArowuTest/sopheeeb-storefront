import Link from "next/link";
import { ArrowLeft, ExternalLink, PackageOpen, Plus, Search, SquarePen } from "lucide-react";

import { BulkDraftToolbar } from "@/components/admin/bulk-draft-toolbar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { bulkUpdateProducts } from "../actions";
import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
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

const PRODUCTS_PER_PAGE = 25;

function escapeSearchTerm(value: string) {
  return value.replace(/[\\%,]/g, (character) => `\\${character}`).replace(/\s+/g, " ").trim();
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await requireCreator();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = statusIsValid(params.status) ? params.status : "all";
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const supabase = await createServerSupabaseClient();
  const search = escapeSearchTerm(query);
  let productsQuery = supabase
    .from("products")
    .select("id,title,slug,status,creator_note,created_at,collections(title),product_offers(destination_url,is_active),product_media(id,is_cover)", { count: "exact" })
    .eq("creator_id", context.profile.id);
  if (status !== "all") productsQuery = productsQuery.eq("status", status);
  if (query) productsQuery = productsQuery.or(`title.ilike.%${search}%,slug.ilike.%${search}%,creator_note.ilike.%${search}%`);
  const [{ data, count: matchingCount }, { count: allCount }, { count: publishedCount }, { count: draftCount }, { count: linkedCount }] = await Promise.all([
    productsQuery.order("created_at", { ascending: false }).range((requestedPage - 1) * PRODUCTS_PER_PAGE, requestedPage * PRODUCTS_PER_PAGE - 1),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("creator_id", context.profile.id),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("creator_id", context.profile.id).eq("status", "published"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("creator_id", context.profile.id).eq("status", "draft"),
    supabase.from("products").select("id,product_offers!inner(id)", { count: "exact", head: true }).eq("creator_id", context.profile.id).eq("product_offers.is_active", true),
  ]);

  const products = (data ?? []) as ProductRecord[];
  const matchingProducts = matchingCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(matchingProducts / PRODUCTS_PER_PAGE));
  const page = Math.min(requestedPage, totalPages);
  const totalProducts = allCount ?? 0;
  const filteredDraftCount = products.filter((product) => product.status === "draft").length;
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
        <div><span>All finds</span><strong>{totalProducts}</strong></div>
        <div><span>Published</span><strong>{publishedCount ?? 0}</strong></div>
        <div><span>Drafts</span><strong>{draftCount ?? 0}</strong></div>
        <div><span>With Shop link</span><strong>{linkedCount ?? 0}</strong></div>
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

      {(bulkNotice || params.error) ? <div className={`admin-notice${params.error ? " admin-notice--error" : ""}`} role="status">{bulkNotice ? <p>{bulkNotice}</p> : null}{params.error === "bulk" ? <p>Select at least one draft before choosing a bulk action.</p> : null}{params.error === "archive" ? <p>That find could not be archived. It may already have been removed.</p> : null}</div> : null}

      <section className="product-manager" aria-labelledby="product-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR FINDS</p>
            <h2 id="product-list-title">Link it once.<br /><em>Keep it current.</em></h2>
          </div>
          <p>{query || status !== "all" ? `${matchingProducts} matching item${matchingProducts === 1 ? "" : "s"} of ${totalProducts}.` : `${totalProducts} catalogue item${totalProducts === 1 ? "" : "s"}.`}</p>
        </div>

        {products.length ? (
          <>
          <form id="bulk-products-form" action={bulkUpdateProducts}>
            <BulkDraftToolbar formId="bulk-products-form" group="products" draftCount={filteredDraftCount} itemLabel="product drafts"/>
          </form>
          <div className="product-manager-list">
            {products.map((product) => {
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
          <AdminPagination page={page} totalPages={totalPages} basePath="/admin/products" query={{ q: query || undefined, status: status === "all" ? undefined : status }} label="Product catalogue pagination" />
          </>
        ) : (
          <div className="admin-card admin-card-wide product-empty-state">
            <PackageOpen size={24} />
            <p className="eyebrow">{totalProducts ? "NO MATCHES" : "NO FINDS YET"}</p>
            <h2>{totalProducts ? "Try a different filter." : "Start with the exact item."}</h2>
            <p>{totalProducts ? "Clear the search or publishing filter to see the rest of the catalogue." : "Add the TikTok Shop URL, then give visitors the note and visual context that make the find useful."}</p>
            {totalProducts ? <Link className="text-link" href="/admin/products">Show all finds <ExternalLink size={15} /></Link> : <Link className="button button-dark" href="/admin/products/new"><Plus size={17} />Add the first find</Link>}
          </div>
        )}
      </section>
    </main>
  );
}
