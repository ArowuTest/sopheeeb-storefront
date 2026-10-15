import { NextResponse } from "next/server";

import { getCreatorContext } from "@/lib/auth/creator";
import { fetchTikTokOEmbed } from "@/lib/tiktok/oembed";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const context = await getCreatorContext(); const origin = new URL(request.url).origin;
  if (context.state !== "ready") return NextResponse.redirect(new URL("/admin/login", origin));
  const form = await request.formData(); const productId = String(form.get("productId") ?? ""); const postUrl = String(form.get("postUrl") ?? "").trim();
  const oembed = await fetchTikTokOEmbed(postUrl);
  if (!productId || !oembed) return NextResponse.redirect(new URL(`/admin/products/${productId}?error=tiktok`, origin));
  const supabase = await createServerSupabaseClient();
  const { data: product } = await supabase.from("products").select("id").eq("id", productId).eq("creator_id", context.profile.id).maybeSingle();
  if (!product) return NextResponse.redirect(new URL("/admin", origin));
  const { data: count } = await supabase.from("product_media").select("id", { count: "exact", head: true }).eq("product_id", productId);
  const { error } = await supabase.from("product_media").insert({ product_id: productId, media_type: "tiktok_embed", url: oembed.thumbnailUrl, alt_text: oembed.title, tiktok_post_url: postUrl, display_order: count ?? 0, is_cover: false });
  return NextResponse.redirect(new URL(`/admin/products/${productId}${error ? "?error=media" : "?saved=1"}`, origin));
}
