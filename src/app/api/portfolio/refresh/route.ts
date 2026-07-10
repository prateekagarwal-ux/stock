import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { refreshPortfolioScores } from "@/lib/actions/portfolio";

/** Manual / cron-friendly endpoint to refresh portfolio scores */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshPortfolioScores();
  return NextResponse.json(result);
}

export async function GET() {
  return POST();
}
