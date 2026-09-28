export type FlowBand = "Healthy" | "Mixed" | "Fragile";
export type Confidence = "High" | "Medium" | "Low";
export type FlowToken = {
  symbol: string; name: string; priceUsd: string | null; change1h: number; change24h: number;
  liquidityUsd: number; volume1h: number; volume24h: number; buys5m: number; sells5m: number;
  buys1h: number; sells1h: number; buys24h?: number; sells24h?: number;
  holders?: number | null; mintAuthority?: string | null; freezeAuthority?: string | null;
};
export function flowScore(token: FlowToken) {
  const total5m = token.buys5m + token.sells5m;
  const buyPressure = total5m > 0 ? (token.buys5m / total5m) * 100 : null;
  const flowComponent = buyPressure == null ? 50 : Math.max(0, Math.min(100, buyPressure));
  const liquidityRatio = token.volume1h > 0 && token.liquidityUsd > 0 ? token.liquidityUsd / token.volume1h : null;
  const liquidityComponent = liquidityRatio == null ? null : Math.max(0, Math.min(100, liquidityRatio * 100));
  const volumeQuality = token.volume24h > 0 && token.volume1h > 0 ? Math.max(0, Math.min(100, (token.volume1h / token.volume24h) * 24 * 100)) : null;
  const available = [flowComponent, liquidityComponent, volumeQuality].filter((x): x is number => x != null && Number.isFinite(x));
  const raw = available.length ? available.reduce((sum, value) => sum + value, 0) / available.length : 0;
  let score = Math.round(Math.max(0, Math.min(100, raw)));
  const missing: string[] = [];
  if (token.holders == null) missing.push("holder spread");
  if (token.mintAuthority == null) missing.push("mint authority");
  if (token.freezeAuthority == null) missing.push("freeze authority");
  if (missing.length > 0) score = Math.min(score, 60);
  const confidence: Confidence = missing.length === 0 && available.length >= 3 ? "High" : missing.length <= 1 && available.length >= 3 ? "Medium" : "Low";
  const band: FlowBand = score >= 80 ? "Healthy" : score >= 50 ? "Mixed" : "Fragile";
  return { score, band, confidence, buyPressure, liquidityComponent, volumeQuality, missing };
}
export function bandClass(band: FlowBand) { return band === "Healthy" ? "text-emerald-500" : band === "Mixed" ? "text-amber-500" : "text-red-500"; }
