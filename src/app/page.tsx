import Link from "next/link";
import { ArrowRight, Flame, Globe2, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  changeColor,
  formatCurrency,
  formatPercent,
  scoreColor,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [topStocks, marketCounts, avgScore] = await Promise.all([
    prisma.stock.findMany({
      orderBy: { promisingScore: "desc" },
      take: 8,
    }),
    prisma.stock.groupBy({
      by: ["market"],
      _count: { _all: true },
    }),
    prisma.stock.aggregate({ _avg: { promisingScore: true } }),
  ]);

  const highConviction = topStocks.filter((s) => s.promisingScore >= 7).length;

  return (
    <div className="space-y-8">
      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/80 via-[#0a1018] to-emerald-950/20 p-6 md:p-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <Badge variant="success" className="mb-4">
            Minervini SEPA · 8-Point Trend Template
          </Badge>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Promising
          </h1>
          <p className="mt-3 max-w-xl text-base text-zinc-400 md:text-lg">
            Discover high-conviction stocks ranked by a transparent Promising
            Score built on Mark Minervini&apos;s Trend Template, earnings, and
            revenue momentum.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/screener">
              <Button size="lg">
                Open Screener
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button size="lg" variant="secondary">
                View Portfolio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Top Score",
            value: topStocks[0]
              ? topStocks[0].promisingScore.toFixed(1)
              : "—",
            hint: topStocks[0]?.ticker,
            icon: Flame,
          },
          {
            label: "High Conviction (≥7)",
            value: String(highConviction),
            hint: "of top screened names",
            icon: ShieldCheck,
          },
          {
            label: "Markets Covered",
            value: String(marketCounts.length),
            hint: "USA · India · Japan · Korea · Others",
            icon: Globe2,
          },
          {
            label: "Avg Promising Score",
            value: (avgScore._avg.promisingScore ?? 0).toFixed(1),
            hint: "universe average",
            icon: Flame,
          },
        ].map((stat, i) => (
          <Card
            key={stat.label}
            className={`animate-fade-up stagger-${i + 1}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-emerald-400/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-zinc-50">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-zinc-500">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="animate-fade-up stagger-3 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
              Top Promising Stocks
            </h2>
            <p className="text-sm text-zinc-500">
              Ranked by Promising Score across all markets
            </p>
          </div>
          <Link
            href="/screener"
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            View all
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-800/80">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ticker</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Company
                </th>
                <th className="px-4 py-3 font-medium">Market</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="hidden px-4 py-3 font-medium text-right sm:table-cell">
                  Change
                </th>
                <th className="px-4 py-3 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {topStocks.map((stock) => (
                <tr
                  key={stock.id}
                  className="bg-zinc-950/30 transition-colors hover:bg-zinc-900/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/stock/${encodeURIComponent(stock.ticker)}`}
                      className="font-semibold text-emerald-300 hover:underline"
                    >
                      {stock.ticker}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                    {stock.name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{stock.market}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(stock.currentPrice, stock.currency)}
                  </td>
                  <td
                    className={`hidden px-4 py-3 text-right tabular-nums sm:table-cell ${changeColor(stock.changePct)}`}
                  >
                    {formatPercent(stock.changePct)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-base font-semibold tabular-nums ${scoreColor(stock.promisingScore)}`}
                  >
                    {stock.promisingScore.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
