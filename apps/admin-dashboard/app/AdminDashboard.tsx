"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { type LiveData, type MarketEntry, type MarketResponse, loadAdminData, number, text } from "../lib/api";

const navItems = ["Overview", "Farmers", "Buyers", "Crop plans", "Predictions", "Market prices", "AI monitoring", "Audit log"];
export function AdminDashboard() {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [section, setSection] = useState("Overview");
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const live = await loadAdminData();
      setData(live);
      if (live.errors.length) setError(live.errors.join(" | "));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load AgriLanka services.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem("smartcrop-admin-theme");
    const frame = requestAnimationFrame(() =>
      setDark(saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => void refresh());
    return () => cancelAnimationFrame(frame);
  }, [refresh]);
  const toggleTheme = () => setDark((value) => {
    localStorage.setItem("smartcrop-admin-theme", value ? "light" : "dark");
    return !value;
  });
  const metrics = [
    { label: "Registered farmers", value: data ? String(data.farmers.length) : "—", delta: "Firestore", tone: "green", icon: "♟" },
    { label: "Registered buyers", value: data ? String(data.buyers.length) : "—", delta: "Firestore", tone: "blue", icon: "◈" },
    { label: "Active crop plans", value: data ? String(data.cropPlans.filter((plan) => text(plan, "status").toLowerCase() === "active").length) : "—", delta: "Live plans", tone: "amber", icon: "◫" },
    { label: "Live market entries", value: data ? String(data.market.entries?.length ?? 0) : "—", delta: "HARTI", tone: "violet", icon: "✦" },
  ];
  const liveRecords = useMemo(() => buildRecords(data), [data]);
  const recentActivity = useMemo(() => buildActivity(data), [data]);
  const marketEntries = (data?.market.entries ?? []).slice(0, 6).map(parseMarketEntry);

  return <div className={dark ? "admin-app dark" : "admin-app"}>
    <aside className={menuOpen ? "sidebar open" : "sidebar"}>
      <div className="brand"><span className="brand-mark"><Image src="/agrilanka-logo.png" alt="" width={42} height={42} /></span><span>AgriLanka<small>ADMIN CONSOLE</small></span></div>
      <nav aria-label="Admin navigation">{navItems.map((item, index) => <button onClick={() => { setSection(item); setMenuOpen(false); }} className={section === item ? "nav-item active" : "nav-item"} key={item}><span>{["▦","♟","◈","◫","⌁","◉","✦","≡"][index]}</span>{item}</button>)}</nav>
      <div className="sidebar-foot"><span className="avatar">AD</span><span><strong>System Admin</strong><small>Super administrator</small></span><button aria-label="Sign out">↗</button></div>
    </aside>
    {menuOpen && <button className="scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    <main>
      <header><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation">☰</button><div><p className="eyebrow">AGRILANKA OPERATIONS</p><h1>{section === "Overview" ? "Good morning, Admin" : section}</h1><p>{section === "Overview" ? "Live information from AgriLanka services." : `Review AgriLanka ${section.toLowerCase()}.`}</p></div><div className="header-actions"><button onClick={refresh} aria-label="Refresh live data">↻</button><button onClick={toggleTheme} aria-label="Toggle color theme">{dark ? "☀" : "☾"}</button><span className={error ? "live service-error" : "live"}><i />{error ? "Service unavailable" : loading ? "Refreshing…" : "Live data"}</span></div></header>
      {error && <div className="error-banner" role="alert"><span>!</span><p><strong>Could not load real data</strong>{error}</p><button onClick={refresh}>Try again</button></div>}
      {section !== "Overview" ? (section === "Market prices" ? <MarketPricesView market={data?.market} loading={loading} onRefresh={refresh} /> : <ManagementView section={section} records={liveRecords} loadedAt={data?.loadedAt} loading={loading} />) : <>
      <section className="metrics" aria-label="Key metrics">{metrics.map((metric) => <article className="metric-card" key={metric.label}><div className={`metric-icon ${metric.tone}`}>{metric.icon}</div><div><p>{metric.label}</p><strong>{metric.value}</strong><span className={metric.tone}>{metric.delta}</span></div></article>)}</section>
      <section className="dashboard-grid">
        <article className="panel demand-panel"><div className="panel-heading"><div><span className="section-label">LIVE HARTI FEED</span><h2>Current market snapshot</h2><p className="snapshot-subtitle">Wholesale price range per kg</p></div><button className="snapshot-view-all" onClick={() => setSection("Market prices")}>View all <span>→</span></button></div><div className="snapshot-market-head"><span>Commodity</span><span>Pettah</span><span>Marandagahamula</span></div><div className="market-snapshot">{marketEntries.length ? marketEntries.map((entry, index) => <button className="market-live-row" key={`${entry.name}-${index}`} onClick={() => setSection("Market prices")}><span className={`product-avatar ${entry.category}`}>{entry.name.slice(0,1)}</span><span className="snapshot-product"><strong>{entry.name.replace(/\s*-\s*$/, "")}</strong><small>{categoryInfo[entry.category].label} · Row {entry.rowNumber ?? "—"}</small></span><span className="snapshot-quote"><strong>{entry.pettah ? `Rs. ${formatPrice(entry.pettah.average)}` : "—"}</strong><small>{entry.pettah ? `${formatPrice(entry.pettah.low)}–${formatPrice(entry.pettah.high)}` : "Not quoted"}</small></span><span className="snapshot-quote"><strong>{entry.marandagahamula ? `Rs. ${formatPrice(entry.marandagahamula.average)}` : "—"}</strong><small>{entry.marandagahamula ? `${formatPrice(entry.marandagahamula.low)}–${formatPrice(entry.marandagahamula.high)}` : "Not quoted"}</small></span><span className="row-arrow">›</span></button>) : <Empty message={loading ? "Loading HARTI prices…" : "No live market entries returned."} />}</div><div className="insight"><span>ⓘ</span><p><strong>{data?.market.success ? "Live source connected" : "Source status"}</strong>{data?.market.bulletinDate ? `Showing HARTI bulletin dated ${data.market.bulletinDate}. Select View all for every commodity and bulletin details.` : "Waiting for HARTI bulletin metadata."}</p></div></article>
        <article className="panel health-panel"><div className="panel-heading"><div><span className="section-label">INFRASTRUCTURE</span><h2>System health</h2></div><span className={error ? "healthy unhealthy" : "healthy"}>● {error ? "Unavailable" : "Connected"}</span></div>{[["Spring API", data?.springHealth.status === "ok" ? "Operational" : "Unavailable", "REST + Firestore"],["AI service", data?.agentHealth.status === "ok" ? "Operational" : "Unavailable", data?.agentHealth.service ?? "FastAPI"],["LLM", data?.agentHealth.llm?.enabled ? "Configured" : "Not configured", data?.agentHealth.llm?.provider ?? "No provider"],["HARTI feed", data?.market.success ? "Updated" : "Unavailable", data?.market.fetchedAt ? new Date(data.market.fetchedAt).toLocaleString() : "No timestamp"],["Price model", data?.priceModel.ready ? "Ready" : "Collecting data", data?.priceModel.trainedAt ? `MAE Rs. ${data.priceModel.validationMae ?? "—"} · ${new Date(data.priceModel.trainedAt).toLocaleDateString()}` : "Waiting for enough archived bulletins"]].map(([name,status,detail],i) => <div className="health-row" key={name}><span className={`service-icon s${i}`}>{["S","✦","L","H","P"][i]}</span><span><strong>{name}</strong><small>{detail}</small></span><em><i />{status}</em></div>)}<button className="outline-button" onClick={refresh}>Refresh health checks</button></article>
      </section>
      <section className="bottom-grid"><article className="panel activity-panel"><div className="panel-heading"><div><span className="section-label">FIRESTORE ACTIVITY</span><h2>Recent records</h2></div></div>{recentActivity.length ? recentActivity.map((item) => <div className="activity-row" key={`${item.title}-${item.detail}`}><i className={item.tone}/><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{item.time}</time></div>) : <Empty message={loading ? "Loading recent records…" : "No recent records available."} />}</article><article className="panel attention-panel"><div className="panel-heading"><div><span className="section-label">DATA STATUS</span><h2>Collection coverage</h2></div><span className="queue-count">{data ? Object.values(liveRecords).reduce((sum, record) => sum + record.rows.length, 0) : 0}</span></div>{[["Farmers", data?.farmers.length ?? 0],["Buyers", data?.buyers.length ?? 0],["Crop plans", data?.cropPlans.length ?? 0],["Predictions", data?.predictions.length ?? 0]].map(([name,count]) => <div className="queue-card green" key={name}><span>✓</span><p><strong>{name}</strong><small>{count} live records</small></p><button onClick={() => setSection(String(name))}>Open</button></div>)}</article></section>
      </>}
    </main>
  </div>;
}

