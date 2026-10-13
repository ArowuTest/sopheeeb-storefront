import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

type SearchParams = { error?: string; sent?: string; signout?: string };

function noticeFor(params: SearchParams) {
  if (params.sent === "1") return "Check your inbox for a secure sign-in link. It expires after a short time.";
  if (params.signout === "1") return "You have been signed out of Creator Studio.";
  if (params.error === "send") return "We could not send that link just now. Check the email address and try again.";
  if (params.error === "callback") return "That sign-in link is no longer valid. Request a fresh one.";
  if (params.error === "authorised") return "That email is not on the approved owner or admin list.";
  if (params.error === "rate") return "Too many sign-in requests. Please wait a few minutes, then try again.";
  return null;
}

export default async function Login({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const notice = noticeFor(params);
  return <main className="empty-edit"><Mail size={30}/><p className="eyebrow">CREATOR STUDIO</p><h2>Sign in without a <em>password.</em></h2><p>Use the owner email or an invited admin email. We will send a secure magic link.</p>{notice ? <p className={params.error ? "form-error" : "admin-notice"} role="status">{notice}</p> : null}<form action="/api/auth/request-link" method="post" style={{maxWidth:420,margin:"28px auto",display:"grid",gap:12}}><label htmlFor="email">Studio email</label><input id="email" name="email" type="email" required placeholder="you@example.com" style={{padding:14,border:"1px solid #ddd3ca",background:"#fffdfc"}}/><button className="button button-dark" type="submit" style={{justifyContent:"center",marginTop:0}}>Send secure sign-in link</button></form><Link href="/" className="button button-outline"><ArrowLeft size={18}/>Back to the edit</Link></main>
}
