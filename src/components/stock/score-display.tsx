import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, scoreBg, scoreColor } from "@/lib/utils";
import type { TrendChecks } from "@/lib/scoring/types";

export function PromisingScoreHero({
  score,
  explanation,
}: {
  score: number;
  explanation: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 md:p-8",
        scoreBg(score)
      )}
    >
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
        Promising Score
      </div>
      <div className={cn("mt-2 font-[family-name:var(--font-display)] text-6xl font-semibold md:text-7xl", scoreColor(score))}>
        {score.toFixed(1)}
        <span className="text-2xl text-zinc-500 md:text-3xl">/10</span>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300">
        {explanation}
      </p>
    </div>
  );
}

export function ScoreBreakdownCards({
  trendScore,
  earningsScore,
  revenueScore,
  otherScore,
}: {
  trendScore: number;
  earningsScore: number;
  revenueScore: number;
  otherScore: number;
}) {
  const items = [
    {
      label: "Trend Strength",
      score: trendScore,
      max: 4,
      color: "bg-emerald-500",
      desc: "8-Point Trend Template",
    },
    {
      label: "Earnings Momentum",
      score: earningsScore,
      max: 3,
      color: "bg-sky-500",
      desc: "EPS growth QoQ & YoY",
    },
    {
      label: "Revenue Momentum",
      score: revenueScore,
      max: 2,
      color: "bg-violet-500",
      desc: "Revenue growth QoQ & YoY",
    },
    {
      label: "Other Factors",
      score: otherScore,
      max: 1,
      color: "bg-amber-500",
      desc: "52w high proximity & volume",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-zinc-100">
              {item.score.toFixed(1)}
              <span className="text-sm text-zinc-500">/{item.max.toFixed(1)}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={cn("h-full rounded-full", item.color)}
                style={{ width: `${(item.score / item.max) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">{item.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TrendTemplateChecklist({ checks }: { checks: TrendChecks }) {
  const entries = Object.entries(checks) as [
    string,
    TrendChecks[keyof TrendChecks],
  ][];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minervini 8-Point Trend Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map(([key, check], i) => (
          <div
            key={key}
            className="flex gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3"
          >
            <div className="mt-0.5 shrink-0">
              {check.passed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-200">
                <span className="mr-2 text-zinc-500">{i + 1}.</span>
                {check.label}
              </div>
              <div className="mt-1 text-xs text-zinc-500">{check.detail}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
