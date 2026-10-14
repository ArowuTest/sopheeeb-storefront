import Link from "next/link";
import { ArrowLeft, WandSparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { bootstrapCreator } from "../actions";
import { canBootstrapCreator, getCreatorContext } from "@/lib/auth/creator";

type SearchParams = { error?: string };

function noticeFor(error?: string) {
  if (error === "details") return "Please add a display name and a handle with at least 3 letters or numbers.";
  if (error === "handle") return "That handle is already in use. Choose a different handle for this Creator Studio.";
  if (error === "configuration") return "Creator Studio is not configured yet. Please contact the site owner.";
  if (error === "profile") return "We could not save the profile. Please try again; your entered details were not published.";
  if (error === "starter") return "Your profile was created, but the starter library needs one more step. Open Creator Studio and use the library setup action.";
  return null;
}

export default async function SetupCreatorPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const context = await getCreatorContext();
  if (context.state === "ready") redirect("/admin");
  if (context.state === "unauthenticated" || context.state === "forbidden" || context.state === "unconfigured" || !canBootstrapCreator(context.email)) redirect("/admin");
  const notice = noticeFor(params.error);
  return <main className="admin-shell"><Link className="back-link" href="/admin"><ArrowLeft size={18}/>Back to Creator Studio</Link><section className="admin-card admin-card-wide"><WandSparkles size={26}/><p className="eyebrow">CREATOR SETUP</p><h1>Make the edit yours.</h1><p>Set the public name and handle once. You can refine the profile, disclosure, and social links later.</p>{notice ? <p className="form-error" role="alert">{notice}</p> : null}<form action={bootstrapCreator} className="admin-form"><label>Display name<input name="displayName" required minLength={2} defaultValue="Sophiee"/></label><label>Store handle<input name="handle" required minLength={3} pattern="[a-z0-9_]+" defaultValue="sopheeeb"/><small>Lowercase letters, numbers, and underscores only.</small></label><label>Short tagline<textarea name="tagline" placeholder="Fashion, home, beauty & the everyday."/></label><button className="button button-dark" type="submit">Create Creator Studio</button></form></section></main>;
}
