import { getTikTokVideoId } from "../tiktok/player";

export const MAX_STORY_IMPORTS = 200;

export interface StoryImportCandidate {
  line: number;
  postUrl: string;
}

export interface StoryImportError {
  line: number;
  reason: string;
}

export function canonicalTikTokPostUrl(value: string): string | null {
  if (!getTikTokVideoId(value)) return null;
  const url = new URL(value);
  return `https://www.tiktok.com${url.pathname.replace(/\/$/, "")}`;
}

export function parseTikTokStoryImport(value: string): { accepted: StoryImportCandidate[]; errors: StoryImportError[] } {
  const accepted: StoryImportCandidate[] = [];
  const errors: StoryImportError[] = [];
  const seen = new Set<string>();

  value.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    const postUrl = canonicalTikTokPostUrl(raw.trim());
    if (!raw.trim()) return;
    if (!postUrl) {
      errors.push({ line, reason: "Use a full TikTok post URL ending in /video/<numeric-id>." });
      return;
    }
    if (seen.has(postUrl)) {
      errors.push({ line, reason: "This TikTok post URL is duplicated in the import." });
      return;
    }
    seen.add(postUrl);
    if (accepted.length >= MAX_STORY_IMPORTS) {
      errors.push({ line, reason: `An import can contain at most ${MAX_STORY_IMPORTS} TikTok posts.` });
      return;
    }
    accepted.push({ line, postUrl });
  });

  return { accepted, errors };
}
