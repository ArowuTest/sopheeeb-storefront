# Customer Copy and TikTok Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use native implementation and independently verify the public Preview before delivery.

**Goal:** Replace implementation-sounding public copy with visitor-centred guidance, make homepage category labels legible, and play each sourced TikTok video within its story page before a separate verified Shop handoff.

**Architecture:** Retain the existing verified-offer redirect and data model. Add a small pure TikTok player URL helper and a reusable player component that uses TikTok’s official `player/v1/{post_id}` embed. Rework public copy and contrast inside the edition system only; no admin, Supabase, authentication, or Shop validation logic changes.

**Tech stack:** Next.js App Router, TypeScript, React, Vitest, CSS, official TikTok Embed Player iframe.

**Spec:** User feedback on 2026-09-29 and TikTok’s official Embed Player documentation.

## Constraints

- A story page must show the original TikTok inline with user-initiated playback; do not autoplay or hide native player controls.
- The TikTok Shop CTA remains absent until a valid, active, exact Shop offer exists. A video URL is never a Shop destination.
- Customer copy explains the benefit and next action; it does not describe internal curation, matching, missing implementation, or developer intent.
- Category labels must achieve strong visual contrast over every source image and remain legible at desktop and phone widths.
- Use the official `https://www.tiktok.com/player/v1/{post_id}` URL, with controls visible and recommendations limited to the creator where TikTok supports it.

## Tasks

### Task 1: Copy reset

**Files:** `app/page.tsx`, `app/watch/[slug]/page.tsx`, `app/collections/[slug]/page.tsx`, `components/store/edition-footer.tsx`, `lib/data/creator-content.ts`, `lib/data/creator-videos.ts`, `docs/creator-voice.md`

- [ ] Replace “I am adding”, “I am not putting”, “I have not matched”, and similar internal-process language with concise visitor-facing guidance.
- [ ] Keep content factual and use “exact product”, “original video”, “verified TikTok Shop link”, and “watch on this page” only where accurate.
- [ ] Ensure a no-link state states what a visitor can do now and what will appear later.

### Task 2: Inline video player

**Files:** `lib/tiktok/player.ts`, `components/store/tiktok-player.tsx`, `components/store/tiktok-preview.tsx`, `app/watch/[slug]/page.tsx`, `tests/unit/tiktok-player.test.ts`

- [ ] Test extraction of numeric TikTok video IDs and generation of the official player URL with controls enabled, `autoplay=0`, `rel=0`, no description/music panel.
- [ ] Render the official player inside each `watch` story page, with a semantic title, fullscreen permission, and a clear TikTok fallback link if no valid numeric ID can be recovered.
- [ ] Reuse the same player component for product-level TikTok media rather than maintaining a competing `/embed/v2` implementation.

### Task 3: Category-card visibility and validation

**Files:** `app/page.tsx`, `app/edition.css`

- [ ] Add a dedicated high-contrast category title treatment and a scrim that makes Fitness, Fashion, Beauty, and Lifestyle readable over all four images.
- [ ] Verify 390px, 768px, and 1440px screenshots and test player frame source, responsive layout, console, and route response.
- [ ] Run typecheck, lint, full tests, production build, and diff check; perform an independent read-only review before commit.
