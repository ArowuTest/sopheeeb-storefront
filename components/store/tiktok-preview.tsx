/* eslint-disable @next/next/no-img-element -- The provider thumbnail is deliberately rendered without image proxying. */
import { TikTokPlayer } from "@/components/store/tiktok-player";
import { getTikTokVideoId } from "@/lib/tiktok/player";

export function TikTokPreview({ postUrl, thumbnailUrl, title }: { postUrl: string; thumbnailUrl: string; title: string }) {
  if (getTikTokVideoId(postUrl)) return <TikTokPlayer postUrl={postUrl} title={title} className="tiktok-preview" />;
  return <a className="tiktok-preview tiktok-preview-fallback" href={postUrl} target="_blank" rel="noreferrer"><img src={thumbnailUrl} alt={title}/><span>Watch the creator video on TikTok ↗</span></a>;
}
