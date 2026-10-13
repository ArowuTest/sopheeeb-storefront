import type { createStory, updateStory } from "@/app/admin/video-actions";

export interface StoryFormValues {
  id?: string;
  title?: string;
  slug?: string;
  summary?: string;
  altText?: string;
  tiktokPostUrl?: string;
    thumbnailUrl?: string;
    collectionId?: string;
    linkedProductId?: string | null;
    linkedProductUrl?: string;
    status?: "draft" | "published" | "archived";
    displayOrder?: number;
}

interface StoryFormProps {
  action: typeof createStory | typeof updateStory;
  values?: StoryFormValues;
  collections: Array<{ id: string; title: string; status: string }>;
  products: Array<{ id: string; title: string; status: string }>;
  submitLabel: string;
}

export function StoryForm({ action, values, collections, products, submitLabel }: StoryFormProps) {
  return <form action={action} className="admin-form">
    {values?.id ? <input type="hidden" name="id" value={values.id}/> : null}
    <label>TikTok post URL<input name="tiktokPostUrl" required type="url" defaultValue={values?.tiktokPostUrl ?? ""} placeholder="https://www.tiktok.com/@…/video/…"/></label>
    <small>Use the full post URL. TikTok’s official oEmbed response can fill the title and thumbnail; you can overwrite both.</small>
    <label>Story title<input name="title" defaultValue={values?.title ?? ""} placeholder="Filled from TikTok when left empty" maxLength={140}/></label>
    <label>URL slug (optional)<input name="slug" defaultValue={values?.slug ?? ""} placeholder="generated-from-title"/></label>
    <label>Summary<textarea name="summary" defaultValue={values?.summary ?? ""} maxLength={600} placeholder="What should someone expect from this video?"/></label>
    <label>Image description<input name="altText" defaultValue={values?.altText ?? ""} maxLength={240} placeholder="Describe what appears in the video thumbnail"/></label>
    <label>Thumbnail URL (optional)<input name="thumbnailUrl" defaultValue={values?.thumbnailUrl ?? ""} placeholder="Filled from TikTok when left empty"/></label>
    <small>Use an HTTPS image URL or a site-owned path such as <code>/creator-content/example.jpg</code>.</small>
    <label>Collection / category<select name="collectionId" required defaultValue={values?.collectionId ?? ""}><option value="" disabled>Select a collection</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.title}{collection.status === "draft" ? " (draft)" : ""}</option>)}</select></label>
    <label>Use an existing product (optional)<select name="linkedProductId" defaultValue={values?.linkedProductId ?? ""}><option value="">No existing product selected</option>{products.map((product) => <option key={product.id} value={product.id}>{product.title}{product.status === "draft" ? " (draft)" : ""}</option>)}</select></label>
    <label>Paste the exact TikTok Shop link (optional)<input name="linkedProductUrl" type="url" defaultValue={values?.linkedProductUrl ?? ""} placeholder="https://shop.tiktok.com/…"/></label>
    <small>Paste a secure <code>shop.tiktok.com</code> URL to update the selected product, or create a new product record automatically when no product is selected.</small>
    <label>Display order<input name="displayOrder" type="number" min="0" max="10000" defaultValue={values?.displayOrder ?? 0}/></label>
    <label>Publishing state<select name="status" defaultValue={values?.status ?? "draft"}><option value="draft">Draft — only visible in Creator Studio</option><option value="published">Published — visible on the storefront</option><option value="archived">Archived — hidden from the storefront</option></select></label>
    <button className="button button-dark" type="submit">{submitLabel}</button>
  </form>;
}
