export function productCatalogueSelect(collectionSlug?: string) {
  const collectionRelation = collectionSlug ? "collections!inner(slug,title)" : "collections(slug,title)";
  return `id, slug, title, creator_note, tags, ${collectionRelation}, product_offers!inner(id,is_primary,is_active), product_media(id,url,storage_path,alt_text,is_cover,media_type,tiktok_post_url,display_order)`;
}
