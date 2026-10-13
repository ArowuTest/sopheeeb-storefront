import { z } from "zod";

import { validateAffiliateUrl } from "./affiliate-url";

const statuses = ["draft", "published", "archived"] as const;

export const productInputSchema = z
  .object({
    title: z.string().trim().min(2, "Use at least 2 characters for the product name.").max(120),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
    creatorNote: z.string().trim().max(600),
    collectionId: z.string().uuid().nullable(),
    affiliateUrl: z.string().trim().min(1),
    status: z.enum(statuses),
    tags: z.string().trim().max(240),
  })
  .superRefine((value, context) => {
    const result = validateAffiliateUrl(value.affiliateUrl);
    if (!result.ok) {
      context.addIssue({
        code: "custom",
        message: result.error,
        path: ["affiliateUrl"],
      });
    }
  });

export type ProductInput = z.infer<typeof productInputSchema>;

export function makeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
}
