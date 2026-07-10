"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchAndScoreStock } from "@/lib/market-data/provider";
import { detectMarket, marketCurrency } from "@/lib/utils";

export async function upsertScoredStock(tickerRaw: string) {
  const ticker = tickerRaw.trim().toUpperCase();
  if (!ticker) return { error: "Ticker required" };

  const session = await auth();
  let polygonKey = process.env.POLYGON_API_KEY || null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    polygonKey = user?.polygonApiKey || polygonKey;
  }

  try {
    const enriched = await fetchAndScoreStock(ticker, polygonKey);
    const market = enriched.market || detectMarket(ticker);

    const stock = await prisma.stock.upsert({
      where: {
        ticker_market: { ticker: enriched.ticker, market },
      },
      create: {
        ticker: enriched.ticker,
        name: enriched.name,
        market,
        currency: enriched.currency || marketCurrency(market),
        currentPrice: enriched.currentPrice,
        changePct: enriched.changePct,
        volume: enriched.volume,
        avgVolume: enriched.avgVolume,
        marketCap: enriched.marketCap,
        high52w: enriched.high52w,
        low52w: enriched.low52w,
        ma50: enriched.ma50,
        ma150: enriched.ma150,
        ma200: enriched.ma200,
        ma200Slope: enriched.ma200Slope,
        rsRating: enriched.rsRating,
        epsGrowthQoQ: enriched.epsGrowthQoQ,
        epsGrowthYoY: enriched.epsGrowthYoY,
        revGrowthQoQ: enriched.revGrowthQoQ,
        revGrowthYoY: enriched.revGrowthYoY,
        promisingScore: enriched.score.promisingScore,
        trendScore: enriched.score.trendScore,
        earningsScore: enriched.score.earningsScore,
        revenueScore: enriched.score.revenueScore,
        otherScore: enriched.score.otherScore,
        trendChecks: JSON.stringify(enriched.score.trendChecks),
        priceHistory: JSON.stringify(enriched.priceHistory),
        lastScoredAt: new Date(),
      },
      update: {
        name: enriched.name,
        currentPrice: enriched.currentPrice,
        changePct: enriched.changePct,
        volume: enriched.volume,
        avgVolume: enriched.avgVolume,
        marketCap: enriched.marketCap,
        high52w: enriched.high52w,
        low52w: enriched.low52w,
        ma50: enriched.ma50,
        ma150: enriched.ma150,
        ma200: enriched.ma200,
        ma200Slope: enriched.ma200Slope,
        rsRating: enriched.rsRating,
        epsGrowthQoQ: enriched.epsGrowthQoQ,
        epsGrowthYoY: enriched.epsGrowthYoY,
        revGrowthQoQ: enriched.revGrowthQoQ,
        revGrowthYoY: enriched.revGrowthYoY,
        promisingScore: enriched.score.promisingScore,
        trendScore: enriched.score.trendScore,
        earningsScore: enriched.score.earningsScore,
        revenueScore: enriched.score.revenueScore,
        otherScore: enriched.score.otherScore,
        trendChecks: JSON.stringify(enriched.score.trendChecks),
        priceHistory: JSON.stringify(enriched.priceHistory),
        lastScoredAt: new Date(),
      },
    });

    revalidatePath("/screener");
    revalidatePath(`/stock/${stock.ticker}`);
    return { success: true, ticker: stock.ticker };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch stock data",
    };
  }
}
