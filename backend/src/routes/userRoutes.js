import { Router } from "express";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { getPersonalizedRecommendations } from "../services/recommendationService.js";
import { getCartSuggestions } from "../services/cartSuggestionService.js";
import { requireAuth } from "../middleware/auth.js";
import { asTrimmedString, isEmail, isNonEmptyString, isSafeId, validatePaginationLimit } from "../middleware/validate.js";

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "";
}

async function isAdminUser(userId) {
  const user = await User.findById(userId).select("isAdmin");
  return Boolean(user?.isAdmin);
}

// GET /api/users/profile - Get current user profile
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ user });
  } catch (error) {
    console.error("[backend] GET /api/users/profile failed:", error);
    return res.status(500).json({ message: "Failed to fetch profile." });
  }
});

// GET /api/users/budget - Get budget status
router.get("/budget", async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub).select("monthlyBudget currentMonthSpending");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const percentUsed = user.monthlyBudget > 0 ? Math.round((user.currentMonthSpending / user.monthlyBudget) * 100) : 0;
    const alert = percentUsed >= 90;
    return res.json({ 
      monthlyBudget: user.monthlyBudget,
      currentMonthSpending: user.currentMonthSpending,
      percentUsed,
      alert,
      remaining: Math.max(0, user.monthlyBudget - user.currentMonthSpending)
    });
  } catch (error) {
    console.error("[backend] GET /api/users/budget failed:", error);
    return res.status(500).json({ message: "Failed to fetch budget." });
  }
});

// PUT /api/users/budget - Update monthly budget
router.put("/budget", async (req, res) => {
  try {
    const budget = Number(req.body.monthlyBudget);
    if (isNaN(budget) || budget < 0) {
      return res.status(400).json({ message: "monthlyBudget must be a non-negative number." });
    }
    const user = await User.findByIdAndUpdate(
      req.auth.sub,
      { monthlyBudget: budget },
      { new: true }
    ).select("monthlyBudget");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ monthlyBudget: user.monthlyBudget });
  } catch (error) {
    console.error("[backend] PUT /api/users/budget failed:", error);
    return res.status(500).json({ message: "Failed to update budget." });
  }
});

// PUT /api/users/profile - Update current user profile
router.put("/profile", async (req, res) => {
  try {
    const username = asTrimmedString(req.body?.username);
    const email = asTrimmedString(req.body?.email).toLowerCase();
    const updates = {};

    if (username) {
      if (!isNonEmptyString(username, { min: 2, max: 40 })) {
        return res.status(400).json({ message: "username must be between 2 and 40 characters." });
      }
      updates.username = username;
    }
    if (email) {
      if (!isEmail(email)) {
        return res.status(400).json({ message: "email must be valid." });
      }
      updates.email = email;
    }

    // Check if email is already taken by another user
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.auth.sub } });
      if (existing) {
        return res.status(409).json({ message: "Email already in use." });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.auth.sub,
      updates,
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user });
  } catch (error) {
    console.error("[backend] PUT /api/users/profile failed:", error);
    return res.status(500).json({ message: "Failed to update profile." });
  }
});

// GET /api/users/addresses - Get all addresses
router.get("/addresses", async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ addresses: user.addresses });
  } catch (error) {
    console.error("[backend] GET /api/users/addresses failed:", error);
    return res.status(500).json({ message: "Failed to fetch addresses." });
  }
});

