import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getPublicSocialLinks } from "@/lib/data/storefront";

function labelFor(platform: string) {
  return platform === "tiktok" ? "TikTok" : platform === "instagram" ? "Instagram" : platform === "youtube" ? "YouTube" : platform === "pinterest" ? "Pinterest" : platform;
}

export async function EditionFooter() {
  const configuredLinks = await getPublicSocialLinks();
  const socialLinks = configuredLinks.map((link) => ({ platform: labelFor(link.platform), url: link.url }));
  return <footer className="edition-footer">
    <div><p className="edition-eyebrow">SOPHIEE FINDS</p><h2>See it in motion.<br/><em>Choose well.</em></h2></div>
    <div className="edition-footer-copy"><p>A considered edit of Sophiee&apos;s fashion, home, beauty, movement and everyday finds. Start with the story, then follow the exact TikTok post when it is ready.</p><p className="edition-disclosure">Some links may be affiliate links. Using one may earn Sophiee a commission at no extra cost to you.</p></div>
    <div className="edition-socials">{socialLinks.map((link) => <a key={`${link.platform}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">{link.platform}<ArrowUpRight size={14}/></a>)}<Link href="/discover">All videos <ArrowUpRight size={14}/></Link></div>
  </footer>;
}
