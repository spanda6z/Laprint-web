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

type Snapshot = {
  capturedAt: string;
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number;
  liquidityUsd: number;
  buys5m: number;
  sells5m: number;
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

function pctDelta(before: number | null, after: number | null) {
  if (before == null || after == null || before === 0) return null;
  return ((after - before) / Math.abs(before)) * 100;
}

function signed(value: number | null, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  return (value >= 0 ? "+" : "") + value.toFixed(digits) + "%";
}

function buyPressure(snapshot: Snapshot) {
  const total = snapshot.buys5m + snapshot.sells5m;
  return total > 0 ? (snapshot.buys5m / total) * 100 : null;
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const address = (sp.get("address") || "").trim();
  const symbol = (sp.get("symbol") || "").trim();

  if (!address) return NextResponse.json({ ok: true, events: [] });

  try {
    const origin = new URL(req.url).origin;
    const backend = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const snapshotUrl = backend
      ? backend + "/api/market-snapshots?address=" + encodeURIComponent(address) + "&sinceMinutes=120"
      : null;

    const [marketResponse, socialResponse, snapshotResponse] = await Promise.all([
      fetch(origin + "/api/discovery", { cache: "no-store" }),
      fetch(origin + "/api/social-signals?address=" + encodeURIComponent(address) + "&symbol=" + encodeURIComponent(symbol), { cache: "no-store" }),
      snapshotUrl ? fetch(snapshotUrl, { cache: "no-store" }) : Promise.resolve(null),
    ]);

    const marketBody = await marketResponse.json();
    const socialBody = await socialResponse.json();
    const snapshotBody = snapshotResponse ? await snapshotResponse.json() : null;
    const token = (marketBody.tokens || []).find((item: Token) => item.address === address) as Token | undefined;

    if (!token) {
      return NextResponse.json({ ok: true, events: [], message: "Token is not in the current discovery snapshot." });
    }

    const now = new Date().toISOString();
    const events: Array<Record<string, unknown>> = [];
    const snapshots: Snapshot[] = Array.isArray(snapshotBody?.snapshots)
      ? snapshotBody.snapshots
          .map((item: Snapshot) => item)
          .sort((a: Snapshot, b: Snapshot) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime())
      : [];

    const posts = Array.isArray(socialBody.signals) ? (socialBody.signals as SocialSignal[]) : [];
    for (const post of posts.slice(0, 8)) {
      if (!post.createdAt) continue;
      const creator = post.author?.username ? "@" + post.author.username : "Public X account";
      const mentionTime = new Date(post.createdAt).getTime();
      const before = [...snapshots].reverse().find((item) => new Date(item.capturedAt).getTime() <= mentionTime);
      const after = snapshots.find((item) => new Date(item.capturedAt).getTime() >= mentionTime && new Date(item.capturedAt).getTime() <= mentionTime + 60 * 60 * 1000);

      events.push({
        id: "x-" + (post.postId || post.createdAt),
        label: "SOCIAL MENTION",
        timestamp: post.createdAt,
        timestampLabel: timeLabel(post.createdAt),
        source: "X / public post",
        description: creator + " mentioned " + (token.symbol || symbol || "this token") + ". This is a social signal; it does not establish that the creator bought, launched, or caused the market move.",
        link: post.url || null,
      });

      if (before && after && after.capturedAt !== before.capturedAt) {
        const minutes = Math.max(1, Math.round((new Date(after.capturedAt).getTime() - mentionTime) / 60000));
        const priceChange = pctDelta(before.priceUsd, after.priceUsd);
        const liquidityChange = pctDelta(before.liquidityUsd, after.liquidityUsd);
        const volumeChange = pctDelta(before.volume24hUsd, after.volume24hUsd);
        const pressureBefore = buyPressure(before);
        const pressureAfter = buyPressure(after);
        const pressureDelta = pressureBefore != null && pressureAfter != null ? pressureAfter - pressureBefore : null;

        events.push({
          id: "response-" + (post.postId || post.createdAt),
          label: "OBSERVED MARKET RESPONSE",
          timestamp: after.capturedAt,
          timestampLabel: timeLabel(after.capturedAt),
          source: "Historical market snapshots",
          description:
            minutes + "m after the mention, the stored market snapshots show price " + signed(priceChange) +
            ", liquidity " + signed(liquidityChange) +
            ", reported 24H volume " + signed(volumeChange) +
            ", and 5M buy pressure " + (pressureDelta == null ? "—" : (pressureDelta >= 0 ? "+" : "") + pressureDelta.toFixed(1) + " pts") +
            ". This is a time-aligned observation, not a claim of causality.",
          link: null,
        });
      }
    }

    if (snapshots.length) {
      const recent = snapshots.slice(-5).reverse();
      for (let i = 0; i < recent.length; i++) {
        const current = recent[i];
        const previous = i < recent.length - 1 ? recent[i + 1] : null;
        const priceChange = previous ? pctDelta(previous.priceUsd, current.priceUsd) : null;
        const liquidityChange = previous ? pctDelta(previous.liquidityUsd, current.liquidityUsd) : null;
        const pressure = buyPressure(current);

        events.push({
          id: "history-" + current.capturedAt,
          label: i === 0 ? "LATEST MARKET SNAPSHOT" : "MARKET SNAPSHOT",
          timestamp: current.capturedAt,
          timestampLabel: timeLabel(current.capturedAt),
          source: "Stored DexScreener snapshot",
          description:
            "Observed price " + (current.priceUsd == null ? "—" : "$" + current.priceUsd.toPrecision(6)) +
            ", liquidity $" + Math.round(current.liquidityUsd).toLocaleString() +
            ", 24H volume $" + Math.round(current.volume24hUsd).toLocaleString() +
            ", and 5M buy pressure " + (pressure == null ? "—" : pressure.toFixed(0) + "%") +
            (previous ? ". Since the prior snapshot: price " + signed(priceChange) + ", liquidity " + signed(liquidityChange) + "." : "."),
          link: null,
        });
      }
    } else {
      events.push({
        id: "snapshot",
        label: "CURRENT MARKET SNAPSHOT",
        timestamp: now,
        timestampLabel: "Now",
        source: "DexScreener",
        description: token.symbol + " is currently " + (token.priceUsd ? "$" + token.priceUsd : "priced from the live feed") + ", with " + token.change1h.toFixed(1) + "% 1H movement, " + token.buys5m + " buys and " + token.sells5m + " sells in the latest 5M window. Historical snapshots are not connected yet.",
        link: null,
      });
    }

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
      snapshotsConnected: snapshots.length > 0,
      limitations: {
        historicalSnapshots: snapshots.length > 0,
        causality: false,
        message: snapshots.length > 0
          ? "Market deltas are calculated only from stored snapshots. Time alignment does not establish causality."
          : "Historical market snapshots are not connected. Current values are not presented as historical deltas.",
      },
      updatedAt: now,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, events: [], error: error?.message || "Token intelligence unavailable" }, { status: 502 });
  }
}
