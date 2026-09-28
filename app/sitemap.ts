import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) return [];
  const base = site.replace(/\/$/, "");
  const now = new Date();
  return [
    { url: base + "/", lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: base + "/discover", lastModified: now, changeFrequency: "always", priority: .95 },
    { url: base + "/watch", lastModified: now, changeFrequency: "hourly", priority: .7 },
    { url: base + "/autopilot", lastModified: now, changeFrequency: "daily", priority: .65 },
    { url: base + "/trade", lastModified: now, changeFrequency: "daily", priority: .6 },
  ];
}