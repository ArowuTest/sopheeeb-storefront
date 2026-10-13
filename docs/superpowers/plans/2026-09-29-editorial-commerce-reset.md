# Editorial Commerce Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use native implementation with a final independent review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Tree$hya’s site into a polished creator-commerce product where every navigation item has a distinct destination, every TikTok video has a dedicated editorial page, and every purchase CTA is backed by a verified TikTok Shop affiliate record.

**Architecture:** Maintain two explicit content types. `creatorVideos` is a local, creator-authored editorial catalogue based on public TikTok post metadata; it powers discovery and video-story pages but never produces a Shop CTA. Supabase `products` and `product_offers` remain the source of truth for published commerce; they power product pages and the first-party `/go/:offerId` hand-off only after an exact affiliate destination is entered.

**Tech Stack:** Next.js App Router, TypeScript, local creator media, Supabase public catalogue service, Lucide, Vitest, CSS design tokens.

**Spec:** `ideas.md` and the user direction from 2026-09-29: premium glossy creator-commerce experience; real category destinations; aligned content cards; all products and related videos must be separately browseable; do not invent shop links.

## Global Constraints

- Never manufacture a TikTok Shop URL from video, product name, search result, or assumed product match.
- A “Shop on TikTok Shop” button may appear only for a published `product_offers` record.
- A video-derived card must open an internal story page; only the explicit “Watch on TikTok” action may open TikTok.
- Navigation entries must point to unique content routes or category routes, never a shared anchor fallback.
- Maintain descriptive alt text, visible keyboard focus, 44px touch controls, responsive layouts, and reduced-motion support.
- Use the creator’s local authorised media assets with responsive `next/image` rendering.

## Review Focus

- Unknown video slug returns a normal Next.js 404 rather than a generic page or empty story.
- Category navigation exposes matching videos before product links exist, and published product cards when records exist.
- A non-Shop video URL cannot enter the commerce route or generate a Shop CTA.
- Product pages continue to use the first-party tracked redirect and can render their linked TikTok post preview.
- Four-up desktop cards and two-up mobile cards share equal row alignment without staggered offsets or horizontal overflow.

---

### Task 1: Formalise editorial-content routes

**Files:**
- Create: `lib/data/creator-content.ts`
- Modify: `lib/data/creator-videos.ts`
- Create: `tests/unit/creator-content.test.ts`

**Interfaces:**
- Produces `getCreatorVideo(slug)`, `listCreatorVideos(category?)`, `getCreatorCategory(slug)`, and `creatorCategories`.
- Each video contains `slug`, `category`, `categorySlug`, `label`, `summary`, `postUrl`, `image`, and `alt`.

- [ ] **Step 1: Write failing unit tests**

```ts
expect(getCreatorVideo("pilates-board")?.categorySlug).toBe("fitness");
expect(getCreatorVideo("missing-video")).toBeUndefined();
expect(listCreatorVideos("Fashion")).toHaveLength(1);
expect(getCreatorCategory("beauty")?.name).toBe("Beauty");
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm test -- creator-content.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement typed video and category helpers**

Create a typed local editorial catalogue from current creator TikTok post metadata. Keep `postUrl` separate from any product offer field and add no purchasing URL.

- [ ] **Step 4: Run the focused test and verify success**

Run: `pnpm test -- creator-content.test.ts`
Expected: PASS.

### Task 2: Create the editorial library and video-story pages

**Files:**
- Create: `components/store/creator-video-card.tsx`
- Create: `app/discover/page.tsx`
- Create: `app/watch/[slug]/page.tsx`
- Create: `app/creator-content.css`
- Modify: `public/manus-routes.json`

**Interfaces:**
- `CreatorVideoCard` accepts one `CreatorVideo` and links to `/watch/[slug]`.
- `/discover?category=<slug>` filters the creator story catalogue.
- `/watch/[slug]` renders one story, a TikTok watch action, related stories, and the current verified product list.

- [ ] **Step 1: Create equal-height video-card component**

Use `next/image`, a fixed media ratio, category label, story title, and visible “Open story” affordance. Link the card to the internal watch route, not TikTok.

- [ ] **Step 2: Build `/discover` with category filter chips**

Render an all-content catalogue and five filter states: All, Fitness, Fashion, Beauty, Lifestyle. Every chip uses a unique `?category=` URL and indicates the selected category with `aria-current`.

- [ ] **Step 3: Build `/watch/[slug]` as an editorial detail page**

Show the full creator image, category, clean creator note, explicit external “Watch the full TikTok” action, and a “Related verified picks” area. When no product records exist, show a clear non-clickable message that exact shop links are being verified.

- [ ] **Step 4: Update route manifest**

Add `/discover` and `/watch/:slug`; preserve all previously declared page routes and exclude APIs.

- [ ] **Step 5: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`
Expected: Both pass and list `/discover` and `/watch/[slug]`.

