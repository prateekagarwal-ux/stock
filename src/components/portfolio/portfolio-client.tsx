"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  refreshPortfolioScores,
  removeFromPortfolio,
} from "@/lib/actions/portfolio";
import {
  changeColor,
  formatCurrency,
  formatPercent,
  scoreColor,
} from "@/lib/utils";

export type HoldingRow = {
  id: string;
  quantity: number;
  addedPrice: number;
  addedAt: string;
  lastScoreAt: string;
  cachedScore: number;
  stock: {
    id: string;
    ticker: string;
    name: string;
    market: string;
    currency: string;
    currentPrice: number;
    promisingScore: number;
  };
};

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function PortfolioClient({ holdings }: { holdings: HoldingRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const needsRefresh = holdings.some(
      (h) => Date.now() - new Date(h.lastScoreAt).getTime() >= TWO_HOURS_MS
    );
    if (needsRefresh) {
      startTransition(async () => {
        await refreshPortfolioScores();
        router.refresh();
      });
    }

    const interval = setInterval(
      () => {
        startTransition(async () => {
          await refreshPortfolioScores();
          router.refresh();
        });
      },
      TWO_HOURS_MS
    );
    return () => clearInterval(interval);
  }, [holdings, router]);

  const totalValue = holdings.reduce(
    (sum, h) => sum + h.quantity * h.stock.currentPrice,
    0
  );
  const totalCost = holdings.reduce(
    (sum, h) => sum + h.quantity * h.addedPrice,
    0
  );
  const overallReturn =
    totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white md:text-3xl">
            Portfolio
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Holdings with live Promising Scores (auto-refresh every 2 hours)
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await refreshPortfolioScores();
              router.refresh();
            })
          }
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          Refresh Scores
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {formatCurrency(totalValue)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">
              Overall Return
            </CardTitle>
          </CardHeader>
          <CardContent
            className={`text-2xl font-semibold tabular-nums ${changeColor(overallReturn)}`}
          >
            {formatPercent(overallReturn)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Holdings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {holdings.length}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3 text-right">Return</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {holdings.map((h) => {
              const value = h.quantity * h.stock.currentPrice;
              const ret =
                ((h.stock.currentPrice - h.addedPrice) / h.addedPrice) * 100;
              return (
                <tr key={h.id} className="bg-zinc-950/30 hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/stock/${encodeURIComponent(h.stock.ticker)}`}
                      className="font-semibold text-emerald-300 hover:underline"
                    >
                      {h.stock.ticker}
                    </Link>
                    <div className="mt-1">
                      <Badge variant="outline">{h.stock.market}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{h.stock.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {h.quantity}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(h.stock.currentPrice, h.stock.currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(value, h.stock.currency)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${changeColor(ret)}`}
                  >
                    {formatPercent(ret)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-base font-semibold tabular-nums ${scoreColor(h.stock.promisingScore)}`}
                  >
                    {h.stock.promisingScore.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        startTransition(async () => {
                          await removeFromPortfolio(h.id);
                          router.refresh();
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {holdings.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-zinc-500"
                >
                  No holdings yet. Add stocks from the{" "}
                  <Link href="/screener" className="text-emerald-400">
                    screener
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
