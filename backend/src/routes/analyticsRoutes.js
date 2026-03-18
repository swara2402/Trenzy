import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import {
  trackPageView,
  trackProductView,
  trackCartAction,
  trackSearchQuery,
  trackCartAbandonment,
  getSearchSuggestions,
  getDashboardAnalytics,
  getUserBehaviorAnalytics
} from "../controllers/analyticsController.js";

const router = Router();

// Tracking endpoints (may or may not require auth)
router.post("/page-view", trackPageView);
router.post("/product-view", trackProductView);
router.post("/cart-action", trackCartAction);
router.post("/search", trackSearchQuery);
router.post("/cart-abandonment", trackCartAbandonment);

// Search suggestions (public)
router.get("/search-suggestions", getSearchSuggestions);

// Dashboard analytics (requires auth)
router.get("/dashboard", requireAuth, getDashboardAnalytics);

// User behavior analytics (admin)
router.get("/behavior", requireAuth, getUserBehaviorAnalytics);

export default router;

