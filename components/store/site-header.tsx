"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const links = [
  ["Stories", "/discover"], ["Fitness", "/collections/fitness"], ["Fashion", "/collections/fashion"], ["Beauty", "/collections/beauty"], ["Lifestyle", "/collections/lifestyle"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false); const firstLink = useRef<HTMLAnchorElement>(null); const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; firstLink.current?.focus(); const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }; window.addEventListener("keydown", keydown); return () => window.removeEventListener("keydown", keydown); }, [open]);
  return <header className="nav"><Link href="/" className="brand"><span className="mark">S</span><span>SOPHIEE FINDS</span></Link><nav aria-label="Storefront navigation">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav><div className="nav-actions"><Link href="/search" aria-label="Search"><Search size={19}/></Link><Link href="/admin" aria-label="Creator admin"><ShoppingBag size={19}/></Link><button ref={toggle} className="mobile-menu" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-storefront-nav" onClick={() => setOpen((value) => !value)}>{open ? <X size={21}/> : <Menu size={21}/>}</button></div>{open ? <nav id="mobile-storefront-nav" className="mobile-drawer" aria-label="Mobile storefront navigation">{links.map(([label, href], index) => <Link ref={index === 0 ? firstLink : undefined} key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<Link href="/search" onClick={() => setOpen(false)}>Search Sophiee Finds</Link></nav> : null}</header>;
}
