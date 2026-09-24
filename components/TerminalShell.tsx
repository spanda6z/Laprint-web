import Link from "next/link";
import { terminalNav } from "@/lib/terminal";
import WalletStatus from "./WalletStatus";
import ThemeToggle from "./ThemeToggle";
import FlowMark from "./FlowMark";

const primary = new Set(["Discover","Watch","Autopilot","Trade"]);

export default function TerminalShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--line)] bg-[var(--bg)] p-5 md:block">
      <Link href="/" className="flex items-center gap-3"><FlowMark compact/><span className="text-lg font-semibold tracking-[-.04em]">FLOW</span></Link>
      <div className="mono mt-2 text-[9px] text-[var(--muted)]">SOLANA / MARKET INTELLIGENCE</div>

      <div className="mt-9">
        <div className="mono px-3 text-[8px] tracking-[.18em] text-[var(--muted)]">CORE</div>
        <nav className="mt-2 space-y-1">{terminalNav.filter(([label])=>primary.has(label)).map(([label,href])=><Link key={label} href={href} className="block rounded-xl px-3 py-2.5 text-sm text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--fg)]">{label}</Link>)}</nav>
      </div>

      <div className="mt-7">
        <div className="mono px-3 text-[8px] tracking-[.18em] text-[var(--muted)]">ACCOUNT</div>
        <nav className="mt-2 space-y-1">{terminalNav.filter(([label])=>!primary.has(label)).map(([label,href])=><Link key={label} href={href} className="block rounded-xl px-3 py-2 text-xs text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--fg)]">{label}</Link>)}</nav>
      </div>

      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3">
        <div className="flex items-center justify-between"><div className="mono text-[8px] text-[var(--muted)]">WALLET</div><span className="mono text-[7px] text-[var(--muted)]">OPTIONAL</span></div>
        <div className="mt-2"><WalletStatus/></div>
      </div>
    </aside>

    <main className="md:pl-64">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/90 px-5 backdrop-blur">
        <Link href="/discover" className="flex items-center gap-2 text-sm font-semibold md:hidden"><FlowMark compact/>FLOW</Link>
        <div className="hidden items-center gap-3 md:flex"><div className="mono text-[10px] text-[var(--muted)]">FLOW / MAINNET</div><span className="h-1 w-1 rounded-full bg-[var(--accent)]"/><span className="mono text-[8px] text-[var(--muted)]">MARKET DATA LIVE</span></div>
        <div className="flex items-center gap-2"><ThemeToggle/><div className="md:hidden"><WalletStatus/></div></div>
      </header>
      <div className="pb-24">{children}</div>
      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur md:hidden"><Link href="/discover" className="py-3 text-center text-[10px]">Discover</Link><Link href="/watch" className="py-3 text-center text-[10px]">Watch</Link><Link href="/autopilot" className="py-3 text-center text-[10px]">Auto</Link><Link href="/trade" className="py-3 text-center text-[10px]">Trade</Link></nav>
    </main>
  </div>;
}