import type { Metadata } from "next";
export const metadata: Metadata = { title: "Trade", description: "Review a live Jupiter route and sign a Solana swap with your connected wallet.", robots: { index: false, follow: true } };
export default function TradeLayout({ children }: { children: React.ReactNode }) { return children; }