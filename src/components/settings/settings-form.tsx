"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MARKETS } from "@/lib/utils";
import { saveDefaultMarket, savePolygonApiKey } from "@/lib/actions/settings";

export function SettingsForm({
  hasPolygonKey,
  defaultMarket,
}: {
  hasPolygonKey: boolean;
  defaultMarket: string;
}) {
  const [apiKey, setApiKey] = useState("");
  const [market, setMarket] = useState(defaultMarket);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure data sources and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Polygon.io API Key</CardTitle>
          <CardDescription>
            Used as the primary data source for USA stocks. Leave blank to use
            Yahoo Finance fallback.{" "}
            {hasPolygonKey ? (
              <span className="text-emerald-400">Key saved.</span>
            ) : (
              <span className="text-amber-400">No key saved.</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="polygon">API Key</Label>
            <Input
              id="polygon"
              type="password"
              placeholder="Enter Polygon.io API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await savePolygonApiKey(apiKey);
                setMessage(res.error || "Polygon API key saved");
              })
            }
          >
            Save API Key
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Market</CardTitle>
          <CardDescription>
            Preferred market filter when opening the screener
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMarket(m.id)}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  market === m.id
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "border-zinc-800 text-zinc-400"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await saveDefaultMarket(market);
                setMessage(res.error || "Default market saved");
              })
            }
          >
            Save Preference
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <p>
            <span className="text-zinc-200">USA:</span> Polygon.io (primary) →
            Yahoo Finance fallback
          </p>
          <p>
            <span className="text-zinc-200">India (.NS):</span> Yahoo Finance
          </p>
          <p>
            <span className="text-zinc-200">Japan (.T):</span> Yahoo Finance
          </p>
          <p>
            <span className="text-zinc-200">Korea (.KS / .KQ):</span> Yahoo
            Finance
          </p>
          <p>
            <span className="text-zinc-200">Others:</span> Yahoo Finance where
            supported
          </p>
        </CardContent>
      </Card>

      {message && <p className="text-sm text-emerald-400">{message}</p>}
    </div>
  );
}
