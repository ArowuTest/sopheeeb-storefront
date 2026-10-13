import { ExternalLink } from "lucide-react";

import { createTikTokPlayerUrl, getTikTokVideoId } from "@/lib/tiktok/player";

export function TikTokPlayer({ postUrl, title, className, priority = false }: { postUrl: string; title: string; className?: string; priority?: boolean }) {
  const videoId = getTikTokVideoId(postUrl);
  const classes = ["tiktok-player", className].filter(Boolean).join(" ");
  if (!videoId) return <a className={`${classes} tiktok-player-fallback`} href={postUrl} target="_blank" rel="noreferrer">Open this video on TikTok <ExternalLink size={15}/></a>;
  return <div className={classes}><iframe src={createTikTokPlayerUrl(videoId)} title={`TikTok video: ${title}`} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading={priority ? "eager" : "lazy"} referrerPolicy="strict-origin-when-cross-origin" /></div>;
}
