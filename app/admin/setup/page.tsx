import Link from "next/link";
import { ArrowLeft, WandSparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { bootstrapCreator } from "../actions";
import { canBootstrapCreator, getCreatorContext } from "@/lib/auth/creator";

export default async function SetupCreatorPage() {
  const context = await getCreatorContext();
  if (context.state === "ready") redirect("/admin");
  if (context.state === "unauthenticated" || context.state === "forbidden" || context.state === "unconfigured" || !canBootstrapCreator(context.email)) redirect("/admin");
  return <main className="admin-shell"><Link className="back-link" href="/admin"><ArrowLeft size={18}/>Back to Creator Studio</Link><section className="admin-card admin-card-wide"><WandSparkles size={26}/><p className="eyebrow">CREATOR SETUP</p><h1>Make the edit yours.</h1><p>Set the public name and handle once. You can refine the profile, disclosure, and social links later.</p><form action={bootstrapCreator} className="admin-form"><label>Display name<input name="displayName" required minLength={2} defaultValue="Sophiee"/></label><label>Store handle<input name="handle" required minLength={3} pattern="[a-z0-9_]+" defaultValue="sopheeeb"/></label><label>Short tagline<textarea name="tagline" placeholder="Fashion, home, beauty & the everyday."/></label><button className="button button-dark" type="submit">Create Creator Studio</button></form></section></main>;
}
