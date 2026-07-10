import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { removeFromWatchlist } from "@/lib/actions/watchlist";
import {
  changeColor,
  formatCurrency,
  formatPercent,
  scoreColor,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center">
        <h1 className="text-2xl font-semibold text-white">Watchlist</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Sign in to save stocks to your watchlist.
        </p>
        <Link href="/login" className="mt-6 inline-block">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    include: { stock: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white md:text-3xl">
          Watchlist
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stocks you&apos;re tracking for SEPA setups
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Market</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Change</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {items.map((item) => (
              <tr key={item.id} className="bg-zinc-950/30 hover:bg-zinc-900/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/stock/${encodeURIComponent(item.stock.ticker)}`}
                    className="font-semibold text-emerald-300 hover:underline"
                  >
                    {item.stock.ticker}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-400">{item.stock.name}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{item.stock.market}</Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(item.stock.currentPrice, item.stock.currency)}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${changeColor(item.stock.changePct)}`}
                >
                  {formatPercent(item.stock.changePct)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold tabular-nums ${scoreColor(item.stock.promisingScore)}`}
                >
                  {item.stock.promisingScore.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await removeFromWatchlist(item.id);
                    }}
                  >
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-zinc-500"
                >
                  Your watchlist is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
