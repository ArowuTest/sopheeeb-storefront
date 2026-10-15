import "server-only";

import { redirect } from "next/navigation";

import { getAdminEmail, hasSupabaseConfig } from "../config/env";
import { createServerSupabaseClient } from "../supabase/server";

export type CreatorContext =
  | { state: "unconfigured" }
  | { state: "unauthenticated" }
  | { state: "forbidden" }
  | { state: "setup"; userId: string; email: string }
  | {
      state: "ready";
      userId: string;
      email: string;
      role: "owner" | "admin";
      creatorId: string;
      profile: { id: string; handle: string; displayName: string };
    };

export function isApprovedCreatorEmail(email: string | null | undefined): boolean {
  const approvedEmail = getAdminEmail();
  return Boolean(approvedEmail && email && approvedEmail === email.trim().toLowerCase());
}

/**
 * The callback route runs before the normal Creator Studio context exists, so
 * it needs a small allow-list check of its own. Keep invited admins in the
 * same server-side authorization path as the dashboard: bootstrap owner email
 * plus pending/active membership records.
 */
export async function isAllowedCreatorEmail(email: string | null | undefined): Promise<boolean> {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return false;
  if (isApprovedCreatorEmail(normalizedEmail)) return true;

  try {
    const { createServiceSupabaseClient } = await import("@/lib/supabase/server");
    const service = createServiceSupabaseClient();
    const { data } = await service
      .from("creator_members")
      .select("id")
      .eq("email", normalizedEmail)
      .in("status", ["pending", "active"])
      .maybeSingle();
    return Boolean(data);
  } catch {
    // A missing migration or service key should fail closed for callbacks.
    return false;
  }
}

export async function getCreatorContext(): Promise<CreatorContext> {
  if (!hasSupabaseConfig()) return { state: "unconfigured" };
  const supabase = await createServerSupabaseClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  const payload = claims?.claims;
  const subject = payload?.sub;
  if (error || typeof subject !== "string") return { state: "unauthenticated" };
  const email = typeof payload?.email === "string" ? payload.email.toLowerCase() : null;
  if (!email) return { state: "forbidden" };

  // The bootstrap email is allowed to create the first creator profile. Once
  // that profile exists, it is always the owner of the workspace.
  const { data: ownProfile } = await supabase
    .from("creator_profiles")
    .select("id, handle, display_name")
    .eq("id", subject)
    .maybeSingle();
  if (ownProfile) {
    return {
      state: "ready",
      userId: subject,
      email,
      role: "owner",
      creatorId: ownProfile.id,
      profile: { id: ownProfile.id, handle: ownProfile.handle, displayName: ownProfile.display_name },
    };
  }

  // Pending invitations are claimed on the first magic-link login. A pending
  // row is intentionally not visible to the authenticated RLS policy until it
  // has a user_id, so use the server-only client as a narrowly-scoped fallback
  // for this email claim. This keeps invited-admin login functional without
  // exposing the membership table to arbitrary callers.
  let { data: membership, error: membershipError } = await supabase
    .from("creator_members")
    .select("id, creator_id, role, status, email")
    .eq("email", email)
    .in("status", ["pending", "active"])
    .maybeSingle();

  if (!membership && !membershipError) {
    try {
      const { createServiceSupabaseClient } = await import("@/lib/supabase/server");
      const service = createServiceSupabaseClient();
      const result = await service
        .from("creator_members")
        .select("id, creator_id, role, status, email")
        .eq("email", email)
        .in("status", ["pending", "active"])
        .maybeSingle();
      membership = result.data;
      membershipError = result.error;
    } catch {
      // Missing membership migration/service key: fail closed below.
    }
  }

  if (!membershipError && membership) {
    if (membership.status === "pending") {
      try {
        const { createServiceSupabaseClient } = await import("@/lib/supabase/server");
        const claim = await createServiceSupabaseClient()
          .from("creator_members")
          .update({ user_id: subject, status: "active", accepted_at: new Date().toISOString() })
          .eq("id", membership.id)
          .eq("status", "pending");
        if (claim.error) return { state: "forbidden" };
      } catch {
        // If the service key is unavailable, the invitation remains pending
        // and can be claimed on the next login after configuration is fixed.
        return { state: "forbidden" };
      }
    }

    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("id, handle, display_name")
      .eq("id", membership.creator_id)
      .maybeSingle();

    if (profile) {
      return {
        state: "ready",
        userId: subject,
        email,
        role: "admin",
        creatorId: profile.id,
        profile: { id: profile.id, handle: profile.handle, displayName: profile.display_name },
      };
    }
  }

  if (!ownProfile && isApprovedCreatorEmail(email)) return { state: "setup", userId: subject, email };
  return { state: "forbidden" };
}

export const canBootstrapCreator = isApprovedCreatorEmail;

export async function requireCreator() {
  const context = await getCreatorContext();
  if (context.state === "unauthenticated" || context.state === "forbidden") redirect("/admin/login?error=authorised");
  if (context.state === "unconfigured") redirect("/admin?error=configuration");
  if (context.state === "setup") redirect("/admin/setup");
  return context;
}

export async function requireOwner() {
  const context = await requireCreator();
  if (context.role !== "owner") redirect("/admin?error=owner");
  return context;
}
