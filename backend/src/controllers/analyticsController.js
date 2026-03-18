import { 
  DailyAnalytics, 
  PageView, 
  ProductView, 
  CartAction, 
  SearchQuery,
  CartAbandonment 
} from "../models/Analytics.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { asTrimmedString, isSafeId, validatePaginationLimit } from "../middleware/validate.js";
import crypto from "crypto";

// Generate or get session ID
function getSessionId(req) {
  const existingSession = req.headers["x-session-id"];
  if (existingSession) return existingSession;
  
  return crypto.randomBytes(16).toString("hex");
}

// Get client info
function getClientInfo(req) {
  const userAgent = req.headers["user-agent"] || "";
  let deviceType = "desktop";
  
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    deviceType = "mobile";
  } else if (/tablet/i.test(userAgent)) {
    deviceType = "tablet";
  }
  
  return {
    deviceType,
    browser: getBrowser(userAgent),
    ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
        req.ip || 
        req.socket?.remoteAddress || 
        "unknown"
  };
}

function getBrowser(userAgent) {
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/edge/i.test(userAgent)) return "Edge";
  if (/opera/i.test(userAgent)) return "Opera";
  return "Other";
}

// Track page view
export async function trackPageView(req, res) {
  try {
    const { page, referrer } = req.body;
    
    if (!page) {
      return res.status(400).json({ message: "Page is required." });
    }

    const clientInfo = getClientInfo(req);
    const sessionId = getSessionId(req);
    const userId = req.auth?.sub || null;

    // Create page view record
    await PageView.create({
      page,
      referrer: asTrimmedString(referrer) || "",
      sessionId,
      userId,
      deviceType: clientInfo.deviceType,
      browser: clientInfo.browser
    });

    // Update daily analytics
    await DailyAnalytics.increment("pageViews");
    if (!userId) {
      // Could track unique visitors here with session tracking
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[backend] POST /api/analytics/page-view failed:", error);
    return res.status(500).json({ message: "Failed to track page view." });
  }
}

// Track product view
export async function trackProductView(req, res) {
  try {
    const { productId, source, duration } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required." });
    }

    if (!isSafeId(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    // Verify product exists
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const clientInfo = getClientInfo(req);
    const sessionId = getSessionId(req);
    const userId = req.auth?.sub || null;
    const validSources = ["search", "category", "recommendation", "direct", "cart", "wishlist"];

    await ProductView.create({
      productId,
      sessionId,
      userId,
      source: validSources.includes(source) ? source : "direct",
      duration: Math.max(0, parseInt(duration) || 0)
    });

    // Update daily analytics
    await DailyAnalytics.increment("productViews");

    // Update product popularity
    await Product.findOneAndUpdate(
      { id: productId },
      { $inc: { popularity: 1 } }
    );

    // Track user browsing history if logged in
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $pull: { "browsingHistory": { productId } },
      });
      await User.findByIdAndUpdate(userId, {
        $push: { 
          "browsingHistory": { 
            $each: [{ productId, viewedAt: new Date() }],
            $position: 0 
          }
        },
        $slice: { "browsingHistory": 100 }
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[backend] POST /api/analytics/product-view failed:", error);
    return res.status(500).json({ message: "Failed to track product view." });
  }
}

// Track cart action
export async function trackCartAction(req, res) {
  try {
    const { productId, action, quantity, source } = req.body;
    
    if (!productId || !action) {
      return res.status(400).json({ message: "Product ID and action are required." });
    }

    const validActions = ["add", "remove", "update"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    const clientInfo = getClientInfo(req);
    const sessionId = getSessionId(req);
    const userId = req.auth?.sub || null;

    await CartAction.create({
      productId,
      sessionId,
      userId,
      action,
      quantity: Math.max(1, parseInt(quantity) || 1),
      source: asTrimmedString(source) || ""
    });

    // Update daily analytics
    if (action === "add") {
      await DailyAnalytics.increment("cartAdditions");
    } else if (action === "remove") {
      await DailyAnalytics.increment("cartRemovals");
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[backend] POST /api/analytics/cart-action failed:", error);
    return res.status(500).json({ message: "Failed to track cart action." });
  }
}

// Track search query
export async function trackSearchQuery(req, res) {
  try {
    const { query, resultsCount, clickedProductId } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required." });
    }

    const clientInfo = getClientInfo(req);
    const sessionId = getSessionId(req);
    const userId = req.auth?.sub || null;

    await SearchQuery.create({
      query: asTrimmedString(query).toLowerCase(),
      sessionId,
      userId,
      resultsCount: Math.max(0, parseInt(resultsCount) || 0),
      clickedProductId: isSafeId(clickedProductId) ? clickedProductId : null
    });

    // Update daily analytics
    await DailyAnalytics.increment("searchesPerformed");
    if (clickedProductId) {
      await DailyAnalytics.increment("successfulSearches");
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[backend] POST /api/analytics/search failed:", error);
    return res.status(500).json({ message: "Failed to track search." });
  }
}

// Track cart abandonment
export async function trackCartAbandonment(req, res) {
  try {
    const { cartValue, itemCount } = req.body;

    const clientInfo = getClientInfo(req);
    const sessionId = getSessionId(req);
    const userId = req.auth?.sub || null;

    await CartAbandonment.create({
      sessionId,
      userId,
      cartValue: Math.max(0, Number(cartValue) || 0),
      itemCount: Math.max(0, parseInt(itemCount) || 0)
    });

    await DailyAnalytics.increment("cartAbandonments");

    return res.json({ success: true });
  } catch (error) {
    console.error("[backend] POST /api/analytics/cart-abandonment failed:", error);
    return res.status(500).json({ message: "Failed to track cart abandonment." });
  }
}

// Get search suggestions / autocomplete
export async function getSearchSuggestions(req, res) {
  try {
    const { q, limit = 8 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchTerm = q.trim().toLowerCase();
    const limitNum = validatePaginationLimit(limit, { min: 1, max: 20, defaultValue: 8 });

    // Search products by name, brand, or tags
    const products = await Product.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { brand: { $regex: searchTerm, $options: "i" } },
        { tags: { $elemMatch: { $regex: searchTerm, $options: "i" } } },
        { category: { $regex: searchTerm, $options: "i" } }
      ]
    })
    .select("id name brand category image price")
    .sort({ popularity: -1, rating: -1 })
    .limit(limitNum);

    // Get popular search terms that match
    const popularSearches = await SearchQuery.aggregate([
      {
        $match: {
          query: { $regex: `^${searchTerm}` }
        }
      },
      {
        $group: {
          _id: "$query",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    const suggestions = products.map(product => ({
      type: "product",
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      image: product.image,
      price: product.price
    }));

    // Add popular search terms
    const searchSuggestions = popularSearches
      .filter(s => s._id !== searchTerm)
      .slice(0, 2)
      .map(s => ({
        type: "search",
        query: s._id
      }));

    return res.json({ 
      suggestions: [...searchSuggestions, ...suggestions].slice(0, limitNum) 
    });
  } catch (error) {
    console.error("[backend] GET /api/analytics/search-suggestions failed:", error);
    return res.status(500).json({ message: "Failed to get search suggestions." });
  }
}

// Get dashboard analytics (admin)
export async function getDashboardAnalytics(req, res) {
  try {
    const { days = 7 } = req.query;
    const daysNum = Math.min(90, Math.max(1, parseInt(days) || 7));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get daily analytics
    const dailyData = await DailyAnalytics.find({
      date: { $gte: startDate.toISOString().split("T")[0] }
    }).sort({ date: 1 });

    // Get orders for revenue calculation
    const orders = await Order.find({
      createdAt: { $gte: startDate },
      orderStatus: { $ne: "cancelled" }
    });

    // Calculate totals
    const summary = {
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      totalOrders: orders.length,
      totalProducts: await Product.countDocuments(),
      totalUsers: await User.countDocuments(),
      averageOrderValue: 0
    };

    if (summary.totalOrders > 0) {
      summary.averageOrderValue = summary.totalRevenue / summary.totalOrders;
    }

    // Revenue by date
    const revenueByDate = {};
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + order.totalAmount;
    }

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ]);

    // Top products
    const productSales = {};
    for (const order of orders) {
      for (const item of order.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Low stock products
    const lowStockProducts = await Product.find({
      $or: [
        { stock: { $lte: 5, $gt: 0 } },
        { inStock: false }
      ]
    })
    .select("id name brand stock inStock")
    .sort({ stock: 1 })
    .limit(10);

    // Recent orders
    const recentOrders = await Order.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      summary,
      revenueSeries: Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue
      })).sort((a, b) => a.date.localeCompare(b.date)),
      ordersByStatus: Object.fromEntries(
        ordersByStatus.map(s => [s._id, s.count])
      ),
      topProducts,
      lowStockProducts,
      recentOrders
    });
  } catch (error) {
    console.error("[backend] GET /api/analytics/dashboard failed:", error);
    return res.status(500).json({ message: "Failed to fetch analytics." });
  }
}

