"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addToPortfolio } from "@/lib/actions/portfolio";
import { toggleWatchlist } from "@/lib/actions/watchlist";

export function AddToPortfolioButton({
  stockId,
  ticker,
  price,
}: {
  stockId: string;
  ticker: string;
  price: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("10");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!session) {
    return (
      <Button variant="secondary" onClick={() => router.push("/login")}>
        <Plus className="h-4 w-4" />
        Add to Portfolio
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add to Portfolio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {ticker} to Portfolio</DialogTitle>
          <DialogDescription>
            Enter the quantity you want to track. Current price:{" "}
            {price.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            const quantity = parseFloat(qty);
            if (!quantity || quantity <= 0) {
              setError("Enter a valid quantity");
              return;
            }
            startTransition(async () => {
              const res = await addToPortfolio(stockId, quantity);
              if (res.error) {
                setError(res.error);
                return;
              }
              setOpen(false);
              router.push("/portfolio");
              router.refresh();
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min="0.0001"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Adding…" : "Confirm Add"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WatchlistButton({
  stockId,
  initialWatched,
}: {
  stockId: string;
  initialWatched?: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [watched, setWatched] = useState(!!initialWatched);
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!session) {
          router.push("/login");
          return;
        }
        startTransition(async () => {
          const res = await toggleWatchlist(stockId);
          if (!res.error) {
            setWatched(!!res.watched);
            router.refresh();
          }
        });
      }}
    >
      <Star
        className={`h-4 w-4 ${watched ? "fill-amber-400 text-amber-400" : ""}`}
      />
      {watched ? "Watching" : "Watch"}
    </Button>
  );
}
