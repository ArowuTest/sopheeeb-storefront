import { NextResponse } from "next/server";

import { hasSupabaseConfig } from "@/lib/config/env";
import { createPublicSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) return new NextResponse("Not found", { status: 404 });
  const { id } = await params;
  const publicClient = createPublicSupabaseClient();
  const { data: media } = await publicClient.from("product_media").select("storage_path").eq("id", id).not("storage_path", "is", null).maybeSingle();
  if (!media?.storage_path) return new NextResponse("Not found", { status: 404 });
  let serviceClient;
  try { serviceClient = createServiceSupabaseClient(); } catch { return new NextResponse("Not found", { status: 404 }); }
  const { data, error } = await serviceClient.storage.from("creator-media").createSignedUrl(media.storage_path, 60);
  if (error || !data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { "Cache-Control": "private, no-store" } });
}
