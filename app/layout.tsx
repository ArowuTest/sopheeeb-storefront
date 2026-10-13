import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AuthSessionBridge } from "@/components/auth/session-bridge";
import "./globals.css";
import "./catalogue.css";
import "./admin.css";
import "./admin-products.css";
import "./mobile-nav.css";
import "./collection-manager.css";
import "./tiktok-preview.css";
import "./social-manager.css";
import "./admin-video.css";
import "./creator-home.css";
import "./creator-gloss.css";
import "./creator-content.css";
import "./creator-category.css";
import "./creator-navigation.css";
import "./edition.css";
import "./sophiee-home.css";
import "./edition-overrides.css";
import "./accessibility-overrides.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sopheeeb-storefront.up.railway.app"),
  applicationName: "Sophiee Finds",
  creator: "Sophiee",
  title: { default: "Sophiee Finds", template: "%s | Sophiee Finds" },
  description: "Sophiee's considered edit of fashion, home, beauty, movement and everyday finds.",
  alternates: { canonical: "/" },
  icons: { icon: "/icon.svg", apple: "/apple-icon.svg" },
  openGraph: {
    type: "website",
    siteName: "Sophiee Finds",
    title: "Sophiee Finds",
    description: "Watch the find in motion, then open the exact TikTok post when you are ready.",
    images: ["/creator-content/sophiee/profile.jpg"],
  },
  twitter: { card: "summary_large_image", title: "Sophiee Finds", description: "Watch the find in motion, then open the exact TikTok post when you are ready.", images: ["/creator-content/sophiee/profile.jpg"] },
};
export const viewport: Viewport = { themeColor: "#1c2746" };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><AuthSessionBridge /><a className="skip-link" href="#main-content">Skip to content</a><div id="main-content">{children}</div></body></html>;
}
