import type { Metadata } from "next";
import { DM_Sans, Instrument_Sans } from "next/font/google";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const display = DM_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Promising — SEPA Stock Discovery",
  description:
    "Find high-conviction stocks using Mark Minervini's SEPA methodology and 8-Point Trend Template. Transparent Promising Score (1–10).",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <Providers>
          <AppShell user={session?.user}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
