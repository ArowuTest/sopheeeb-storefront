import { NextResponse } from "next/server";

import { buildSafeAffiliateRedirect } from "@/lib/affiliate/redirect";
import { hasSupabaseConfig } from "@/lib/config/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  if (!hasSupabaseConfig()) return NextResponse.redirect(new URL("/?notice=shop-unavailable", request.url), 302);
  const { offerId } = await params;
  const source = new URL(request.url).searchParams.get("src");
  let supabase;
  try { supabase = createServiceSupabaseClient(); } catch { return NextResponse.redirect(new URL("/?notice=shop-unavailable", request.url), 302); }
  const { data } = await supabase
    .from("product_offers")
    .select("id, destination_url, is_active, products!inner(status)")
    .eq("id", offerId)
    .eq("is_active", true)
    .eq("products.status", "published")
    .maybeSingle();
  if (!data) return NextResponse.redirect(new URL("/?notice=product-unavailable", request.url), 302);
  const safe = buildSafeAffiliateRedirect(data.destination_url, source);
  if (!safe) return NextResponse.redirect(new URL("/?notice=invalid-link", request.url), 302);
  const { error: clickError } = await supabase.from("outbound_clicks").insert({ offer_id: data.id, source: safe.source });
  if (clickError) {
    // Never block a shopper because telemetry is unavailable, but leave a
    // structured server-side signal so the creator can investigate a broken
    // analytics policy or migration.
    console.error("outbound_click_record_failed", { offerId: data.id, code: clickError.code });
  }
  return NextResponse.redirect(safe.destination, 302);
}
