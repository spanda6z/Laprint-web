import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Tier() {
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between"><Link href="/" className="text-sm text-[var(--muted)]">← La😂Print</Link><ThemeToggle/></div>
      <div className="mt-20 mono text-[10px] text-[var(--muted)]">STRATEGY / CHOOSE A MODE</div>
      <h1 className="mt-4 text-5xl font-semibold tracking-[-.05em]">Choose how you want to act.</h1>
      <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--muted)]">Exploration stays open. Strategy configuration is the point where your wallet becomes relevant.</p>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <Link href="/autopilot/spot" className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-7 hover:border-[var(--line-strong)]">
          <span className="mono text-[9px] text-[var(--muted)]">01 / SPOT</span>
          <h2 className="mt-12 text-2xl font-semibold">Spot Autopilot</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Configure Hunter or Rider rules for Solana spot markets. Your wallet signs the strategy authorization; unattended execution remains separately gated.</p>
          <div className="mt-8 text-sm font-semibold">Configure →</div>
        </Link>
        <Link href="/autopilot/setup?tier=leverage" className="rounded-3xl border border-[var(--line)] p-7 hover:border-[var(--line-strong)]">
          <span className="mono text-[9px] text-[var(--muted)]">02 / PERPS</span>
          <h2 className="mt-12 text-2xl font-semibold">Leverage</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Configure SOL-PERP leverage, position size, take profit and maximum loss through the Velocity account.</p>
          <div className="mt-8 text-sm font-semibold">Configure →</div>
        </Link>
      </div>
      <p className="mt-8 text-[10px] leading-5 text-[var(--muted)]">No strategy is presented as a guaranteed outcome. Execution remains subject to wallet authorization, market conditions, risk controls and backend availability.</p>
    </div>
  </main>;
}
