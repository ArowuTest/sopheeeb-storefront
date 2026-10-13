import { describe, expect, it } from "vitest";

import { shouldUseInitialStoryCatalogue } from "../../lib/data/story-fallback";

describe("initial story catalogue fallback policy", () => {
  it("allows the launch preview only before a Creator Studio profile exists", () => {
    expect(shouldUseInitialStoryCatalogue("unconfigured")).toBe(true);
    expect(shouldUseInitialStoryCatalogue("missing")).toBe(true);
  });

  it("never resurrects static stories after onboarding or on a live query failure", () => {
    expect(shouldUseInitialStoryCatalogue("ready")).toBe(false);
    expect(shouldUseInitialStoryCatalogue("error")).toBe(false);
  });
});
