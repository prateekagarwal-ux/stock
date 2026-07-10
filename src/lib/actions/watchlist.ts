"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleWatchlist(stockId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in" };

  const existing = await prisma.watchlistItem.findUnique({
    where: {
      userId_stockId: { userId: session.user.id, stockId },
    },
  });

  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/watchlist");
    return { watched: false };
  }

  await prisma.watchlistItem.create({
    data: { userId: session.user.id, stockId },
  });
  revalidatePath("/watchlist");
  return { watched: true };
}

export async function removeFromWatchlist(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in" };

  await prisma.watchlistItem.deleteMany({
    where: { id: itemId, userId: session.user.id },
  });
  revalidatePath("/watchlist");
  return { success: true };
}
