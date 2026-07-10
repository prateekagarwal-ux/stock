import { detectMarket } from "@/lib/utils";
import {
  calculatePromisingScore,
  ma200SlopeFromCloses,
  sma,
} from "@/lib/scoring/promising-score";
import { OHLCV, StockMetrics } from "@/lib/scoring/types";
import { fetchPolygonBars, fetchPolygonQuote } from "./polygon";
import {
  fetchYahooBars,
  fetchYahooFundamentals,
  fetchYahooQuote,
} from "./yfinance";

export type EnrichedStockData = {
  ticker: string;
  name: string;
  market: string;
  currency: string;
  currentPrice: number;
  changePct: number;
  volume: number;
  avgVolume: number;
  marketCap?: number;
  high52w: number;
  low52w: number;
  ma50: number;
  ma150: number;
  ma200: number;
  ma200Slope: number;
  rsRating: number;
  epsGrowthQoQ: number;
  epsGrowthYoY: number;
  revGrowthQoQ: number;
  revGrowthYoY: number;
  priceHistory: OHLCV[];
  score: ReturnType<typeof calculatePromisingScore>;
};

function metricsFromBars(
  bars: OHLCV[],
  fundamentals: {
    epsGrowthQoQ: number;
    epsGrowthYoY: number;
    revGrowthQoQ: number;
    revGrowthYoY: number;
  },
  rsRating: number
): StockMetrics {
  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);
  const currentPrice = closes[closes.length - 1] ?? 0;
  const yearBars = bars.slice(-252);
  const high52w = Math.max(...yearBars.map((b) => b.high), currentPrice);
  const low52w = Math.min(...yearBars.map((b) => b.low), currentPrice);
  const volume = volumes[volumes.length - 1] ?? 0;
  const avgVolume = sma(volumes, Math.min(50, volumes.length));

  return {
    currentPrice,
    ma50: sma(closes, 50),
    ma150: sma(closes, 150),
    ma200: sma(closes, 200),
    ma200Slope: ma200SlopeFromCloses(closes),
    high52w,
    low52w,
    rsRating,
    volume,
    avgVolume,
    ...fundamentals,
  };
}

/** Approximate RS rating from 12-month price performance (0–99) */
export function estimateRsRating(bars: OHLCV[]): number {
  if (bars.length < 60) return 50;
  const now = bars[bars.length - 1].close;
  const ago = bars[Math.max(0, bars.length - 252)].close;
  if (ago <= 0) return 50;
  const perf = ((now - ago) / ago) * 100;
  // Map roughly -50%..+200% → 1..99
  const score = 50 + perf * 0.25;
  return Math.max(1, Math.min(99, Math.round(score)));
}

export async function fetchAndScoreStock(
  ticker: string,
  polygonApiKey?: string | null
): Promise<EnrichedStockData> {
  const market = detectMarket(ticker);
  const usePolygon = market === "USA" && !!polygonApiKey;

  let bars: OHLCV[] = [];
  let name = ticker;
  let currency = "USD";
  let changePct = 0;
  let marketCap: number | undefined;
  let quoteVolume = 0;
  let quoteAvgVolume = 0;
  let quoteHigh = 0;
  let quoteLow = 0;
  let fundamentals = {
    epsGrowthQoQ: 0,
    epsGrowthYoY: 0,
    revGrowthQoQ: 0,
    revGrowthYoY: 0,
  };

  if (usePolygon) {
    try {
      const [polyBars, polyQuote] = await Promise.all([
        fetchPolygonBars(ticker, polygonApiKey!),
        fetchPolygonQuote(ticker, polygonApiKey!),
      ]);
      bars = polyBars;
      name = polyQuote.name || ticker;
      currency = polyQuote.currency || "USD";
      changePct = polyQuote.changePct || 0;
      marketCap = polyQuote.marketCap;
      quoteVolume = polyQuote.volume || 0;
      // Yahoo for fundamentals even on US when available
      try {
        fundamentals = await fetchYahooFundamentals(ticker);
      } catch {
        /* keep zeros */
      }
    } catch {
      // Fall through to Yahoo
    }
  }

  if (bars.length === 0) {
    const [yahooBars, yahooQuote, yahooFund] = await Promise.all([
      fetchYahooBars(ticker),
      fetchYahooQuote(ticker),
      fetchYahooFundamentals(ticker),
    ]);
    bars = yahooBars;
    name = yahooQuote.name;
    currency = yahooQuote.currency;
    changePct = yahooQuote.changePct;
    marketCap = yahooQuote.marketCap;
    quoteVolume = yahooQuote.volume;
    quoteAvgVolume = yahooQuote.avgVolume;
    quoteHigh = yahooQuote.high52w;
    quoteLow = yahooQuote.low52w;
    fundamentals = yahooFund;
  }

  if (bars.length === 0) {
    throw new Error(`No price data for ${ticker}`);
  }

  const rsRating = estimateRsRating(bars);
  const metrics = metricsFromBars(bars, fundamentals, rsRating);

  if (quoteHigh > 0) metrics.high52w = quoteHigh;
  if (quoteLow > 0) metrics.low52w = quoteLow;
  if (quoteVolume > 0) metrics.volume = quoteVolume;
  if (quoteAvgVolume > 0) metrics.avgVolume = quoteAvgVolume;

  const score = calculatePromisingScore(metrics);

  return {
    ticker: ticker.toUpperCase(),
    name,
    market,
    currency,
    currentPrice: metrics.currentPrice,
    changePct,
    volume: metrics.volume,
    avgVolume: metrics.avgVolume,
    marketCap,
    high52w: metrics.high52w,
    low52w: metrics.low52w,
    ma50: metrics.ma50,
    ma150: metrics.ma150,
    ma200: metrics.ma200,
    ma200Slope: metrics.ma200Slope,
    rsRating: metrics.rsRating,
    epsGrowthQoQ: metrics.epsGrowthQoQ,
    epsGrowthYoY: metrics.epsGrowthYoY,
    revGrowthQoQ: metrics.revGrowthQoQ,
    revGrowthYoY: metrics.revGrowthYoY,
    priceHistory: bars.slice(-365),
    score,
  };
}
