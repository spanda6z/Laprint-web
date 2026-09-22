import Link from "next/link";

export default function Tier() {
  return (
    <main className="min-h-screen bg-[#070707]">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/" className="text-sm text-zinc-500">← La😂Print</Link>
        <div className="mt-20 mono text-xs text-zinc-600">02 / STRATEGY</div>
        <h1 className="mt-4 text-5xl font-semibold">Choose your trading tier.</h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-500">
          Select how La😂Print should structure execution on your Velocity account. Nothing is simulated.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Link href="/autopilot/setup?tier=leverage" className="rounded-2xl border border-white/10 p-7 hover:bg-white/[.03]">
            <span className="mono text-xs text-zinc-600">01</span>
            <h2 className="mt-12 text-2xl font-semibold">Leverage</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Velocity perpetual markets with configurable leverage, collateral limits and live liquidation monitoring.
            </p>
          </Link>
          <Link href="/autopilot/setup?tier=spot" className="rounded-2xl border border-white/10 p-7 hover:bg-white/[.03]">
            <span className="mono text-xs text-zinc-600">02</span>
            <h2 className="mt-12 text-2xl font-semibold">Spot</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Spot execution without leverage or liquidation risk, using the supported Velocity spot markets.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
