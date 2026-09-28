import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "FLOW — Why is it moving?",
  description: "Read why Solana tokens are moving. Explore live market flow, evidence, watchlists and Autopilot without a wallet.",
  metadataBase: new URL("https://flow.app"),
  openGraph: {
    title: "FLOW — Why is it moving?",
    description: "Solana market intelligence for understanding the flow behind every move.",
    type: "website",
    images: [{ url: "/opengraph-image" }],
    siteName: "FLOW",
  },
  twitter: {
    card: "summary_large_image",
    title: "FLOW — Why is it moving?",
    description: "Read why Solana tokens are moving.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;
}