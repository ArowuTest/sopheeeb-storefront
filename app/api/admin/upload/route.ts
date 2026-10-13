import { NextResponse } from "next/server";

import { getCreatorContext } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]);
const maxBytes = 12 * 1024 * 1024;

function safeName(name: string) { return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-80) || "media"; }

export async function POST(request: Request) {
  const context = await getCreatorContext();
  const origin = new URL(request.url).origin;
  if (context.state !== "ready") return NextResponse.redirect(new URL("/admin/login", origin));
  const form = await request.formData();
  const productId = String(form.get("productId") ?? "");
  const file = form.get("file");
  const altText = String(form.get("altText") ?? "").trim();
  const isCover = form.get("isCover") === "on";
  if (!productId || !(file instanceof File) || !acceptedTypes.has(file.type) || file.size > maxBytes) return NextResponse.redirect(new URL(`/admin/products/${productId}?error=upload`, origin));
  const supabase = await createServerSupabaseClient();
  const { data: product } = await supabase.from("products").select("id").eq("id", productId).eq("creator_id", context.profile.id).maybeSingle();
  if (!product) return NextResponse.redirect(new URL("/admin", origin));
  const path = `${context.userId}/${productId}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from("creator-media").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (uploadError) return NextResponse.redirect(new URL(`/admin/products/${productId}?error=upload`, origin));
  if (isCover) await supabase.from("product_media").update({ is_cover: false }).eq("product_id", productId);
  const { data: count } = await supabase.from("product_media").select("id", { count: "exact", head: true }).eq("product_id", productId);
  const { error: mediaError } = await supabase.from("product_media").insert({ product_id: productId, media_type: file.type.startsWith("video/") ? "video" : "image", url: path, storage_path: path, alt_text: altText, display_order: count ?? 0, is_cover: isCover });
  if (mediaError) await supabase.storage.from("creator-media").remove([path]);
  return NextResponse.redirect(new URL(`/admin/products/${productId}${mediaError ? "?error=media" : "?saved=1"}`, origin));
}
