import { describe, expect, it } from "vitest";

import { parseTikTokStoryImport } from "../../lib/import/story-import";

const first = "https://www.tiktok.com/@tr33shya/video/7688697187869396246";
const second = "https://www.tiktok.com/@tr33shya/video/7674357859039055126";

describe("parseTikTokStoryImport", () => {
  it("keeps canonical TikTok post URLs with their original line numbers", () => {
    expect(parseTikTokStoryImport(`\n${first}\n\n${second}\n`).accepted).toEqual([
      { line: 2, postUrl: first },
      { line: 4, postUrl: second },
    ]);
  });

  it("reports invalid and duplicate URLs without discarding valid entries", () => {
    const result = parseTikTokStoryImport(`${first}\nhttps://vm.tiktok.com/ZM123\n${first}\n${second}`);

    expect(result.accepted).toEqual([
      { line: 1, postUrl: first },
      { line: 4, postUrl: second },
    ]);
    expect(result.errors).toEqual([
      { line: 2, reason: "Use a full TikTok post URL ending in /video/<numeric-id>." },
      { line: 3, reason: "This TikTok post URL is duplicated in the import." },
    ]);
  });

  it("caps one import at 200 valid story URLs and reports later lines", () => {
    const urls = Array.from({ length: 201 }, (_, index) => `https://www.tiktok.com/@tr33shya/video/76886971878693${String(index).padStart(4, "0")}`);
    const result = parseTikTokStoryImport(urls.join("\n"));

    expect(result.accepted).toHaveLength(200);
    expect(result.errors).toContainEqual({ line: 201, reason: "An import can contain at most 200 TikTok posts." });
  });
});
