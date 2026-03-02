import { Router } from "express";
import { Product } from "../models/Product.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { category, search, sort = "popular", minPrice, maxPrice, limit } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { tags: { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }

    const priceFilter = {};
    if (minPrice !== undefined) {
      priceFilter.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      priceFilter.$lte = Number(maxPrice);
    }
    if (Object.keys(priceFilter).length > 0) {
      query.price = priceFilter;
    }

    const sortMap = {
      popular: { popularity: -1 },
      rating: { rating: -1 },
      "price-low": { price: 1 },
      "price-high": { price: -1 },
      newest: { createdAt: -1 },
    };

    const resolvedSort = sortMap[sort] || sortMap.popular;
    const resolvedLimit = Math.max(1, Math.min(Number(limit) || 100, 200));

    const products = await Product.find(query).sort(resolvedSort).limit(resolvedLimit);
    res.json({ products });
  } catch (error) {
    console.error("[backend] GET /api/products failed:", error);
    res.status(500).json({ message: "Failed to fetch products." });
  }
});

// GET /api/products/:id - Get single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ id });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    
    res.json({ product });
  } catch (error) {
    console.error("[backend] GET /api/products/:id failed:", error);
    res.status(500).json({ message: "Failed to fetch product." });
  }
});

export default router;
