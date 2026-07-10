export type OHLCV = {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TrendCheckKey =
  | "priceAboveMa150And200"
  | "ma150AboveMa200"
  | "ma200TrendingUp"
  | "ma50AboveMa150And200"
  | "priceAboveMa50"
  | "price25PctAbove52wLow"
  | "priceWithin25PctOf52wHigh"
  | "rsRatingAbove70";

export type TrendChecks = Record<
  TrendCheckKey,
  { passed: boolean; label: string; detail: string }
>;

export type ScoreBreakdown = {
  promisingScore: number;
  trendScore: number;
  earningsScore: number;
  revenueScore: number;
  otherScore: number;
  trendChecks: TrendChecks;
  passedCount: number;
  explanation: string;
};

export type StockMetrics = {
  currentPrice: number;
  ma50: number;
  ma150: number;
  ma200: number;
  ma200Slope: number; // % change over ~20 trading days
  high52w: number;
  low52w: number;
  rsRating: number;
  volume: number;
  avgVolume: number;
  epsGrowthQoQ: number;
  epsGrowthYoY: number;
  revGrowthQoQ: number;
  revGrowthYoY: number;
};

export const TREND_TEMPLATE_LABELS: Record<TrendCheckKey, string> = {
  priceAboveMa150And200:
    "Price is above both the 150-day and 200-day moving averages",
  ma150AboveMa200: "The 150-day MA is above the 200-day MA",
  ma200TrendingUp:
    "The 200-day MA is trending up for at least 1 month",
  ma50AboveMa150And200:
    "The 50-day MA is above both the 150-day and 200-day MAs",
  priceAboveMa50: "Current price is above the 50-day MA",
  price25PctAbove52wLow:
    "Current price is at least 25% above the 52-week low",
  priceWithin25PctOf52wHigh:
    "Current price is within 25% of the 52-week high",
  rsRatingAbove70: "Relative Strength rating is at least 70",
};
