import { z } from "zod";

import { getTikTokVideoId } from "../tiktok/player";

const statuses = ["draft", "published", "archived"] as const;
const localThumbnailPath = /^\/creator-content\/[A-Za-z0-9][A-Za-z0-9._-]*\.(jpg|jpeg|png|webp|gif|avif)$/;

export function isStoryThumbnailValue(value: string): boolean {
  const trimmed = value.trim();
  if (localThumbnailPath.test(trimmed)) return true;
  try {
    return new URL(trimmed).protocol === "https:";
  } catch {
    return false;
  }
}

export const creatorVideoInputSchema = z
  .object({
    title: z.string().trim().min(2, "Use at least 2 characters for the video title.").max(140),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
    summary: z.string().trim().max(600),
    altText: z.string().trim().max(240),
    tiktokPostUrl: z.string().trim().min(1, "A canonical TikTok post URL is required."),
    thumbnailUrl: z.string().trim().max(2_000).refine(isStoryThumbnailValue, "Use an HTTPS thumbnail URL or a site-owned /creator-content/ path."),
    collectionId: z.string().uuid("Choose a collection."),
    linkedProductId: z.string().uuid("Choose a valid product or leave this empty.").nullable(),
    status: z.enum(statuses),
    displayOrder: z.coerce.number().int().min(0).max(10_000),
  })
  .superRefine((value, context) => {
    if (!getTikTokVideoId(value.tiktokPostUrl)) {
      context.addIssue({
        code: "custom",
        path: ["tiktokPostUrl"],
        message: "Use a full TikTok post URL ending in /video/<numeric-id>.",
      });
    }
  });

export type CreatorVideoInput = z.infer<typeof creatorVideoInputSchema>;
