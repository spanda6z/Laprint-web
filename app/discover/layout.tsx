import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover",
  description: "Explore live Solana markets by momentum, volume, activity, and newly created markets.",
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}