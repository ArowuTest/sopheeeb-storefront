import Link from "next/link";
import { ArrowLeft, Clapperboard } from "lucide-react";

import { StoryForm } from "@/components/admin/story-form";
import { createStory } from "@/app/admin/video-actions";
import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewVideoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const context = await requireCreator();
  const { error } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const [{ data: collections }, { data: products }] = await Promise.all([
    supabase.from("collections").select("id,title,status").eq("creator_id", context.profile.id).neq("status", "archived").order("display_order"),
    supabase.from("products").select("id,title,status").eq("creator_id", context.profile.id).neq("status", "archived").order("title"),
  ]);
  return <main className="admin-shell"><Link className="back-link" href="/admin/videos"><ArrowLeft size={18}/>Video library</Link><section className="admin-card admin-card-wide"><Clapperboard size={24}/><p className="eyebrow">ADD VIDEO STORY</p><h1>Let the original<br/>video do the talking.</h1><p>Create a video card from a canonical TikTok post. It starts as a private Draft so you can refine the title, category and product link before visitors see it.</p>{error === "product-url" ? <p className="form-error" role="alert">Paste a complete HTTPS TikTok Shop URL beginning with <code>https://shop.tiktok.com/</code>.</p> : error === "product-save" || error === "offer-save" ? <p className="form-error" role="alert">The product link could not be saved. Please try again.</p> : error ? <p className="form-error" role="alert">Please check the TikTok post URL, collection and required fields. TikTok metadata must be available unless you enter a title and secure thumbnail URL yourself.</p> : null}{collections?.length ? <StoryForm action={createStory} collections={collections} products={products ?? []} submitLabel="Save private video draft"/> : <p className="form-error">Create at least one collection before adding a video.</p>}</section></main>;
}
