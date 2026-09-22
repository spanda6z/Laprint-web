import Link from "next/link";
import { terminalNav } from "@/lib/terminal";
import WalletStatus from "./WalletStatus";

export default function TerminalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070707] text-[#f4f4f0]">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-white/10 bg-[#080808] p-5 md:block">
        <Link href="/" className="text-lg font-bold">La😂Print</Link>
        <div className="mono mt-2 text-[9px] text-zinc-700">VELOCITY TERMINAL</div>
        <nav className="mt-10 space-y-1">
          {terminalNav.map(([label, href]) => (
            <Link key={label} href={href} className="block rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-white/5 hover:text-white">{label}</Link>
          ))}
        </nav>
      </aside>

      <main className="md:pl-60">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-[#070707]/90 px-5 backdrop-blur">
          <span className="text-sm font-semibold md:hidden">La😂Print</span>
          <span className="mono text-[10px] text-zinc-600">VELOCITY / MAINNET</span>
          <WalletStatus />
        </header>
        <div className="pb-24">{children}</div>
        <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-white/10 bg-[#080808]/95 md:hidden">
          {terminalNav.slice(0, 5).map(([label, href]) => (
            <Link key={label} href={href} className="py-3 text-center text-[10px] text-zinc-500">{label}</Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
