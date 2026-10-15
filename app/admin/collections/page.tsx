import Link from "next/link";
import { ArrowLeft, FolderPlus, Search } from "lucide-react";

import { AdminPagination } from "@/components/admin/admin-pagination";
import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const COLLECTIONS_PER_PAGE = 25;

function escapeSearchTerm(value: string) {
  return value.replace(/[\\%,]/g, (character) => `\\${character}`).replace(/\s+/g, " ").trim();
}

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ error?: string; q?: string; status?: string; page?: string }> }) {
  const context = await requireCreator();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = ["draft", "published", "archived"].includes(params.status ?? "") ? params.status! : "all";
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const supabase = await createServerSupabaseClient();
  let collectionsQuery = supabase
    .from("collections")
    .select("id,title,slug,status,display_order", { count: "exact" })
    .eq("creator_id", context.profile.id);
  if (status !== "all") collectionsQuery = collectionsQuery.eq("status", status);
  if (query) {
    const escaped = escapeSearchTerm(query);
    collectionsQuery = collectionsQuery.or(`title.ilike.%${escaped}%,slug.ilike.%${escaped}%`);
  }
  const { data: collections, count } = await collectionsQuery
    .order("display_order")
    .range((requestedPage - 1) * COLLECTIONS_PER_PAGE, requestedPage * COLLECTIONS_PER_PAGE - 1);
  const totalCollections = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCollections / COLLECTIONS_PER_PAGE));
  const page = Math.min(requestedPage, totalPages);
  return <main className="admin-shell"><Link className="back-link" href="/admin"><ArrowLeft size={18}/>Creator Studio</Link><header className="admin-header"><div><p className="eyebrow">COLLECTIONS</p><h1>Shape the edit.</h1><p className="admin-lede">Keep the storefront’s routes organised and easy to browse.</p></div><Link className="button button-dark" href="/admin/collections/new"><FolderPlus size={17}/>New collection</Link></header>{params.error ? <div className="admin-notice admin-notice--error" role="status"><p>That collection could not be archived or saved. Please try again.</p></div> : null}<form className="admin-video-filters collection-filters" method="get"><label><span>Search collections</span><div className="product-search-input"><Search size={16}/><input name="q" defaultValue={query} placeholder="Try beauty, fitness…" /></div></label><label><span>Status</span><select name="status" defaultValue={status}><option value="all">All states</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option></select></label><button className="button button-outline" type="submit">Filter</button>{query || status !== "all" ? <Link className="filter-reset" href="/admin/collections">Reset</Link> : null}</form><section className="collection-manager">{collections?.length ? <>{collections.map((collection) => <Link key={collection.id} href={`/admin/collections/${collection.id}`}><span><strong>{collection.title}</strong><small>/{collection.slug} · {collection.status}</small></span><span>Order {collection.display_order} ↗</span></Link>)}<AdminPagination page={page} totalPages={totalPages} basePath="/admin/collections" query={{ q: query || undefined, status: status === "all" ? undefined : status }} label="Collection pagination" /></> : <div className="admin-card"><p>{totalCollections ? "No collections match this filter." : "Collections turn the store into clear edits. Create Beauty, Fitness, Fashion, or a one-off shortlist."}</p></div>}</section></main>;
}
