import { describe, expect, it } from "vitest";

import { productCatalogueSelect } from "../../lib/data/product-query";

describe("product catalogue relationship selection", () => {
  it("keeps published uncategorised products in unfiltered catalogues", () => {
    expect(productCatalogueSelect()).toContain("collections(slug,title)");
    expect(productCatalogueSelect()).not.toContain("collections!inner(slug,title)");
  });

  it("uses an inner relationship only while filtering a specific category", () => {
    expect(productCatalogueSelect("fitness")).toContain("collections!inner(slug,title)");
  });
});
