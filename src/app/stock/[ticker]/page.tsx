import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { StockChart } from "@/components/charts/stock-chart";
import {
  PromisingScoreHero,
  ScoreBreakdownCards,
  TrendTemplateChecklist,
} from "@/components/stock/score-display";
import {
  AddToPortfolioButton,
  WatchlistButton,
} from "@/components/stock/action-buttons";
import type { OHLCV, TrendChecks } from "@/lib/scoring/types";
import {
  changeColor,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker: raw } = await params;
  const ticker = decodeURIComponent(raw).toUpperCase();
  const session = await auth();

  const stock = await prisma.stock.findFirst({
    where: { ticker },
    orderBy: { promisingScore: "desc" },
  });

  if (!stock) notFound();

  let watched = false;
  if (session?.user?.id) {
    const item = await prisma.watchlistItem.findUnique({
      where: {
        userId_stockId: { userId: session.user.id, stockId: stock.id },
      },
    });
    watched = !!item;
  }

  const trendChecks = JSON.parse(stock.trendChecks || "{}") as TrendChecks;
  const priceHistory = JSON.parse(stock.priceHistory || "[]") as OHLCV[];

  const explanation =
    `Promising Score ${stock.promisingScore.toFixed(1)}/10. ` +
    `Trend Strength ${stock.trendScore.toFixed(1)}/4.0, ` +
    `Earnings Momentum ${stock.earningsScore.toFixed(1)}/3.0, ` +
    `Revenue Momentum ${stock.revenueScore.toFixed(1)}/2.0, ` +
    `Other Factors ${stock.otherScore.toFixed(1)}/1.0. ` +
    `Scored using Minervini's SEPA 8-Point Trend Template plus fundamental momentum.`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
              {stock.ticker}
            </h1>
            <Badge variant="outline">{stock.market}</Badge>
            {stock.sector && <Badge variant="default">{stock.sector}</Badge>}
          </div>
          <p className="mt-1 text-zinc-400">{stock.name}</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums text-zinc-50">
              {formatCurrency(stock.currentPrice, stock.currency)}
            </span>
            <span
              className={`text-sm font-medium tabular-nums ${changeColor(stock.changePct)}`}
            >
              {formatPercent(stock.changePct)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddToPortfolioButton
            stockId={stock.id}
            ticker={stock.ticker}
            price={stock.currentPrice}
          />
          <WatchlistButton stockId={stock.id} initialWatched={watched} />
          <Link
            href="/screener"
            className="inline-flex h-10 items-center rounded-md border border-zinc-700 px-4 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Back to Screener
          </Link>
        </div>
      </div>

      <div className="animate-score-pulse">
        <PromisingScoreHero
          score={stock.promisingScore}
          explanation={explanation}
        />
      </div>

      <ScoreBreakdownCards
        trendScore={stock.trendScore}
        earningsScore={stock.earningsScore}
        revenueScore={stock.revenueScore}
        otherScore={stock.otherScore}
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Price Chart
          </h2>
          {priceHistory.length > 0 ? (
            <StockChart data={priceHistory} />
          ) : (
            <div className="rounded-xl border border-zinc-800 p-10 text-center text-zinc-500">
              No chart data available
            </div>
          )}
        </div>
        <div className="xl:col-span-2">
          <TrendTemplateChecklist checks={trendChecks} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "50-day MA", value: formatCurrency(stock.ma50, stock.currency) },
          { label: "150-day MA", value: formatCurrency(stock.ma150, stock.currency) },
          { label: "200-day MA", value: formatCurrency(stock.ma200, stock.currency) },
          { label: "RS Rating", value: stock.rsRating.toFixed(0) },
          {
            label: "52-week High",
            value: formatCurrency(stock.high52w, stock.currency),
          },
          {
            label: "52-week Low",
            value: formatCurrency(stock.low52w, stock.currency),
          },
          { label: "Volume", value: formatNumber(stock.volume, true) },
          {
            label: "EPS Growth YoY",
            value: formatPercent(stock.epsGrowthYoY),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4"
          >
            <div className="text-xs text-zinc-500">{item.label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
