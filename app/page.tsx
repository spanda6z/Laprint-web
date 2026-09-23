import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="laprint-mark" aria-hidden="true">L😂</span>
          <span className="laprint-wordmark">La😂Print</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/discover" className="hidden text-sm font-medium text-[var(--muted)] transition hover:text-[var(--fg)] sm:block">Discover</Link>
          <ThemeToggle />
          <Link href="/connect/fund" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-xs font-semibold transition hover:bg-[var(--panel)]">Connect</Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="hero-art" aria-hidden="true"><div className="hero-flow" /></div>
        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-20 md:px-8 md:pb-32 md:pt-32">
          <div className="max-w-4xl">
            <div className="mono inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-[10px] uppercase tracking-[.20em] text-[var(--muted)] backdrop-blur">● Live Solana market discovery</div>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[.94] tracking-[-.065em] md:text-8xl">
              Discover what&apos;s <span className="text-[var(--accent)]">moving.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              Explore live Solana markets, follow the flow, investigate tokens and watch opportunities develop. Connect a wallet only when you&apos;re ready to act.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/discover" className="rounded-full bg-[var(--fg)] px-7 py-4 text-center text-sm font-bold text-[var(--bg)] shadow-sm transition hover:-translate-y-0.5">Explore the market</Link>
              <Link href="/autopilot" className="rounded-full border border-[var(--line-strong)] bg-[var(--bg)]/70 px-7 py-4 text-center text-sm font-semibold backdrop-blur transition hover:bg-[var(--panel)]">See Autopilot</Link>
            </div>
          </div>

          <div className="mt-24 border-y border-[var(--line)] py-5 backdrop-blur-sm">
            <div className="grid gap-5 sm:grid-cols-3">
              <div><div className="mono text-[9px] font-semibold tracking-[.18em] text-[var(--accent)]">01 / DISCOVER</div><p className="mt-2 text-sm">Trending, moving and high-volume markets.</p></div>
              <div><div className="mono text-[9px] font-semibold tracking-[.18em] text-[var(--accent)]">02 / UNDERSTAND</div><p className="mt-2 text-sm">Price, liquidity, volume and transaction flow.</p></div>
              <div><div className="mono text-[9px] font-semibold tracking-[.18em] text-[var(--accent)]">03 / ACT</div><p className="mt-2 text-sm">Trade manually or let Autopilot watch for you.</p></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
