import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getAdminEmail, getSupabasePublicConfig, hasSupabaseConfig, siteUrl } from "@/lib/config/env";

const requestWindows = new Map<string, { startedAt: number; count: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (requestWindows.size > 5000) {
    for (const [storedKey, window] of requestWindows) {
      if (now - window.startedAt > WINDOW_MS) requestWindows.delete(storedKey);
    }
  }
  const previous = requestWindows.get(key);
  if (!previous || now - previous.startedAt > WINDOW_MS) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return false;
  }
  previous.count += 1;
  requestWindows.set(key, previous);
  return previous.count > MAX_REQUESTS;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(`ip:${ip}`) || (email && isRateLimited(`email:${email}`))) {
    return NextResponse.redirect(new URL("/admin/login?error=rate", siteUrl));
  }
  const adminEmail = getAdminEmail();
  if (!email || !adminEmail || !hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/admin/login?error=authorised", siteUrl));
  }
  let allowed = email === adminEmail;
  if (!allowed) {
    try {
      const service = createServiceSupabaseClient();
      const { data } = await service.from("creator_members").select("id").eq("email", email).in("status", ["pending", "active"]).maybeSingle();
      allowed = Boolean(data);
    } catch {
      allowed = false;
    }
  }
  if (!allowed) return NextResponse.redirect(new URL("/admin/login?error=authorised", siteUrl));
  const { url, key } = getSupabasePublicConfig();
  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "implicit",
      persistSession: false,
    },
  });
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${siteUrl}/auth/callback?next=/admin` },
  });
  return NextResponse.redirect(new URL(error ? "/admin/login?error=send" : "/admin/login?sent=1", siteUrl));
}
