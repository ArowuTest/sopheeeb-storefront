/* eslint-disable @next/next/no-img-element -- TikTok supplies dynamic remote oEmbed thumbnail domains. */
import Link from "next/link";
import { Archive, ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { StoryForm } from "@/components/admin/story-form";
import { archiveStory, updateStory } from "@/app/admin/video-actions";
import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditVideoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const context = await requireCreator();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createServerSupabaseClient();
  const [{ data: story }, { data: collections }, { data: products }] = await Promise.all([
    supabase.from("creator_videos").select("id,title,slug,summary,alt_text,tiktok_post_url,thumbnail_url,collection_id,linked_product_id,status,display_order").eq("id", id).eq("creator_id", context.profile.id).maybeSingle(),
    supabase.from("collections").select("id,title,status").eq("creator_id", context.profile.id).neq("status", "archived").order("display_order"),
    supabase.from("products").select("id,title,status").eq("creator_id", context.profile.id).neq("status", "archived").order("title"),
  ]);
  if (!story) notFound();
  return <main className="admin-shell"><Link className="back-link" href="/admin/videos"><ArrowLeft size={18}/>Video library</Link><div className="admin-two-column"><section className="admin-card"><p className="eyebrow">EDIT VIDEO STORY</p><h1>{story.title}</h1>{query.saved ? <p className="admin-notice" role="status">Changes saved.</p> : null}{query.error === "product-url" ? <p className="form-error" role="alert">Paste a complete HTTPS TikTok Shop URL beginning with <code>https://shop.tiktok.com/</code>.</p> : query.error === "product-save" || query.error === "offer-save" ? <p className="form-error" role="alert">The product link could not be saved. Please try again.</p> : query.error ? <p className="form-error" role="alert">Please check the TikTok post URL, collection and required fields.</p> : null}<StoryForm action={updateStory} values={{ id: story.id, title: story.title, slug: story.slug, summary: story.summary, altText: story.alt_text, tiktokPostUrl: story.tiktok_post_url, thumbnailUrl: story.thumbnail_url, collectionId: story.collection_id, linkedProductId: story.linked_product_id, status: story.status, displayOrder: story.display_order }} collections={collections ?? []} products={products ?? []} submitLabel="Save video changes"/><form action={archiveStory} className="inline-form"><input type="hidden" name="id" value={story.id}/><button type="submit" className="danger-link"><Archive size={15}/>Archive this video</button></form></section><aside className="admin-card"><p className="eyebrow">SOURCE POST</p><h2>Preview it in context.</h2><img className="admin-story-thumbnail" src={story.thumbnail_url} alt={story.alt_text || story.title}/><a className="text-link" href={story.tiktok_post_url} target="_blank" rel="noreferrer">Open original TikTok <ExternalLink size={15}/></a><p>Publishing makes this story available in its selected collection. Add an exact product only when you are ready for visitors to see the Shop link.</p></aside></div></main>;
}
