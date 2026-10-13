# Database-backed Creator CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Execute natively in focused, testable tasks. An independent read-only reviewer must validate the public/admin data boundary before delivery.

**Goal:** Replace the source-coded TikTok story catalogue with a Supabase-backed Creator Studio in which Tree$hya can create, import, edit, organise, publish, archive, and link every video, category, product, media asset, and social profile without touching code.

**Architecture:** A new owner-scoped `creator_videos` table becomes the single source of truth for public videos. It links each TikTok post to an existing collection (the editable category), optional exact product, oEmbed-derived title/thumbnail, editorial summary, published status, and display order. Server-only data functions query only published records for public routes; authenticated, approved creators manage records through new Studio pages and a bounded TikTok URL batch import. The existing product, offer, media, social-link, auth and safe redirect systems remain intact.

**Tech stack:** Next.js App Router, TypeScript, Supabase Postgres/Auth/RLS, `@supabase/ssr`, TikTok official oEmbed and Embed Player, Zod, Vitest.

**Spec:** User feedback on 2026-09-29; [current storefront plan](/home/ubuntu/plan.md); [Supabase current changelog](https://supabase.com/changelog.md).

## Verified current state

- `treeshya-storefront` is healthy but has **0** creator profiles, collections, products, active offers, media records, social links, and import batches.
- The public stories are currently 8 source-coded objects in `lib/data/creator-videos.ts`: 5 Fitness, 1 Fashion, 1 Beauty, 1 Lifestyle. This is temporary prototype content and must be removed from the public data path.
- The existing Studio already supports secure magic-link access, products/offers, product media uploads, collections, social links, safe outbound redirects, and product CSV/paste imports. It does **not** yet manage the public story feed.
- Supabase’s current changelog says new `public` tables may not automatically be exposed through the Data API; the migration must use explicit grants, RLS and public data tests. Source: [Supabase changelog, 28 April 2026](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

## Global constraints

- No source-coded creator video titles, post URLs, summaries, thumbnails, category assignments, or product associations remain in public rendering.
- Creator-owned content is never automatically published. A creator explicitly selects Draft, Published, or Archived.
- A TikTok post URL is only embedded as a video; it never becomes a purchase destination. Purchase uses the existing active, exact TikTok Shop offer redirect.
- Every video record has a creator owner and editable collection/category. A video may link only to a product owned by the same creator.
- Public data queries return only published stories from published collections; private Draft and Archived records remain inaccessible to anonymous users.
- TikTok oEmbed is a convenience for a creator-supplied canonical post URL. Failures leave the record editable; it never executes provider HTML.
- Batch import is capped at 25 URLs per request and always creates Drafts. It reports successes/failures rather than silently dropping rows.
- The approved native execution method from the earlier plan remains in force. Do not request another implementation-method choice.

## Review focus

1. **Zero-content state:** before creator setup or when no stories are published, public routes must render helpful empty states without leaking prototype stories or throwing.
2. **Cross-creator references:** a creator must not attach another creator’s product or collection to a video, including by crafted form value.
3. **Public visibility:** Draft/Archived stories, their thumbnails, titles, summaries and TikTok URLs must not appear in public route queries or anonymous Data API access.
4. **Bad provider URLs:** malformed, short-form or non-TikTok URLs must never be stored as player source URLs; oEmbed failure must be visible to the creator and leave no incomplete published record.
5. **Batch partial failure:** valid URLs create independent Draft records; invalid/failing entries are reported and do not prevent good rows from being imported.

---

### Task 1: Secure Story Data Model

**Files:**
- Create: `supabase/migrations/0009_creator_video_cms.sql`
- Create: `lib/validation/creator-video.ts`
- Create: `tests/unit/creator-video-validation.test.ts`
- Modify: `lib/domain/types.ts`
- Modify: `.env.example`

**Interfaces:**
- `creator_videos(id, creator_id, collection_id, linked_product_id, slug, title, summary, alt_text, tiktok_post_url, thumbnail_url, status, display_order, published_at, created_at, updated_at)`.
- `creatorVideoInputSchema.safeParse(...)` validates canonical TikTok posts, title/summary lengths, UUID optional links, category collection selection and `draft|published|archived` status.

- [ ] Write failing Vitest cases for a valid canonical TikTok post, a short/non-TikTok URL, a missing collection, excessive summary length, a bad status and an optional linked product UUID.
- [ ] Implement the validation contract using existing `isTikTokPostUrl` and explicit Zod field limits.
- [ ] Write an additive migration that creates `creator_videos`; adds indexes for `(creator_id,status,published_at,display_order)`, `(collection_id,status,display_order)` and `linked_product_id`; enables RLS; grants only needed Data API roles; creates owner read/write and published anonymous read policies; and adds a `SECURITY INVOKER` trigger that rejects cross-creator collection/product references.
- [ ] Apply the migration to `itiwldjagwxetjcgxmcx`, list the table/columns, query the zero-state table, and run both security and performance advisors. Use one anonymous published-read policy and one authenticated published-or-owner read policy so the advisor does not report duplicate authenticated `SELECT` policies.
- [ ] Commit the data model and validation tests.

### Task 2: Server-only Public Story Repository

**Files:**
- Create: `lib/data/stories.ts`
- Create: `lib/data/story-query.ts`
- Create: `tests/unit/story-query.test.ts`
- Modify: `lib/data/storefront.ts`
- Delete: `lib/data/creator-videos.ts`
- Modify: `lib/data/creator-content.ts`
- Modify: `tests/unit/creator-content.test.ts`

**Interfaces:**
- `StorefrontStory`: id, slug, title, summary, altText, tiktokPostUrl, thumbnailUrl, collection `{ slug, title }`, linkedProduct `{ slug, title, offerId } | null`.
- `listPublicStories({ collectionSlug?, limit? })`, `getPublicStory(slug)`, `listPublicStoryCollections()` return no source-coded fallback records.
- `storyCatalogueSelect()` selects the minimum published public projection and only joins active published offers for linked products.

- [ ] Write failing selector tests proving unfiltered/filtered story queries use public published collection joins and active offer constraints without exposing creator/private fields.
- [ ] Implement mapper and query helpers using `getPublicProfile()` / public Supabase client. Return empty arrays/null if configuration or creator setup is absent.
- [ ] Replace the old synchronous hardcoded-video helpers with async repository calls and update tests to exercise null/empty state behavior.
- [ ] Remove the hardcoded story file only after all imports compile against the repository interface.
- [ ] Commit the public repository refactor.

### Task 3: Creator Studio Story Management and Draft Import

**Files:**
- Create: `app/admin/videos/page.tsx`
- Create: `app/admin/videos/new/page.tsx`
- Create: `app/admin/videos/[id]/page.tsx`
- Create: `app/admin/video-actions.ts`
- Create: `components/admin/story-import-form.tsx`
- Create: `tests/unit/story-import.test.ts`
- Modify: `app/admin/page.tsx`
- Modify: `app/admin.css`
- Modify: `app/admin/actions.ts` only if shared authorised helper is extracted
- Modify: `app/api/admin/tiktok-oembed/route.ts` only if shared oEmbed service needs a safe exported mapper
- Modify: `public/manus-routes.json`

**Interfaces:**
- `createStory(formData)`, `updateStory(formData)`, `archiveStory(formData)`, `importTikTokStoryDrafts(formData)` call `requireCreator()` before any record access.
- The story editor takes `tiktokPostUrl`, optional `title`, optional `summary`, `collectionId`, optional `linkedProductId`, `status`, `displayOrder`.
- The importer accepts newline-separated canonical TikTok URLs plus a required target collection and creates up to 25 Draft stories after fetching oEmbed metadata.

- [ ] Write failing pure tests for deduplication, 25-item cap, canonical URL parsing, and a partial import result with failures.
- [ ] Build a creator dashboard entry and a management list showing status, category, linked product, TikTok preview, order and edit/add actions.
- [ ] Build the single-story editor: use oEmbed title/thumbnail only as form defaults; allow creator override; require a collection; select only same-owner products; default to Draft; surface errors beside their fields.
- [ ] Build the batch importer with visible count/error feedback. Valid URLs insert independent Draft records; invalid or duplicate URLs report their line number and do not publish anything.
- [ ] Update route manifest and responsive Studio styles; keyboard focus and destructive archive action must stay accessible.
- [ ] Commit the Studio management work.

### Task 4: Public Database-backed Video Experience

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/discover/page.tsx`
- Modify: `app/watch/[slug]/page.tsx`
- Modify: `app/collections/[slug]/page.tsx`
- Modify: `components/store/edition-header.tsx`
- Create: `components/store/edition-header-server.tsx`
- Modify: `components/store/story-tile.tsx`
- Modify: `components/store/feature-story.tsx`
- Modify: `app/edition.css`
- Modify: `app/edition-overrides.css`
- Modify: `app/sitemap.ts`
- Modify: `public/manus-routes.json`

**Interfaces:**
- The server wrapper fetches published categories and passes compact navigation `{ slug, title }[]` to the existing client header.
- Every public page consumes `StorefrontStory` records from Task 2.
- A story’s Shop CTA renders only when its linked public product has an active offer; otherwise the original TikTok player remains available with no purchase CTA.

- [ ] Replace all direct `creatorVideos[...]` imports with asynchronous database reads.
- [ ] Render real published story/category data on home, Discover, collection and Watch pages; category tile cover uses `collections.image_url` or the first published story thumbnail.
- [ ] Implement polished empty states for no creator profile/no published stories without reintroducing sample video names, links, or post-specific media.
- [ ] Preserve responsive embedded TikTok player behavior and make header categories database-driven.
- [ ] Extend sitemap with published video and collection URLs only.
- [ ] Commit the public data integration.

### Task 5: Proof, Content Readiness and Deployment Boundary

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `docs/creator-voice.md` if the creator content workflow changes customer copy
- Create: `docs/creator-content-onboarding.md`

- [ ] Add setup documentation that explicitly requires Railway `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, and `NEXT_PUBLIC_CREATOR_HANDLE` before Creator Studio can be used.
- [ ] Document the creator’s operational flow: sign in; complete profile setup; create/publish collections; batch-import post URLs as Drafts; categorise/describe/order them; attach exact products; publish; add TikTok Shop URLs; update social links.
- [ ] Verify live database counts, anonymous/public query behavior, owner-only admin behavior, migration advisors, typecheck, lint, unit tests, build, public route responses, desktop/mobile layouts, inline player source, and an independent reviewer report. Before creator setup, category and story routes correctly return 404 rather than fall back to prototype content; home, Discover, sitemap and Studio routes render their intentional zero states.
- [ ] Do not create a creator account, publish public content, set Railway secrets, or deploy content without the creator’s approved administrator email and supplied/approved post selections. Record these as launch prerequisites, not defects.
- [ ] Commit verified documentation and evidence.
