import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="text-3xl font-semibold text-white">Stock not found</h1>
      <p className="mt-2 text-zinc-400">
        Try looking it up from the screener to score a new ticker.
      </p>
      <Link href="/screener" className="mt-6 inline-block">
        <Button>Go to Screener</Button>
      </Link>
    </div>
  );
}
