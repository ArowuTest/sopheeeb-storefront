const tiktokHosts = new Set(["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"]);

export function isTikTokPostUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && tiktokHosts.has(url.hostname.toLowerCase());
  } catch { return false; }
}
