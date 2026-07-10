# Promising

Professional dark-mode stock discovery platform built around **Mark Minervini’s SEPA methodology** and his exact **8-Point Trend Template**.

The star feature is a transparent **Promising Score (1–10)** that ranks stocks on Trend Strength, Earnings Momentum, Revenue Momentum, and Other Factors.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI
- TradingView Lightweight Charts
- Prisma + SQLite (swap `DATABASE_URL` for PostgreSQL in production)
- NextAuth (Email/Password + optional Google)
- Polygon.io (USA) + Yahoo Finance (international)

## Quick start

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo account:** `demo@promising.app` / `demo1234`

## Promising Score (1–10)

| Component | Max | Basis |
|-----------|-----|--------|
| Trend Strength | 4.0 | 0.5 × each of Minervini’s 8 Trend Template points met |
| Earnings Momentum | 3.0 | EPS growth QoQ & YoY |
| Revenue Momentum | 2.0 | Revenue growth QoQ & YoY |
| Other Factors | 1.0 | Proximity to 52-week high + volume |

### Exact 8-Point Trend Template

1. Price above both 150-day and 200-day MAs  
2. 150-day MA above 200-day MA  
3. 200-day MA trending up (≥ ~1 month)  
4. 50-day MA above both 150-day and 200-day MAs  
5. Price above 50-day MA  
6. Price ≥ 25% above 52-week low  
7. Price within 25% of 52-week high  
8. Relative Strength rating ≥ 70  

## Markets

| Tab | Source |
|-----|--------|
| USA | Polygon.io (primary), Yahoo fallback |
| India | Yahoo (`.NS`) |
| Japan | Yahoo (`.T`) |
| Korea | Yahoo (`.KS` / `.KQ`) |
| Others | Yahoo where supported |

Add your Polygon API key in **Settings**.

## Features

- Auth (email/password + Google when configured)
- Multi-market screener with filters & sorting
- Stock detail: chart, score breakdown, Trend Template checklist
- Dashboard: top Promising stocks
- Portfolio: one-click add with quantity, returns, score auto-refresh every 2 hours
- Watchlist
- Legal disclaimer on every page

## Environment

See `.env.example`:

- `DATABASE_URL` — SQLite by default (`file:./dev.db`)
- `AUTH_SECRET` — required for NextAuth
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — optional Google OAuth
- `POLYGON_API_KEY` — optional default USA data key

## Disclaimer

Promising is for educational and informational purposes only. It is not financial advice. Past performance does not guarantee future results. Always do your own research.
