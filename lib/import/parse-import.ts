import Papa from "papaparse";

import { validateAffiliateUrl, validateTikTokPostUrl } from "../validation/affiliate-url";

const MAX_ROWS = 100;
const MAX_INPUT_LENGTH = 200_000;

export type ImportRowStatus = "ready" | "needs_attention";

export interface ImportRowResult {
  index: number;
  affiliateUrl: string;
  tiktokPostUrl: string;
  title: string;
  collection: string;
  errors: string[];
  status: ImportRowStatus;
}

export interface ImportParseResult {
  rows: ImportRowResult[];
  errors: string[];
}

function firstValue(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value.trim();
  }
  return "";
}

function normalizedRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key.trim().toLowerCase(), value]),
  );
}

export function parseImport(input: string): ImportParseResult {
  if (input.length > MAX_INPUT_LENGTH) {
    return { rows: [], errors: ["This import is too large. Use at most 100 rows at a time."] };
  }

  const source = input.trim();
  if (!source) return { rows: [], errors: ["Paste at least one affiliate link or upload a CSV."] };

  const pastedLines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const isPastedLinkList = pastedLines.length > 0 && pastedLines.every((line) => !line.includes(","));
  const parsed = isPastedLinkList
    ? { data: pastedLines.map((affiliate_url) => ({ affiliate_url })), errors: [] }
    : Papa.parse<Record<string, unknown>>(source, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (header) => header.trim().toLowerCase(),
      });

  const errors = parsed.errors.map(
    (error) => `CSV row ${(error.row ?? 0) + 1}: ${error.message}`,
  );
  const seenAffiliateUrls = new Set<string>();
  const rows = parsed.data.slice(0, MAX_ROWS).map((record, index) => {
    const normalized = normalizedRecord(record);
    const affiliateUrl = firstValue(normalized, "affiliate_url", "affiliate url", "url", "link");
    const tiktokPostUrl = firstValue(normalized, "tiktok_post_url", "tiktok post url", "video_url", "video url");
    const title = firstValue(normalized, "title", "product_title", "product title");
    const collection = firstValue(normalized, "collection", "category");
    const rowErrors: string[] = [];

    const affiliate = validateAffiliateUrl(affiliateUrl);
    if (!affiliate.ok) rowErrors.push(affiliate.error);

    const post = validateTikTokPostUrl(tiktokPostUrl);
    if (!post.ok) rowErrors.push(post.error);

    if (!title) rowErrors.push("A product title is required before publishing.");

    const duplicateKey = affiliateUrl.trim().toLowerCase();
    if (duplicateKey && seenAffiliateUrls.has(duplicateKey)) {
      rowErrors.push("Duplicate affiliate URL in this import batch.");
    }
    if (duplicateKey) seenAffiliateUrls.add(duplicateKey);

    const status: ImportRowStatus = rowErrors.length ? "needs_attention" : "ready";

    return {
      index: index + 1,
      affiliateUrl,
      tiktokPostUrl,
      title,
      collection,
      errors: rowErrors,
      status,
    };
  });

  if (parsed.data.length > MAX_ROWS) {
    errors.push("Only the first 100 rows were read. Split the remaining links into another import.");
  }

  return { rows, errors };
}
