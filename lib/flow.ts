export type FlowBand = "Healthy" | "Mixed" | "Fragile";
export type Confidence = "High" | "Medium" | "Low" | "None";

export type FlowToken = {
  symbol: string;
  name: string;
  priceUsd: string | null;
  change1h: number;
  change24h: number;
  liquidityUsd: number;
  volume1h: number;
  volume24h: number;
  buys5m: number;
  sells5m: number;
  buys1h: number;
  sells1h: number;
  buys24h?: number;
  sells24h?: number;
  holders?: number | null;
  top10Pct?: number | null;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
};

export type FlowPart = {
  key: string;
  weight: number;
  value: number | null;
  pts: number;
};

export type FlowResult = {
  score: number | null;
  band: FlowBand | "Unavailable";
  confidence: Confidence;
  label: string;
  formulaVersion: "flow-v1";
  buyPressure: number | null;
  liquidityComponent: number | null;
  holderSpread: number | null;
  volumeQuality: number | null;
  riskComponent: number | null;
  cappedByRisk: boolean;
  missing: string[];
  parts: FlowPart[];
  causes: string[];
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function flowScore(token: FlowToken): FlowResult {
  const total = token.buys1h + token.sells1h;
  const buyPressure = total > 0 ? (token.buys1h / total) * 100 : null;

  // Liquidity depth: deeper liquidity relative to one-hour turnover receives
  // more credit, while extremely high ratios simply cap at 100.
  const liquidityRatio =
    token.liquidityUsd > 0 && token.volume1h > 0
      ? token.liquidityUsd / token.volume1h
      : null;
  const liquidityComponent =
    liquidityRatio == null ? null : clamp(liquidityRatio * 50);

  // Holder spread requires a real concentration measurement. We deliberately
  // do not infer it from holder count.
  const holderSpread =
    token.top10Pct == null ? null : clamp(((90 - token.top10Pct) / 70) * 100);

  // Volume quality rewards sustained turnover rather than one isolated spike.
  const volumeQuality =
    token.volume24h > 0 && token.volume1h > 0
      ? clamp((token.volume1h / token.volume24h) * 24 * 100)
      : null;

  const riskFlags = [
    token.mintAuthority ? "Mint authority active" : null,
    token.freezeAuthority ? "Freeze authority active" : null,
  ].filter(Boolean) as string[];

  const riskComponent = riskFlags.length === 0 ? 100 : 0;

  const inputs: Array<[string, number, number | null]> = [
    ["Buy vs sell flow", 30, buyPressure],
    ["Liquidity depth", 20, liquidityComponent],
    ["Holder spread", 20, holderSpread],
    ["Volume quality", 20, volumeQuality],
    ["Risk", 10, riskComponent],
  ];

  const missing = inputs
    .filter(([, , value]) => value == null)
    .map(([key]) => key);

  const availableWeight = inputs
    .filter(([, , value]) => value != null)
    .reduce((sum, [, weight]) => sum + weight, 0);

  if (availableWeight === 0) {
    return {
      score: null,
      band: "Unavailable",
      confidence: "None",
      label: "— · Unavailable · no confidence",
      formulaVersion: "flow-v1",
      buyPressure,
      liquidityComponent,
      holderSpread,
      volumeQuality,
      riskComponent,
      cappedByRisk: false,
      missing,
      parts: [],
      causes: [],
    };
  }

  const raw = inputs.reduce(
    (sum, [, weight, value]) =>
      sum + (value == null ? 0 : (value / 100) * weight),
    0,
  );
  let score = Math.round((raw / availableWeight) * 100);

  const cappedByRisk = riskFlags.length > 0;
  if (cappedByRisk) score = Math.min(score, 60);

  const band: FlowBand = score >= 80 ? "Healthy" : score >= 50 ? "Mixed" : "Fragile";

  const confidence: Confidence =
    missing.length === 0
      ? "High"
      : missing.length === 1
        ? "Medium"
        : "Low";

  const causes: string[] = [];
  if (buyPressure != null) {
    if (buyPressure >= 60) causes.push("Buy pressure is stronger than sell pressure");
    else if (buyPressure <= 40) causes.push("Sell pressure is stronger than buy pressure");
  }
  if (token.volume1h > 0 && token.volume24h > 0) {
    const hourlyShare = (token.volume1h / token.volume24h) * 24;
    if (hourlyShare >= 2) causes.push("Recent volume is elevated versus the 24H pace");
    else if (hourlyShare <= 0.5) causes.push("Recent volume is below the 24H pace");
  }
  if (liquidityComponent != null && liquidityComponent < 40) {
    causes.push("Liquidity is relatively thin");
  }
  if (riskFlags.length) causes.push(...riskFlags);
  if (!causes.length) causes.push("No dominant flow cause is available from the current data");

  const parts = inputs.map(([key, weight, value]) => ({
    key,
    weight,
    value,
    pts: value == null ? 0 : Math.round((value / 100) * weight),
  }));

  return {
    score,
    band,
    confidence,
    label: `${score} · ${band} · ${confidence.toLowerCase()} confidence`,
    formulaVersion: "flow-v1",
    buyPressure,
    liquidityComponent,
    holderSpread,
    volumeQuality,
    riskComponent,
    cappedByRisk,
    missing,
    parts,
    causes: causes.slice(0, 3),
  };
}

export function bandClass(band: FlowBand | "Unavailable") {
  return band === "Healthy"
    ? "text-emerald-500"
    : band === "Mixed"
      ? "text-amber-500"
      : band === "Fragile"
        ? "text-red-500"
        : "text-[var(--muted)]";
}