type TableRecord = { headers: string[]; rows: string[][] };

function buildRecords(data: LiveData | null): Record<string, TableRecord> {
  const empty = (headers: string[]): TableRecord => ({ headers, rows: [] });
  if (!data) return {
    Farmers: empty(["Farmer", "Farmer code", "Region", "Land", "Created"]),
    Buyers: empty(["Buyer", "Buyer code", "Organisation", "Region", "Created"]),
    "Crop plans": empty(["Plan", "Farmer", "Crop", "Season", "Area", "Status"]),
    Predictions: empty(["Request", "Farmer", "Crop", "Predicted yield", "Unit", "Created"]),
    "Market prices": empty(["Commodity", "Current price", "Bulletin row", "Source", "Status"]),
    "AI monitoring": empty(["Service", "Provider", "Mode", "Integration", "Status"]),
    "Audit log": empty(["Record", "Collection", "Created", "Source", "Status"]),
  };
  return {
    Farmers: { headers: ["Farmer", "Farmer code", "Region", "Land", "Created"], rows: data.farmers.map((item) => [text(item,"full_name","fullName","name"), text(item,"farmer_code","farmerCode"), text(item,"region"), `${number(item,"total_land_area","totalLandArea")} ha`, formatDate(item.created_at)]) },
    Buyers: { headers: ["Buyer", "Buyer code", "Organisation", "Region", "Created"], rows: data.buyers.map((item) => [text(item,"full_name","fullName","name"), text(item,"buyer_code","buyerCode"), text(item,"organization_name","organizationName","buyer_type"), text(item,"region"), formatDate(item.created_at)]) },
    "Crop plans": { headers: ["Plan", "Farmer", "Crop", "Season", "Area", "Status"], rows: data.cropPlans.map((item) => [text(item,"id"), text(item,"farmerId","farmer_id"), text(item,"cropName","cropId"), text(item,"season"), `${number(item,"cultivatedArea")} ha`, text(item,"status")]) },
    Predictions: { headers: ["Request", "Farmer", "Crop", "Predicted yield", "Unit", "Created"], rows: data.predictions.map((item) => [text(item,"id"), text(item,"farmer","farmer_id"), text(item,"crop_type","cropType"), text(item,"predicted_yield","predictedYield"), text(item,"unit"), formatDate(item.created_at)]) },
    "Market prices": { headers: ["Commodity", "Current price", "Bulletin row", "Source", "Status"], rows: (data.market.entries ?? []).map((item) => [item.cropName || "—", item.displayPrice || item.prices?.join(" · ") || "—", String(item.rowNumber ?? "—"), "HARTI", data.market.success ? "Live" : "Unavailable"]) },
    "AI monitoring": { headers: ["Service", "Provider", "Mode", "Integration", "Status"], rows: [[data.agentHealth.service ?? "AgriLanka AI", data.agentHealth.llm?.provider ?? "—", data.agentHealth.demoMode ? "Demo" : "Production", neo4jStatus(data.agentHealth.neo4j), data.agentHealth.status ?? "Unavailable"], ["HARTI price forecast", "Random Forest", `${data.priceModel.observations ?? 0} observations`, data.priceModel.latestBulletinDate ?? "No bulletin", data.priceModel.ready ? "Ready" : "Collecting data"]] },
    "Audit log": { headers: ["Record", "Collection", "Created", "Source", "Status"], rows: [...data.farmers.map((item) => [text(item,"id"),"farmers",formatDate(item.created_at),"Firestore","Recorded"]), ...data.buyers.map((item) => [text(item,"id"),"buyers",formatDate(item.created_at),"Firestore","Recorded"]), ...data.cropPlans.map((item) => [text(item,"id"),"cropPlans",formatDate(item.createdAt),"Firestore",text(item,"status")])].sort((a,b) => b[2].localeCompare(a[2])) },
  };
}

