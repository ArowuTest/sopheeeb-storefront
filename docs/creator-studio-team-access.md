# Creator Studio team access

The first authenticated creator is the owner. The owner can invite additional
admins from `/admin/team`; invited people use the same Supabase magic-link flow.

## One-time Supabase setup

Apply `supabase/migrations/0013_creator_memberships.sql` in the Supabase SQL
Editor for the Tree$hya project. The migration:

- creates the `creator_members` table;
- adds owner/admin membership helpers;
- lets admins manage the catalogue without editing the creator identity;
- keeps the owner as the only person who can manage team access;
- preserves public RLS for published products, collections and videos.

The app intentionally keeps owner access working before this migration is
applied. Until it is applied, `/admin/team` shows a migration notice and no
invites can be created.