// POST /api/users/addresses - Add new address
router.post("/addresses", async (req, res) => {
  try {
    const { label, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({ message: "Missing required address fields." });
    }

    const normalized = {
      label: asTrimmedString(label) || "Home",
      fullName: asTrimmedString(fullName),
      phone: asTrimmedString(phone),
      addressLine1: asTrimmedString(addressLine1),
      addressLine2: asTrimmedString(addressLine2),
      city: asTrimmedString(city),
      state: asTrimmedString(state),
      postalCode: asTrimmedString(postalCode),
      country: asTrimmedString(country) || "USA",
      isDefault: Boolean(isDefault),
    };

    if (
      !isNonEmptyString(normalized.fullName, { min: 2, max: 120 }) ||
      !isNonEmptyString(normalized.phone, { min: 8, max: 30 }) ||
      !isNonEmptyString(normalized.addressLine1, { min: 3, max: 200 }) ||
      !isNonEmptyString(normalized.city, { min: 2, max: 100 }) ||
      !isNonEmptyString(normalized.state, { min: 2, max: 100 }) ||
      !isNonEmptyString(normalized.postalCode, { min: 3, max: 20 })
    ) {
      return res.status(400).json({ message: "Invalid address field values." });
    }

    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If this is set as default, unset other defaults
    if (normalized.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    const newAddress = {
      label: normalized.label,
      fullName: normalized.fullName,
      phone: normalized.phone,
      addressLine1: normalized.addressLine1,
      addressLine2: normalized.addressLine2,
      city: normalized.city,
      state: normalized.state,
      postalCode: normalized.postalCode,
      country: normalized.country,
      isDefault: normalized.isDefault,
    };

    // Add the new address to the array
    user.addresses.push(newAddress);
    await user.save();

    return res.status(201).json({
      address: newAddress,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        wishlist: user.wishlist,
        addresses: user.addresses,
        cart: user.cart,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error("[backend] POST /api/users/addresses failed:", error);
    return res.status(500).json({ message: "Failed to add address." });
  }
});

// PUT /api/users/addresses/:addressId - Update address
router.put("/addresses/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;
    if (!isSafeId(addressId)) {
      return res.status(400).json({ message: "Invalid addressId." });
    }
    const { label, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found." });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    if (label !== undefined) address.label = asTrimmedString(label) || address.label;
    if (fullName !== undefined) {
      const value = asTrimmedString(fullName);
      if (!isNonEmptyString(value, { min: 2, max: 120 })) {
        return res.status(400).json({ message: "Invalid fullName." });
      }
      address.fullName = value;
    }
    if (phone !== undefined) {
      const value = asTrimmedString(phone);
      if (!isNonEmptyString(value, { min: 8, max: 30 })) {
        return res.status(400).json({ message: "Invalid phone." });
      }
      address.phone = value;
    }
    if (addressLine1 !== undefined) {
      const value = asTrimmedString(addressLine1);
      if (!isNonEmptyString(value, { min: 3, max: 200 })) {
        return res.status(400).json({ message: "Invalid addressLine1." });
      }
      address.addressLine1 = value;
    }
    if (addressLine2 !== undefined) address.addressLine2 = asTrimmedString(addressLine2);
    if (city !== undefined) {
      const value = asTrimmedString(city);
      if (!isNonEmptyString(value, { min: 2, max: 100 })) {
        return res.status(400).json({ message: "Invalid city." });
      }
      address.city = value;
    }
    if (state !== undefined) {
      const value = asTrimmedString(state);
      if (!isNonEmptyString(value, { min: 2, max: 100 })) {
        return res.status(400).json({ message: "Invalid state." });
      }
      address.state = value;
    }
    if (postalCode !== undefined) {
      const value = asTrimmedString(postalCode);
      if (!isNonEmptyString(value, { min: 3, max: 20 })) {
        return res.status(400).json({ message: "Invalid postalCode." });
      }
      address.postalCode = value;
    }
    if (country !== undefined) address.country = asTrimmedString(country) || address.country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();

    return res.json({
      address,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        wishlist: user.wishlist,
        addresses: user.addresses,
        cart: user.cart,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error("[backend] PUT /api/users/addresses/:addressId failed:", error);
    return res.status(500).json({ message: "Failed to update address." });
  }
});

// DELETE /api/users/addresses/:addressId - Delete address
router.delete("/addresses/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;
    if (!isSafeId(addressId)) {
      return res.status(400).json({ message: "Invalid addressId." });
    }

    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found." });
    }

    address.deleteOne();
    await user.save();

    return res.json({
      message: "Address deleted successfully.",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        wishlist: user.wishlist,
        addresses: user.addresses,
        cart: user.cart,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error("[backend] DELETE /api/users/addresses/:addressId failed:", error);
    return res.status(500).json({ message: "Failed to delete address." });
  }
});

// GET /api/users/wishlist - Get wishlist
router.get("/wishlist", async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ wishlist: user.wishlist });
  } catch (error) {
    console.error("[backend] GET /api/users/wishlist failed:", error);
    return res.status(500).json({ message: "Failed to fetch wishlist." });
  }
});

