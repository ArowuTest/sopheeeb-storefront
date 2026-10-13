# The Tree$hya Edit

A TikTok Shop affiliate storefront for editorial recommendations, built with **Next.js**, **Supabase**, and **Railway**.

## What it does

- Public, indexable video stories, collections, product pages, search, social profile links, and a safe TikTok Shop purchase hand-off.
- Creator Studio for magic-link sign-in, TikTok video drafts and batch imports, products, media, collections, social profiles, private CSV/paste imports, click totals, and TikTok post previews.
- Published-only public catalogue and video access, owner-scoped RLS, private uploaded media served through short-lived signed redirects, and no user payment processing.

## Required Railway variables

Use the dedicated `treeshya-storefront` Supabase project:

```bash
NEXT_PUBLIC_SITE_URL=https://treeshya.com
NEXT_PUBLIC_CREATOR_HANDLE=tr33shya
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ADMIN_EMAIL=approved-creator@example.com
```

`ADMIN_EMAIL` is the only address allowed to create or use the Creator Studio. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only: never prefix it with `NEXT_PUBLIC_`.

## Creator content workflow

See [Creator content onboarding](docs/creator-content-onboarding.md) for the operating flow. Video posts are always imported as **Drafts** and do not appear publicly until the creator explicitly publishes them. A video can play on the storefront without a Shop link; a purchase button appears only after the creator attaches an exact product with an active TikTok Shop offer.

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Deploy to Railway

1. Create a Railway service from the GitHub repository and set the variables above.
2. Use `pnpm build` as the build command and `pnpm start` as the start command.
3. Run the health check at `/api/health`.
4. Attach `treeshya.com` once the service is healthy, then set `NEXT_PUBLIC_SITE_URL=https://treeshya.com`.
5. In Supabase Auth, add `https://treeshya.com/auth/callback` to the allowed redirect URLs.

## Data migrations

The SQL history in `supabase/migrations` is already applied to the dedicated Supabase project through the governed Supabase connector. New environments should apply the migrations in filename order.
