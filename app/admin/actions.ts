"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { adoptInitialLibraryForCreator } from "@/lib/admin/initial-library";
import { canBootstrapCreator, getCreatorContext, requireCreator, requireOwner } from "@/lib/auth/creator";
import { initialStoryCategories } from "@/lib/data/initial-catalogue";
import { makeSlug, parseTags, productInputSchema } from "@/lib/validation/product";
import { socialLinkSchema } from "@/lib/validation/social-link";

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function checked(formData: FormData, key: string) { return formData.get(key) === "on"; }
function normalizeEmail(value: string) { return value.trim().toLowerCase(); }

function refreshInitialLibrarySurfaces() {
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath("/sitemap.xml");
  initialStoryCategories.forEach((category) => revalidatePath(`/collections/${category.slug}`));
}

export async function bootstrapCreator(formData: FormData) {
  const context = await getCreatorContext();
  if (context.state !== "setup" || !canBootstrapCreator(context.email)) redirect("/admin?error=not-authorised");
  const handle = text(formData, "handle").toLowerCase().replace(/[^a-z0-9_]/g, "");
  const displayName = text(formData, "displayName");
  if (handle.length < 3 || displayName.length < 2) redirect("/admin/setup?error=details");
  // This is an owner-scoped write. Use the authenticated session rather than
  // making first-time setup depend on the optional service-role secret. The
  // RLS policy allows the signed-in user to create/update the profile whose id
  // is their own auth subject, and using that policy keeps setup safe even if
  // the privileged integration is temporarily unavailable.
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("creator_profiles").upsert({
    id: context.userId,
    handle,
    display_name: displayName,
    tagline: text(formData, "tagline") || null,
  }, { onConflict: "id" });
  if (error) redirect(`/admin/setup?error=${error.code === "23505" ? "handle" : "profile"}`);
  try {
    await supabase.from("creator_members").upsert({
      creator_id: context.userId,
      user_id: context.userId,
      email: context.email,
      role: "owner",
      status: "active",
      accepted_at: new Date().toISOString(),
    }, { onConflict: "creator_id,email" });
  } catch {
    // Migration 0013 is optional during bootstrap; owner access still works
    // through the creator profile while the migration is being applied.
  }
  try {
    await adoptInitialLibraryForCreator(context.userId);
  } catch {
    refreshInitialLibrarySurfaces();
    redirect("/admin?error=starter");
  }
  refreshInitialLibrarySurfaces();
  redirect("/admin");
}

export async function adoptInitialLibrary() {
  const context = await requireCreator();
  let result;
  try {
    result = await adoptInitialLibraryForCreator(context.profile.id);
  } catch {
    redirect("/admin?error=starter");
  }
  refreshInitialLibrarySurfaces();
  redirect(`/admin/videos?starter=${result.storiesAdded ? "adopted" : "already-present"}`);
}

export async function createCollection(formData: FormData) {
  const context = await requireCreator();
  const title = text(formData, "title");
  const slug = makeSlug(text(formData, "slug") || title);
  if (title.length < 2 || !slug) redirect("/admin/collections/new?error=details");
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("collections").insert({ creator_id: context.profile.id, title, slug, description: text(formData, "description") || null, image_url: text(formData, "imageUrl") || null, display_order: Number(text(formData, "displayOrder") || 0), status: text(formData, "status") === "published" ? "published" : "draft" });
  if (error) redirect("/admin/collections/new?error=save");
  revalidatePath("/"); revalidatePath("/admin"); redirect("/admin");
}

function productPayload(formData: FormData) {
  const title = text(formData, "title");
  return productInputSchema.safeParse({ title, slug: makeSlug(text(formData, "slug") || title), creatorNote: text(formData, "creatorNote"), collectionId: text(formData, "collectionId") || null, affiliateUrl: text(formData, "affiliateUrl"), status: text(formData, "status"), tags: text(formData, "tags") });
}

