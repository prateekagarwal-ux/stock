"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Star,
  Settings,
  LogOut,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn, DISCLAIMER } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/screener", label: "Screener", icon: Search },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null } | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070b12] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.06),_transparent_40%)]" />
      <div className="relative flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-800/80 bg-[#0a1018]/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center gap-2 border-b border-zinc-800/80 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white">
                Promising
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                SEPA Discovery
              </div>
            </div>
          </div>
          <nav className="space-y-1 p-3">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800/80 p-4">
            {user ? (
              <div className="space-y-3">
                <div className="truncate text-sm text-zinc-300">
                  {user.name || user.email}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </aside>

        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-800/80 bg-[#070b12]/80 px-4 backdrop-blur-xl lg:px-8">
            <button
              className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden text-sm text-zinc-500 lg:block">
              High-conviction stocks via Minervini SEPA
            </div>
            <div className="text-xs text-zinc-500">Promising Score · 1–10</div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>

          <footer className="border-t border-zinc-800/80 px-4 py-4 lg:px-8">
            <p className="text-center text-[11px] leading-relaxed text-zinc-500">
              {DISCLAIMER}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
