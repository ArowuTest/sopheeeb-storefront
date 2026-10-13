import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { updateImportRow } from "../../import-actions";
import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ImportRowEditor({ params }: { params: Promise<{ rowId: string }> }) {
  await requireCreator(); const { rowId } = await params; const supabase = await createServerSupabaseClient();
  const { data: row } = await supabase.from("import_rows").select("id,batch_id,affiliate_url,tiktok_post_url,title,collection_name,errors,imported_product_id").eq("id", rowId).maybeSingle();
  if (!row) notFound();
  return <main className="admin-shell"><Link className="back-link" href={`/admin/import?batch=${row.batch_id}`}><ArrowLeft size={18}/>Back to import review</Link><section className="admin-card admin-card-wide"><p className="eyebrow">EDIT IMPORT ROW</p><h1>{row.title ?? "Complete this find."}</h1>{row.imported_product_id ? <p>This row has already created a draft; edit that product in Creator Studio instead.</p> : <form action={updateImportRow} className="admin-form"><input type="hidden" name="id" value={row.id}/><input type="hidden" name="batchId" value={row.batch_id}/><label>Product title<input name="title" required defaultValue={row.title ?? ""}/></label><label>TikTok Shop affiliate URL<input name="affiliateUrl" required type="url" defaultValue={row.affiliate_url ?? ""}/></label><label>TikTok post URL (optional)<input name="tiktokPostUrl" type="url" defaultValue={row.tiktok_post_url ?? ""}/></label><label>Collection (optional)<input name="collection" defaultValue={row.collection_name ?? ""}/></label><button className="button button-dark" type="submit">Save review row</button></form>}</section></main>;
}
