import { z } from "zod";

const platforms = [
  "tiktok",
  "instagram",
  "youtube",
  "pinterest",
  "website",
  "email",
] as const;

export const socialLinkSchema = z
  .object({
    platform: z.enum(platforms),
    url: z.string().trim().min(1, "A destination is required.").max(500),
    label: z.string().trim().max(60),
    isVisible: z.boolean(),
    displayOrder: z.number().int().min(0).max(100),
  })
  .superRefine((value, context) => {
    if (value.platform === "email") {
      if (!z.email().safeParse(value.url.replace(/^mailto:/i, "")).success) {
        context.addIssue({ code: "custom", message: "Enter a valid email address.", path: ["url"] });
      }
      return;
    }

    const parsed = z.url().safeParse(value.url);
    if (!parsed.success || !value.url.startsWith("https://")) {
      context.addIssue({ code: "custom", message: "Use a secure HTTPS URL.", path: ["url"] });
    }

    if (value.platform === "website" && value.label.length === 0) {
      context.addIssue({ code: "custom", message: "Label a custom website link.", path: ["label"] });
    }
  });

export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
