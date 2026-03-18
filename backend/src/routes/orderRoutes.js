import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
  getOrderAnalytics
} from "../controllers/orderController.js";

const router = Router();

// All order routes require authentication
router.use(requireAuth);

// Create a new order
router.post("/", createOrder);

// Get user's orders
router.get("/", getUserOrders);

// Get order by ID
router.get("/:orderId", getOrderById);

// Get order by order number
router.get("/number/:orderNumber", getOrderByNumber);

// Cancel order
router.delete("/:orderId", cancelOrder);

// Admin routes
router.patch("/:orderId/status", updateOrderStatus);
router.get("/admin/all", getAllOrders);
router.get("/admin/analytics", getOrderAnalytics);

export default router;

