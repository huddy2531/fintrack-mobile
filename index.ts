import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });
app.get("/api/market-data", async (_req, res) => {
    try {
      const assets = [];
      
      // Fetch Forex
      const forexRes = await fetch("https://v6.exchangerate-api.com/v6/e47e8d1dfc2496cab101a168/latest/USD");
      const forexData = await forexRes.json();
      const rates = forexData.conversion_rates;
      
      assets.push({
        id: "EURUSD",
        symbol: "EUR/USD",
        name: "Euro to US Dollar",
        type: "forex",
        price: 1 / rates.EUR,
        change24h: 0,
        change24hPercent: 0.15,
        lastUpdated: Date.now(),
        provider: "Exchange Rate API"
      });
      
      // Fetch Crypto
      const btcRes = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
      const btcData = await btcRes.json();
      
      assets.push({
        id: "BTCUSDT",
        symbol: "BTC/USD",
        name: "Bitcoin",
        type: "crypto",
        price: parseFloat(btcData.lastPrice),
        change24h: parseFloat(btcData.priceChange),
        change24hPercent: parseFloat(btcData.priceChangePercent),
        lastUpdated: btcData.closeTime,
        provider: "Binance"
      });
      
      res.json(assets);
    } catch (error) {
      console.error("Market data error:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
