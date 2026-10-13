/* eslint-disable @next/next/no-img-element -- product images are creator-supplied and remote domains are dynamic. */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { StorefrontProduct } from "@/lib/data/storefront";

export function EditionProductCard({ product }: { product: StorefrontProduct }) {
  const cover = product.media.find((media) => media.isCover) ?? product.media[0];
  return <article className="edition-product-card"><Link className="edition-product-image" href={`/products/${product.slug}`}>{cover ? cover.mediaType === "video" ? <video src={cover.url} muted playsInline preload="metadata" aria-label={cover.altText || product.title}/> : <img src={cover.url} alt={cover.altText || product.title}/> : <span>Sophiee<br/>Finds</span>}</Link><div><p>{product.collection?.title ?? "Verified link"}</p><Link href={`/products/${product.slug}`}><h3>{product.title}</h3></Link>{product.creatorNote ? <span>{product.creatorNote}</span> : null}{product.offerId ? <Link className="edition-product-link" href={`/go/${product.offerId}?src=direct`}>Get the exact one <ArrowUpRight size={14}/></Link> : null}</div></article>;
}
