import type { Metadata } from "next";
export const metadata: Metadata = { title: "Autopilot", description: "Monitor Solana markets with configurable FLOW automation and explicit wallet authorization.", robots: { index: false, follow: true } };
export default function AutopilotLayout({ children }: { children: React.ReactNode }) { return children; }