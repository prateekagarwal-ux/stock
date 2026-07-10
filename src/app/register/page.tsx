"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerUser } from "@/lib/actions/auth";
import { DISCLAIMER } from "@/lib/utils";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-display)] text-2xl">
            Create your account
          </CardTitle>
          <CardDescription>
            Track portfolios and Promising Scores across markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action={(formData) => {
              setError("");
              startTransition(async () => {
                const res = await registerUser(formData);
                if (res?.error) setError(res.error);
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
                placeholder="At least 6 characters"
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline">
              Sign in
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
