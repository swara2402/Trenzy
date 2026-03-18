import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import { getEnvConfig } from "./config/env.js";
import { createRateLimiter } from "./middleware/rateLimit.js";
import { enforceHttps, securityHeaders } from "./middleware/security.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const env = getEnvConfig();
const app = express();

if (env.trustProxy) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(enforceHttps({ enabled: env.enforceHttps }));

const globalRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 180,
  keyPrefix: "global",
});
const authRateLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 20,
  keyPrefix: "auth",
});
const writeRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 90,
  keyPrefix: "write",
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(globalRateLimit);
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "smartcart-backend" });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRateLimit, authRoutes);
app.use("/api/users", writeRateLimit, userRoutes);
app.use("/api/orders", writeRateLimit, orderRoutes);
app.use("/api/payments", writeRateLimit, paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/groups", writeRateLimit, groupRoutes);
app.use("/api/suggestions", writeRateLimit, suggestionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);

app.use((error, _req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ message: "Payload too large." });
  }
  if (error?.message === "CORS origin not allowed.") {
    return res.status(403).json({ message: "Origin not allowed." });
  }
  return next(error);
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, _req, res, _next) => {
  console.error("[backend] Unhandled error:", error);
  return res.status(500).json({ message: "Internal server error." });
});

async function start() {
  try {
    await connectDB(env.mongoUri);
    app.listen(env.port, () => {
      console.log(`[backend] Server running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("[backend] Failed to start:", error);
    process.exit(1);
  }
}

start();
