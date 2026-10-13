import Link from "next/link";
import { ArrowLeft, BarChart3, MousePointerClick } from "lucide-react";

import { requireCreator } from "@/lib/auth/creator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProductWithOffers = {
  id: string;
  title: string;
  product_offers: Array<{ id: string }> | null;
};

const sourceLabels: Record<string, string> = {
  direct: "On-site link",
  tiktok: "TikTok",
  instagram: "Instagram",
  newsletter: "Newsletter",
};

export default async function AnalyticsPage() {
  const context = await requireCreator();
  const supabase = await createServerSupabaseClient();
  const { data: productRows } = await supabase
    .from("products")
    .select("id,title,product_offers(id)")
    .eq("creator_id", context.profile.id);
  const products = (productRows ?? []) as ProductWithOffers[];
  const offerToProduct = new Map<string, { id: string; title: string }>();
  for (const product of products) {
    for (const offer of product.product_offers ?? []) offerToProduct.set(offer.id, { id: product.id, title: product.title });
  }
  const offerIds = [...offerToProduct.keys()];
  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - 30);
  const since = sinceDate.toISOString();
  const { data: clicks } = offerIds.length
    ? await supabase.from("outbound_clicks").select("offer_id,source,clicked_at").in("offer_id", offerIds).gte("clicked_at", since).order("clicked_at", { ascending: false })
    : { data: [] as Array<{ offer_id: string; source: string; clicked_at: string }> };
  const { count: allTimeClicks } = offerIds.length
    ? await supabase.from("outbound_clicks").select("id", { count: "exact", head: true }).in("offer_id", offerIds)
    : { count: 0 };
  const sourceCounts = new Map<string, number>();
  const productCounts = new Map<string, { title: string; clicks: number }>();
  for (const click of clicks ?? []) {
    sourceCounts.set(click.source, (sourceCounts.get(click.source) ?? 0) + 1);
    const product = offerToProduct.get(click.offer_id);
    if (product) {
      const current = productCounts.get(product.id) ?? { title: product.title, clicks: 0 };
      current.clicks += 1;
      productCounts.set(product.id, current);
    }
  }
  const topProducts = [...productCounts.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const totalClicks = (clicks ?? []).length;
  const today = new Date();
  const trendDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (6 - index));
    return { key: date.toISOString().slice(0, 10), label: date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }), clicks: 0 };
  });
  const trendMap = new Map(trendDays.map((day) => [day.key, day]));
  for (const click of clicks ?? []) {
    const day = trendMap.get(click.clicked_at.slice(0, 10));
    if (day) day.clicks += 1;
  }
  const trendMax = Math.max(1, ...trendDays.map((day) => day.clicks));

  return <main className="admin-shell">
    <Link className="back-link" href="/admin"><ArrowLeft size={18}/>Creator Studio</Link>
    <header className="admin-header"><div><p className="eyebrow">PRIVACY-FIRST ANALYTICS</p><h1>See what people<br/><em>choose next.</em></h1><p className="admin-lede">Only outbound Shop clicks are counted. No names, emails, cookies or browsing profiles are stored.</p></div><BarChart3 size={42}/></header>
    <section className="metric-grid"><div><span>Clicks / last 30 days</span><strong>{totalClicks}</strong></div><div><span>Products clicked</span><strong>{productCounts.size}</strong></div><div><span>Tracked sources</span><strong>{sourceCounts.size}</strong></div><div><span>All-time tracked clicks</span><strong>{allTimeClicks ?? 0}</strong></div></section>
    <section className="admin-card analytics-trend-card" aria-labelledby="analytics-trend-title"><div className="analytics-trend-heading"><div><p className="eyebrow">RECENT PULSE</p><h2 id="analytics-trend-title">The last seven days</h2></div><span>{totalClicks} tracked in the last 30 days</span></div><div className="analytics-trend" role="img" aria-label={`Outbound Shop clicks for the last seven days: ${trendDays.map((day) => `${day.label} ${day.clicks}`).join(", ")}`}>{trendDays.map((day) => <div className="analytics-trend-day" key={day.key}><div className="analytics-trend-bar-wrap"><span className="analytics-trend-bar" style={{ height: `${Math.max(day.clicks ? 12 : 4, (day.clicks / trendMax) * 100)}%` }} /></div><strong>{day.clicks}</strong><small>{day.label}</small></div>)}</div><p className="analytics-note">This is click activity, not TikTok Shop conversion data. TikTok does not expose purchase attribution through this storefront.</p></section>
    <section className="admin-two-column">
      <div className="admin-card"><p className="eyebrow">TOP FINDS</p><h2>Most clicked</h2>{topProducts.length ? <div className="analytics-list">{topProducts.map((product) => <div key={product.title}><span>{product.title}</span><strong>{product.clicks}</strong></div>)}</div> : <p>No outbound Shop clicks in the last 30 days.</p>}</div>
      <div className="admin-card"><p className="eyebrow">SOURCES</p><h2>Where clicks came from</h2>{sourceCounts.size ? <div className="analytics-list">{[...sourceCounts.entries()].sort((a, b) => b[1] - a[1]).map(([source, count]) => <div key={source}><span>{sourceLabels[source] ?? source}</span><strong>{count}</strong></div>)}</div> : <p>Source totals will appear after visitors use a verified Shop link.</p>}<p className="analytics-note"><MousePointerClick size={15}/> Counts are recorded only when a visitor follows a verified product redirect.</p></div>
    </section>
  </main>;
}
