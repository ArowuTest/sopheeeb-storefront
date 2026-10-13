/* eslint-disable @next/next/no-img-element -- Creator-supplied media domains are dynamic and intentionally not proxied. */
import Link from "next/link";

import type { StorefrontProduct } from "@/lib/data/storefront";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const cover = product.media.find((media) => media.isCover) ?? product.media[0];
  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-card-image">
        {cover ? cover.mediaType === "video" ? <video src={cover.url} muted playsInline preload="metadata" aria-label={cover.altText || product.title} /> : <img src={cover.url} alt={cover.altText || product.title} /> : <span className="product-card-placeholder">SOPHEE<br/>FINDS</span>}
      </Link>
      <div className="product-card-copy">
        <p className="eyebrow">{product.collection?.title ?? "FEATURED VIDEO"}</p>
        <Link href={`/products/${product.slug}`}><h3>{product.title}</h3></Link>
        {product.creatorNote ? <p>{product.creatorNote}</p> : null}
        {product.offerId ? <Link className="text-link" href={`/go/${product.offerId}?src=direct`}>Get the exact one on TikTok Shop ↗</Link> : null}
      </div>
    </article>
  );
}
