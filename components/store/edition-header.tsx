"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface EditionNavigationCollection {
  slug: string;
  title: string;
}

export function EditionHeader({ collections = [] }: { collections?: EditionNavigationCollection[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const firstMobileLink = useRef<HTMLAnchorElement>(null);
  const navigation = [
    { label: "Stories", href: "/discover", matches: (path: string) => path === "/discover" || path.startsWith("/watch/") },
    { label: "All Finds", href: "/products", matches: (path: string) => path === "/products" || path.startsWith("/products/") },
    ...collections.slice(0, 4).map((collection) => ({ label: collection.title, href: `/collections/${collection.slug}`, matches: (path: string) => path === `/collections/${collection.slug}` })),
  ];

  useEffect(() => {
    if (!open) return;
    firstMobileLink.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return <header className="edition-header">
    <Link className="edition-brand" href="/"><span className="edition-brand-mark" aria-hidden="true">S</span><span>Sophiee Finds</span></Link>
    <nav className="edition-desktop-nav" aria-label="Primary navigation">{navigation.map((item) => <Link key={item.href} href={item.href} aria-current={item.matches(pathname) ? "page" : undefined}>{item.label}</Link>)}</nav>
    <div className="edition-header-actions"><Link href="/search" aria-label="Search Sophiee Finds"><Search size={19}/></Link><button type="button" className="edition-menu-toggle" aria-expanded={open} aria-controls="edition-mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>{open ? <X size={22}/> : <Menu size={22}/>}</button></div>
    {open ? <nav id="edition-mobile-menu" className="edition-mobile-menu" aria-label="Mobile navigation">{navigation.map((item, index) => <Link ref={index === 0 ? firstMobileLink : undefined} key={item.href} href={item.href} aria-current={item.matches(pathname) ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}</Link>)}<Link href="/search" onClick={() => setOpen(false)}>Find a link</Link></nav> : null}
  </header>;
}
