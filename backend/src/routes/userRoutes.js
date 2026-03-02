import { Router } from "express";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

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

// PUT /api/users/profile - Update current user profile
router.put("/profile", async (req, res) => {
  try {
    const { username, email } = req.body;
    const updates = {};

    if (username) updates.username = username.trim();
    if (email) updates.email = email.toLowerCase().trim();

    // Check if email is already taken by another user
    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: req.auth.sub } });
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

    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    const newAddress = {
      label: label || "Home",
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      city,
      state,
      postalCode,
      country: country || "USA",
      isDefault: isDefault || false,
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

    if (label) address.label = label;
    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.country = country;
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

    // Validate cart items
    const validCart = cart.map(item => ({
      productId: item.productId,
      quantity: Math.max(1, Math.min(item.quantity || 1, 99)),
    }));

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

// GET /api/users/reviews - Get reviews for a product
router.get("/reviews", async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ message: "productId is required." });
    }

    const reviews = await Review.find({ productId }).populate("userId", "username").sort({ createdAt: -1 });

    return res.json({ reviews });
  } catch (error) {
    console.error("[backend] GET /api/users/reviews failed:", error);
    return res.status(500).json({ message: "Failed to fetch reviews." });
  }
});

// POST /api/users/reviews - Add review
router.post("/reviews", async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ message: "productId and rating are required." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ userId: req.auth.sub, productId });
    if (existingReview) {
      return res.status(409).json({ message: "You have already reviewed this product." });
    }

    const review = await Review.create({
      userId: req.auth.sub,
      productId,
      rating,
      comment: comment || "",
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
