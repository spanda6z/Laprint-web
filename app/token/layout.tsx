import type { Metadata } from "next";
export const metadata: Metadata = { title: "Market intelligence", description: "Investigate price, liquidity, volume, transaction flow, social signals, and market evidence for a Solana token." };
export default function TokenLayout({ children }: { children: React.ReactNode }) { return children; }