import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:8080";

if (!process.env.JWT_SECRET) {
  console.error("[backend] Missing JWT_SECRET in environment variables.");
  process.exit(1);
}

app.use(
  cors({
    origin: [clientOrigin, "http://localhost:8081", "http://localhost:8082", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "smartcart-backend" });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(port, () => {
      console.log(`[backend] Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("[backend] Failed to start:", error);
    process.exit(1);
  }
}

start();
