import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  calculatePromisingScore,
  ma200SlopeFromCloses,
  sma,
} from "../src/lib/scoring/promising-score";
import type { OHLCV } from "../src/lib/scoring/types";

const prisma = new PrismaClient();

type SeedStock = {
  ticker: string;
  name: string;
  market: string;
  exchange: string;
  sector: string;
  currency: string;
  basePrice: number;
  trend: "strong" | "moderate" | "weak";
  epsGrowthQoQ: number;
  epsGrowthYoY: number;
  revGrowthQoQ: number;
  revGrowthYoY: number;
  rsRating: number;
};

const SEED_STOCKS: SeedStock[] = [
  // USA
  { ticker: "NVDA", name: "NVIDIA Corporation", market: "USA", exchange: "NASDAQ", sector: "Technology", currency: "USD", basePrice: 875, trend: "strong", epsGrowthQoQ: 85, epsGrowthYoY: 120, revGrowthQoQ: 55, revGrowthYoY: 90, rsRating: 96 },
  { ticker: "META", name: "Meta Platforms Inc.", market: "USA", exchange: "NASDAQ", sector: "Technology", currency: "USD", basePrice: 520, trend: "strong", epsGrowthQoQ: 42, epsGrowthYoY: 55, revGrowthQoQ: 28, revGrowthYoY: 35, rsRating: 88 },
  { ticker: "AMZN", name: "Amazon.com Inc.", market: "USA", exchange: "NASDAQ", sector: "Consumer Cyclical", currency: "USD", basePrice: 185, trend: "strong", epsGrowthQoQ: 38, epsGrowthYoY: 48, revGrowthQoQ: 14, revGrowthYoY: 13, rsRating: 82 },
  { ticker: "AVGO", name: "Broadcom Inc.", market: "USA", exchange: "NASDAQ", sector: "Technology", currency: "USD", basePrice: 165, trend: "strong", epsGrowthQoQ: 45, epsGrowthYoY: 60, revGrowthQoQ: 32, revGrowthYoY: 40, rsRating: 91 },
  { ticker: "LLY", name: "Eli Lilly and Company", market: "USA", exchange: "NYSE", sector: "Healthcare", currency: "USD", basePrice: 780, trend: "strong", epsGrowthQoQ: 65, epsGrowthYoY: 80, revGrowthQoQ: 35, revGrowthYoY: 45, rsRating: 94 },
  { ticker: "COST", name: "Costco Wholesale Corp.", market: "USA", exchange: "NASDAQ", sector: "Consumer Defensive", currency: "USD", basePrice: 780, trend: "moderate", epsGrowthQoQ: 18, epsGrowthYoY: 16, revGrowthQoQ: 9, revGrowthYoY: 8, rsRating: 74 },
  { ticker: "CRM", name: "Salesforce Inc.", market: "USA", exchange: "NYSE", sector: "Technology", currency: "USD", basePrice: 290, trend: "moderate", epsGrowthQoQ: 22, epsGrowthYoY: 30, revGrowthQoQ: 11, revGrowthYoY: 12, rsRating: 71 },
  { ticker: "INTC", name: "Intel Corporation", market: "USA", exchange: "NASDAQ", sector: "Technology", currency: "USD", basePrice: 32, trend: "weak", epsGrowthQoQ: -15, epsGrowthYoY: -25, revGrowthQoQ: -5, revGrowthYoY: -8, rsRating: 28 },
  { ticker: "BA", name: "The Boeing Company", market: "USA", exchange: "NYSE", sector: "Industrials", currency: "USD", basePrice: 175, trend: "weak", epsGrowthQoQ: -40, epsGrowthYoY: -20, revGrowthQoQ: 5, revGrowthYoY: 8, rsRating: 35 },
  { ticker: "TSLA", name: "Tesla Inc.", market: "USA", exchange: "NASDAQ", sector: "Consumer Cyclical", currency: "USD", basePrice: 245, trend: "moderate", epsGrowthQoQ: 8, epsGrowthYoY: -12, revGrowthQoQ: 6, revGrowthYoY: 3, rsRating: 68 },
  { ticker: "MSFT", name: "Microsoft Corporation", market: "USA", exchange: "NASDAQ", sector: "Technology", currency: "USD", basePrice: 420, trend: "strong", epsGrowthQoQ: 20, epsGrowthYoY: 22, revGrowthQoQ: 15, revGrowthYoY: 16, rsRating: 85 },
  { ticker: "AAPL", name: "Apple Inc.", market: "USA", exchange: "NASDAQ", sector: "Technology", currency: "USD", basePrice: 195, trend: "moderate", epsGrowthQoQ: 6, epsGrowthYoY: 8, revGrowthQoQ: 4, revGrowthYoY: 5, rsRating: 62 },
  // India
  { ticker: "RELIANCE.NS", name: "Reliance Industries", market: "INDIA", exchange: "NSE", sector: "Energy", currency: "INR", basePrice: 2950, trend: "moderate", epsGrowthQoQ: 15, epsGrowthYoY: 18, revGrowthQoQ: 10, revGrowthYoY: 12, rsRating: 72 },
  { ticker: "TCS.NS", name: "Tata Consultancy Services", market: "INDIA", exchange: "NSE", sector: "Technology", currency: "INR", basePrice: 3850, trend: "moderate", epsGrowthQoQ: 12, epsGrowthYoY: 10, revGrowthQoQ: 8, revGrowthYoY: 9, rsRating: 65 },
  { ticker: "INFY.NS", name: "Infosys Limited", market: "INDIA", exchange: "NSE", sector: "Technology", currency: "INR", basePrice: 1580, trend: "moderate", epsGrowthQoQ: 9, epsGrowthYoY: 7, revGrowthQoQ: 6, revGrowthYoY: 5, rsRating: 58 },
  { ticker: "HDFCBANK.NS", name: "HDFC Bank Limited", market: "INDIA", exchange: "NSE", sector: "Financials", currency: "INR", basePrice: 1680, trend: "strong", epsGrowthQoQ: 25, epsGrowthYoY: 20, revGrowthQoQ: 18, revGrowthYoY: 16, rsRating: 78 },
  { ticker: "BHARTIARTL.NS", name: "Bharti Airtel Limited", market: "INDIA", exchange: "NSE", sector: "Communication", currency: "INR", basePrice: 1450, trend: "strong", epsGrowthQoQ: 35, epsGrowthYoY: 40, revGrowthQoQ: 20, revGrowthYoY: 22, rsRating: 86 },
  // Japan
  { ticker: "7203.T", name: "Toyota Motor Corp.", market: "JAPAN", exchange: "TSE", sector: "Consumer Cyclical", currency: "JPY", basePrice: 2850, trend: "moderate", epsGrowthQoQ: 14, epsGrowthYoY: 18, revGrowthQoQ: 8, revGrowthYoY: 10, rsRating: 70 },
  { ticker: "6758.T", name: "Sony Group Corporation", market: "JAPAN", exchange: "TSE", sector: "Technology", currency: "JPY", basePrice: 13200, trend: "strong", epsGrowthQoQ: 28, epsGrowthYoY: 32, revGrowthQoQ: 12, revGrowthYoY: 15, rsRating: 80 },
  { ticker: "9984.T", name: "SoftBank Group Corp.", market: "JAPAN", exchange: "TSE", sector: "Technology", currency: "JPY", basePrice: 9200, trend: "moderate", epsGrowthQoQ: 50, epsGrowthYoY: -10, revGrowthQoQ: 5, revGrowthYoY: 3, rsRating: 75 },
  { ticker: "8306.T", name: "Mitsubishi UFJ Financial", market: "JAPAN", exchange: "TSE", sector: "Financials", currency: "JPY", basePrice: 1680, trend: "strong", epsGrowthQoQ: 22, epsGrowthYoY: 30, revGrowthQoQ: 10, revGrowthYoY: 12, rsRating: 77 },
  // Korea
  { ticker: "005930.KS", name: "Samsung Electronics", market: "KOREA", exchange: "KRX", sector: "Technology", currency: "KRW", basePrice: 72000, trend: "moderate", epsGrowthQoQ: 40, epsGrowthYoY: 55, revGrowthQoQ: 15, revGrowthYoY: 18, rsRating: 73 },
  { ticker: "000660.KS", name: "SK Hynix Inc.", market: "KOREA", exchange: "KRX", sector: "Technology", currency: "KRW", basePrice: 195000, trend: "strong", epsGrowthQoQ: 120, epsGrowthYoY: 200, revGrowthQoQ: 60, revGrowthYoY: 90, rsRating: 95 },
  { ticker: "035420.KS", name: "NAVER Corporation", market: "KOREA", exchange: "KRX", sector: "Technology", currency: "KRW", basePrice: 185000, trend: "moderate", epsGrowthQoQ: 18, epsGrowthYoY: 12, revGrowthQoQ: 14, revGrowthYoY: 11, rsRating: 69 },
  // Others
  { ticker: "SAP.DE", name: "SAP SE", market: "OTHERS", exchange: "XETRA", sector: "Technology", currency: "EUR", basePrice: 195, trend: "strong", epsGrowthQoQ: 30, epsGrowthYoY: 35, revGrowthQoQ: 12, revGrowthYoY: 14, rsRating: 84 },
  { ticker: "ASML.AS", name: "ASML Holding N.V.", market: "OTHERS", exchange: "AMS", sector: "Technology", currency: "EUR", basePrice: 720, trend: "strong", epsGrowthQoQ: 25, epsGrowthYoY: 28, revGrowthQoQ: 18, revGrowthYoY: 20, rsRating: 87 },
  { ticker: "NESN.SW", name: "Nestlé S.A.", market: "OTHERS", exchange: "SWX", sector: "Consumer Defensive", currency: "CHF", basePrice: 88, trend: "weak", epsGrowthQoQ: 3, epsGrowthYoY: 2, revGrowthQoQ: 2, revGrowthYoY: 1, rsRating: 42 },
];

