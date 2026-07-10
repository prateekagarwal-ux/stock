import YahooFinance from "yahoo-finance2";
import { OHLCV } from "@/lib/scoring/types";
import { QuoteResult } from "./polygon";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function asPercent(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) {
    // Yahoo sometimes returns decimal ratios (0.25) and sometimes percent (25)
    return Math.abs(value) <= 3 ? value * 100 : value;
  }
  if (typeof value === "object" && value !== null && "raw" in value) {
    const raw = (value as { raw?: number }).raw;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return Math.abs(raw) <= 3 ? raw * 100 : raw;
    }
  }
  return 0;
}

export async function fetchYahooBars(
  ticker: string,
  days = 400
): Promise<OHLCV[]> {
  const period2 = new Date();
  const period1 = new Date();
  period1.setDate(period1.getDate() - days);

  const result = await yahooFinance.chart(ticker, {
    period1,
    period2,
    interval: "1d",
  });

  const quotes = result.quotes || [];
  return quotes
    .filter((q) => q.close != null && q.date)
    .map((q) => ({
      time: new Date(q.date).toISOString().slice(0, 10),
      open: q.open ?? q.close!,
      high: q.high ?? q.close!,
      low: q.low ?? q.close!,
      close: q.close!,
      volume: q.volume ?? 0,
    }));
}

export async function fetchYahooQuote(ticker: string): Promise<QuoteResult> {
  const q = await yahooFinance.quote(ticker);
  const price = q.regularMarketPrice ?? 0;
  const prev = q.regularMarketPreviousClose ?? price;

  return {
    ticker,
    name: q.longName || q.shortName || ticker,
    price,
    changePct: prev ? ((price - prev) / prev) * 100 : 0,
    volume: q.regularMarketVolume ?? 0,
    avgVolume: q.averageDailyVolume3Month ?? q.regularMarketVolume ?? 0,
    high52w: q.fiftyTwoWeekHigh ?? price,
    low52w: q.fiftyTwoWeekLow ?? price,
    marketCap: q.marketCap,
    currency: q.currency || "USD",
  };
}

export async function fetchYahooFundamentals(ticker: string): Promise<{
  epsGrowthQoQ: number;
  epsGrowthYoY: number;
  revGrowthQoQ: number;
  revGrowthYoY: number;
}> {
  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ["earningsTrend", "financialData", "defaultKeyStatistics"],
    });

    const trends = summary.earningsTrend?.trend || [];
    const current = trends.find((t) => t.period === "0q");
    const yearAgo = trends.find((t) => t.period === "-1y");
    const nextYear = trends.find((t) => t.period === "+1y");

    const epsGrowthQoQ =
      asPercent(current?.growth) ||
      asPercent(current?.earningsEstimate?.growth) ||
      0;

    const epsGrowthYoY =
      asPercent(yearAgo?.growth) ||
      asPercent(nextYear?.growth) ||
      asPercent(summary.financialData?.earningsGrowth) ||
      0;

    const revGrowthYoY = asPercent(summary.financialData?.revenueGrowth);
    const revGrowthQoQ = revGrowthYoY > 0 ? revGrowthYoY * 0.6 : revGrowthYoY;

    return { epsGrowthQoQ, epsGrowthYoY, revGrowthQoQ, revGrowthYoY };
  } catch {
    return {
      epsGrowthQoQ: 0,
      epsGrowthYoY: 0,
      revGrowthQoQ: 0,
      revGrowthYoY: 0,
    };
  }
}
