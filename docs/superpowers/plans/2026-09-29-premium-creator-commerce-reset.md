# Premium creator-commerce reconstruction plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use native implementation with a final independent review. This plan replaces the public presentation layer; it does not weaken the existing Supabase, authentication, media, import, or verified-redirect boundaries.

**Goal:** Rebuild the public Tree$hya experience as a cohesive, premium creator storefront that starts with the creator’s real TikTok content and makes the visitor’s next action obvious: watch the actual video, explore a relevant category, or use an exact verified product link when one exists.

**Architecture:** Keep the existing Next.js routes, Supabase data model, safe `/go/[offerId]` redirect, and creator admin system. Replace the public presentation layer with a single `edition-*` design system and purpose-built components shared by homepage, Stories, categories, and video-detail pages. Current real creator imagery remains the visual source; no generated or stock person imagery will be introduced.

**Tech stack:** Next.js 16 App Router, TypeScript, React, CSS, Lucide, Next Image, existing Supabase data clients.

**Spec:** This document and `docs/creator-voice.md`.

## Global constraints

- Use Tree$hya’s original, locally cached public creator imagery only.
- Do not infer a TikTok Shop link from a video. Product CTAs require an active, exact `shop.tiktok.com` offer already stored in Supabase.
- Do not use generic influencer-directory language such as “editorial story”, “curated”, “product layer”, “the full edit”, or “no gatekeeping” as default UI copy.
- One page should have one clear primary action.
- Preserve all admin routes, Supabase RLS, authentication protections, import flows, media protection, analytics, and redirect validation.
- The public pages must work at 390px, 768px, and 1440px, with a visible responsive navigation control and no horizontal scrolling.

## Design decision

The site should feel like a private, beautifully art-directed **digital tear sheet** created by someone whose followers already know her face and voice. It is not a link-in-bio grid and it is not TikTok reproduced in a browser.

The visual system uses a charcoal ink base, warm paper, one lime “highlighter” accent, dusted rose for restrained emphasis, one editorial serif for expressive headlines, and one compact sans/mono family for practical information. Large imagery carries most of the atmosphere. The grid is intentional: asymmetric at the hero, regular where people scan stories, and product-like only once a verified link exists.

## Information architecture

| Route | User purpose | Primary action | Page role |
|---|---|---|---|
| `/` | “I saw something on Tree$hya’s page. Where do I start?” | Open Stories | Clear creator introduction and selected entry points, not a long generic landing page |
| `/discover` | Browse all creator content | Open a video | A magazine-like story index with useful category filters |
| `/collections/[slug]` | Explore a content pillar | Open a relevant video | Category landing page with visual context and verified products only when present |
| `/watch/[slug]` | Understand one specific video/find | Watch the original TikTok | Story detail with an exact-link promise rather than unrelated shopping cards |
| `/products/[slug]` | Buy a verified product | Open TikTok Shop | Product detail with creator note and clear external-shop handoff |

## File structure

| File | Responsibility |
|---|---|
| `app/edition.css` | All public presentation tokens, responsive grids, interactions, and visual rhythm under `.edition-*` scope |
| `components/store/edition-header.tsx` | Shared public header, desktop navigation, mobile menu, active-page state, focus behavior |
| `components/store/edition-footer.tsx` | Shared public footer, social links, affiliate language, consistent final CTA |
| `components/store/story-tile.tsx` | Shared story list/grid card with category, image, title, and open-story destination |
| `components/store/feature-story.tsx` | Large feature tile used on the home and category pages |
| `app/page.tsx` | Rebuilt homepage with a compact creator intro, selected stories, category entry points, and clear verified-link promise |
| `app/discover/page.tsx` | Rebuilt story index with filter and scan-friendly asset grid |
| `app/collections/[slug]/page.tsx` | Rebuilt category landing page and correct verified-products state |
| `app/watch/[slug]/page.tsx` | Rebuilt single-story page with original TikTok CTA and exact-link status |
| `lib/data/creator-videos.ts` and `lib/data/creator-content.ts` | Maintain grounded first-person content metadata and categories |
| `tests/unit/creator-content.test.ts` | Pin stable story/category routes and content safety rules |

## Tasks

### Task 1: Establish the public edition system

**Files:**
- Create: `app/edition.css`
- Create: `components/store/edition-header.tsx`
- Create: `components/store/edition-footer.tsx`
- Modify: `app/layout.tsx`
- Test: existing TypeScript and lint checks

