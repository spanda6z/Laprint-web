import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Token = {
  address: string;
  symbol: string;
  name: string;
  priceUsd: string | null;
  change1h: number;
  volume24h: number;
  liquidityUsd: number;
  buys5m: number;
  sells5m: number;
  createdAt?: number | null;
};

type SocialSignal = {
  type?: string;
  postId?: string;
  text?: string;
  createdAt?: string | null;
  ageMinutes?: number | null;
  author?: { username?: string; name?: string } | null;
  url?: string | null;
};

function timeLabel(value: string | number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const address = (sp.get("address") || "").trim();
  const symbol = (sp.get("symbol") || "").trim();

  if (!address) {
    return NextResponse.json({ ok: true, events: [] });
  }

  try {
    const origin = new URL(req.url).origin;
    const [marketResponse, socialResponse] = await Promise.all([
      fetch(origin + "/api/discovery", { cache: "no-store" }),
      fetch(origin + "/api/social-signals?address=" + encodeURIComponent(address) + "&symbol=" + encodeURIComponent(symbol), { cache: "no-store" }),
    ]);

    const marketBody = await marketResponse.json();
    const socialBody = await socialResponse.json();
    const token = (marketBody.tokens || []).find((item: Token) => item.address === address) as Token | undefined;

    if (!token) {
      return NextResponse.json({ ok: true, events: [], message: "Token is not in the current discovery snapshot." });
    }

    const now = new Date().toISOString();
    const events: Array<Record<string, unknown>> = [];

    const posts = Array.isArray(socialBody.signals) ? (socialBody.signals as SocialSignal[]) : [];
    for (const post of posts.slice(0, 8)) {
      if (!post.createdAt) continue;
      const creator = post.author?.username ? "@" + post.author.username : "Public X account";
      events.push({
        id: "x-" + (post.postId || post.createdAt),
        label: "SOCIAL MENTION",
        timestamp: post.createdAt,
        timestampLabel: timeLabel(post.createdAt),
        source: "X / public post",
        description: creator + " mentioned " + (token.symbol || symbol || "this token") + ". This is a social signal; it does not establish that the creator bought, launched, or caused the market move.",
        link: post.url || null,
      });
    }

    events.push({
      id: "snapshot",
      label: "CURRENT MARKET SNAPSHOT",
      timestamp: now,
      timestampLabel: "Now",
      source: "DexScreener",
      description: token.symbol + " is currently " + (token.priceUsd ? "$" + token.priceUsd : "priced from the live feed") + ", with " + token.change1h.toFixed(1) + "% 1H movement, " + token.buys5m + " buys and " + token.sells5m + " sells in the latest 5M window. These are current values, not a historical delta.",
      link: null,
    });

    if (token.createdAt) {
      const created = new Date(token.createdAt);
      if (!Number.isNaN(created.getTime())) {
        events.push({
          id: "pair-created",
          label: "PAIR CREATED",
          timestamp: created.toISOString(),
          timestampLabel: timeLabel(created.toISOString()),
          source: "DexScreener",
          description: "The market-data provider reports this pair creation timestamp. It is historical metadata, not proof of when a narrative or social signal began.",
          link: null,
        });
      }
    }

    events.sort((a, b) => new Date(String(b.timestamp)).getTime() - new Date(String(a.timestamp)).getTime());

    return NextResponse.json({
      ok: true,
      token: { address: token.address, symbol: token.symbol },
      events,
      limitations: {
        historicalSnapshots: false,
        causality: false,
        message: "Market changes are not described as increases or decreases unless historical snapshots are available.",
      },
      updatedAt: now,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, events: [], error: error?.message || "Token intelligence unavailable" },
      { status: 502 }
    );
  }
}
