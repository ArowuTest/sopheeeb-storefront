import Link from "next/link";
import { ArrowLeft, FolderPlus } from "lucide-react";

import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CollectionsPage() {
  const context = await requireCreator(); const supabase = await createServerSupabaseClient();
  const { data: collections } = await supabase.from("collections").select("id,title,slug,status,display_order").eq("creator_id", context.profile.id).order("display_order");
  return <main className="admin-shell"><Link className="back-link" href="/admin"><ArrowLeft size={18}/>Creator Studio</Link><header className="admin-header"><div><p className="eyebrow">COLLECTIONS</p><h1>Shape the edit.</h1></div><Link className="button button-dark" href="/admin/collections/new"><FolderPlus size={17}/>New collection</Link></header><section className="collection-manager">{collections?.length ? collections.map((collection) => <Link key={collection.id} href={`/admin/collections/${collection.id}`}><span><strong>{collection.title}</strong><small>/{collection.slug} · {collection.status}</small></span><span>Order {collection.display_order} ↗</span></Link>) : <div className="admin-card"><p>Collections turn the store into clear edits. Create Beauty, Fitness, Fashion, or a one-off shortlist.</p></div>}</section></main>;
}
