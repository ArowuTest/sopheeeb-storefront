import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
