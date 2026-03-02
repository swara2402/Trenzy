import bcrypt from "bcryptjs";
import { Router } from "express";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { signAuthToken } from "../utils/jwt.js";

const router = Router();

function sanitizeUser(user) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt,
    addresses: user.addresses || [],
    wishlist: user.wishlist || [],
    cart: user.cart || [],
  };
}

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email, and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = signAuthToken(
      { sub: String(user._id), email: user.email },
      process.env.JWT_SECRET
    );

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[backend] POST /api/auth/signup failed:", error);
    return res.status(500).json({ message: "Signup failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signAuthToken(
      { sub: String(user._id), email: user.email },
      process.env.JWT_SECRET
    );

    return res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[backend] POST /api/auth/login failed:", error);
    return res.status(500).json({ message: "Login failed." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("[backend] GET /api/auth/me failed:", error);
    return res.status(500).json({ message: "Failed to fetch current user." });
  }
});

export default router;
