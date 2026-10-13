import { describe, expect, it } from "vitest";

import { storyCatalogueSelect } from "../../lib/data/story-query";

describe("storyCatalogueSelect", () => {
  it("joins only published collection context and an optional linked product", () => {
    const select = storyCatalogueSelect();

    expect(select).toContain("collections!inner(slug,title,image_url,status)");
    expect(select).toContain("linked_product:products(id,slug,title,status,product_offers(id,is_primary,is_active,platform))");
  });

  it("does not select creator-private fields or offer destinations", () => {
    const select = storyCatalogueSelect();

    expect(select).not.toMatch(/creator_profiles|contact_email|destination_url|service_role/i);
  });
});
