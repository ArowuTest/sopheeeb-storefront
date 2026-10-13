export type ClickSource = "tiktok" | "instagram" | "newsletter" | "direct";

export type AffiliateUrlResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

const allowedSources = new Set<ClickSource>([
  "tiktok",
  "instagram",
  "newsletter",
  "direct",
]);

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1") {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return true;

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    octets[0] === 0 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

function isTikTokHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "tiktok.com" || host.endsWith(".tiktok.com");
}

function isTikTokShopHost(hostname: string): boolean {
  return hostname.toLowerCase() === "shop.tiktok.com";
}

export function validateAffiliateUrl(rawUrl: string): AffiliateUrlResult {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return { ok: false, error: "A TikTok Shop affiliate URL is required." };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "Enter a complete, valid URL." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Only secure HTTPS links are allowed." };
  }

  if (isPrivateOrLocalHost(parsed.hostname)) {
    return { ok: false, error: "Private or local destinations are not allowed." };
  }

  if (!isTikTokShopHost(parsed.hostname)) {
    return {
      ok: false,
      error: "Use a TikTok Shop affiliate URL. Other retailers can be enabled later.",
    };
  }

  return { ok: true, value: rawUrl.trim() };
}

export function validateTikTokPostUrl(rawUrl: string): AffiliateUrlResult {
  if (!rawUrl.trim()) return { ok: true, value: "" };

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "Enter a valid TikTok post URL." };
  }

  if (parsed.protocol !== "https:" || !isTikTokHost(parsed.hostname)) {
    return { ok: false, error: "Use a secure TikTok post URL." };
  }

  return { ok: true, value: rawUrl.trim() };
}

export function normalizeClickSource(source: string | null): ClickSource {
  const normalized = source?.trim().toLowerCase();
  return normalized && allowedSources.has(normalized as ClickSource)
    ? (normalized as ClickSource)
    : "direct";
}