function generateBars(seed: SeedStock): OHLCV[] {
  const bars: OHLCV[] = [];
  const days = 320;
  let price = seed.basePrice * (seed.trend === "strong" ? 0.45 : seed.trend === "moderate" ? 0.7 : 1.1);
  const start = new Date();
  start.setDate(start.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const progress = i / days;
    let drift = 0;
    if (seed.trend === "strong") {
      drift = 0.004 + progress * 0.002;
    } else if (seed.trend === "moderate") {
      drift = 0.0015 + Math.sin(progress * Math.PI) * 0.001;
    } else {
      drift = -0.0005 + Math.sin(progress * 4) * 0.003;
    }

    const noise = (Math.sin(i * 1.7 + seed.basePrice) + Math.cos(i * 0.9)) * 0.008;
    const open = price;
    const close = Math.max(0.01, price * (1 + drift + noise));
    const high = Math.max(open, close) * (1 + Math.abs(noise) * 0.5);
    const low = Math.min(open, close) * (1 - Math.abs(noise) * 0.5);
    const volume =
      seed.basePrice *
      1000 *
      (0.8 + Math.abs(Math.sin(i / 7)) * 0.8) *
      (seed.trend === "strong" && progress > 0.85 ? 1.6 : 1);

    bars.push({
      time: date.toISOString().slice(0, 10),
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume: Math.round(volume),
    });
    price = close;
  }

  // Pull last price near base for realism
  const last = bars[bars.length - 1];
  const adjust = seed.basePrice / last.close;
  return bars.map((b) => ({
    ...b,
    open: round(b.open * adjust),
    high: round(b.high * adjust),
    low: round(b.low * adjust),
    close: round(b.close * adjust),
  }));
}

