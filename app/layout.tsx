import "./globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const metadataBase = siteUrl ? new URL(siteUrl) : undefined;

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
  title: {
    default: "FLOW — Solana Market Intelligence",
    template: "%s — FLOW",
  },
  description: "Discover live Solana markets, understand the flow, watch tokens and trade when you are ready.",
  applicationName: "FLOW",
  keywords: ["Solana", "market intelligence", "crypto markets", "meme coins", "token discovery"],
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    siteName: "FLOW",
    title: "FLOW — Solana Market Intelligence",
    description: "Discover live Solana markets, understand the flow, watch tokens and trade when you are ready.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "FLOW — Solana Market Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FLOW — Solana Market Intelligence",
    description: "Discover live Solana markets, understand the flow, watch tokens and trade when you are ready.",
    images: ["/twitter-image"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f5f1" }, { media: "(prefers-color-scheme: dark)", color: "#070707" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;
}