import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="font-semibold tracking-tight">La😂Print <span className="text-[var(--muted)]">/ VELOCITY</span></Link>
        <div className="flex items-center gap-3">
          <Link href="/discover" className="hidden text-sm text-[var(--muted)] hover:text-[var(--fg)] sm:block">Discover</Link>
          <ThemeToggle />
          <Link href="/connect/fund" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-xs font-semibold hover:bg-[var(--panel)]">Connect</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-20 md:px-8 md:pb-24 md:pt-32">
        <div className="max-w-4xl">
          <div className="mono text-[10px] uppercase tracking-[.22em] text-[var(--muted)]">Solana market discovery</div>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-.055em] md:text-8xl">
            Discover what&apos;s moving.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
            Explore live Solana markets, follow the flow, investigate tokens and watch opportunities develop. Connect a wallet only when you&apos;re ready to act.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/discover" className="rounded-full bg-[var(--fg)] px-7 py-4 text-center text-sm font-bold text-[var(--bg)]">Explore the market</Link>
            <Link href="/autopilot" className="rounded-full border border-[var(--line-strong)] px-7 py-4 text-center text-sm font-semibold hover:bg-[var(--panel)]">See Autopilot</Link>
          </div>
        </div>

        <div className="mt-20 border-y border-[var(--line)] py-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <div><div className="mono text-[9px] text-[var(--muted)]">DISCOVER</div><p className="mt-2 text-sm">Trending, moving, new and high-volume markets.</p></div>
            <div><div className="mono text-[9px] text-[var(--muted)]">UNDERSTAND</div><p className="mt-2 text-sm">Price, liquidity, volume and transaction flow.</p></div>
            <div><div className="mono text-[9px] text-[var(--muted)]">ACT</div><p className="mt-2 text-sm">Trade manually or let Autopilot watch for you.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
