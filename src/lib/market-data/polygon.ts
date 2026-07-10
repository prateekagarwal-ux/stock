import { OHLCV } from "@/lib/scoring/types";

export type QuoteResult = {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  avgVolume: number;
  high52w: number;
  low52w: number;
  marketCap?: number;
  currency: string;
};

export async function fetchPolygonBars(
  ticker: string,
  apiKey: string,
  days = 400
): Promise<OHLCV[]> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  const url =
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${fromStr}/${toStr}` +
    `?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Polygon bars failed: ${res.status}`);
  }
  const data = await res.json();
  if (!data.results?.length) return [];

  return data.results.map(
    (r: {
      t: number;
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
    }) => ({
      time: new Date(r.t).toISOString().slice(0, 10),
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v,
    })
  );
}

export async function fetchPolygonQuote(
  ticker: string,
  apiKey: string
): Promise<Partial<QuoteResult>> {
  const [prevRes, tickerRes] = await Promise.all([
    fetch(
      `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev?adjusted=true&apiKey=${apiKey}`,
      { next: { revalidate: 300 } }
    ),
    fetch(
      `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(ticker)}?apiKey=${apiKey}`,
      { next: { revalidate: 86400 } }
    ),
  ]);

  const prev = prevRes.ok ? await prevRes.json() : null;
  const ref = tickerRes.ok ? await tickerRes.json() : null;
  const bar = prev?.results?.[0];

  return {
    ticker,
    name: ref?.results?.name || ticker,
    price: bar?.c ?? 0,
    changePct:
      bar?.o && bar?.c ? ((bar.c - bar.o) / bar.o) * 100 : 0,
    volume: bar?.v ?? 0,
    marketCap: ref?.results?.market_cap,
    currency: ref?.results?.currency_name?.toUpperCase() || "USD",
  };
}
