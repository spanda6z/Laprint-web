import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FLOW — Solana Market Intelligence",
    short_name: "FLOW",
    description: "Discover live Solana markets, understand the flow, and act when you are ready.",
    start_url: "/discover",
    display: "standalone",
    background_color: "#070707",
    theme_color: "#070707",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}