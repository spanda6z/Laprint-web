import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import FlowMark from "@/components/FlowMark";

const features = [
  {k:"01", title:"DISCOVER", body:"Find markets changing now across price, volume, liquidity and transaction flow.", href:"/discover"},
  {k:"02", title:"UNDERSTAND", body:"Open a market and trace the evidence behind the move instead of relying on a single number.", href:"/discover"},
  {k:"03", title:"WATCH", body:"Build a personal radar and keep important markets close without connecting a wallet.", href:"/watch"},
  {k:"04", title:"ACT", body:"Trade manually or activate Autopilot only when you decide it is time to act.", href:"/autopilot"},
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="flex items-center gap-3"><FlowMark /><span className="tracking-[-.04em] text-lg font-semibold">FLOW</span></Link>
        <div className="flex items-center gap-3"><Link href="/discover" className="hidden text-sm font-medium text-[var(--muted)] transition hover:text-[var(--fg)] sm:block">Discover</Link><ThemeToggle/><Link href="/connect/fund" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-xs font-semibold transition hover:bg-[var(--panel)]">Connect</Link></div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="hero-art" aria-hidden="true"><div className="hero-flow"/></div>
        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-28">
          <div className="max-w-4xl">
            <div className="mono inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-[10px] uppercase tracking-[.20em] text-[var(--muted)] backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"/>Live Solana market intelligence</div>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[.94] tracking-[-.065em] md:text-8xl">See what&apos;s <span className="text-[var(--accent)]">moving.</span></h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">FLOW continuously tracks live Solana markets, helping you discover meaningful changes in price, volume, liquidity and trading flow. Open a market to investigate what is happening, watch it develop, or connect your wallet when you&apos;re ready to trade.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/discover" className="rounded-full bg-[var(--fg)] px-7 py-4 text-center text-sm font-bold text-[var(--bg)] shadow-sm transition hover:-translate-y-0.5">Explore markets</Link><Link href="/autopilot" className="rounded-full border border-[var(--line-strong)] bg-[var(--bg)]/70 px-7 py-4 text-center text-sm font-semibold backdrop-blur transition hover:bg-[var(--panel)]">See Autopilot</Link></div>
          </div>

          <div className="mt-20 overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg)]/75 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4 md:px-6"><div><div className="mono text-[8px] tracking-[.18em] text-[var(--muted)]">FLOW / DISCOVER</div><div className="mt-1 text-sm font-semibold">A live map of market movement</div></div><div className="mono flex items-center gap-2 text-[8px] text-[var(--muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"/>LIVE DATA</div></div>
            <div className="grid md:grid-cols-[1.1fr_.9fr]">
              <div className="border-b border-[var(--line)] p-5 md:border-b-0 md:border-r md:p-7">
                <div className="flex items-center justify-between"><span className="mono text-[8px] text-[var(--muted)]">MARKET PULSE</span><span className="mono text-[8px] text-[var(--muted)]">CURRENT FEED</span></div>
                <div className="mt-6 space-y-4">
                  {["Trending markets","Active buy flow","Volume acceleration","Recently created"].map((label,i)=><div key={label} className="border-t border-[var(--line)] pt-4 first:border-t-0 first:pt-0"><div className="flex items-center justify-between text-xs"><span>{label}</span><span className="text-[var(--muted)]">Explore →</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-[var(--fg)]" style={{width:(92-i*16)+"%"}}/></div></div>)}
                </div>
              </div>
              <div className="p-5 md:p-7">
                <div className="mono text-[8px] text-[var(--muted)]">TOKEN INTELLIGENCE</div>
                <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
                  <div className="flex items-center justify-between"><div><div className="text-sm font-semibold">Open any market</div><div className="mt-1 text-[10px] text-[var(--muted)]">Price · Flow · Volume · Liquidity</div></div><FlowMark compact/></div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {["Why it’s moving","Event timeline","Social signals","Holder activity"].map(x=><div key={x} className="rounded-xl border border-[var(--line)] px-3 py-3 text-[9px] text-[var(--muted)]">{x}</div>)}
                  </div>
                  <div className="mt-4 text-[9px] leading-5 text-[var(--muted)]">Every signal is tied to available market evidence. Missing data stays unavailable.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-[var(--muted)]"><span>NO WALLET REQUIRED TO EXPLORE</span><span>•</span><span>LIVE MARKET DATA</span><span>•</span><span>TRACEABLE SIGNALS</span></div>
        </div>
      </section>

      <section className="border-y border-[var(--line)]">
        <div className="mx-auto grid max-w-7xl md:grid-cols-2">
          <div className="border-b border-[var(--line)] px-5 py-16 md:border-b-0 md:border-r md:px-8 md:py-24"><div className="mono text-[9px] tracking-[.18em] text-[var(--accent)]">THE IDEA</div><h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-[-.05em] md:text-6xl">Don&apos;t just watch price. <span className="text-[var(--muted)]">Read the market.</span></h2></div>
          <div className="px-5 py-16 md:px-12 md:py-24"><p className="max-w-lg text-base leading-7 text-[var(--muted)]">A price move is only the beginning. FLOW brings the surrounding market context into one place so you can investigate what changed, compare supporting signals and decide what to do next.</p><div className="mt-10 border-t border-[var(--line)] pt-6"><div className="mono text-[9px] text-[var(--muted)]">PRODUCT LOOP</div><div className="mt-4 flex flex-wrap gap-2">{["Discover","Investigate","Watch","Trade","Monitor","Return"].map((x,i)=><span key={x} className="rounded-full border border-[var(--line-strong)] px-3 py-2 text-[10px]">{String(i+1).padStart(2,"0")} {x}</span>)}</div></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="mono text-[9px] tracking-[.18em] text-[var(--accent)]">THE PRODUCT</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] md:text-6xl">Four layers. One flow.</h2></div><p className="max-w-md text-sm leading-6 text-[var(--muted)]">The interface stays simple while the underlying product gives you progressively deeper context.</p></div>
        <div className="mt-12 grid border-l border-t border-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {features.map(f=><Link key={f.k} href={f.href} className="group min-h-[240px] border-b border-r border-[var(--line)] p-6 transition hover:bg-[var(--panel)] md:p-7"><div className="mono text-[9px] text-[var(--accent)]">{f.k}</div><h3 className="mt-14 text-sm font-semibold tracking-[.08em]">{f.title}</h3><p className="mt-4 text-sm leading-6 text-[var(--muted)]">{f.body}</p><div className="mt-6 text-[10px] text-[var(--muted)] transition group-hover:text-[var(--fg)]">Open {f.title.toLowerCase()} →</div></Link>)}
        </div>
      </section>

      <section className="border-y border-[var(--line)]">
        <div className="mx-auto grid max-w-7xl md:grid-cols-[.8fr_1.2fr]">
          <div className="border-b border-[var(--line)] px-5 py-14 md:border-b-0 md:border-r md:px-8 md:py-20"><div className="mono text-[9px] text-[var(--accent)]">WHEN YOU&apos;RE READY</div><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] md:text-5xl">The wallet can wait.</h2></div>
          <div className="px-5 py-14 md:px-12 md:py-20"><p className="max-w-xl text-base leading-7 text-[var(--muted)]">Explore first. Connect only when an action actually requires it. Trading, live Autopilot and wallet-specific positions stay behind an explicit wallet action.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/discover" className="rounded-full bg-[var(--fg)] px-6 py-3 text-center text-xs font-bold text-[var(--bg)]">Start exploring</Link><Link href="/autopilot" className="rounded-full border border-[var(--line-strong)] px-6 py-3 text-center text-xs font-semibold">Explore Autopilot</Link></div></div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-[10px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between md:px-8"><div className="flex items-center gap-2"><FlowMark compact/><span>FLOW · SOLANA MARKET INTELLIGENCE</span></div><div>Market data is informational. No token appearance is a recommendation or guarantee.</div></footer>
    </main>
  );
}