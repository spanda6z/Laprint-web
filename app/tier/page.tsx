import Link from "next/link";

export default function Tier() {
  return (
    <main className="min-h-screen bg-[#070707]">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/" className="text-sm text-zinc-500">← La😂Print</Link>
        <div className="mt-20 mono text-xs text-zinc-600">02 / STRATEGY</div>
        <h1 className="mt-4 text-5xl font-semibold">Choose your trading tier.</h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-500">
          La😂Print currently automates Velocity perpetual trading. Spot balances and swaps are not presented as an automated execution tier.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Link href="/autopilot/setup?tier=leverage" className="rounded-2xl border border-white/10 p-7 hover:bg-white/[.03]">
            <span className="mono text-xs text-zinc-600">01</span>
            <h2 className="mt-12 text-2xl font-semibold">Leverage</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Configure SOL-PERP strategy, leverage, position size, take profit and maximum loss. Orders remain disabled until the production keeper is explicitly enabled.
            </p>
            <div className="mt-8 text-sm font-semibold">Configure →</div>
          </Link>

          <div className="rounded-2xl border border-white/5 p-7 opacity-50">
            <span className="mono text-xs text-zinc-700">02</span>
            <h2 className="mt-12 text-2xl font-semibold">Spot</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Spot execution is not enabled in the current automation path. This stays visible only to make the product boundary explicit.
            </p>
            <div className="mt-8 mono text-[10px] text-zinc-700">NOT AVAILABLE</div>
          </div>
        </div>
      </div>
    </main>
  );
}
