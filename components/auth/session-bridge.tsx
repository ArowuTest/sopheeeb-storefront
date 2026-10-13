"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Completes legacy implicit-flow links that were already sent before the
 * server-side request switched to PKCE. Supabase puts those tokens in the
 * URL hash, which the server cannot read; the browser client must consume
 * them, persist the session cookie, and then refresh the server component.
 */
export function AuthSessionBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!window.location.hash.includes("access_token=")) return;

    const supabase = createClient();
    let active = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || error || !data.session) return;

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
      router.refresh();
    });

    return () => {
      active = false;
    };
  }, [router]);

  return null;
}
