import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import {
  createRazorpayOrder,
  verifyPayment,
  getPaymentDetails,
  getPaymentByOrder,
  handlePaymentFailure,
  processRefund,
  getAllPayments,
  getPaymentAnalytics
} from "../controllers/paymentController.js";

const router = Router();

// All payment routes require authentication
router.use(requireAuth);

// Create Razorpay order
router.post("/create-order", createRazorpayOrder);

// Verify payment
router.post("/verify", verifyPayment);

// Get payment details
router.get("/:paymentId", getPaymentDetails);

// Get payment by order ID
router.get("/order/:orderId", getPaymentByOrder);

// Handle payment failure
router.post("/failure", handlePaymentFailure);

// Process refund (admin)
router.post("/refund", processRefund);

// Admin routes
router.get("/admin/all", getAllPayments);
router.get("/admin/analytics", getPaymentAnalytics);

export default router;

