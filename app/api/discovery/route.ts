import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Profile = {
  chainId?: string;
  tokenAddress?: string;
  icon?: string;
  description?: string | null;
  links?: Array<{ type?: string; label?: string; url?: string }>;
};

type Boost = Profile & {
  amount?: number;
  totalAmount?: number;
};

type Pair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string | null;
  priceNative?: string;
  txns?: Record<string, { buys?: number; sells?: number }>;
  volume?: Record<string, number>;
  priceChange?: Record<string, number>;
  liquidity?: { usd?: number; base?: number; quote?: number };
  fdv?: number | null;
  marketCap?: number | null;
  pairCreatedAt?: number | null;
  boosts?: { active?: number };
  info?: { imageUrl?: string };
};

const API = "https://api.dexscreener.com";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Discovery provider returned ${response.status}`);
  return response.json() as Promise<T>;
}

function uniqueAddresses(items: Array<Profile | Boost>) {
  return [...new Set(
    items
      .filter((item) => item.chainId === "solana" && item.tokenAddress)
      .map((item) => item.tokenAddress as string)
  )].slice(0, 30);
}

export async function GET() {
  try {
    const [profiles, boosts] = await Promise.all([
      getJson<Profile[]>(`${API}/token-profiles/latest/v1`),
      getJson<Boost[]>(`${API}/token-boosts/latest/v1`),
    ]);

    const solProfiles = profiles.filter((x) => x.chainId === "solana");
    const solBoosts = boosts.filter((x) => x.chainId === "solana");
    const addresses = uniqueAddresses([...solBoosts, ...solProfiles]);

    if (!addresses.length) {
      return NextResponse.json({ ok: true, source: "dexscreener", updatedAt: new Date().toISOString(), tokens: [] });
    }

    const pairs = await getJson<Pair[] | { pairs?: Pair[] }>(
      `${API}/tokens/v1/solana/${addresses.join(",")}`
    );
    const list = Array.isArray(pairs) ? pairs : pairs.pairs ?? [];

    const boostByAddress = new Map(
      solBoosts.map((x) => [x.tokenAddress, x])
    );
    const profileByAddress = new Map(
      solProfiles.map((x) => [x.tokenAddress, x])
    );

    const best = new Map<string, Pair>();
    for (const pair of list) {
      const address = pair.baseToken?.address;
      if (!address || pair.chainId !== "solana") continue;
      const current = best.get(address);
      if (!current || (pair.liquidity?.usd ?? 0) > (current.liquidity?.usd ?? 0)) {
        best.set(address, pair);
      }
    }

    const tokens = addresses.map((address) => {
      const pair = best.get(address);
      const boost = boostByAddress.get(address);
      const profile = profileByAddress.get(address);
      const m5 = pair?.txns?.m5 ?? {};
      const h1 = pair?.txns?.h1 ?? {};
      const h24 = pair?.txns?.h24 ?? {};
      const h24Change = pair?.priceChange?.h24 ?? 0;
      const h1Volume = pair?.volume?.h1 ?? 0;
      const h24Volume = pair?.volume?.h24 ?? 0;

      return {
        address,
        name: pair?.baseToken?.name ?? "Unknown token",
        symbol: pair?.baseToken?.symbol ?? "UNKNOWN",
        image: pair?.info?.imageUrl ?? profile?.icon ?? null,
        priceUsd: pair?.priceUsd ?? null,
        priceNative: pair?.priceNative ?? null,
        dex: pair?.dexId ?? null,
        pairUrl: pair?.url ?? null,
        liquidityUsd: pair?.liquidity?.usd ?? 0,
        marketCap: pair?.marketCap ?? pair?.fdv ?? null,
        volume1h: h1Volume,
        volume24h: h24Volume,
        change1h: pair?.priceChange?.h1 ?? 0,
        change24h: h24Change,
        buys5m: m5.buys ?? 0,
        sells5m: m5.sells ?? 0,
        buys1h: h1.buys ?? 0,
        sells1h: h1.sells ?? 0,
        buys24h: h24.buys ?? 0,
        sells24h: h24.sells ?? 0,
        boosts: boost?.totalAmount ?? pair?.boosts?.active ?? 0,
        promoted: Boolean(boost || profile),
        description: profile?.description ?? null,
        createdAt: pair?.pairCreatedAt ?? null,
      };
    });

    tokens.sort((a, b) => {
      const aScore = a.volume24h + a.liquidityUsd * 0.25 + a.boosts * 1000;
      const bScore = b.volume24h + b.liquidityUsd * 0.25 + b.boosts * 1000;
      return bScore - aScore;
    });

    return NextResponse.json({
      ok: true,
      source: "dexscreener",
      updatedAt: new Date().toISOString(),
      tokens,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Discovery service unavailable" },
      { status: 502 }
    );
  }
}
