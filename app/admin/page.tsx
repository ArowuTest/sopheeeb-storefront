import Link from "next/link";
import { BarChart3, Clapperboard, FileUp, FolderPlus, PackagePlus, PackageSearch, Settings2, ShieldCheck, Sparkles } from "lucide-react";

import { adoptInitialLibrary, signOut } from "./actions";
import { getCreatorContext } from "@/lib/auth/creator";
import { initialStories } from "@/lib/data/initial-catalogue";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const context = await getCreatorContext();
  const params = await searchParams;
  if (context.state === "unconfigured") return <main className="admin-shell"><section className="admin-card"><p className="eyebrow">CREATOR STUDIO</p><h1>Connect Supabase to open the studio.</h1><p>Add the project URL and publishable key in Railway, then return here for secure creator sign-in.</p></section></main>;
  if (context.state === "unauthenticated" || context.state === "forbidden") return <main className="admin-shell"><section className="admin-card"><p className="eyebrow">CREATOR STUDIO</p><h1>Keep the edit current.</h1><p>Sign in with the approved creator email to manage posts, product links and social profiles.</p><Link className="button button-dark" href="/admin/login">Creator sign in</Link></section></main>;
  if (context.state === "setup") return <main className="admin-shell"><section className="admin-card"><p className="eyebrow">CREATOR STUDIO</p><h1>One quick setup step.</h1><p>Create the profile, then the reviewed launch posts will be added as editable video stories with no product links attached.</p><Link className="button button-dark" href="/admin/setup">Set up Sophiee Finds</Link></section></main>;

  const supabase = await createServerSupabaseClient();
  const [{ count: totalProducts }, { count: publishedProducts }, { count: totalVideos }, { count: totalClicks }, { data: existingStories }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("creator_id", context.profile.id),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("creator_id", context.profile.id).eq("status", "published"),
    supabase.from("creator_videos").select("id", { count: "exact", head: true }).eq("creator_id", context.profile.id),
    supabase.from("outbound_clicks").select("id", { count: "exact", head: true }),
    supabase.from("creator_videos").select("slug,tiktok_post_url").eq("creator_id", context.profile.id),
  ]);
  const existingStarterSlugs = new Set((existingStories ?? []).map((story) => story.slug));
  const existingStarterUrls = new Set((existingStories ?? []).map((story) => story.tiktok_post_url));
  const missingStarterCount = initialStories.filter((story) => !existingStarterSlugs.has(story.slug) && !existingStarterUrls.has(story.tiktokPostUrl)).length;
  const needsStarterLibrary = missingStarterCount > 0;

  return <main className="admin-shell">
    <header className="admin-header"><div><p className="eyebrow">CREATOR STUDIO / @{context.profile.handle}</p><h1>Today’s edit.</h1><p className="admin-lede">A calm control room for the videos, links and collections behind the public storefront.</p></div><div className="admin-header-links"><span className="admin-role-chip"><ShieldCheck size={14}/>{context.role === "owner" ? "Owner" : "Admin"}</span><Link href="/" className="text-link">View storefront ↗</Link><form action={signOut}><button className="admin-signout" type="submit">Sign out</button></form></div></header>
    {params.error === "starter" ? <div className="admin-notice" role="status"><p>The starter library could not be added just now. Nothing was replaced—please try again.</p></div> : null}
    <section className="metric-grid"><div><span>Finds</span><strong>{totalProducts ?? 0}</strong></div><div><span>Published</span><strong>{publishedProducts ?? 0}</strong></div><div><span>Video stories</span><strong>{totalVideos ?? 0}</strong></div><div><span>Tracked clicks</span><strong>{totalClicks ?? 0}</strong></div></section>
    {needsStarterLibrary ? <section className="starter-library-card"><div><Sparkles size={21}/><p className="eyebrow">READY TO ADOPT</p><h2>Put {missingStarterCount} launch video{missingStarterCount === 1 ? "" : "s"} in your Studio.</h2><p>The public starter posts become normal Creator Studio records: edit their titles, images, categories and order; connect an exact product whenever its link is ready.</p></div><form action={adoptInitialLibrary}><button className="button button-dark" type="submit">Add {missingStarterCount} starter video{missingStarterCount === 1 ? "" : "s"}</button></form></section> : null}
    <section className="admin-actions"><Link href="/admin/videos"><Clapperboard size={21}/><span><strong>Manage videos</strong><small>Import TikTok posts, edit their story, category and product link.</small></span></Link><Link href="/admin/products"><PackageSearch size={21}/><span><strong>Manage products</strong><small>Review every find, its Shop link, media and publishing state.</small></span></Link><Link href="/admin/products/new"><PackagePlus size={21}/><span><strong>Add a find</strong><small>Save a TikTok Shop link, note and media.</small></span></Link><Link href="/admin/import"><FileUp size={21}/><span><strong>Import existing links</strong><small>Paste URLs or review a CSV privately.</small></span></Link><Link href="/admin/collections"><FolderPlus size={21}/><span><strong>Manage collections</strong><small>Create, order, publish, archive and refine every edit.</small></span></Link><Link href="/admin/settings"><Settings2 size={21}/><span><strong>Profile & links</strong><small>Update the public profile and social icons.</small></span></Link>{context.role === "owner" ? <Link href="/admin/team"><ShieldCheck size={21}/><span><strong>Team access</strong><small>Invite or revoke admins without sharing your login.</small></span></Link> : null}<Link href="/admin/analytics"><BarChart3 size={21}/><span><strong>Privacy-first analytics</strong><small>View verified outbound Shop clicks by source and product.</small></span></Link></section>
  </main>;
}
