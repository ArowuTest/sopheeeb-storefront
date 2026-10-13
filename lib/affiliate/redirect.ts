import { normalizeClickSource, validateAffiliateUrl } from "../validation/affiliate-url";

export interface SafeAffiliateRedirect {
  destination: string;
  source: "tiktok" | "instagram" | "newsletter" | "direct";
}

export function buildSafeAffiliateRedirect(
  rawDestination: string,
  rawSource: string | null,
): SafeAffiliateRedirect | null {
  const destination = validateAffiliateUrl(rawDestination);
  if (!destination.ok) return null;

  return {
    destination: destination.value,
    source: normalizeClickSource(rawSource),
  };
}
