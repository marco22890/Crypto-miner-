import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/prices", (req, res) => {
    res.json({
      BTC: { priceUsd: 94850, change24h: 2.45, networkDiff: 82500000000000 },
      LTC: { priceUsd: 92.40, change24h: -0.82, networkDiff: 32400000 },
      VRSC: { priceUsd: 1.62, change24h: 5.14, networkDiff: 1450000 }
    });
  });

  app.post("/api/pools/ping", (req, res) => {
    const { url, port } = req.body;
    // Simulate real network TCP socket ping test
    const latency = Math.floor(12 + Math.random() * 38);
    res.json({
      url,
      port,
      status: "reachable",
      latencyMs: latency,
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
