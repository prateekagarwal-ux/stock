import {
  ScoreBreakdown,
  StockMetrics,
  TrendChecks,
  TREND_TEMPLATE_LABELS,
} from "./types";

/**
 * Mark Minervini's Exact 8-Point Trend Template
 * Source: Trade Like a Stock Market Wizard / SEPA methodology
 */
export function evaluateTrendTemplate(m: StockMetrics): TrendChecks {
  const priceAboveMa150And200 =
    m.currentPrice > m.ma150 && m.currentPrice > m.ma200;
  const ma150AboveMa200 = m.ma150 > m.ma200;
  // Prefer 4–5 months; require at least ~1 month of upward MA200 slope
  const ma200TrendingUp = m.ma200Slope > 0;
  const ma50AboveMa150And200 = m.ma50 > m.ma150 && m.ma50 > m.ma200;
  const priceAboveMa50 = m.currentPrice > m.ma50;
  const pctAboveLow =
    m.low52w > 0 ? ((m.currentPrice - m.low52w) / m.low52w) * 100 : 0;
  const price25PctAbove52wLow = pctAboveLow >= 25;
  const pctBelowHigh =
    m.high52w > 0 ? ((m.high52w - m.currentPrice) / m.high52w) * 100 : 100;
  const priceWithin25PctOf52wHigh = pctBelowHigh <= 25;
  const rsRatingAbove70 = m.rsRating >= 70;

  return {
    priceAboveMa150And200: {
      passed: priceAboveMa150And200,
      label: TREND_TEMPLATE_LABELS.priceAboveMa150And200,
      detail: `Price ${m.currentPrice.toFixed(2)} vs MA150 ${m.ma150.toFixed(2)} / MA200 ${m.ma200.toFixed(2)}`,
    },
    ma150AboveMa200: {
      passed: ma150AboveMa200,
      label: TREND_TEMPLATE_LABELS.ma150AboveMa200,
      detail: `MA150 ${m.ma150.toFixed(2)} vs MA200 ${m.ma200.toFixed(2)}`,
    },
    ma200TrendingUp: {
      passed: ma200TrendingUp,
      label: TREND_TEMPLATE_LABELS.ma200TrendingUp,
      detail: `MA200 slope (≈1 month): ${m.ma200Slope.toFixed(2)}%`,
    },
    ma50AboveMa150And200: {
      passed: ma50AboveMa150And200,
      label: TREND_TEMPLATE_LABELS.ma50AboveMa150And200,
      detail: `MA50 ${m.ma50.toFixed(2)} vs MA150 ${m.ma150.toFixed(2)} / MA200 ${m.ma200.toFixed(2)}`,
    },
    priceAboveMa50: {
      passed: priceAboveMa50,
      label: TREND_TEMPLATE_LABELS.priceAboveMa50,
      detail: `Price ${m.currentPrice.toFixed(2)} vs MA50 ${m.ma50.toFixed(2)}`,
    },
    price25PctAbove52wLow: {
      passed: price25PctAbove52wLow,
      label: TREND_TEMPLATE_LABELS.price25PctAbove52wLow,
      detail: `${pctAboveLow.toFixed(1)}% above 52-week low (${m.low52w.toFixed(2)})`,
    },
    priceWithin25PctOf52wHigh: {
      passed: priceWithin25PctOf52wHigh,
      label: TREND_TEMPLATE_LABELS.priceWithin25PctOf52wHigh,
      detail: `${pctBelowHigh.toFixed(1)}% below 52-week high (${m.high52w.toFixed(2)})`,
    },
    rsRatingAbove70: {
      passed: rsRatingAbove70,
      label: TREND_TEMPLATE_LABELS.rsRatingAbove70,
      detail: `RS Rating: ${m.rsRating.toFixed(0)}`,
    },
  };
}

/** Trend Strength: max 4.0 — 0.5 points per Trend Template criterion met */
export function scoreTrendStrength(checks: TrendChecks): {
  score: number;
  passedCount: number;
} {
  const values = Object.values(checks);
  const passedCount = values.filter((c) => c.passed).length;
  return { score: Math.min(4, passedCount * 0.5), passedCount };
}

/**
 * Earnings Momentum: max 3.0
 * QoQ EPS growth weighted more heavily than YoY (acceleration matters).
 */
export function scoreEarningsMomentum(
  epsGrowthQoQ: number,
  epsGrowthYoY: number
): number {
  let score = 0;
  // QoQ up to 1.8
  if (epsGrowthQoQ >= 100) score += 1.8;
  else if (epsGrowthQoQ >= 50) score += 1.5;
  else if (epsGrowthQoQ >= 25) score += 1.2;
  else if (epsGrowthQoQ >= 10) score += 0.8;
  else if (epsGrowthQoQ > 0) score += 0.4;

  // YoY up to 1.2
  if (epsGrowthYoY >= 100) score += 1.2;
  else if (epsGrowthYoY >= 50) score += 1.0;
  else if (epsGrowthYoY >= 25) score += 0.7;
  else if (epsGrowthYoY >= 10) score += 0.4;
  else if (epsGrowthYoY > 0) score += 0.2;

  return Math.min(3, Math.round(score * 10) / 10);
}

