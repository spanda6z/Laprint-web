import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watch",
  description: "Keep interesting Solana markets close and monitor their live market flow.",
};

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return children;
}