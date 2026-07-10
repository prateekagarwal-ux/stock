"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownUp, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddToPortfolioButton } from "@/components/stock/action-buttons";
import { upsertScoredStock } from "@/lib/actions/stocks";
import {
  MARKETS,
  changeColor,
  formatCurrency,
  formatPercent,
  scoreColor,
} from "@/lib/utils";

export type ScreenerStock = {
  id: string;
  ticker: string;
  name: string;
  market: string;
  currency: string;
  currentPrice: number;
  changePct: number;
  promisingScore: number;
  trendScore: number;
  earningsScore: number;
  revenueScore: number;
  rsRating: number;
  sector: string | null;
};

type SortKey =
  | "promisingScore"
  | "ticker"
  | "currentPrice"
  | "changePct"
  | "rsRating";

export function ScreenerClient({ stocks }: { stocks: ScreenerStock[] }) {
  const router = useRouter();
  const [market, setMarket] = useState("ALL");
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("promisingScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [lookup, setLookup] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let rows = [...stocks];
    if (market !== "ALL") rows = rows.filter((s) => s.market === market);
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.sector || "").toLowerCase().includes(q)
      );
    }
    if (minScore > 0) {
      rows = rows.filter((s) => s.promisingScore >= minScore);
    }
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? Number(av) - Number(bv)
        : Number(bv) - Number(av);
    });
    return rows;
  }, [stocks, market, query, minScore, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "ticker" ? "asc" : "desc");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white md:text-3xl">
          Stock Screener
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Filter by market and Promising Score. Sort any column.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MARKETS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMarket(m.id)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              market === m.id
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            className="pl-9"
            placeholder="Search ticker, company, sector…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-full lg:w-40">
          <label className="mb-1 block text-xs text-zinc-500">Min score</label>
          <Input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value) || 0)}
          />
        </div>
        <form
          className="flex w-full gap-2 lg:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            setLookupError("");
            startTransition(async () => {
              const res = await upsertScoredStock(lookup);
              if (res.error) {
                setLookupError(res.error);
                return;
              }
              if (res.ticker) {
                router.push(`/stock/${encodeURIComponent(res.ticker)}`);
                router.refresh();
              }
            });
          }}
        >
          <Input
            placeholder="Lookup ticker (e.g. NVDA, RELIANCE.NS)"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            className="lg:w-72"
          />
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "…" : "Score"}
          </Button>
        </form>
      </div>
      {lookupError && <p className="text-sm text-rose-400">{lookupError}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              {(
                [
                  ["ticker", "Ticker"],
                  ["promisingScore", "Score"],
                  ["currentPrice", "Price"],
                  ["changePct", "Change"],
                  ["rsRating", "RS"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th key={key} className="px-4 py-3 font-medium">
                  <button
                    className="inline-flex items-center gap-1 hover:text-zinc-300"
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    <ArrowDownUp className="h-3 w-3" />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Market</th>
              <th className="px-4 py-3 font-medium">Trend</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {filtered.map((stock) => (
              <tr
                key={stock.id}
                className="bg-zinc-950/30 transition-colors hover:bg-zinc-900/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/stock/${encodeURIComponent(stock.ticker)}`}
                    className="font-semibold text-emerald-300 hover:underline"
                  >
                    {stock.ticker}
                  </Link>
                  <div className="max-w-[180px] truncate text-xs text-zinc-500">
                    {stock.name}
                  </div>
                </td>
                <td
                  className={`px-4 py-3 text-base font-semibold tabular-nums ${scoreColor(stock.promisingScore)}`}
                >
                  {stock.promisingScore.toFixed(1)}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {formatCurrency(stock.currentPrice, stock.currency)}
                </td>
                <td
                  className={`px-4 py-3 tabular-nums ${changeColor(stock.changePct)}`}
                >
                  {formatPercent(stock.changePct)}
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-300">
                  {stock.rsRating.toFixed(0)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{stock.market}</Badge>
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-400">
                  {stock.trendScore.toFixed(1)}/4
                </td>
                <td className="px-4 py-3">
                  <AddToPortfolioButton
                    stockId={stock.id}
                    ticker={stock.ticker}
                    price={stock.currentPrice}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  No stocks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">{filtered.length} results</p>
    </div>
  );
}
