import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createProduct } from "../../actions";
import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const context = await requireCreator();
  const supabase = await createServerSupabaseClient();
  const { data: collections } = await supabase.from("collections").select("id,title,status").eq("creator_id", context.profile.id).order("display_order");
  return <main className="admin-shell"><Link className="back-link" href="/admin"><ArrowLeft size={18}/>Creator Studio</Link><section className="admin-card admin-card-wide"><p className="eyebrow">ADD A FIND</p><h1>Give the link a story.</h1><p>Products start as drafts unless you deliberately publish them.</p><form action={createProduct} className="admin-form"><label>Product name<input name="title" required minLength={2} placeholder="The piece worth sharing"/></label><label>URL slug (optional)<input name="slug" placeholder="generated-from-title"/></label><label>Collection<select name="collectionId" defaultValue=""><option value="">Uncategorised</option>{collections?.map((collection) => <option key={collection.id} value={collection.id}>{collection.title} {collection.status === "draft" ? "(draft)" : ""}</option>)}</select></label><label>Your note<textarea name="creatorNote" maxLength={600} placeholder="Why it earned a place in the edit."/></label><label>Tags, separated by commas<input name="tags" placeholder="fitness, recovery, home gym"/></label><label>TikTok Shop affiliate URL<input name="affiliateUrl" required type="url" placeholder="https://shop.tiktok.com/…"/></label><label>Publishing state<select name="status"><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label><button className="button button-dark" type="submit">Save find</button></form></section></main>;
}
