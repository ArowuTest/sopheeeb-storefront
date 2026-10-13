import Link from "next/link";
import { ArrowLeft, Clapperboard, Plus, Search, SquarePen } from "lucide-react";

import { BulkDraftToolbar } from "@/components/admin/bulk-draft-toolbar";
import { StoryImportForm } from "@/components/admin/story-import-form";
import { SyncPublicPostsButton } from "@/components/admin/sync-public-posts-button";
import { bulkUpdateStories, syncCreatorPublicTikTokPosts, updateStoryOrder } from "../video-actions";
import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ imported?: string; failed?: string; error?: string; starter?: string; publicSync?: string; syncTotal?: string; discovered?: string; discovery?: string; q?: string; status?: string; saved?: string; bulk?: string; count?: string }> }) {
  const context = await requireCreator();
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const [{ data: stories }, { data: collections }] = await Promise.all([
    supabase.from("creator_videos").select("id,title,slug,status,summary,display_order,tiktok_post_url,collections(title),linked_product:products(title)").eq("creator_id", context.profile.id).order("display_order").order("created_at", { ascending: false }),
    supabase.from("collections").select("id,title,status").eq("creator_id", context.profile.id).neq("status", "archived").order("display_order"),
  ]);
  const query = params.q?.trim().toLowerCase() ?? "";
  const status = ["draft", "published", "archived"].includes(params.status ?? "") ? params.status : "all";
  const filteredStories = (stories ?? []).filter((story) => {
    const collection = story.collections as unknown as { title?: string } | null;
    const haystack = `${story.title} ${story.slug} ${story.summary ?? ""} ${story.tiktok_post_url} ${collection?.title ?? ""}`.toLowerCase();
    return (status === "all" || story.status === status) && (!query || haystack.includes(query));
  });
  const imported = Number(params.imported ?? 0);
  const failedLines = params.failed?.split(",").filter(Boolean) ?? [];
  const bulkCount = Number.parseInt(params.count ?? "0", 10) || 0;
  const bulkNotice = params.bulk === "publish"
    ? `${bulkCount} video draft${bulkCount === 1 ? "" : "s"} published.`
    : params.bulk === "archive"
      ? `${bulkCount} video draft${bulkCount === 1 ? "" : "s"} archived.`
      : null;
  const draftCount = filteredStories.filter((story) => story.status === "draft").length;

  const retryNotice = params.failed && params.failed !== "0" ? `${params.failed} posts need a retry.` : "";
  const discoveryNote = params.discovered ? ` TikTok exposed ${params.discovered} public post URLs during this scan.` : "";
  const discoveryWarning = params.discovery === "empty" || params.discovery === "unavailable";
  const notice = params.publicSync === "0"
    ? discoveryWarning
      ? `TikTok did not expose any current profile post URLs to the server during this scan. The ${params.syncTotal ?? "configured"} known URLs were checked, but newer posts may still be missing. Use Batch import below for today's post links.`
      : `No new posts found across ${params.syncTotal ?? "the configured"} public post URLs.${discoveryNote}`
    : params.publicSync
      ? `${params.publicSync} public TikTok draft${params.publicSync === "1" ? "" : "s"} synced.${discoveryNote}`
      : null;
  const syncResult = params.publicSync !== undefined;
  const notices = imported || failedLines.length || params.error || params.starter || params.publicSync || params.saved || bulkNotice;
  return (
    <main className="admin-shell">
      <Link className="back-link" href="/admin"><ArrowLeft size={18} /> Creator Studio</Link>
      <header className="admin-header">
        <div><p className="eyebrow">VIDEO LIBRARY</p><h1>Every post, <em>on your terms.</em></h1></div>
        <Link className="button button-dark" href="/admin/videos/new"><Plus size={17} /> Add one video</Link>
      </header>
      {notices ? <div className="admin-notice" role="status">
        {params.saved === "order" ? <p>Story order saved. The storefront will use the new position.</p> : null}
        {bulkNotice ? <p>{bulkNotice}</p> : null}
        {params.starter === "adopted" ? <p>Starter videos are now in Creator Studio. Open any row to update its category, copy, thumbnail or product link.</p> : null}
        {params.starter === "already-present" ? <p>Your Creator Studio already contains the starter library.</p> : null}
        {imported ? <p>{imported} private video draft{imported === 1 ? "" : "s"} created.</p> : null}
        {notice ? <p>{notice} {retryNotice} Exact Shop destinations were not inferred.</p> : null}
        {failedLines.length ? <p>Could not import lines {failedLines.join(", ")}. Use full, unique TikTok post URLs and try again.</p> : null}
        {params.error === "order" ? <p>Enter an order number between 0 and 100,000.</p> : null}
        {params.error === "product-url" ? <p>Paste a complete HTTPS TikTok Shop URL beginning with <code>https://shop.tiktok.com/</code>.</p> : null}
        {params.error === "offer-save" || params.error === "product-save" ? <p>The product link could not be saved. Please try again.</p> : null}
        {params.error === "bulk" ? <p>Select at least one draft before choosing a bulk action.</p> : null}
        {params.error && !["order", "product-url", "offer-save", "product-save", "bulk"].includes(params.error) ? <p>That video could not be saved. Check the collection, post URL and field details.</p> : null}
      </div> : null}
      <section className="story-manager">
        <div className="section-heading"><div><p className="eyebrow">YOUR VIDEO STORIES</p><h2>Video first.<br />Shop link <em>when ready.</em></h2></div><p>Search by caption, title, TikTok URL or ID. Update the order number inline, then open a row to edit its full story.</p></div>
        <form className="admin-video-filters" method="get">
          <label><span>Search videos</span><div className="product-search-input"><Search size={16} /><input name="q" defaultValue={params.q ?? ""} placeholder="Try gym, bra, 7690…" /></div></label>
          <label><span>Status</span><select name="status" defaultValue={status}><option value="all">All states</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option></select></label>
          <button className="button button-outline" type="submit">Filter</button>
          {query || status !== "all" ? <Link className="filter-reset" href="/admin/videos">Reset</Link> : null}
        </form>
        {filteredStories.length ? <>
          <form id="bulk-stories-form" action={bulkUpdateStories} />
          <BulkDraftToolbar formId="bulk-stories-form" group="stories" draftCount={draftCount} itemLabel="video drafts" />
          <div className="story-manager-list">{filteredStories.map((story) => {
            const collection = story.collections as unknown as { title?: string } | null;
            const product = story.linked_product as unknown as { title?: string } | null;
            return <div key={story.id} className="story-manager-row"><span className="bulk-checkbox-slot">{story.status === "draft" ? <input form="bulk-stories-form" data-bulk-group="stories" type="checkbox" name="storyId" value={story.id} aria-label={`Select ${story.title}`} /> : null}</span><span className={`status-pill status-pill--${story.status}`}>{story.status}</span><Link href={`/admin/videos/${story.id}`} className="story-manager-copy"><strong>{story.title}</strong><small>{collection?.title ?? "No collection"} · {story.tiktok_post_url} · {product?.title ? `Linked to ${product.title}` : "No product link"}</small></Link><form action={updateStoryOrder} className="story-order-form"><input type="hidden" name="id" value={story.id} /><label><span>Order</span><input name="displayOrder" type="number" min="0" max="100000" defaultValue={story.display_order} /></label><button className="story-row-action" type="submit">Save <SquarePen size={15} /></button></form></div>;
          })}</div>
        </> : <div className="admin-card admin-card-wide"><Clapperboard size={23} /><p className="eyebrow">{stories?.length ? "NO MATCHES" : "NO VIDEO STORIES YET"}</p><h2>{stories?.length ? "Try a different search." : "Start with a post people already ask about."}</h2><p>{stories?.length ? "Search across titles, captions, URLs, IDs and collection names." : "Add a single video, or create private drafts in batches. Nothing appears on the storefront until you publish it."}</p></div>}
      </section>
      <section className="admin-card admin-card-wide story-sync-card">
        <p className="eyebrow">PUBLIC PAGE SYNC</p><h2>Sync the public profile and configured library.</h2>
        <p>This checks the public @sopheeeb profile when TikTok exposes its post URLs, then merges them with the configured library, fetches official captions and thumbnails for missing posts, and saves everything as private drafts. TikTok can limit automated discovery; Batch import remains available for any post links it does not expose. Shop links are never guessed.</p>
        {syncResult ? <div className={`sync-result ${discoveryWarning ? "sync-result--warning" : params.publicSync === "0" ? "sync-result--quiet" : "sync-result--success"}`} role="status"><strong>{discoveryWarning ? "TikTok's public feed needs a manual link handoff." : params.publicSync === "0" ? "Everything known is already up to date." : `${params.publicSync} new draft${params.publicSync === "1" ? "" : "s"} added.`}</strong><span>{notice}{params.failed && params.failed !== "0" ? ` ${params.failed} post${params.failed === "1" ? "" : "s"} could not be read.` : ""}</span></div> : null}
        <form action={syncCreatorPublicTikTokPosts}><SyncPublicPostsButton /></form>
      </section>
      <StoryImportForm collections={(collections ?? []).map((collection) => ({ id: collection.id, title: collection.title }))} />
    </main>
  );
}
