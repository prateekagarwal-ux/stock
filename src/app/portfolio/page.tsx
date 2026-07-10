import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center">
        <h1 className="text-2xl font-semibold text-white">Portfolio</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Sign in to track holdings and Promising Scores.
        </p>
        <Link href="/login" className="mt-6 inline-block">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  const holdings = await prisma.holding.findMany({
    where: { userId: session.user.id },
    include: { stock: true },
    orderBy: { addedAt: "desc" },
  });

  return (
    <PortfolioClient
      holdings={holdings.map((h) => ({
        id: h.id,
        quantity: h.quantity,
        addedPrice: h.addedPrice,
        addedAt: h.addedAt.toISOString(),
        lastScoreAt: h.lastScoreAt.toISOString(),
        cachedScore: h.cachedScore,
        stock: {
          id: h.stock.id,
          ticker: h.stock.ticker,
          name: h.stock.name,
          market: h.stock.market,
          currency: h.stock.currency,
          currentPrice: h.stock.currentPrice,
          promisingScore: h.stock.promisingScore,
        },
      }))}
    />
  );
}
