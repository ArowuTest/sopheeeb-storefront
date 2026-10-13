"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SyncPublicPostsButton() {
  const { pending } = useFormStatus();
  return <button className="button button-dark" type="submit" disabled={pending} aria-disabled={pending}>
    {pending ? <LoaderCircle size={17} className="admin-spin" aria-hidden="true" /> : <RefreshCw size={17} aria-hidden="true" />}
    {pending ? "Checking TikTok…" : "Sync public posts"}
  </button>;
}
