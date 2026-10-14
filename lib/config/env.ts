const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
export const siteUrl = configuredSiteUrl && !/localhost|127\.0\.0\.1/.test(configuredSiteUrl) ? configuredSiteUrl : "https://sopheeeb.com";

function normalizeSupabaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
}

export function hasSupabaseConfig(): boolean {
  return Boolean(publicUrl && publicKey);
}

export function getSupabasePublicConfig() {
  if (!publicUrl || !publicKey) {
    throw new Error("Supabase is not configured. Add the required Railway environment variables.");
  }

  return { url: normalizeSupabaseUrl(publicUrl), key: publicKey };
}

export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? null;
}

export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return key;
}
