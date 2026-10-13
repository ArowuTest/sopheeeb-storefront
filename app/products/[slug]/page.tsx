/* eslint-disable @next/next/no-img-element -- product images are creator-supplied and remote domains are dynamic. */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";

import { EditionFooter } from "@/components/store/edition-footer";
import { EditionHeaderServer } from "@/components/store/edition-header-server";
import { TikTokPreview } from "@/components/store/tiktok-preview";
import { getPublicProduct } from "@/lib/data/storefront";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getPublicProduct((await params).slug);
  return product ? { title: product.title, description: product.creatorNote ?? `Why Sophiee linked ${product.title}.` } : { title: "Link not available" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getPublicProduct((await params).slug);
  if (!product) notFound();
  return <main className="edition-page edition-product-page"><EditionHeaderServer/><article className="edition-product-detail"><Link className="edition-back" href="/"><ArrowLeft size={16}/> Back to home</Link><div className="edition-product-layout"><div className="edition-product-gallery">{product.media.length ? product.media.map((media) => media.mediaType === "tiktok_embed" && media.tiktokPostUrl ? <TikTokPreview key={media.id} postUrl={media.tiktokPostUrl} thumbnailUrl={media.url} title={media.altText || product.title}/> : media.mediaType === "video" ? <video key={media.id} src={media.url} controls playsInline preload="metadata" aria-label={media.altText || product.title}/> : <img key={media.id} src={media.url} alt={media.altText || product.title}/>) : <div className="edition-product-placeholder">Sophiee Finds</div>}</div><div className="edition-product-copy"><p className="edition-eyebrow">{product.collection?.title ?? "THE EXACT ONE"}</p><h1>{product.title}</h1><p>{product.creatorNote ?? "The exact item from Sophiee&apos;s TikTok, with its original video and Shop link in one place."}</p>{product.tags.length ? <div className="edition-tags">{product.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div> : null}{product.offerId ? <Link className="edition-button edition-button--ink" href={`/go/${product.offerId}?src=direct`}><ShoppingBag size={17}/> Get the exact one on TikTok Shop <ArrowUpRight size={16}/></Link> : null}<small>Using this link may earn Sophiee a commission at no extra cost to you.</small></div></div></article><EditionFooter /></main>;
}
