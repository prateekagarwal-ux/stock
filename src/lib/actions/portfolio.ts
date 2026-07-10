"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function addToPortfolio(stockId: string, quantity: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in" };
  if (!quantity || quantity <= 0) return { error: "Invalid quantity" };

  const stock = await prisma.stock.findUnique({ where: { id: stockId } });
  if (!stock) return { error: "Stock not found" };

  await prisma.holding.upsert({
    where: {
      userId_stockId: { userId: session.user.id, stockId },
    },
    create: {
      userId: session.user.id,
      stockId,
      quantity,
      addedPrice: stock.currentPrice,
      cachedScore: stock.promisingScore,
      lastScoreAt: new Date(),
    },
    update: {
      quantity: { increment: quantity },
    },
  });

  revalidatePath("/portfolio");
  revalidatePath("/screener");
  revalidatePath(`/stock/${stock.ticker}`);
  return { success: true };
}

export async function removeFromPortfolio(holdingId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in" };

  const holding = await prisma.holding.findFirst({
    where: { id: holdingId, userId: session.user.id },
  });
  if (!holding) return { error: "Holding not found" };

  await prisma.holding.delete({ where: { id: holdingId } });
  revalidatePath("/portfolio");
  return { success: true };
}

export async function updateHoldingQuantity(
  holdingId: string,
  quantity: number
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in" };
  if (!quantity || quantity <= 0) return { error: "Invalid quantity" };

  await prisma.holding.updateMany({
    where: { id: holdingId, userId: session.user.id },
    data: { quantity },
  });
  revalidatePath("/portfolio");
  return { success: true };
}

/** Refresh Promising Scores for holdings older than 2 hours */
export async function refreshPortfolioScores() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in", refreshed: 0 };

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const holdings = await prisma.holding.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { lastScoreAt: { lt: twoHoursAgo } },
        { stock: { lastScoredAt: { lt: twoHoursAgo } } },
      ],
    },
    include: { stock: true },
  });

  let refreshed = 0;
  for (const holding of holdings) {
    // Re-score from stored metrics (seed/live data already computed)
    // For live refresh, attempt market data when API available
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      const { fetchAndScoreStock } = await import("@/lib/market-data/provider");
      const enriched = await fetchAndScoreStock(
        holding.stock.ticker,
        user?.polygonApiKey || process.env.POLYGON_API_KEY
      );

      await prisma.stock.update({
        where: { id: holding.stockId },
        data: {
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

      await prisma.holding.update({
        where: { id: holding.id },
        data: {
          cachedScore: enriched.score.promisingScore,
          lastScoreAt: new Date(),
        },
      });
      refreshed++;
    } catch {
      // Keep cached score if live fetch fails
      await prisma.holding.update({
        where: { id: holding.id },
        data: {
          cachedScore: holding.stock.promisingScore,
          lastScoreAt: new Date(),
        },
      });
    }
  }

  revalidatePath("/portfolio");
  return { success: true, refreshed };
}