/** Revenue Momentum: max 2.0 */
export function scoreRevenueMomentum(
  revGrowthQoQ: number,
  revGrowthYoY: number
): number {
  let score = 0;
  if (revGrowthQoQ >= 50) score += 1.2;
  else if (revGrowthQoQ >= 25) score += 1.0;
  else if (revGrowthQoQ >= 10) score += 0.7;
  else if (revGrowthQoQ > 0) score += 0.3;

  if (revGrowthYoY >= 50) score += 0.8;
  else if (revGrowthYoY >= 25) score += 0.6;
  else if (revGrowthYoY >= 10) score += 0.4;
  else if (revGrowthYoY > 0) score += 0.2;

  return Math.min(2, Math.round(score * 10) / 10);
}

/**
 * Other Factors: max 1.0
 * Proximity to 52-week high + volume confirmation
 */
export function scoreOtherFactors(m: StockMetrics): number {
  let score = 0;
  const pctBelowHigh =
    m.high52w > 0 ? ((m.high52w - m.currentPrice) / m.high52w) * 100 : 100;

  // Closer to 52w high is better (up to 0.6)
  if (pctBelowHigh <= 5) score += 0.6;
  else if (pctBelowHigh <= 10) score += 0.5;
  else if (pctBelowHigh <= 15) score += 0.35;
  else if (pctBelowHigh <= 25) score += 0.2;

  // Volume above average (up to 0.4)
  if (m.avgVolume > 0) {
    const volRatio = m.volume / m.avgVolume;
    if (volRatio >= 1.5) score += 0.4;
    else if (volRatio >= 1.2) score += 0.3;
    else if (volRatio >= 1.0) score += 0.2;
    else if (volRatio >= 0.8) score += 0.1;
  }

  return Math.min(1, Math.round(score * 10) / 10);
}

export function calculatePromisingScore(m: StockMetrics): ScoreBreakdown {
  const trendChecks = evaluateTrendTemplate(m);
  const { score: trendScore, passedCount } = scoreTrendStrength(trendChecks);
  const earningsScore = scoreEarningsMomentum(m.epsGrowthQoQ, m.epsGrowthYoY);
  const revenueScore = scoreRevenueMomentum(m.revGrowthQoQ, m.revGrowthYoY);
  const otherScore = scoreOtherFactors(m);

  const promisingScore =
    Math.round((trendScore + earningsScore + revenueScore + otherScore) * 10) /
    10;

  const explanation = buildExplanation({
    promisingScore,
    trendScore,
    earningsScore,
    revenueScore,
    otherScore,
    passedCount,
  });

  return {
    promisingScore,
    trendScore,
    earningsScore,
    revenueScore,
    otherScore,
    trendChecks,
    passedCount,
    explanation,
  };
}

function buildExplanation(parts: {
  promisingScore: number;
  trendScore: number;
  earningsScore: number;
  revenueScore: number;
  otherScore: number;
  passedCount: number;
}): string {
  const quality =
    parts.promisingScore >= 8
      ? "high-conviction SEPA candidate"
      : parts.promisingScore >= 6
        ? "solid setup with room to improve"
        : parts.promisingScore >= 4
          ? "mixed signals — proceed with caution"
          : "does not currently meet Minervini-style criteria";

  return (
    `Promising Score ${parts.promisingScore}/10 — ${quality}. ` +
    `Trend Strength ${parts.trendScore}/4.0 (${parts.passedCount}/8 Trend Template points), ` +
    `Earnings Momentum ${parts.earningsScore}/3.0, ` +
    `Revenue Momentum ${parts.revenueScore}/2.0, ` +
    `Other Factors ${parts.otherScore}/1.0.`
  );
}

/** Simple SMA helper */
export function sma(values: number[], period: number): number {
  if (values.length < period) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/** Compute MA200 slope over ~20 trading days (≈1 month) */
export function ma200SlopeFromCloses(closes: number[]): number {
  if (closes.length < 220) {
    // Fallback: compare recent MA200-ish vs older window
    if (closes.length < 40) return 0;
    const recent = sma(closes, Math.min(closes.length, 50));
    const older = sma(closes.slice(0, -20), Math.min(closes.length - 20, 50));
    if (older === 0) return 0;
    return ((recent - older) / older) * 100;
  }
  const maNow = sma(closes, 200);
  const maPrev = sma(closes.slice(0, -20), 200);
  if (maPrev === 0) return 0;
  return ((maNow - maPrev) / maPrev) * 100;
}