// POST /api/users/wishlist/:productId - Add to wishlist
router.post("/wishlist/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    if (!isSafeId(productId)) {
      return res.status(400).json({ message: "Invalid productId." });
    }

    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    return res.json({ wishlist: user.wishlist });
  } catch (error) {
    console.error("[backend] POST /api/users/wishlist/:productId failed:", error);
    return res.status(500).json({ message: "Failed to add to wishlist." });
  }
});

// DELETE /api/users/wishlist/:productId - Remove from wishlist
router.delete("/wishlist/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    if (!isSafeId(productId)) {
      return res.status(400).json({ message: "Invalid productId." });
    }

    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.wishlist = user.wishlist.filter(id => id !== productId);
    await user.save();

    return res.json({ wishlist: user.wishlist });
  } catch (error) {
    console.error("[backend] DELETE /api/users/wishlist/:productId failed:", error);
    return res.status(500).json({ message: "Failed to remove from wishlist." });
  }
});

// GET /api/users/cart - Get cart from database
router.get("/cart", async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ cart: user.cart });
  } catch (error) {
    console.error("[backend] GET /api/users/cart failed:", error);
    return res.status(500).json({ message: "Failed to fetch cart." });
  }
});

// PUT /api/users/cart - Update cart in database
router.put("/cart", async (req, res) => {
  try {
    const { cart } = req.body;

    if (!Array.isArray(cart)) {
      return res.status(400).json({ message: "Cart must be an array." });
    }
    if (cart.length > 100) {
      return res.status(400).json({ message: "Cart size exceeds limit." });
    }

    // Validate cart items
    const validCart = cart.map(item => ({
      productId: asTrimmedString(item?.productId),
      quantity: Math.max(1, Math.min(item.quantity || 1, 99)),
    }));
    if (validCart.some((item) => !isSafeId(item.productId))) {
      return res.status(400).json({ message: "Cart contains invalid productId values." });
    }

    const user = await User.findByIdAndUpdate(
      req.auth.sub,
      { cart: validCart },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ cart: user.cart });
  } catch (error) {
    console.error("[backend] PUT /api/users/cart failed:", error);
    return res.status(500).json({ message: "Failed to update cart." });
  }
});

// POST /api/users/purchases - Track purchased products for collaborative filtering
router.post("/purchases", async (req, res) => {
  try {
    const { productIds } = req.body || {};
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ message: "productIds must be an array." });
    }

    const normalizedIds = [
      ...new Set(
        productIds
          .filter((id) => typeof id === "string")
          .map((id) => id.trim())
          .filter((id) => isSafeId(id))
          .filter(Boolean)
      ),
    ];

    if (normalizedIds.length === 0) {
      return res.status(400).json({ message: "No valid productIds provided." });
    }

    const existingProducts = await Product.find({ id: { $in: normalizedIds } }).select("id");
    const existingIds = new Set(existingProducts.map((product) => product.id));
    const validIds = normalizedIds.filter((id) => existingIds.has(id));

    if (validIds.length === 0) {
      return res.status(400).json({ message: "No valid products found for provided productIds." });
    }

    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const purchaseHistory = user.purchaseHistory || [];
    user.purchaseHistory = [...new Set([...validIds, ...purchaseHistory])].slice(0, 500);
    await user.save();

    return res.status(201).json({
      message: "Purchase history updated.",
      purchaseHistory: user.purchaseHistory,
    });
  } catch (error) {
    console.error("[backend] POST /api/users/purchases failed:", error);
    return res.status(500).json({ message: "Failed to update purchase history." });
  }
});

