# Creator Studio: content onboarding

## Before signing in

The live Railway service needs these values configured before Creator Studio can be used:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The live site address, `https://sopheeeb.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | The dedicated `sopheeeb-storefront` Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used for secure setup and private media operations |
| `ADMIN_EMAIL` | The owner email, `etest105@gmail.com`; the owner can add and revoke other admins |
| `NEXT_PUBLIC_CREATOR_HANDLE` | The public TikTok handle, `sopheeeb` |

In Supabase Auth, set the Site URL to `https://sopheeeb.com` and allow `https://sopheeeb.com/auth/callback`.

## First-time setup

Before Creator Studio is set up, the storefront displays a short **initial preview library** based on public @sopheeeb posts reviewed during the project. It has no product buttons. During Creator Studio setup, the same starter posts and categories are automatically added as normal, editable database records.

1. Visit `/admin` and request a magic link using the approved `ADMIN_EMAIL` address.
2. Complete the profile setup: display name, public handle, disclosure and optional contact details.
3. Create the public collections that visitors should browse, for example **Fitness**, **Fashion**, **Beauty** and **Lifestyle**. A collection must be published before its published videos can be seen on the storefront.
4. Add public social destinations in **Profile & links**. These are the icons and footer links shown on the storefront.

## Add TikTok video stories

### Import several posts

1. Open **Creator Studio → Manage videos**.
2. Select the destination collection.
3. Paste up to **200 full TikTok post URLs**, one URL per line. Use the canonical format: `https://www.tiktok.com/@handle/video/<numeric-id>`.
4. Select **Create private video drafts**. Each valid post is fetched through TikTok’s official oEmbed endpoint for a title and thumbnail. Invalid, duplicate or unavailable URLs are reported by their line number.
5. Open each Draft to improve the title, add a visitor-facing summary, confirm the image description, choose the display order and add an exact product when one is available.
6. Change the story to **Published** only when it is ready for visitors. Draft and Archived stories never appear in public pages, the sitemap or anonymous reads.

### Add one post

Use **Add one video** for a single TikTok post. TikTok’s title and thumbnail are used when the corresponding fields are left blank; the creator can always override them.

## Attach the exact Shop link

1. In **Add a find**, create the product and paste its exact TikTok Shop affiliate URL.
2. Set the product to **Published** only once it is correct.
3. In the related video story, choose that product under **Exact product link** and publish the story.

Visitors can always play the embedded TikTok video first. The **Get [product]** button only appears where a linked, published product has an active exact Shop offer. A TikTok post URL is never treated as a purchase destination.

## Ongoing editing

- Update a story’s category, title, summary, thumbnail, order, linked product or state in **Manage videos**.
- Update product links and images in **Manage finds**.
- Update collection order and publication status in **Manage collections**.
- Update TikTok, Instagram and other public profile links in **Profile & links**.
- Archive a story to remove it from the public storefront without deleting its history.

## Launch checklist

- [ ] Railway variables are set, including the approved creator email.
- [ ] Supabase Auth redirect URL is correct.
- [ ] Creator profile and visible social links are complete.
- [ ] Collections are published.
- [ ] Video stories are reviewed and explicitly published.
- [ ] Every displayed Shop CTA has an exact active TikTok Shop destination.
- [ ] Mobile and desktop storefronts have been reviewed after the first content import.