- [ ] Define semantic public tokens for ink, paper, lime, rose, visual spacing, type, shadows, focus, and reduced motion.
- [ ] Build a single header that renders the same page hierarchy on all public routes and has a properly labelled mobile trigger, Escape handling, initial focus, and 44px touch targets.
- [ ] Build a restrained footer with creator social links and an affiliate statement that is explicit without dominating the page.
- [ ] Load the new public style sheet after old compatibility styles, then scope all new rules to new class names so admin routes remain unchanged.
- [ ] Verify keyboard focus, 390px navigation, 768px navigation, and 1440px navigation.

### Task 2: Rebuild homepage around discovery rather than decoration

**Files:**
- Create: `components/store/feature-story.tsx`
- Create: `components/store/story-tile.tsx`
- Modify: `app/page.tsx`
- Modify: `lib/data/creator-videos.ts`
- Test: `tests/unit/creator-content.test.ts`

- [ ] Make the hero answer the visitor’s first question: “I saw it on Tree$hya’s page. Where do I find it?”
- [ ] Use a real Tree$hya portrait as the focal visual and three real, clickable story fragments as supporting proof.
- [ ] Add a selected-stories rail with distinct visual weights and specific creator-language labels.
- [ ] Add a category selector with Fitness, Fashion, Beauty, and Lifestyle routes that all lead somewhere distinct.
- [ ] Place the verified-link rule in a quiet trust module rather than showing an empty shop state as the primary message.
- [ ] Do not display product cards unless real, verified public product data exists.

### Task 3: Rebuild the Stories and category journeys

**Files:**
- Modify: `app/discover/page.tsx`
- Modify: `app/collections/[slug]/page.tsx`
- Modify: `components/store/story-tile.tsx`
- Modify: `lib/data/creator-content.ts`
- Test: `tests/unit/creator-content.test.ts`

- [ ] Give `/discover` a clear index role: filter categories, scan image-first story cards, and one sentence explaining that an original video comes before a product link.
- [ ] Make each category page visually and verbally specific to the content pillar rather than a generic template with a swapped heading.
- [ ] Keep story tiles aligned in a deliberate responsive grid; no decorative staggered offsets or horizontal card clipping at phone widths.
- [ ] Retain the correct empty-shop state: it must state that an exact link is still being checked, not suggest unrelated shopping.

### Task 4: Rebuild the video and product decision surfaces

**Files:**
- Modify: `app/watch/[slug]/page.tsx`
- Modify: `app/products/[slug]/page.tsx`
- Modify: `components/store/product-card.tsx`
- Test: existing affiliate redirect and URL validation tests

- [ ] Treat a story page as a single decision: watch the original video or return to related content.
- [ ] Explain missing product links in natural first-person language and do not render a generic product carousel.
- [ ] Treat an actual product page as a purchase decision page: selected media, creator note, transparent affiliate note, and one high-contrast `Get the exact one on TikTok Shop` CTA.
- [ ] Preserve the verified `/go/[offerId]` link path and existing server-side destination validation.

### Task 5: Quality gate and evidence

**Files:**
- Modify: `public/manus-routes.json` if titles change
- Test: all existing unit tests and build

- [ ] Run typecheck, lint, tests, production build, and diff check.
- [ ] Crawl all internal public routes and assert they return 200.
- [ ] Test a real mobile hamburger interaction against the public Preview, follow one menu destination, and check the console.
- [ ] Capture 390px, 768px, and 1440px screenshots of `/`, `/discover`, `/collections/fitness`, and `/watch/pilates-board`.
- [ ] Conduct one independent read-only review, fix confirmed findings, rerun the relevant checks, then commit the coherent redesign.

## Review focus

1. Preview-origin client hydration: the public Preview must connect its development websocket and the mobile menu must toggle on the direct Preview URL.
2. Empty catalogue: no verified product data must result in an intentional trust message, never an empty broken grid or a fake Shop CTA.
3. Product/link integrity: video URLs must never be used as an affiliate destination; only `/go/[offerId]` may hand off a verified Shop link.
4. Route identity: Home, Stories, category, and single-story pages must provide different jobs and visual hierarchy rather than visually repeating the same page.
5. Small screens: category/story grids may reduce columns but must not create horizontal overflow, clipped controls, unreadable typography, or inaccessible navigation.