// POST /api/users/browse/:productId - Track product view for recommendation signals
router.post("/browse/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    if (!isSafeId(productId)) {
      return res.status(400).json({ message: "Invalid productId." });
    }

    const product = await Product.findOne({ id: productId }).select("id");
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.browsingHistory = (user.browsingHistory || []).filter(
      (entry) => entry.productId !== productId
    );
    user.browsingHistory.unshift({ productId, viewedAt: new Date() });
    user.browsingHistory = user.browsingHistory.slice(0, 100);

    await user.save();

    return res.status(201).json({ message: "Browsing history updated." });
  } catch (error) {
    console.error("[backend] POST /api/users/browse/:productId failed:", error);
    return res.status(500).json({ message: "Failed to update browsing history." });
  }
});

// GET /api/users/preferences - Get user preferences
router.get("/preferences", async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub).select("preferences");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      preferences: user.preferences || {
        categories: [],
        brands: [],
        tags: [],
        priceRange: { min: 0, max: 100000 },
      },
    });
  } catch (error) {
    console.error("[backend] GET /api/users/preferences failed:", error);
    return res.status(500).json({ message: "Failed to fetch preferences." });
  }
});

// PUT /api/users/preferences - Update user preferences
router.put("/preferences", async (req, res) => {
  try {
    const { categories, brands, tags, priceRange } = req.body || {};
    const updates = {};

    if (Array.isArray(categories)) {
      updates["preferences.categories"] = [
        ...new Set(categories.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 25)),
      ];
    }

    if (Array.isArray(brands)) {
      updates["preferences.brands"] = [
        ...new Set(brands.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 25)),
      ];
    }

    if (Array.isArray(tags)) {
      updates["preferences.tags"] = [
        ...new Set(tags.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 40)),
      ];
    }

    if (priceRange && typeof priceRange === "object") {
      const min = Number(priceRange.min);
      const max = Number(priceRange.max);
      if (!Number.isNaN(min) && !Number.isNaN(max) && min >= 0 && max >= min) {
        updates["preferences.priceRange"] = { min, max };
      } else {
        return res.status(400).json({ message: "Invalid priceRange. Expected { min, max } with 0 <= min <= max." });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.auth.sub,
      { $set: updates },
      { new: true }
    ).select("preferences");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ preferences: user.preferences });
  } catch (error) {
    console.error("[backend] PUT /api/users/preferences failed:", error);
    return res.status(500).json({ message: "Failed to update preferences." });
  }
});

// GET /api/users/recommendations - Personalized recommendations
router.get("/recommendations", async (req, res) => {
  try {
    const limit = validatePaginationLimit(req.query.limit, { min: 1, max: 20, defaultValue: 8 });
    const userId = req.auth.sub;

    const products = await getPersonalizedRecommendations(userId, limit);
    return res.json({ products });
  } catch (error) {
    console.error("[backend] GET /api/users/recommendations failed:", error);
    return res.status(500).json({ message: "Failed to fetch recommendations." });
  }
});

// GET /api/users/feed - Personalized homepage feed
router.get("/feed", async (req, res) => {
  try {
    const limit = validatePaginationLimit(req.query.limit, { min: 4, max: 40, defaultValue: 12 });
    const userId = req.auth.sub;

    // For now, feed is just personalized recommendations but potentially with different ranking or diversity
    const products = await getPersonalizedRecommendations(userId, limit);
    return res.json({ products });
  } catch (error) {
    console.error("[backend] GET /api/users/feed failed:", error);
    return res.status(500).json({ message: "Failed to fetch feed." });
  }
});

// GET /api/users/cart/suggestions - Suggestions based on current cart
router.get("/cart/suggestions", async (req, res) => {
  try {
    const limit = validatePaginationLimit(req.query.limit, { min: 1, max: 12, defaultValue: 4 });
    const user = await User.findById(req.auth.sub).select("cart");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const cartProductIds = (user.cart || []).map(item => item.productId);
    const suggestions = await getCartSuggestions(cartProductIds, limit);

    return res.json({ products: suggestions });
  } catch (error) {
    console.error("[backend] GET /api/users/cart/suggestions failed:", error);
    return res.status(500).json({ message: "Failed to fetch cart suggestions." });
  }
});

