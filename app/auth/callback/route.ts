import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAllowedCreatorEmail } from "@/lib/auth/creator";
import { getSupabasePublicConfig, siteUrl } from "@/lib/config/env";

function safeNextPath(value: string | null): string { return value && value.startsWith("/") && !value.startsWith("//") ? value : "/admin"; }

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url); const code = requestUrl.searchParams.get("code"); let redirectPath = safeNextPath(requestUrl.searchParams.get("next"));
  let response = NextResponse.redirect(new URL(redirectPath, siteUrl));
  if (!code) return response;
  let config: { url: string; key: string };
  try { config = getSupabasePublicConfig(); } catch { return response; }
  const supabase = createServerClient(config.url, config.key, { cookies: { getAll: () => request.cookies.getAll(), setAll(cookies, headers) { cookies.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.redirect(new URL(redirectPath, siteUrl)); cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value)); } } });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/admin/login?error=callback", siteUrl));
  const { data: claims } = await supabase.auth.getClaims();
  const email = typeof claims?.claims?.email === "string" ? claims.claims.email : null;
  if (!(await isAllowedCreatorEmail(email))) { redirectPath = "/admin/login?error=authorised"; await supabase.auth.signOut(); return response; }
  return response;
}
