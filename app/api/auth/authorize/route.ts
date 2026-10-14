import { NextResponse } from "next/server";

import { isAllowedCreatorEmail } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  if (error || !(await isAllowedCreatorEmail(email))) {
    return NextResponse.json({ authorised: false }, { status: 403 });
  }

  return NextResponse.json({ authorised: true });
}