function round(n: number) {
  if (n >= 1000) return Math.round(n * 100) / 100;
  if (n >= 10) return Math.round(n * 100) / 100;
  return Math.round(n * 1000) / 1000;
}

async function main() {
  console.log("Seeding Promising database…");

  await prisma.watchlistItem.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("demo1234", 10);
  const demoUser = await prisma.user.create({
    data: {
      name: "Demo Trader",
      email: "demo@promising.app",
      password,
      settings: { create: { defaultMarket: "ALL" } },
    },
  });

  for (const seed of SEED_STOCKS) {
    const bars = generateBars(seed);
    const closes = bars.map((b) => b.close);
    const volumes = bars.map((b) => b.volume);
    const currentPrice = closes[closes.length - 1];
    const prev = closes[closes.length - 2] || currentPrice;
    const yearBars = bars.slice(-252);
    const metrics = {
      currentPrice,
      ma50: sma(closes, 50),
      ma150: sma(closes, 150),
      ma200: sma(closes, 200),
      ma200Slope: ma200SlopeFromCloses(closes),
      high52w: Math.max(...yearBars.map((b) => b.high)),
      low52w: Math.min(...yearBars.map((b) => b.low)),
      rsRating: seed.rsRating,
      volume: volumes[volumes.length - 1],
      avgVolume: sma(volumes, 50),
      epsGrowthQoQ: seed.epsGrowthQoQ,
      epsGrowthYoY: seed.epsGrowthYoY,
      revGrowthQoQ: seed.revGrowthQoQ,
      revGrowthYoY: seed.revGrowthYoY,
    };
    const score = calculatePromisingScore(metrics);

    await prisma.stock.create({
      data: {
        ticker: seed.ticker,
        name: seed.name,
        market: seed.market,
        exchange: seed.exchange,
        sector: seed.sector,
        currency: seed.currency,
        currentPrice: metrics.currentPrice,
        changePct: ((currentPrice - prev) / prev) * 100,
        volume: metrics.volume,
        avgVolume: metrics.avgVolume,
        high52w: metrics.high52w,
        low52w: metrics.low52w,
        ma50: metrics.ma50,
        ma150: metrics.ma150,
        ma200: metrics.ma200,
        ma200Slope: metrics.ma200Slope,
        rsRating: metrics.rsRating,
        epsGrowthQoQ: metrics.epsGrowthQoQ,
        epsGrowthYoY: metrics.epsGrowthYoY,
        revGrowthQoQ: metrics.revGrowthQoQ,
        revGrowthYoY: metrics.revGrowthYoY,
        promisingScore: score.promisingScore,
        trendScore: score.trendScore,
        earningsScore: score.earningsScore,
        revenueScore: score.revenueScore,
        otherScore: score.otherScore,
        trendChecks: JSON.stringify(score.trendChecks),
        priceHistory: JSON.stringify(bars.slice(-365)),
        lastScoredAt: new Date(),
      },
    });
  }

  const top = await prisma.stock.findMany({
    orderBy: { promisingScore: "desc" },
    take: 3,
  });

  for (const s of top) {
    await prisma.holding.create({
      data: {
        userId: demoUser.id,
        stockId: s.id,
        quantity: s.market === "USA" ? 10 : 5,
        addedPrice: s.currentPrice * 0.92,
        cachedScore: s.promisingScore,
        lastScoreAt: new Date(),
      },
    });
  }

  const watch = await prisma.stock.findMany({
    orderBy: { promisingScore: "desc" },
    skip: 3,
    take: 4,
  });
  for (const s of watch) {
    await prisma.watchlistItem.create({
      data: { userId: demoUser.id, stockId: s.id },
    });
  }

  console.log(`Seeded ${SEED_STOCKS.length} stocks`);
  console.log("Demo login: demo@promising.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
