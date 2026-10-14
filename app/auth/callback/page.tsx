"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

function safeNextPath(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/admin";
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Completing your secure sign-in…");

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      const supabase = createClient();
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const nextPath = safeNextPath(query.get("next"));
      const tokenHash = query.get("token_hash");
      const otpType = query.get("type") as EmailOtpType | null;
      const code = query.get("code");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      let authError: Error | null = null;
      if (accessToken && refreshToken) {
        const result = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        authError = result.error;
      } else if (tokenHash && otpType) {
        const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
        authError = result.error;
      } else if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        authError = result.error;
      } else {
        authError = new Error("The sign-in link is incomplete.");
      }

      if (authError) {
        window.location.replace("/admin/login?error=callback");
        return;
      }

      const response = await fetch("/api/auth/authorize", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      if (!response.ok) {
        await supabase.auth.signOut();
        window.location.replace("/admin/login?error=authorised");
        return;
      }

      if (active) setMessage("Signed in. Opening Creator Studio…");
      window.location.replace(nextPath);
    }

    void completeSignIn();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="empty-edit" aria-live="polite">
      <p className="eyebrow">CREATOR STUDIO</p>
      <h1>{message}</h1>
      <p>This should only take a moment.</p>
    </main>
  );
}
