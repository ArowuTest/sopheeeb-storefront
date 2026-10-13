import Link from "next/link";
import { ArrowLeft, Archive } from "lucide-react";
import { notFound } from "next/navigation";

import { archiveCollection, updateCollection } from "../../actions";
import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CollectionEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const context = await requireCreator(); const supabase = await createServerSupabaseClient();
  const { data: collection } = await supabase.from("collections").select("id,title,slug,description,image_url,display_order,status").eq("id", id).eq("creator_id", context.profile.id).maybeSingle();
  if (!collection) notFound();
  return <main className="admin-shell"><Link className="back-link" href="/admin/collections"><ArrowLeft size={18}/>Collections</Link><section className="admin-card admin-card-wide"><p className="eyebrow">EDIT COLLECTION</p><h1>{collection.title}</h1><form action={updateCollection} className="admin-form"><input type="hidden" name="id" value={collection.id}/><label>Collection title<input name="title" required defaultValue={collection.title}/></label><label>URL slug<input name="slug" defaultValue={collection.slug}/></label><label>Editorial description<textarea name="description" defaultValue={collection.description ?? ""}/></label><label>Collection image URL<input name="imageUrl" type="url" defaultValue={collection.image_url ?? ""}/></label><label>Display order<input name="displayOrder" type="number" min="0" defaultValue={collection.display_order}/></label><label>Visibility<select name="status" defaultValue={collection.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><button className="button button-dark" type="submit">Save collection</button></form><form action={archiveCollection} className="inline-form"><input type="hidden" name="id" value={collection.id}/><button className="danger-link" type="submit"><Archive size={15}/>Archive collection</button></form></section></main>;
}
