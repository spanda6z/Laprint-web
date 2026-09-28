"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FlowMark from "@/components/FlowMark";
import ThemeToggle from "@/components/ThemeToggle";

type Token = {
  address: string; name: string; symbol: string; image: string | null; priceUsd: string | null;
  liquidityUsd: number; volume1h: number; volume24h: number; change1h: number; change24h: number;
  buys5m: number; sells5m: number; buys1h: number; sells1h: number; buys24h: number; sells24h: number;
  marketCap: number | null; promoted: boolean; createdAt?: number | null;
};

const money = (n: number) => n >= 1e9 ? "$" + (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? "$" + (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? "$" + (n / 1e3).toFixed(1) + "K" : "$" + n.toFixed(0);
const price = (v: string | null) => { if (!v) return "—"; const n = Number(v); if (!Number.isFinite(n)) return "—"; return n >= 1 ? "$" + n.toFixed(2) : n >= 0.01 ? "$" + n.toFixed(4) : "$" + n.toPrecision(4); };
const age = (createdAt?: number | null) => { if (!createdAt) return "—"; const mins = Math.max(1, Math.floor((Date.now() - createdAt) / 60000)); return mins < 60 ? mins + "m" : mins < 1440 ? Math.floor(mins / 60) + "h" : Math.floor(mins / 1440) + "d"; };

function Change({ value }: { value: number }) { return <span className={value >= 0 ? "text-emerald-500" : "text-red-500"}>{value >= 0 ? "+" : ""}{value.toFixed(1)}%</span>; }

function TokenRow({ token }: { token: Token }) {
  return <Link href={"/token?address=" + encodeURIComponent(token.address) + "&symbol=" + encodeURIComponent(token.symbol)} className="group grid grid-cols-[minmax(150px,1.5fr)_100px_90px_100px_100px_75px] items-center gap-3 border-t border-[var(--line)] px-4 py-4 text-sm transition hover:bg-[var(--panel)]">
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[10px] font-bold">{token.image ? <img src={token.image} alt="" className="h-full w-full object-cover" /> : token.symbol.slice(0, 2)}</div>
      <div className="min-w-0"><div className="truncate font-semibold">${"$"}{token.symbol}</div><div className="truncate text-[10px] text-[var(--muted)]">{token.name}</div></div>
    </div>
    <span>{price(token.priceUsd)}</span><Change value={token.change1h} /><span className="text-[var(--muted)]">{money(token.marketCap || 0)}</span><span className="text-[var(--muted)]">{money(token.liquidityUsd)}</span><span className="text-right text-[10px] text-[var(--muted)] group-hover:text-[var(--fg)]">View →</span>
  </Link>;
}

function MiniCard({ token }: { token: Token }) {
  return <Link href={"/token?address=" + encodeURIComponent(token.address) + "&symbol=" + encodeURIComponent(token.symbol)} className="block min-w-[250px] rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)]">
    <div className="flex items-start justify-between gap-3"><div><div className="font-semibold">${"$"}{token.symbol}</div><div className="mt-1 text-[10px] text-[var(--muted)]">{token.name}</div></div><Change value={token.change1h} /></div>
    <div className="mt-7 flex items-end justify-between"><div><div className="text-lg font-semibold">{price(token.priceUsd)}</div><div className="mt-1 text-[10px] text-[var(--muted)]">LIQ {money(token.liquidityUsd)}</div></div><div className="mono text-[8px] text-[var(--muted)]">FLOW</div></div>
  </Link>;
}

export default function Home() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try { const response = await fetch("/api/discovery", { cache: "no-store" }); const data = await response.json(); setTokens((data.tokens || []) as Token[]); }
    catch { setTokens([]); } finally { setLoading(false); }
  }

  useEffect(() => { void load(); const id = window.setInterval(load, 30000); return () => window.clearInterval(id); }, []);

  const trending = useMemo(() => [...tokens].sort((a, b) => (b.volume1h || 0) - (a.volume1h || 0)).slice(0, 6), [tokens]);
  const gainers = useMemo(() => [...tokens].sort((a, b) => b.change1h - a.change1h).slice(0, 5), [tokens]);
  const newPairs = useMemo(() => [...tokens].filter(t => t.createdAt).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5), [tokens]);
  const boosted = useMemo(() => tokens.filter(t => t.promoted).slice(0, 6), [tokens]);

  return <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-3"><FlowMark compact/><span className="font-semibold tracking-[-.05em]">FLOW</span></Link>
        <nav className="hidden items-center gap-6 text-xs text-[var(--muted)] lg:flex"><Link href="/discover" className="text-[var(--fg)]">Discover</Link><a href="#trending">Trending</a><a href="#boosted">Boosted</a><a href="#gold">Gold</a><a href="#new-pairs">New Pairs</a><a href="#gainers">Gainers</a></nav>
        <div className="flex items-center gap-2"><ThemeToggle/><Link href="/discover" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-[10px] font-semibold">Explore</Link></div>
      </div>
    </header>

    <section className="relative overflow-hidden border-b border-[var(--line)]">
      <div className="pointer-events-none absolute inset-0 opacity-60"><div className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-[var(--accent-soft)] blur-3xl"/><div className="absolute inset-0 bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_right,transparent,black_45%,black)]"/></div>
      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 md:px-8 md:pb-28 md:pt-28">
        <div className="max-w-4xl"><div className="mono text-[9px] uppercase tracking-[.22em] text-[var(--accent)]">Solana discovery layer</div><h1 className="mt-6 text-6xl font-semibold leading-[.88] tracking-[-.075em] md:text-9xl">Every move<br/><span className="text-[var(--accent)]">has a reason.</span></h1><p className="mt-8 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">Discover what is moving across Solana. Trending markets, boosted projects, premium Gold placements, new pairs and the intelligence behind the move.</p><div className="mt-9 flex flex-wrap gap-3"><a href="#trending" className="rounded-full bg-[var(--fg)] px-7 py-4 text-xs font-bold text-[var(--bg)]">Explore markets</a><a href="#promote" className="rounded-full border border-[var(--line-strong)] px-7 py-4 text-xs font-semibold">List your project</a></div><div className="mt-5 text-[10px] text-[var(--muted)]">No wallet needed to explore.</div></div>
      </div>
    </section>

    <section className="border-b border-[var(--line)]"><div className="mx-auto max-w-7xl overflow-x-auto px-5 md:px-8"><div className="flex min-w-max items-center gap-8 py-4 text-[9px] font-semibold uppercase tracking-[.16em] text-[var(--muted)]"><a href="#trending" className="text-[var(--fg)]">🔥 Trending</a><a href="#boosted">🚀 Boosted</a><a href="#gold">🥇 Gold</a><a href="#new-pairs">🆕 New Pairs</a><a href="#gainers">📈 Gainers</a><span>🐋 Flow</span></div></div></section>

    <section id="trending" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <div className="flex items-end justify-between gap-6"><div><div className="mono text-[9px] tracking-[.18em] text-[var(--accent)]">01 / MARKET ATTENTION</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.06em] md:text-6xl">🔥 Trending now.</h2><p className="mt-3 max-w-xl text-sm text-[var(--muted)]">The markets getting the most observable activity right now.</p></div><Link href="/discover" className="hidden text-xs font-semibold underline underline-offset-4 sm:block">View all →</Link></div>
      <div className="mt-10 overflow-hidden rounded-3xl border border-[var(--line)]">
        <div className="hidden grid-cols-[minmax(150px,1.5fr)_100px_90px_100px_100px_75px] gap-3 bg-[var(--panel)] px-4 py-3 text-[8px] uppercase tracking-[.16em] text-[var(--muted)] md:grid"><span>Token</span><span>Price</span><span>1H</span><span>Market Cap</span><span>Liquidity</span><span/></div>
        {loading && <div className="p-10 text-sm text-[var(--muted)]">Loading live markets…</div>}
        {!loading && trending.length === 0 && <div className="p-10 text-sm text-[var(--muted)]">No live markets available right now.</div>}
        {trending.map(token => <TokenRow key={token.address} token={token}/>)}
      </div>
    </section>

    <section id="boosted" className="border-y border-[var(--line)] bg-[var(--panel)]"><div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20"><div><div className="mono text-[9px] tracking-[.18em] text-[var(--accent)]">02 / PAID VISIBILITY</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.06em] md:text-6xl">🚀 Boosted.</h2><p className="mt-3 text-sm text-[var(--muted)]">Projects can pay for additional discovery visibility. Promotion never changes the Flow Score.</p></div><div className="mt-10 flex gap-4 overflow-x-auto pb-2">{boosted.length ? boosted.map(token => <MiniCard key={token.address} token={token}/>) : <div className="w-full rounded-3xl border border-dashed border-[var(--line-strong)] p-8"><div className="text-sm font-semibold">Be one of the first projects boosted on FLOW.</div><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">Reserve visibility in the discovery feed while keeping sponsored placement clearly separated from organic market intelligence.</p><a href="#promote" className="mt-5 inline-flex rounded-full bg-[var(--fg)] px-5 py-3 text-[10px] font-bold text-[var(--bg)]">Promote a project →</a></div>}</div></div></section>

    <section id="gold" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><div className="mono text-[9px] tracking-[.18em] text-[#b38b32]">03 / PREMIUM PLACEMENT</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.06em] md:text-6xl">🥇 Gold.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Premium featured real estate for projects that want a larger presence across FLOW.</p></div><a href="#promote" className="text-xs font-semibold underline underline-offset-4">Get Gold →</a></div><div className="mt-10 rounded-[2rem] border border-[#b38b32]/30 bg-[linear-gradient(135deg,rgba(179,139,50,.10),transparent_55%)] p-6 md:p-10"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><div className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#b38b32]">Gold · Sponsored</div><h3 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-.05em] md:text-5xl">Own the first impression.</h3><p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)]">A premium project card with branding, description, market context and a direct route to your project. Paid placement is always disclosed.</p></div><a href="#promote" className="rounded-full bg-[#b38b32] px-6 py-3 text-center text-xs font-bold text-black">Apply for Gold</a></div></div></section>

    <section id="new-pairs" className="border-y border-[var(--line)]"><div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20"><div><div className="mono text-[9px] tracking-[.18em] text-[var(--accent)]">04 / EARLY DISCOVERY</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.06em] md:text-6xl">🆕 New pairs.</h2><p className="mt-3 text-sm text-[var(--muted)]">Fresh markets entering the discovery layer.</p></div><div className="mt-10 grid gap-3 md:grid-cols-5">{newPairs.length ? newPairs.map(token => <MiniCard key={token.address} token={token}/>) : <div className="rounded-3xl border border-dashed border-[var(--line-strong)] p-8 text-sm text-[var(--muted)] md:col-span-5">No newly created markets available right now.</div>}</div></div></section>

    <section id="gainers" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20"><div><div className="mono text-[9px] tracking-[.18em] text-[var(--accent)]">05 / PRICE MOVEMENT</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.06em] md:text-6xl">📈 Gainers.</h2></div><div className="mt-10 grid gap-3 md:grid-cols-5">{gainers.map((token, index) => <Link key={token.address} href={"/token?address=" + encodeURIComponent(token.address) + "&symbol=" + encodeURIComponent(token.symbol)} className="rounded-2xl border border-[var(--line)] p-5 transition hover:-translate-y-0.5 hover:bg-[var(--panel)]"><div className="mono text-[8px] text-[var(--muted)]">0{index + 1}</div><div className="mt-8 font-semibold">${"$"}{token.symbol}</div><div className="mt-2 text-2xl font-semibold"><Change value={token.change1h}/></div><div className="mt-5 text-[10px] text-[var(--muted)]">LIQ {money(token.liquidityUsd)}</div></Link>)}</div></section>

    <section className="border-y border-[var(--line)]"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[.8fr_1.2fr] md:px-8 md:py-24"><div><div className="mono text-[9px] tracking-[.18em] text-[var(--accent)]">06 / INTELLIGENCE</div><h2 className="mt-5 text-5xl font-semibold tracking-[-.06em] md:text-7xl">You see the move.<br/><span className="text-[var(--muted)]">FLOW shows the reason.</span></h2></div><div><p className="max-w-xl text-base leading-7 text-[var(--muted)]">Open any market to inspect the evidence behind the move: volume, buy and sell activity, liquidity, holder concentration and other observable signals.</p><div className="mt-8 rounded-3xl border border-[var(--line)] p-6"><div className="mono text-[8px] text-[var(--muted)]">WHY IS IT MOVING?</div><div className="mt-6 space-y-4 text-sm"><div className="flex justify-between border-b border-[var(--line)] pb-4"><span>Volume</span><span className="text-emerald-500">↑ accelerating</span></div><div className="flex justify-between border-b border-[var(--line)] pb-4"><span>Buy flow</span><span className="text-emerald-500">↑ increasing</span></div><div className="flex justify-between border-b border-[var(--line)] pb-4"><span>Liquidity</span><span className="text-amber-500">thin</span></div><div className="flex justify-between"><span>Confidence</span><span>depends on available data</span></div></div></div></div></div></section>

    <section id="promote" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24"><div className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-7 md:p-12"><div className="max-w-3xl"><div className="mono text-[9px] tracking-[.18em] text-[var(--accent)]">FOR PROJECTS</div><h2 className="mt-5 text-5xl font-semibold tracking-[-.06em] md:text-7xl">Get discovered on FLOW.</h2><p className="mt-6 text-base leading-7 text-[var(--muted)]">Put your project in front of people actively exploring Solana. Choose a Boosted campaign or premium Gold placement. Sponsored visibility stays separate from independent market data.</p></div><div className="mt-10 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-[var(--line)] p-6"><div className="text-sm font-semibold">🚀 Boost</div><p className="mt-2 text-sm text-[var(--muted)]">Increase visibility in discovery surfaces.</p><button className="mt-6 rounded-full border border-[var(--line-strong)] px-4 py-2 text-[10px] font-semibold">Start Boost</button></div><div className="rounded-2xl border border-[#b38b32]/30 p-6"><div className="text-sm font-semibold">🥇 Gold</div><p className="mt-2 text-sm text-[var(--muted)]">Premium featured placement with richer project presentation.</p><button className="mt-6 rounded-full bg-[#b38b32] px-4 py-2 text-[10px] font-bold text-black">Get Gold</button></div><div className="rounded-2xl border border-[var(--line)] p-6"><div className="text-sm font-semibold">Custom</div><p className="mt-2 text-sm text-[var(--muted)]">Build a larger campaign around your launch or community.</p><button className="mt-6 rounded-full border border-[var(--line-strong)] px-4 py-2 text-[10px] font-semibold">Contact FLOW</button></div></div></div></section>

    <section className="border-t border-[var(--line)]"><div className="mx-auto max-w-7xl px-5 py-12 md:px-8"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-center"><div><div className="font-semibold">FLOW</div><div className="mt-1 text-sm text-[var(--muted)]">The Solana discovery layer.</div></div><div className="flex flex-wrap gap-5 text-[10px] text-[var(--muted)]"><Link href="/score">Methodology</Link><Link href="/discover">Discover</Link><Link href="/watch">Watchlist</Link><span>X</span><span>Telegram</span></div></div><div className="mt-8 border-t border-[var(--line)] pt-6 text-[10px] text-[var(--muted)]">Market information is informational only. Sponsored placement does not alter Flow Scores or independent market signals.</div></div></section>
  </main>;
}