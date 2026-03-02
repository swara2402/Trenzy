import "dotenv/config";
import { connectDB } from "./config/db.js";
import { Product } from "./models/Product.js";
import { seedProducts } from "./data/seedProducts.js";

async function run() {
  try {
    await connectDB(process.env.MONGODB_URI);
    await Product.deleteMany({});
    await Product.insertMany(seedProducts);
    console.log(`[backend] Seeded ${seedProducts.length} products`);
    process.exit(0);
  } catch (error) {
    console.error("[backend] Seed failed:", error);
    process.exit(1);
  }
}

run();
