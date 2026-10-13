"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCreator } from "@/lib/auth/creator";
import { parseImport } from "@/lib/import/parse-import";
import { fetchTikTokOEmbed } from "@/lib/tiktok/oembed";
import { makeSlug } from "@/lib/validation/product";
import { validateAffiliateUrl } from "@/lib/validation/affiliate-url";

export async function createImportBatch(formData: FormData) {
  const context = await requireCreator();
  const raw = String(formData.get("content") ?? "");
  const parsed = parseImport(raw);
  if (!parsed.rows.length) redirect("/admin/import?error=empty");
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  const { data: batch, error } = await supabase.from("import_batches").insert({ creator_id: context.profile.id, source: raw.includes(",") ? "csv" : "paste" }).select("id").single();
  if (error || !batch) redirect("/admin/import?error=save");
  const rows = parsed.rows.map((row) => ({ batch_id: batch.id, row_number: row.index, affiliate_url: row.affiliateUrl || null, tiktok_post_url: row.tiktokPostUrl || null, title: row.title || null, collection_name: row.collection || null, errors: row.errors, is_selected: row.status === "ready" }));
  const { error: rowsError } = await supabase.from("import_rows").insert(rows);
  if (rowsError) redirect("/admin/import?error=rows");
  redirect(`/admin/import?batch=${batch.id}`);
}

export async function importSelectedRows(formData: FormData) {
  const context = await requireCreator();
  const batchId = String(formData.get("batchId") ?? "");
  const selectedIds = formData.getAll("rowId").map(String).filter(Boolean);
  if (!batchId || !selectedIds.length) redirect(`/admin/import?batch=${batchId}&error=selection`);
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase.from("import_rows").select("id,title,affiliate_url,tiktok_post_url,collection_name,errors,imported_product_id").eq("batch_id", batchId).in("id", selectedIds).is("imported_product_id", null);
  const { data: collections } = await supabase.from("collections").select("id,title").eq("creator_id", context.profile.id);
  const collectionMap = new Map((collections ?? []).map((collection) => [collection.title.toLowerCase(), collection.id]));
  for (const row of rows ?? []) {
    const errors = Array.isArray(row.errors) ? row.errors : [];
    const affiliate = validateAffiliateUrl(row.affiliate_url ?? "");
    if (errors.length || !row.title || !affiliate.ok) continue;
    const slug = `${makeSlug(row.title)}-${row.id.slice(0, 6)}`;
    const { data: product } = await supabase.from("products").insert({ creator_id: context.profile.id, title: row.title, slug, collection_id: row.collection_name ? collectionMap.get(row.collection_name.toLowerCase()) ?? null : null, status: "draft" }).select("id").single();
    if (!product) continue;
    const { error: offerError } = await supabase.from("product_offers").insert({ product_id: product.id, platform: "tiktok_shop", destination_url: affiliate.value, is_primary: true, is_active: true });
    if (offerError) { await supabase.from("products").delete().eq("id", product.id); continue; }
    if (row.tiktok_post_url) {
      const oembed = await fetchTikTokOEmbed(row.tiktok_post_url);
      if (oembed) {
        await supabase.from("product_media").insert({
          product_id: product.id,
          media_type: "tiktok_embed",
          url: oembed.thumbnailUrl,
          alt_text: oembed.title.slice(0, 240),
          tiktok_post_url: row.tiktok_post_url,
          display_order: 0,
          is_cover: false,
        });
      }
    }
    await supabase.from("import_rows").update({ imported_product_id: product.id, processed_at: new Date().toISOString() }).eq("id", row.id);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  redirect(`/admin/import?batch=${batchId}&saved=1`);
}


export async function updateImportRow(formData: FormData) {
  await requireCreator(); const id = String(formData.get("id") ?? ""); const batchId = String(formData.get("batchId") ?? "");
  const affiliateUrl = String(formData.get("affiliateUrl") ?? "").trim(); const tiktokPostUrl = String(formData.get("tiktokPostUrl") ?? "").trim(); const title = String(formData.get("title") ?? "").trim(); const collection = String(formData.get("collection") ?? "").trim();
  const errors: string[] = []; const affiliate = validateAffiliateUrl(affiliateUrl); if (!affiliate.ok) errors.push(affiliate.error);
  const post = (await import("@/lib/validation/affiliate-url")).validateTikTokPostUrl(tiktokPostUrl); if (!post.ok) errors.push(post.error);
  if (!title) errors.push("A product title is required before publishing.");
  const { createServerSupabaseClient } = await import("@/lib/supabase/server"); const supabase = await createServerSupabaseClient();
  await supabase.from("import_rows").update({ affiliate_url: affiliateUrl || null, tiktok_post_url: tiktokPostUrl || null, title: title || null, collection_name: collection || null, errors, is_selected: errors.length === 0 }).eq("id", id).eq("batch_id", batchId);
  redirect(`/admin/import?batch=${batchId}`);
}
