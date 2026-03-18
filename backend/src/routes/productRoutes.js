import { Router } from "express";
import { asTrimmedString, isSafeId, validatePaginationLimit } from "../middleware/validate.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.auth?.sub).select("isAdmin");
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required." });
    }
    return next();
  } catch (error) {
    console.error("[backend] admin authorization failed:", error);
    return res.status(500).json({ message: "Failed to authorize admin access." });
  }
}

function runLinearRegression(points) {
  const n = points.length;
  if (n < 2) {
    return null;
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i += 1) {
    const x = i;
    const y = Number(points[i].price);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = (n * sumXX) - (sumX * sumX);
  if (denominator === 0) {
    return null;
  }

  const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
  const intercept = (sumY - (slope * sumX)) / n;
  const nextX = n;
  const predicted = (slope * nextX) + intercept;

  return {
    slope,
    intercept,
    predictedPrice: Math.max(0, Number(predicted.toFixed(2))),
  };
}

router.get("/", async (req, res) => {
  try {
    const category = asTrimmedString(req.query.category);
    const search = asTrimmedString(req.query.search);
    const color = asTrimmedString(req.query.color);
    const sort = asTrimmedString(req.query.sort || "popular");
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const limit = req.query.limit;

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

    if (color) {
      query.tags = { $regex: color, $options: "i" };
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
    const resolvedLimit = validatePaginationLimit(limit, { min: 1, max: 200, defaultValue: 100 });

    const products = await Product.find(query).sort(resolvedSort).limit(resolvedLimit);
    res.json({ products });
  } catch (error) {
    console.error("[backend] GET /api/products failed:", error);
    res.status(500).json({ message: "Failed to fetch products." });
  }
});

// POST /api/products/:id/price-history - Store historical price point (admin)
router.post("/:id/price-history", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isSafeId(id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }
    const { price, recordedAt } = req.body || {};

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: "Valid non-negative price is required." });
    }

    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const entryDate = recordedAt ? new Date(recordedAt) : new Date();
    if (Number.isNaN(entryDate.getTime())) {
      return res.status(400).json({ message: "Invalid recordedAt date." });
    }

    product.priceHistory = [
      ...(product.priceHistory || []),
      { price: numericPrice, recordedAt: entryDate },
    ]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-180);

    product.price = numericPrice;
    await product.save();

    return res.status(201).json({ priceHistory: product.priceHistory, currentPrice: product.price });
  } catch (error) {
    console.error("[backend] POST /api/products/:id/price-history failed:", error);
    return res.status(500).json({ message: "Failed to store historical price data." });
  }
});

// GET /api/products/:id/price-trend - Historical trend with simple regression prediction
router.get("/:id/price-trend", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isSafeId(id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }
    const pointsLimit = validatePaginationLimit(req.query.limit, { min: 2, max: 120, defaultValue: 30 });

    const product = await Product.findOne({ id }).select("id name price priceHistory");
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    let history = [...(product.priceHistory || [])]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-pointsLimit);

    if (history.length < 2) {
      const now = new Date();
      const prior = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      const currentPrice = Number(product.price) || 0;
      history = [
        { price: currentPrice, recordedAt: prior.toISOString() },
        { price: currentPrice, recordedAt: now.toISOString() },
      ];
    }

    const regression = runLinearRegression(history);

    return res.json({
      productId: product.id,
      productName: product.name,
      currentPrice: product.price,
      history,
      model: regression
        ? { type: "linear_regression", ...regression }
        : { type: "none", predictedPrice: Number(product.price) || 0 },
    });
  } catch (error) {
    console.error("[backend] GET /api/products/:id/price-trend failed:", error);
    return res.status(500).json({ message: "Failed to fetch price trend." });
  }
});

// GET /api/products/:id/people-also-bought - Get associated products
router.get("/:id/people-also-bought", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isSafeId(id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }
    const limit = validatePaginationLimit(req.query.limit, { min: 1, max: 12, defaultValue: 4 });

    const currentProduct = await Product.findOne({ id }).select("id category");
    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    const scoreMap = new Map();

    const usersWithPurchases = await User.find({
      purchaseHistory: id,
    }).select("purchaseHistory");

    for (const user of usersWithPurchases) {
      for (const productId of user.purchaseHistory || []) {
        if (productId === id) continue;
        scoreMap.set(productId, (scoreMap.get(productId) || 0) + 3);
      }
    }

    const usersWithViews = await User.find({
      "browsingHistory.productId": id,
    }).select("browsingHistory");

    for (const user of usersWithViews) {
      const uniqueViewedIds = new Set((user.browsingHistory || []).map((entry) => entry.productId));
      uniqueViewedIds.delete(id);
      for (const productId of uniqueViewedIds) {
        scoreMap.set(productId, (scoreMap.get(productId) || 0) + 1);
      }
    }

    const sortedAssociatedIds = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([productId]) => productId);

    let products = [];
    if (sortedAssociatedIds.length > 0) {
      const associated = await Product.find({
        id: { $in: sortedAssociatedIds },
      }).select("-__v");

      const productMap = new Map(associated.map((product) => [product.id, product]));
      products = sortedAssociatedIds
        .map((productId) => productMap.get(productId))
        .filter(Boolean)
        .slice(0, limit);
    }

    if (products.length < limit) {
      const seen = new Set([id, ...products.map((product) => product.id)]);
      const fallback = await Product.find({
        category: currentProduct.category,
        id: { $nin: Array.from(seen) },
      })
        .sort({ popularity: -1, rating: -1 })
        .limit(limit - products.length)
        .select("-__v");
      products = [...products, ...fallback];
    }

    return res.json({ products });
  } catch (error) {
    console.error("[backend] GET /api/products/:id/people-also-bought failed:", error);
    return res.status(500).json({ message: "Failed to fetch related products." });
  }
});

// GET /api/products/:id - Get single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isSafeId(id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }
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
