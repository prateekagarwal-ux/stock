"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginUser } from "@/lib/actions/auth";
import { DISCLAIMER } from "@/lib/utils";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const googleEnabled =
    typeof process.env.NEXT_PUBLIC_GOOGLE_ENABLED !== "undefined"
      ? process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true"
      : false;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-display)] text-2xl">
            Sign in to Promising
          </CardTitle>
          <CardDescription>
            Demo: demo@promising.app / demo1234
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action={(formData) => {
              setError("");
              startTransition(async () => {
                const res = await loginUser(formData);
                if (res?.error) setError(res.error);
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                defaultValue="demo@promising.app"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                defaultValue="demo1234"
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-zinc-500">
            <div className="h-px flex-1 bg-zinc-800" />
            OR
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Continue with Google
          </Button>
          {!googleEnabled && (
            <p className="mt-2 text-center text-[11px] text-zinc-500">
              Google sign-in requires AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET in
              .env
            </p>
          )}

          <p className="mt-6 text-center text-sm text-zinc-400">
            No account?{" "}
            <Link href="/register" className="text-emerald-400 hover:underline">
              Create one
            </Link>
          </p>
          <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
            {DISCLAIMER}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