function buildActivity(data: LiveData | null) {
  if (!data) return [];
  const items = [
    ...data.farmers.map((item) => ({ title: "Farmer record", detail: `${text(item,"full_name","fullName")} · ${text(item,"region")}`, time: formatDate(item.created_at), tone: "green" })),
    ...data.buyers.map((item) => ({ title: "Buyer record", detail: `${text(item,"full_name","fullName")} · ${text(item,"region")}`, time: formatDate(item.created_at), tone: "blue" })),
    ...data.cropPlans.map((item) => ({ title: "Crop plan", detail: `${text(item,"cropName","cropId")} · ${text(item,"district","location")}`, time: formatDate(item.createdAt), tone: "amber" })),
    ...data.predictions.map((item) => ({ title: "Yield prediction", detail: `${text(item,"crop_type","cropType")} · ${text(item,"farmer")}`, time: formatDate(item.created_at), tone: "violet" })),
  ];
  return items.slice(0, 6);
}

function formatDate(value: unknown): string {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function neo4jStatus(value: LiveData["agentHealth"]["neo4j"]): string {
  if (typeof value === "string") return value;
  if (value?.connected) return "Connected";
  return value?.status ?? "Unavailable";
}

function Empty({ message }: { message: string }) {
  return <div className="empty-live">{message}</div>;
}

type MarketKey = "pettah" | "marandagahamula";
type CategoryKey = "all" | "grains" | "vegetables" | "fruits" | "other";
type Quote = { low: number; high: number; average: number };
type ParsedMarketEntry = MarketEntry & { name: string; category: Exclude<CategoryKey, "all">; pettah?: Quote; marandagahamula?: Quote; average: number; low: number; high: number };
type AlertRule = { id: string; crop: string; market: MarketKey; direction: "above" | "below"; threshold: number };

const categoryInfo: Record<Exclude<CategoryKey, "all">, { label: string; icon: string }> = {
  grains: { label: "Rice & grains", icon: "◉" },
  vegetables: { label: "Vegetables", icon: "♧" },
  fruits: { label: "Fruits", icon: "●" },
  other: { label: "Other commodities", icon: "◇" },
};

function MarketPricesView({ market, loading, onRefresh }: { market?: MarketResponse; loading: boolean; onRefresh: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey>("all");
  const [sort, setSort] = useState("bulletin");
  const [marketKey, setMarketKey] = useState<MarketKey>("pettah");
  const [bulletinDate, setBulletinDate] = useState("");
  const [selected, setSelected] = useState<ParsedMarketEntry | null>(null);
  const [language, setLanguage] = useState<"en" | "si" | "ta">("en");
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertCrop, setAlertCrop] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("");
  const [alerts, setAlerts] = useState<AlertRule[]>(() => { try { return typeof window === "undefined" ? [] : JSON.parse(localStorage.getItem("smartcrop-market-alerts") ?? "[]") as AlertRule[]; } catch { return []; } });
  const bulletins = market?.bulletins ?? [];
  const bulletin = bulletins.find((item) => item.date === bulletinDate) ?? bulletins[0];
  const entries = useMemo(() => (bulletin?.entries?.length ? bulletin.entries : market?.entries ?? []).map(parseMarketEntry), [bulletin, market?.entries]);
  const filtered = useMemo(() => entries.filter((entry) => {
    const matchesCategory = category === "all" || entry.category === category;
    return matchesCategory && entry.name.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a, b) => sort === "highest" ? b.average - a.average : sort === "az" ? a.name.localeCompare(b.name) : (a.rowNumber ?? 0) - (b.rowNumber ?? 0)), [entries, category, query, sort]);
  const priced = filtered.filter((entry) => quoteFor(entry, marketKey));
  const averages = priced.map((entry) => quoteFor(entry, marketKey)!.average);
  const highest = priced.reduce<ParsedMarketEntry | null>((best, entry) => !best || quoteFor(entry, marketKey)!.average > quoteFor(best, marketKey)!.average ? entry : best, null);
  const lowest = priced.reduce<ParsedMarketEntry | null>((best, entry) => !best || quoteFor(entry, marketKey)!.average < quoteFor(best, marketKey)!.average ? entry : best, null);
  const categories: CategoryKey[] = ["all", "grains", "vegetables", "fruits", "other"];
  const grouped = (["grains", "vegetables", "fruits", "other"] as const).map((key) => ({ key, entries: filtered.filter((entry) => entry.category === key) })).filter((group) => group.entries.length);
  const bulletinUrl = bulletin?.url ?? market?.bulletinUrl ?? market?.sourceUrl;
  const previousBulletin = bulletins.find((item) => item.date && item.date < (bulletin?.date ?? "9999"));
  const previousEntries = useMemo(() => (previousBulletin?.entries ?? []).map(parseMarketEntry), [previousBulletin]);
  const recommendations = useMemo(() => entries.map((entry) => bestMarket(entry)).filter((item) => item.advantage > 0).sort((a, b) => b.advantage - a.advantage).slice(0, 4), [entries]);
  const copy = translations[language];
  const saveAlert = () => {
    const threshold = Number(alertThreshold); if (!alertCrop || !Number.isFinite(threshold) || threshold <= 0) return;
    const next = [...alerts, { id: `${Date.now()}`, crop: alertCrop, market: marketKey, direction: "above" as const, threshold }];
    setAlerts(next); localStorage.setItem("smartcrop-market-alerts", JSON.stringify(next)); setAlertThreshold("");
  };
  const removeAlert = (id: string) => { const next = alerts.filter((item) => item.id !== id); setAlerts(next); localStorage.setItem("smartcrop-market-alerts", JSON.stringify(next)); };
  const exportCsv = () => downloadMarketCsv(filtered, marketKey, bulletin?.date);

  return <section className="market-page">
    <article className="market-hero panel">
      <div><span className="market-live-pill"><i /> HARTI LIVE BULLETIN</span><h2>{copy.title}</h2><p>{copy.subtitle}</p></div>
      <div className="market-hero-actions"><button className="outline-button" onClick={() => setShowAlerts((value) => !value)}>♧ Alerts ({alerts.length})</button><button className="outline-button" onClick={exportCsv}>↓ CSV</button><button className="outline-button" onClick={() => window.print()}>Print / PDF</button><button className="outline-button" onClick={onRefresh}>↻ Refresh</button>{bulletinUrl && <a href={bulletinUrl} target="_blank" rel="noreferrer">Bulletin ↗</a>}</div>
    </article>
    <div className="market-capability-bar panel"><span><strong>{bulletins.filter((item) => item.success).length}</strong> archived bulletins</span><span><strong>{alerts.length}</strong> saved alerts</span><label>Language<select value={language} onChange={(event) => setLanguage(event.target.value as "en" | "si" | "ta")}><option value="en">English</option><option value="si">සිංහල</option><option value="ta">தமிழ்</option></select></label></div>
    {showAlerts && <article className="panel alert-builder"><div><span className="section-label">PRICE ALERTS</span><h3>Create a threshold alert</h3><p>Rules are saved on this admin device and evaluated against each live refresh.</p></div><select value={alertCrop} onChange={(event) => setAlertCrop(event.target.value)}><option value="">Select commodity</option>{entries.map((entry) => <option key={entry.name} value={entry.name}>{entry.name}</option>)}</select><label><span>Price above Rs.</span><input inputMode="decimal" value={alertThreshold} onChange={(event) => setAlertThreshold(event.target.value)} placeholder="500" /></label><button onClick={saveAlert}>Add alert</button>{alerts.length > 0 && <div className="alert-list">{alerts.map((alert) => { const current = entries.find((entry) => normalizeCrop(entry.name) === normalizeCrop(alert.crop)); const value = current ? quoteFor(current, alert.market)?.average : undefined; const triggered = value !== undefined && value > alert.threshold; return <span className={triggered ? "triggered" : ""} key={alert.id}><b>{triggered ? "!" : "✓"}</b>{alert.crop} above Rs. {alert.threshold} <small>{triggered ? `Triggered at Rs. ${formatPrice(value!)}` : "Monitoring"}</small><button onClick={() => removeAlert(alert.id)}>×</button></span>})}</div>}</article>}
    <div className="market-toolbar panel">
      <label className="market-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a crop or commodity…" /></label>
      {bulletins.length > 0 && <label className="market-select"><span>Bulletin</span><select value={bulletin?.date ?? ""} onChange={(event) => setBulletinDate(event.target.value)}>{bulletins.map((item, index) => <option key={`${item.date}-${index}`} value={item.date}>{item.label ?? item.date ?? `Bulletin ${index + 1}`}</option>)}</select></label>}
      <label className="market-select"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="bulletin">Bulletin order</option><option value="highest">Highest price</option><option value="az">A–Z</option></select></label>
    </div>
    <div className="market-switch" aria-label="Select wholesale market"><button className={marketKey === "pettah" ? "active" : ""} onClick={() => setMarketKey("pettah")}><span>Pettah</span><small>Colombo wholesale market</small></button><button className={marketKey === "marandagahamula" ? "active" : ""} onClick={() => setMarketKey("marandagahamula")}><span>Marandagahamula</span><small>Regional wholesale market</small></button></div>
    <section className="market-stats">
      <article><span>PRODUCTS FOUND</span><strong>{loading ? "—" : filtered.length}</strong><small>Matching the current filters</small></article>
      <article><span>AVERAGE PRICE</span><strong>{averages.length ? `Rs. ${Math.round(averages.reduce((sum, value) => sum + value, 0) / averages.length)}` : "—"}</strong><small>Per kg across visible products</small></article>
      <article><span>HIGHEST</span><strong>{highest ? `Rs. ${Math.round(quoteFor(highest, marketKey)!.average)}` : "—"}</strong><small>{highest?.name ?? "No quoted product"}</small></article>
      <article><span>LOWEST</span><strong>{lowest ? `Rs. ${Math.round(quoteFor(lowest, marketKey)!.average)}` : "—"}</strong><small>{lowest?.name ?? "No quoted product"}</small></article>
    </section>
    <section className="market-intelligence">
      <article className="panel archive-panel"><div className="panel-heading"><div><span className="section-label">BULLETIN ARCHIVE</span><h2>Recent editions</h2></div><span className="archive-count">{bulletins.filter((item) => item.success).length} stored</span></div><div className="archive-strip">{bulletins.filter((item) => item.success).slice(0, 8).map((item) => <button className={item.date === bulletin?.date ? "active" : ""} key={item.date} onClick={() => setBulletinDate(item.date ?? "")}><strong>{formatBulletinDate(item.date)}</strong><small>{item.entries?.length ?? 0} products</small></button>)}</div></article>
      <article className="panel recommendation-panel"><div className="panel-heading"><div><span className="section-label">BEST MARKET</span><h2>Top selling opportunities</h2></div></div>{recommendations.length ? recommendations.map((item) => <div className="recommendation-row" key={item.entry.name}><span className={`product-avatar ${item.entry.category}`}>{item.entry.name.slice(0,1)}</span><span><strong>{item.entry.name}</strong><small>Sell at {item.market}</small></span><b>+ Rs. {formatPrice(item.advantage)}<small>per kg</small></b></div>) : <Empty message="Both-market quotes are needed for recommendations." />}<p className="recommendation-note">Price-only recommendation. Transport cost and distance are not included.</p></article>
    </section>
    <div className="market-filter-row">{categories.map((key) => <button key={key} className={category === key ? "active" : ""} onClick={() => setCategory(key)}>{key === "all" ? "All products" : categoryInfo[key].label}<span>{key === "all" ? entries.length : entries.filter((entry) => entry.category === key).length}</span></button>)}</div>
    {loading && !entries.length ? <article className="panel market-empty"><Empty message="Loading the latest HARTI bulletin…" /></article> : grouped.length ? grouped.map((group) => <article className="panel market-category" key={group.key}>
      <header><span className={`category-symbol ${group.key}`}>{categoryInfo[group.key].icon}</span><div><h3>{categoryInfo[group.key].label}</h3><p>{group.entries.length} products in the current bulletin</p></div><span className="market-name-label">{marketKey === "pettah" ? "PETTAH PRICE" : "MARANDAGAHAMULA PRICE"}</span></header>
      <div className="market-product-grid">{group.entries.map((entry, index) => { const quote = quoteFor(entry, marketKey); const other = quoteFor(entry, marketKey === "pettah" ? "marandagahamula" : "pettah"); const prior = previousEntries.find((item) => normalizeCrop(item.name) === normalizeCrop(entry.name)); const change = priceChange(quote, prior ? quoteFor(prior, marketKey) : undefined); return <button className="market-product" key={`${entry.name}-${entry.rowNumber ?? index}`} onClick={() => setSelected(entry)}><span className={`product-avatar ${entry.category}`}>{entry.name.slice(0, 1).toUpperCase()}</span><span className="product-name"><strong>{entry.name}</strong><small>Bulletin row {entry.rowNumber ?? "—"}</small></span><span className="product-price"><strong>{quote ? `Rs. ${formatPrice(quote.average)}` : "Not quoted"}</strong><small>{quote ? `Range ${formatPrice(quote.low)}–${formatPrice(quote.high)}` : "No price for this market"}</small></span><span className={`product-compare ${change?.tone ?? ""}`}>{change ? <><strong>{change.label}</strong><small>vs previous</small></> : other ? <><strong>{priceDifference(quote, other)}</strong><small>vs other market</small></> : <><strong>—</strong><small>No comparison</small></>}</span><span className="row-arrow">›</span></button>})}</div>
    </article>) : <article className="panel market-empty"><Empty message="No commodities match your current search and filters." /></article>}
    <div className="table-note market-source-note"><span>ⓘ</span>Prices are parsed from the live HARTI bulletin. “Not quoted” means the source did not publish a usable value for that market.</div>
    {selected && <div className="market-modal-backdrop" role="button" tabIndex={0} aria-label="Close price details" onClick={(event) => { if (event.currentTarget === event.target) setSelected(null); }} onKeyDown={(event) => { if (event.key === "Escape" || event.key === "Enter") setSelected(null); }}><article className="market-detail" role="dialog" aria-modal="true" aria-label={`${selected.name} price details`}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close details">×</button><span className={`product-avatar large ${selected.category}`}>{selected.name.slice(0, 1)}</span><p className="section-label">{categoryInfo[selected.category].label}</p><h2>{selected.name}</h2><p className="detail-date">HARTI bulletin {bulletin?.date ?? market?.bulletinDate ?? "latest edition"} · Row {selected.rowNumber ?? "—"}</p><div className="detail-quotes"><MarketQuote label="Pettah" quote={selected.pettah} /><MarketQuote label="Marandagahamula" quote={selected.marandagahamula} /></div><PriceHistoryChart name={selected.name} bulletins={bulletins} marketKey={marketKey} />{selected.rawText && <div className="raw-bulletin"><span>ORIGINAL BULLETIN ROW</span><p>{selected.rawText}</p></div>}{bulletinUrl && <a className="detail-link" href={bulletinUrl} target="_blank" rel="noreferrer">View official bulletin ↗</a>}</article></div>}
  </section>;
}

function MarketQuote({ label, quote }: { label: string; quote?: Quote }) {
  return <article><span>{label}</span><strong>{quote ? `Rs. ${formatPrice(quote.average)}` : "Not quoted"}</strong><small>{quote ? `Low ${formatPrice(quote.low)} · High ${formatPrice(quote.high)}` : "No usable price in this bulletin"}</small></article>;
}

const translations = {
  en: { title: "Daily food commodity prices", subtitle: "Compare wholesale prices, trends, alerts, and archived HARTI bulletins." },
  si: { title: "දෛනික ආහාර ද්‍රව්‍ය මිල", subtitle: "තොග මිල, ප්‍රවණතා, ඇඟවීම් සහ HARTI වාර්තා සසඳන්න." },
  ta: { title: "தினசரி உணவுப் பொருள் விலைகள்", subtitle: "மொத்த விலைகள், போக்குகள், எச்சரிக்கைகள் மற்றும் HARTI அறிக்கைகளை ஒப்பிடுங்கள்." },
};

function PriceHistoryChart({ name, bulletins, marketKey }: { name: string; bulletins: NonNullable<MarketResponse["bulletins"]>; marketKey: MarketKey }) {
  const points = bulletins.filter((item) => item.success).map((item) => {
    const entry = (item.entries ?? []).map(parseMarketEntry).find((candidate) => normalizeCrop(candidate.name) === normalizeCrop(name));
    return { date: item.date ?? "", value: entry ? quoteFor(entry, marketKey)?.average : undefined };
  }).filter((point): point is { date: string; value: number } => point.value !== undefined).slice(0, 10).reverse();
  const max = Math.max(...points.map((point) => point.value), 1);
  return <section className="history-chart"><div><span>PRICE HISTORY</span><strong>{marketKey === "pettah" ? "Pettah" : "Marandagahamula"} · {points.length} editions</strong></div>{points.length > 1 ? <div className="history-bars">{points.map((point) => <span key={point.date}><i style={{ height: `${Math.max(12, point.value / max * 100)}%` }} /><b>Rs. {formatPrice(point.value)}</b><small>{point.date.slice(5)}</small></span>)}</div> : <p>More archived bulletins are required to draw a price trend.</p>}</section>;
}

function bestMarket(entry: ParsedMarketEntry) {
  const pettah = entry.pettah?.average ?? 0; const regional = entry.marandagahamula?.average ?? 0;
  return { entry, market: pettah >= regional ? "Pettah" : "Marandagahamula", advantage: pettah && regional ? Math.abs(pettah - regional) : 0 };
}

function priceChange(current?: Quote, previous?: Quote) {
  if (!current || !previous || previous.average === 0) return undefined;
  const percent = (current.average - previous.average) / previous.average * 100;
  return { label: `${percent > 0 ? "↑" : percent < 0 ? "↓" : "→"} ${Math.abs(percent).toFixed(1)}%`, tone: percent > 0 ? "price-up" : percent < 0 ? "price-down" : "" };
}

function normalizeCrop(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function formatBulletinDate(value?: string) { if (!value) return "Unknown date"; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

function downloadMarketCsv(entries: ParsedMarketEntry[], marketKey: MarketKey, date?: string) {
  const rows = [["Bulletin date", "Commodity", "Category", "Market", "Average (Rs/kg)", "Low", "High"], ...entries.map((entry) => { const quote = quoteFor(entry, marketKey); return [date ?? "", entry.name, categoryInfo[entry.category].label, marketKey === "pettah" ? "Pettah" : "Marandagahamula", quote?.average ?? "", quote?.low ?? "", quote?.high ?? ""]; })];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `harti-market-prices-${date ?? "latest"}.csv`; anchor.click(); URL.revokeObjectURL(url);
}

function parseMarketEntry(entry: MarketEntry): ParsedMarketEntry {
  const name = entry.cropName?.trim() || "Unnamed commodity";
  const source = entry.rawText || entry.prices?.join(" ") || entry.displayPrice || "";
  const values = [...source.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0])).filter((value) => Number.isFinite(value) && value > 0);
  const useful = values.length > 4 && values[0] === entry.rowNumber ? values.slice(1) : values;
  const midpoint = Math.ceil(useful.length / 2);
  const first = quoteFrom(useful.slice(0, midpoint));
  const second = quoteFrom(useful.slice(midpoint));
  const fallback = quoteFrom(useful);
  const quotes = first && second ? [first, second] : [fallback, undefined];
  const available = quotes.filter(Boolean) as Quote[];
  return { ...entry, name, category: detectCategory(name), pettah: quotes[0], marandagahamula: quotes[1], average: available.length ? available.reduce((sum, quote) => sum + quote.average, 0) / available.length : 0, low: available.length ? Math.min(...available.map((quote) => quote.low)) : 0, high: available.length ? Math.max(...available.map((quote) => quote.high)) : 0 };
}

function quoteFrom(values: number[]): Quote | undefined {
  if (!values.length) return undefined;
  const prices = values.slice(0, 2);
  const low = Math.min(...prices); const high = Math.max(...prices);
  return { low, high, average: (low + high) / 2 };
}

function detectCategory(name: string): Exclude<CategoryKey, "all"> {
  const value = name.toLowerCase();
  if (/(rice|paddy|samba|nadu|kekulu|maize|gram|cowpea|soya|kurakkan|millet|dhal|sesame|groundnut|flour|sugar|wheat)/.test(value)) return "grains";
  if (/(beans|carrot|leek|beet|radish|cabbage|tomato|brinjal|capsicum|pumpkin|cucumber|gourd|drumstick|luffa|plantain|chilli|potato|manioc|eggplant|onion|kohl|dambala|thibbatu|murunga|kohila|spinach|ginger|garlic)/.test(value)) return "vegetables";
  if (/(banana|papaya|passion|pineapple|mango|woodapple|avocado|orange|lime|guava|rambutan|mangosteen|melon|grape|apple|beli|anoda|nelli|dates)/.test(value)) return "fruits";
  return "other";
}

function quoteFor(entry: ParsedMarketEntry, key: MarketKey) { return entry[key]; }
function formatPrice(value: number) { return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1); }
function priceDifference(current?: Quote, other?: Quote) {
  if (!current || !other) return "—";
  const difference = current.average - other.average;
  return `${difference > 0 ? "+" : ""}${formatPrice(difference)}`;
}

function ManagementView({ section, records, loadedAt, loading }: { section: string; records: Record<string, TableRecord>; loadedAt?: string; loading: boolean }) {
  const [query, setQuery] = useState("");
  const table = records[section] ?? records.Farmers;
  const filtered = table.rows.filter((row) => row.join(" ").toLowerCase().includes(query.toLowerCase()));
  return <section className="management"><div className="management-summary"><article><span>VISIBLE RECORDS</span><strong>{loading ? "—" : filtered.length}</strong><small>Current filtered result</small></article><article><span>DATA SOURCE</span><strong>{section === "AI monitoring" ? "Python AI" : section === "Market prices" ? "HARTI" : "Firestore"}</strong><small>Live read connection</small></article><article><span>LAST UPDATED</span><strong>{loadedAt ? new Date(loadedAt).toLocaleTimeString() : "—"}</strong><small>Manual refresh available</small></article></div><article className="panel table-panel"><div className="table-toolbar"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${section.toLowerCase()}…`} /></label></div><div className="table-wrap"><table><thead><tr>{table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{filtered.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, index) => <td key={`${cell}-${index}`}><span className={index === row.length - 1 ? `status ${cell.toLowerCase().replaceAll(" ", "-")}` : ""}>{cell}</span></td>)}</tr>)}</tbody></table>{!loading && !filtered.length && <Empty message="No records returned by this data source." />}</div><div className="table-note"><span>ⓘ</span>These values come directly from the configured SmartCrop services. No demonstration records are inserted.</div></article></section>;
}
