import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, UserPlus, UserRound, UserRoundX } from "lucide-react";

import { addAdminEmail, revokeAdmin } from "../actions";
import { requireOwner } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
  saved?: string;
};

function messageFor(params: SearchParams) {
  if (params.saved === "added" || params.saved === "invited") return "Admin email added. No invitation email is sent. They can open Creator Studio, enter this same email, and request their own secure sign-in link.";
  if (params.saved === "revoked") return "Admin access revoked.";
  if (params.error === "migration") return "Run the creator membership migration in Supabase before adding admin emails.";
  if (params.error === "email") return "Use a valid email that is different from the owner email.";
  if (params.error === "configuration") return "The server-side Supabase key is not configured.";
  if (params.error) return "That team change could not be saved. Please try again.";
  return null;
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await requireOwner();
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: members, error } = await supabase
    .from("creator_members")
    .select("id,email,role,status,invited_at,accepted_at")
    .eq("creator_id", context.creatorId)
    .order("created_at");

  const notice = messageFor(params);
  return (
    <main className="admin-shell admin-team-shell">
      <Link className="back-link" href="/admin">
        <ArrowLeft size={18} />
        Creator Studio
      </Link>
      <header className="admin-header">
        <div>
          <p className="eyebrow">TEAM ACCESS</p>
          <h1>Keep the studio <em>in good hands.</em></h1>
          <p className="admin-lede">The owner controls access. Admins can manage videos, products, collections and links without changing the creator identity.</p>
        </div>
        <Link href="/admin/settings" className="text-link">Profile & settings ↗</Link>
      </header>

      {notice ? <div className={`admin-notice${params.error ? " admin-notice--error" : ""}`} role="status"><p>{notice}</p></div> : null}

      <section className="team-grid">
        <article className="team-owner-card">
          <div className="team-card-icon"><ShieldCheck size={22} /></div>
          <p className="eyebrow">OWNER</p>
          <h2>{context.profile.displayName}</h2>
          <p>{context.email}</p>
          <span className="status-pill status-pill--published">Full access</span>
        </article>

        <section className="admin-card team-invite-card">
          <p className="eyebrow">ADD ADMIN ACCESS</p>
          <h2>Give a trusted person access.</h2>
          <p>Add their email to the approved admin list. We do not send a separate invitation email; they request a secure link themselves from the normal Creator Studio sign-in page.</p>
          <form action={addAdminEmail} className="admin-form compact-form">
            <label>Admin email<input name="email" type="email" required placeholder="editor@example.com" /></label>
            <button className="button button-dark" type="submit"><UserPlus size={16} />Add admin email</button>
          </form>
        </section>
      </section>

      <section className="team-members-section">
        <div className="section-heading">
          <div><p className="eyebrow">PEOPLE WITH ACCESS</p><h2>One source of <em>truth.</em></h2></div>
          <p>New admin emails remain pending until that person requests and completes a secure sign-in with the same address.</p>
        </div>
        {error ? (
          <div className="admin-card admin-card-wide">
            <UserRoundX size={22} />
            <p className="eyebrow">MIGRATION NEEDED</p>
            <h2>Team access is ready to turn on.</h2>
            <p>Apply <code>0013_creator_memberships.sql</code> in Supabase SQL Editor, then reload this page. Your current owner access is unaffected.</p>
          </div>
        ) : (
          <div className="team-list">
            <div className="team-row team-row--owner">
              <span className="team-avatar"><ShieldCheck size={16} /></span>
              <span><strong>{context.email}</strong><small>Creator owner · Full access</small></span>
              <span className="status-pill status-pill--published">Owner</span>
            </div>
            {(members ?? []).filter((member) => member.role !== "owner").map((member) => (
              <div className="team-row" key={member.id}>
                <span className="team-avatar"><UserRound size={16} /></span>
                <span><strong>{member.email}</strong><small>Admin · {member.status === "pending" ? "Added, not signed in yet" : member.status === "active" ? "Active" : "Revoked"}</small></span>
                <span className={`status-pill status-pill--${member.status === "active" ? "published" : member.status === "revoked" ? "archived" : "draft"}`}>{member.status}</span>
                {member.status !== "revoked" ? <form action={revokeAdmin}><input type="hidden" name="memberId" value={member.id} /><button className="danger-link" type="submit"><UserRoundX size={14} />Revoke</button></form> : <span className="team-row-spacer" />}
              </div>
            ))}
            {!members?.filter((member) => member.role !== "owner").length ? <div className="team-empty"><CheckCircle2 size={20} /><span>No other admins yet. Add someone above when you are ready.</span></div> : null}
          </div>
        )}
      </section>
    </main>
  );
}