### Task 3: Make category destinations real

**Files:**
- Modify: `app/collections/[slug]/page.tsx`
- Modify: `components/store/site-header.tsx`
- Modify: `app/page.tsx`
- Modify: `app/creator-home.css`

**Interfaces:**
- Navigation maps The Edit to `/discover` and category labels to `/collections/<slug>`.
- Category page combines matching editorial stories with published Supabase product cards.

- [ ] **Step 1: Replace anchor-based header destinations**

Map “The Edit” to `/discover`, Fitness to `/collections/fitness`, Fashion to `/collections/fashion`, Beauty to `/collections/beauty`, and Lifestyle to `/collections/lifestyle`.

- [ ] **Step 2: Add video stories to each category page**

Resolve category metadata by slug. Render title, description, correct creator story cards, then a separate “Shop the verified picks” section. Never label video cards as purchase links.

- [ ] **Step 3: Refocus homepage CTAs**

Use `/discover` for “See the edit” and make all featured cards internal story links. Preserve the `latestProducts` section only as the verified Shop layer.

- [ ] **Step 4: Run route and interaction checks**

Run: `curl -fsS http://127.0.0.1:3000/manus-routes.json && pnpm lint`
Expected: JSON contains the new routes and lint passes.

### Task 4: Deliver a premium, aligned visual system

**Files:**
- Modify: `app/creator-home.css`
- Modify: `app/creator-gloss.css`
- Modify: `app/catalogue.css`
- Modify: `app/creator-content.css`

**Interfaces:**
- Uses scoped `creator-*` classes and local CSS tokens.
- Hero uses elevated visual layers; content grids remain uniform and aligned.

- [ ] **Step 1: Remove the staggered video-card layout**

Remove per-card `margin-top` layout offsets. Use equal row alignment at desktop and a consistent two-column mobile grid.

- [ ] **Step 2: Establish premium surface tokens**

Use a named surface scale for ink, cream, glass, line, shadow, lime accent, and rose accent. Apply one shadow scale and a restrained gloss/reflection treatment to cards, hero framing, and CTA surfaces.

- [ ] **Step 3: Add responsive and focus states**

Set `:focus-visible` for links/buttons, maintain 44px targets, add `prefers-reduced-motion` fallback, set local image dimensions/sizes, and remove below-fold layout shifts.

- [ ] **Step 4: Capture desktop and mobile renders**

Use `webdev.take_screenshot` at 1440×1000 and 390×844. Confirm navigation, cards, CTA hierarchy, and pages have no visible misalignment or horizontal overflow.

### Task 5: Verify content/commerce boundaries and commit

**Files:**
- Modify: `tests/unit/creator-content.test.ts`
- Modify as needed: `tests/unit/affiliate-url.test.ts`

- [ ] **Step 1: Run complete quality suite**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build && git diff --check`
Expected: all pass.

- [ ] **Step 2: Check empty-catalogue state**

Query the public catalogue and verify no video card carries `Shop on TikTok Shop`; product cards appear only when published product/offer records exist.

- [ ] **Step 3: Commit and push the coherent reset**

Run a normal commit and `git push origin main`; do not force-push.
