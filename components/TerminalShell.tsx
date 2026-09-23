import Link from "next/link";
import { terminalNav } from "@/lib/terminal";
import WalletStatus from "./WalletStatus";

export default function TerminalShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--line)] bg-[var(--bg)] p-5 md:block">
      <Link href="/" className="text-lg font-bold">La😂Print</Link>
      <div className="mono mt-2 text-[9px] text-[var(--muted)]">VELOCITY / SOLANA</div>
      <nav className="mt-10 space-y-1">{terminalNav.map(([label,href])=><Link key={label} href={href} className="block rounded-xl px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--fg)]">{label}</Link>)}</nav>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-[var(--line)] p-3"><div className="mono text-[8px] text-[var(--muted)]">WALLET</div><div className="mt-2"><WalletStatus/></div></div>
    </aside>
    <main className="md:pl-64"><header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/90 px-5 backdrop-blur"><Link href="/discover" className="text-sm font-semibold md:hidden">La😂Print</Link><div className="mono text-[10px] text-[var(--muted)]">VELOCITY / MAINNET</div><div className="md:hidden"><WalletStatus/></div></header><div className="pb-24">{children}</div>
      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur md:hidden"><Link href="/discover" className="py-3 text-center text-[10px]">Discover</Link><Link href="/watch" className="py-3 text-center text-[10px]">Watch</Link><Link href="/autopilot" className="py-3 text-center text-[10px]">Auto</Link><Link href="/connect/fund" className="py-3 text-center text-[10px]">Wallet</Link></nav>
    </main>
  </div>;
}