export async function createProduct(formData: FormData) {
  const context = await requireCreator();
  const result = productPayload(formData);
  if (!result.success) redirect("/admin/products/new?error=details");
  const input = result.data;
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  if (input.collectionId) {
    const { data: collection } = await supabase.from("collections").select("id").eq("id", input.collectionId).eq("creator_id", context.profile.id).maybeSingle();
    if (!collection) redirect("/admin/products/new?error=collection");
  }
  const { data: product, error } = await supabase.from("products").insert({ creator_id: context.profile.id, collection_id: input.collectionId, title: input.title, slug: input.slug, creator_note: input.creatorNote || null, tags: parseTags(input.tags), status: input.status, published_at: input.status === "published" ? new Date().toISOString() : null }).select("id").single();
  if (error || !product) redirect("/admin/products/new?error=save");
  const { error: offerError } = await supabase.from("product_offers").insert({ product_id: product.id, platform: "tiktok_shop", destination_url: input.affiliateUrl, is_primary: true, is_active: true });
  if (offerError) { await supabase.from("products").delete().eq("id", product.id); redirect("/admin/products/new?error=offer"); }
  revalidatePath("/"); revalidatePath("/admin"); redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(formData: FormData) {
  const context = await requireCreator();
  const id = text(formData, "id");
  const result = productPayload(formData);
  if (!id || !result.success) redirect(`/admin/products/${id}?error=details`);
  const input = result.data;
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  if (input.collectionId) {
    const { data: collection } = await supabase.from("collections").select("id").eq("id", input.collectionId).eq("creator_id", context.profile.id).maybeSingle();
    if (!collection) redirect(`/admin/products/${id}?error=collection`);
  }
  const { error } = await supabase.from("products").update({ collection_id: input.collectionId, title: input.title, slug: input.slug, creator_note: input.creatorNote || null, tags: parseTags(input.tags), status: input.status, published_at: input.status === "published" ? new Date().toISOString() : null }).eq("id", id).eq("creator_id", context.profile.id);
  if (error) redirect(`/admin/products/${id}?error=save`);
  const { data: offer } = await supabase.from("product_offers").select("id").eq("product_id", id).eq("is_primary", true).maybeSingle();
  if (offer) await supabase.from("product_offers").update({ destination_url: input.affiliateUrl, is_active: true }).eq("id", offer.id);
  else await supabase.from("product_offers").insert({ product_id: id, platform: "tiktok_shop", destination_url: input.affiliateUrl, is_primary: true, is_active: true });
  revalidatePath("/"); revalidatePath(`/products/${input.slug}`); revalidatePath("/admin"); redirect(`/admin/products/${id}?saved=1`);
}

export async function archiveProduct(formData: FormData) {
  const context = await requireCreator(); const id = text(formData, "id");
  const { createServerSupabaseClient } = await import("@/lib/supabase/server"); const supabase = await createServerSupabaseClient();
  await supabase.from("products").update({ status: "archived" }).eq("id", id).eq("creator_id", context.profile.id);
  revalidatePath("/"); revalidatePath("/admin"); redirect("/admin");
}

export async function bulkUpdateProducts(formData: FormData) {
  const context = await requireCreator();
  const action = text(formData, "action");
  const productIds = [...new Set(formData.getAll("productId").map(String).filter(Boolean))].slice(0, 100);
  if (!productIds.length || !["publish", "archive"].includes(action)) redirect("/admin/products?error=bulk");

  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  const update = action === "publish"
    ? { status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    : { status: "archived", published_at: null, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("products")
    .update(update)
    .eq("creator_id", context.profile.id)
    .eq("status", "draft")
    .in("id", productIds)
    .select("id");
  if (error) redirect("/admin/products?error=bulk");

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/collections/[slug]", "page");
  redirect(`/admin/products?bulk=${action}&count=${data?.length ?? 0}`);
}

export async function addMedia(formData: FormData) {
  await requireCreator(); const productId = text(formData, "productId"); const url = text(formData, "url"); const isCover = checked(formData, "isCover");
  if (!productId || !/^https:\/\//.test(url)) redirect(`/admin/products/${productId}?error=media`);
  const { createServerSupabaseClient } = await import("@/lib/supabase/server"); const supabase = await createServerSupabaseClient();
  const { data: count } = await supabase.from("product_media").select("id", { count: "exact", head: true }).eq("product_id", productId);
  if (isCover) await supabase.from("product_media").update({ is_cover: false }).eq("product_id", productId);
  await supabase.from("product_media").insert({ product_id: productId, media_type: text(formData, "mediaType") === "video" ? "video" : "image", url, alt_text: text(formData, "altText"), display_order: count ?? 0, is_cover: isCover });
  revalidatePath("/"); redirect(`/admin/products/${productId}?saved=1`);
}

export async function saveProfile(formData: FormData) {
  const context = await requireCreator(); const { createServerSupabaseClient } = await import("@/lib/supabase/server"); const supabase = await createServerSupabaseClient();
  await supabase.from("creator_profiles").update({ display_name: text(formData, "displayName"), tagline: text(formData, "tagline") || null, affiliate_disclosure: text(formData, "disclosure") || "Some links may be affiliate links.", contact_email: text(formData, "contactEmail") || null, contact_visible: checked(formData, "contactVisible") }).eq("id", context.profile.id);
  revalidatePath("/"); revalidatePath("/admin/settings"); redirect("/admin/settings?saved=1");
}

export async function addSocialLink(formData: FormData) {
  const context = await requireCreator(); const raw = { platform: text(formData, "platform"), url: text(formData, "url"), label: text(formData, "label"), isVisible: checked(formData, "isVisible"), displayOrder: Number(text(formData, "displayOrder") || 0) };
  const result = socialLinkSchema.safeParse(raw); if (!result.success) redirect("/admin/settings?error=social");
  const { createServerSupabaseClient } = await import("@/lib/supabase/server"); const supabase = await createServerSupabaseClient();
  await supabase.from("social_links").insert({ creator_id: context.profile.id, platform: result.data.platform, url: result.data.platform === "email" ? `mailto:${result.data.url.replace(/^mailto:/i, "")}` : result.data.url, label: result.data.label || null, is_visible: result.data.isVisible, display_order: result.data.displayOrder });
  revalidatePath("/"); revalidatePath("/admin/settings"); redirect("/admin/settings?saved=1");
}


export async function updateCollection(formData: FormData) {
  const context = await requireCreator(); const id = text(formData, "id"); const title = text(formData, "title"); const slug = makeSlug(text(formData, "slug") || title);
  if (!id || title.length < 2 || !slug) redirect(`/admin/collections/${id}?error=details`);
  const status = text(formData, "status"); if (!["draft", "published", "archived"].includes(status)) redirect(`/admin/collections/${id}?error=status`);
  const { createServerSupabaseClient } = await import("@/lib/supabase/server"); const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("collections").update({ title, slug, description: text(formData, "description") || null, image_url: text(formData, "imageUrl") || null, display_order: Number(text(formData, "displayOrder") || 0), status }).eq("id", id).eq("creator_id", context.profile.id);
  if (error) redirect(`/admin/collections/${id}?error=save`);
  revalidatePath("/"); revalidatePath("/admin/collections"); redirect(`/admin/collections/${id}?saved=1`);
}

export async function archiveCollection(formData: FormData) {
  const context = await requireCreator(); const id = text(formData, "id");
  const { createServerSupabaseClient } = await import("@/lib/supabase/server"); const supabase = await createServerSupabaseClient();
  await supabase.from("collections").update({ status: "archived" }).eq("id", id).eq("creator_id", context.profile.id);
  revalidatePath("/"); revalidatePath("/admin/collections"); redirect("/admin/collections");
}

function socialPayload(formData: FormData) {
  return socialLinkSchema.safeParse({ platform: text(formData, "platform"), url: text(formData, "url"), label: text(formData, "label"), isVisible: checked(formData, "isVisible"), displayOrder: Number(text(formData, "displayOrder") || 0) });
}

function socialUrl(input: { platform: string; url: string }) { return input.platform === "email" ? `mailto:${input.url.replace(/^mailto:/i, "")}` : input.url; }

export async function updateSocialLink(formData: FormData) {
  const context = await requireCreator(); const id = text(formData, "id"); const result = socialPayload(formData);
  if (!id || !result.success) redirect("/admin/settings?error=social");
  const { createServerSupabaseClient } = await import("@/lib/supabase/server"); const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("social_links").update({ platform: result.data.platform, url: socialUrl(result.data), label: result.data.label || null, is_visible: result.data.isVisible, display_order: result.data.displayOrder }).eq("id", id).eq("creator_id", context.profile.id);
  if (error) redirect("/admin/settings?error=social");
  revalidatePath("/"); revalidatePath("/admin/settings"); redirect("/admin/settings?saved=1");
}

export async function deleteSocialLink(formData: FormData) {
  const context = await requireCreator(); const id = text(formData, "id");
  const { createServerSupabaseClient } = await import("@/lib/supabase/server"); const supabase = await createServerSupabaseClient();
  await supabase.from("social_links").delete().eq("id", id).eq("creator_id", context.profile.id);
  revalidatePath("/"); revalidatePath("/admin/settings"); redirect("/admin/settings?saved=1");
}

export async function inviteAdmin(formData: FormData) {
  const context = await requireOwner();
  const email = normalizeEmail(text(formData, "email"));
  if (!email || !email.includes("@") || email === context.email) {
    redirect("/admin/team?error=email");
  }

  // The owner is already authenticated and migration 0013 grants the owner
  // an RLS-safe write to this table. Use that session rather than making a
  // normal team change depend on the optional service-role secret.
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("creator_members").upsert(
    {
      creator_id: context.creatorId,
      email,
      role: "admin",
      status: "pending",
      invited_by: context.userId,
      invited_at: new Date().toISOString(),
      user_id: null,
      accepted_at: null,
    },
    { onConflict: "creator_id,email" },
  );

  // A missing-table error means the owner has not run migration 0013 yet.
  if (error) {
    console.error("creator_admin_invite_failed", { code: error.code, message: error.message });
    redirect(`/admin/team?error=${error.code === "42P01" ? "migration" : "save"}`);
  }
  revalidatePath("/admin/team");
  revalidatePath("/admin");
  redirect("/admin/team?saved=invited");
}

export async function revokeAdmin(formData: FormData) {
  const context = await requireOwner();
  const memberId = text(formData, "memberId");
  if (!memberId) redirect("/admin/team?error=member");

  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("creator_members")
    .update({ status: "revoked", user_id: null })
    .eq("id", memberId)
    .eq("creator_id", context.creatorId)
    .eq("role", "admin");

  if (error) {
    console.error("creator_admin_revoke_failed", { code: error.code, message: error.message });
    redirect(`/admin/team?error=${error.code === "42P01" ? "migration" : "save"}`);
  }
  revalidatePath("/admin/team");
  revalidatePath("/admin");
  redirect("/admin/team?saved=revoked");
}

export async function signOut() {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login?signout=1");
}
