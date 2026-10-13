export type StoryCatalogueProfileState = "unconfigured" | "missing" | "ready" | "error";

/** A static launch preview is permitted only before a Creator Studio profile exists. */
export function shouldUseInitialStoryCatalogue(profileState: StoryCatalogueProfileState): boolean {
  return profileState === "unconfigured" || profileState === "missing";
}
