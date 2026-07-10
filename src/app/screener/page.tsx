import { prisma } from "@/lib/prisma";
import { ScreenerClient } from "@/components/screener/screener-client";

export const dynamic = "force-dynamic";

export default async function ScreenerPage() {
  const stocks = await prisma.stock.findMany({
    orderBy: { promisingScore: "desc" },
  });

  return (
    <ScreenerClient
      stocks={stocks.map((s) => ({
        id: s.id,
        ticker: s.ticker,
        name: s.name,
        market: s.market,
        currency: s.currency,
        currentPrice: s.currentPrice,
        changePct: s.changePct,
        promisingScore: s.promisingScore,
        trendScore: s.trendScore,
        earningsScore: s.earningsScore,
        revenueScore: s.revenueScore,
        rsRating: s.rsRating,
        sector: s.sector,
      }))}
    />
  );
}
