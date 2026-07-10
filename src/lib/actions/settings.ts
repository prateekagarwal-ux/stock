"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function savePolygonApiKey(apiKey: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { polygonApiKey: apiKey.trim() || null },
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function saveDefaultMarket(market: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in" };

  await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, defaultMarket: market },
    update: { defaultMarket: market },
  });
  revalidatePath("/settings");
  revalidatePath("/screener");
  return { success: true };
}
