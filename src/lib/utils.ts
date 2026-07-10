import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency = "USD",
  compact = false
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : value < 10 ? 2 : 2,
  }).format(value);
}

export function formatPercent(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatNumber(value: number, compact = false): string {
  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value);
}

export function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-lime-400";
  if (score >= 4) return "text-amber-400";
  return "text-rose-400";
}

export function scoreBg(score: number): string {
  if (score >= 8) return "bg-emerald-500/15 border-emerald-500/30";
  if (score >= 6) return "bg-lime-500/15 border-lime-500/30";
  if (score >= 4) return "bg-amber-500/15 border-amber-500/30";
  return "bg-rose-500/15 border-rose-500/30";
}

export function changeColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-zinc-400";
}

export const MARKETS = [
  { id: "ALL", label: "All" },
  { id: "USA", label: "USA" },
  { id: "INDIA", label: "India" },
  { id: "JAPAN", label: "Japan" },
  { id: "KOREA", label: "Korea" },
  { id: "OTHERS", label: "Others" },
] as const;

export type MarketId = (typeof MARKETS)[number]["id"];

export const DISCLAIMER =
  "Promising is for educational and informational purposes only. It is not financial advice. Past performance does not guarantee future results. Always do your own research.";

export function detectMarket(ticker: string): MarketId {
  const t = ticker.toUpperCase();
  if (t.endsWith(".NS") || t.endsWith(".BO")) return "INDIA";
  if (t.endsWith(".T")) return "JAPAN";
  if (t.endsWith(".KS") || t.endsWith(".KQ")) return "KOREA";
  if (t.includes(".")) return "OTHERS";
  return "USA";
}

export function marketCurrency(market: string): string {
  switch (market) {
    case "INDIA":
      return "INR";
    case "JAPAN":
      return "JPY";
    case "KOREA":
      return "KRW";
    default:
      return "USD";
  }
}