// Get user behavior analytics (admin)
export async function getUserBehaviorAnalytics(req, res) {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(90, Math.max(1, parseInt(days) || 30));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Product view stats
    const productViews = await ProductView.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { 
        $group: { 
          _id: "$productId", 
          views: { $sum: 1 },
          uniqueSessions: { $addToSet: "$sessionId" }
        }
      },
      { $project: { views: 1, uniqueSessions: { $size: "$uniqueSessions" } } },
      { $sort: { views: -1 } },
      { $limit: 20 }
    ]);

    // Popular search terms
    const popularSearches = await SearchQuery.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: "$query", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Cart abandonment rate
    const totalCartActions = await CartAction.countDocuments({
      timestamp: { $gte: startDate },
      action: "add"
    });

    const totalAbandonments = await CartAbandonment.countDocuments({
      abandonedAt: { $gte: startDate }
    });

    const cartAbandonmentRate = totalCartActions > 0 
      ? ((totalAbandonments / totalCartActions) * 100).toFixed(2)
      : 0;

    // Conversion rate (views to purchases)
    const totalProductViews = await ProductView.countDocuments({
      timestamp: { $gte: startDate }
    });

    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate }
    });

    const conversionRate = totalProductViews > 0
      ? ((totalOrders / totalProductViews) * 100).toFixed(2)
      : 0;

    // Device distribution
    const deviceStats = await PageView.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: "$deviceType", count: { $sum: 1 } } }
    ]);

    return res.json({
      productViews: productViews.map(p => ({
        productId: p._id,
        views: p.views,
        uniqueSessions: p.uniqueSessions
      })),
      popularSearches: popularSearches.map(s => ({
        query: s._id,
        count: s.count
      })),
      cartAbandonmentRate: parseFloat(cartAbandonmentRate),
      conversionRate: parseFloat(conversionRate),
      deviceStats: Object.fromEntries(deviceStats.map(d => [d._id, d.count])),
      totalProductViews,
      totalOrders,
      totalCartActions,
      totalAbandonments
    });
  } catch (error) {
    console.error("[backend] GET /api/analytics/behavior failed:", error);
    return res.status(500).json({ message: "Failed to fetch behavior analytics." });
  }
}