// GET /api/users/reviews - Get reviews for a product
router.get("/reviews", async (req, res) => {
  try {
    const productId = asTrimmedString(req.query.productId);

    if (!productId) {
      return res.status(400).json({ message: "productId is required." });
    }
    if (!isSafeId(productId)) {
      return res.status(400).json({ message: "Invalid productId." });
    }

    const reviews = await Review.find({ productId }).populate("userId", "username").sort({ createdAt: -1 });

    return res.json({ reviews });
  } catch (error) {
    console.error("[backend] GET /api/users/reviews failed:", error);
    return res.status(500).json({ message: "Failed to fetch reviews." });
  }
});

// GET /api/users/reviews/flagged - Get suspicious reviews (admin)
router.get("/reviews/flagged", async (req, res) => {
  try {
    const isAdmin = await isAdminUser(req.auth.sub);
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required." });
    }

    const limit = validatePaginationLimit(req.query.limit, { min: 1, max: 200, defaultValue: 50 });
    const reviews = await Review.find({ isSuspicious: true })
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ reviews });
  } catch (error) {
    console.error("[backend] GET /api/users/reviews/flagged failed:", error);
    return res.status(500).json({ message: "Failed to fetch flagged reviews." });
  }
});

// POST /api/users/reviews - Add review
router.post("/reviews", async (req, res) => {
  try {
    const productId = asTrimmedString(req.body?.productId);
    const rating = Number(req.body?.rating);
    const comment = asTrimmedString(req.body?.comment);

    if (!productId || !rating) {
      return res.status(400).json({ message: "productId and rating are required." });
    }
    if (!isSafeId(productId)) {
      return res.status(400).json({ message: "Invalid productId." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }
    if (comment.length > 2000) {
      return res.status(400).json({ message: "Review comment cannot exceed 2000 characters." });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ userId: req.auth.sub, productId });
    if (existingReview) {
      return res.status(409).json({ message: "You have already reviewed this product." });
    }

    const normalizedComment = String(comment || "").trim().toLowerCase();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000));
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const ipAddress = getClientIp(req);
    const userAgent = String(req.headers["user-agent"] || "");
    const suspiciousReasons = [];

    const [recentUserReviewCount, repeatedCommentCount, sameIpRecentCount] = await Promise.all([
      Review.countDocuments({ userId: req.auth.sub, createdAt: { $gte: fiveMinutesAgo } }),
      normalizedComment
        ? Review.countDocuments({
          productId,
          comment: { $regex: `^${normalizedComment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
          userId: { $ne: req.auth.sub },
        })
        : Promise.resolve(0),
      ipAddress
        ? Review.countDocuments({
          productId,
          createdAt: { $gte: oneHourAgo },
          "behavior.ipAddress": ipAddress,
          userId: { $ne: req.auth.sub },
        })
        : Promise.resolve(0),
    ]);

    if (recentUserReviewCount >= 3) {
      suspiciousReasons.push("high_review_velocity");
    }
    if (normalizedComment && repeatedCommentCount >= 1) {
      suspiciousReasons.push("duplicate_comment_pattern");
    }
    if (sameIpRecentCount >= 2) {
      suspiciousReasons.push("shared_ip_burst_pattern");
    }

    const review = await Review.create({
      userId: req.auth.sub,
      productId,
      rating,
      comment: comment || "",
      behavior: {
        ipAddress,
        userAgent,
        submittedAt: now,
      },
      isSuspicious: suspiciousReasons.length > 0,
      suspiciousReasons,
    });

    // Update product rating
    const productReviews = await Review.find({ productId });
    const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / productReviews.length;

    await Product.findOneAndUpdate(
      { id: productId },
      {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: productReviews.length
      }
    );

    const populatedReview = await Review.findById(review._id).populate("userId", "username");

    return res.status(201).json({ review: populatedReview });
  } catch (error) {
    console.error("[backend] POST /api/users/reviews failed:", error);
    return res.status(500).json({ message: "Failed to add review." });
  }
});

export default router;

