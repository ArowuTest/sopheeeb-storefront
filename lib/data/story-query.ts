export function storyCatalogueSelect() {
  return "id,slug,title,summary,alt_text,tiktok_post_url,thumbnail_url,display_order,published_at,collections!inner(slug,title,image_url,status),linked_product:products(id,slug,title,status,product_offers(id,is_primary,is_active,platform))";
}
