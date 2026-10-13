"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "../config/env";

export function createClient() {
  const { url, key } = getSupabasePublicConfig();
  return createBrowserClient(url, key, { auth: { flowType: "pkce" } });
}
