import Razorpay from "razorpay";
import crypto from "crypto";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { asTrimmedString, isSafeId } from "../middleware/validate.js";

// Initialize Razorpay
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

// Create Razorpay order
export async function createRazorpayOrder(req, res) {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        message: "Payment gateway not configured. Please contact support." 
      });
    }

    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: "Order ID and amount are required." });
    }

    if (!isSafeId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID." });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount." });
    }

    // Verify order exists and belongs to user
    const order = await Order.findOne({ 
      _id: orderId,
      userId: req.auth.sub 
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment && existingPayment.status === "completed") {
      return res.status(400).json({ message: "Order is already paid." });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(numericAmount * 100), // Convert to paise
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: String(order._id),
        orderNumber: order.orderNumber
      }
    });

    // Create payment record
    const payment = await Payment.create({
      orderId: order._id,
      userId: req.auth.sub,
      razorpayOrderId: razorpayOrder.id,
      amount: numericAmount,
      status: "pending"
    });

    return res.status(201).json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("[backend] POST /api/payments/create-order failed:", error);
    return res.status(500).json({ message: "Failed to create payment order." });
  }
}

// Verify and capture payment
export async function verifyPayment(req, res) {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        message: "Payment gateway not configured." 
      });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Payment verification details are required." });
    }

    // Verify signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (razorpaySignature !== expectedSignature) {
      // Mark payment as failed
      if (paymentId) {
        await Payment.findByIdAndUpdate(paymentId, {
          status: "failed",
          errorCode: "SIGNATURE_MISMATCH",
          errorDescription: "Payment signature verification failed"
        });
      }
      return res.status(400).json({ message: "Payment verification failed." });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);

    // Find payment record
    let payment;
    if (paymentId) {
      payment = await Payment.findById(paymentId);
    } else {
      payment = await Payment.findOne({ razorpayOrderId });
    }

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found." });
    }

    // Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = paymentDetails.status === "captured" ? "completed" : "captured";
    payment.method = paymentDetails.method;
    payment.processedAt = new Date();

    // Add card/UPI details if applicable
    if (paymentDetails.method === "card") {
      payment.cardLast4 = paymentDetails.card?.last4;
      payment.cardBrand = paymentDetails.card?.network;
    } else if (paymentDetails.method === "upi") {
      payment.vpa = paymentDetails.vpa;
    } else if (paymentDetails.method === "netbanking") {
      payment.bank = paymentDetails.bank;
    } else if (paymentDetails.method === "wallet") {
      payment.wallet = paymentDetails.wallet;
    }

    payment.gatewayResponse = paymentDetails;
    await payment.save();

    // Update order status
    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paymentStatus = "completed";
      order.paymentId = razorpayPaymentId;
      await order.save();
    }

    return res.json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        id: payment._id,
        status: payment.status,
        method: payment.method
      }
    });
  } catch (error) {
    console.error("[backend] POST /api/payments/verify failed:", error);
    return res.status(500).json({ message: "Payment verification failed." });
  }
}

// Get payment details
export async function getPaymentDetails(req, res) {
  try {
    const { paymentId } = req.params;

    if (!isSafeId(paymentId)) {
      return res.status(400).json({ message: "Invalid payment ID." });
    }

    const payment = await Payment.findById(paymentId)
      .populate("orderId")
      .populate("userId", "username email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    // Check if user owns this payment or is admin
    if (String(payment.userId._id) !== req.auth.sub && !payment.userId.isAdmin) {
      return res.status(403).json({ message: "Access denied." });
    }

    return res.json({ payment });
  } catch (error) {
    console.error("[backend] GET /api/payments/:paymentId failed:", error);
    return res.status(500).json({ message: "Failed to fetch payment details." });
  }
}

// Get payment by order ID
export async function getPaymentByOrder(req, res) {
  try {
    const { orderId } = req.params;

    if (!isSafeId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID." });
    }

    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    // Check if user owns this payment
    if (String(payment.userId) !== req.auth.sub) {
      return res.status(403).json({ message: "Access denied." });
    }

    return res.json({ payment });
  } catch (error) {
    console.error("[backend] GET /api/payments/order/:orderId failed:", error);
    return res.status(500).json({ message: "Failed to fetch payment." });
  }
}

// Handle payment failure webhook or manual update
export async function handlePaymentFailure(req, res) {
  try {
    const { paymentId, reason } = req.body;

    if (!isSafeId(paymentId)) {
      return res.status(400).json({ message: "Invalid payment ID." });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    payment.status = "failed";
    payment.errorDescription = asTrimmedString(reason) || "Payment failed";
    payment.processedAt = new Date();
    await payment.save();

    // Update order status
    await Order.findByIdAndUpdate(payment.orderId, {
      paymentStatus: "failed"
    });

    return res.json({
      message: "Payment marked as failed",
      payment
    });
  } catch (error) {
    console.error("[backend] POST /api/payments/failure failed:", error);
    return res.status(500).json({ message: "Failed to update payment status." });
  }
}

// Process refund (admin)
export async function processRefund(req, res) {
  try {
    if (!razorpay) {
      return res.status(503).json({ message: "Payment gateway not configured." });
    }

    const { paymentId, amount, reason } = req.body;

    if (!isSafeId(paymentId)) {
      return res.status(400).json({ message: "Invalid payment ID." });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    if (payment.status !== "completed" && payment.status !== "captured") {
      return res.status(400).json({ message: "Payment cannot be refunded." });
    }

    const refundAmount = amount ? Number(amount) : payment.amount;
    if (refundAmount <= 0 || refundAmount > (payment.amount - payment.refundedAmount)) {
      return res.status(400).json({ message: "Invalid refund amount." });
    }

    // Create refund in Razorpay
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100),
      notes: {
        reason: asTrimmedString(reason) || "Refund initiated"
      }
    });

    // Update payment record
    payment.refundedAmount += refundAmount;
    if (payment.refundedAmount >= payment.amount) {
      payment.status = "refunded";
    }
    payment.refundedAt = new Date();
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      refund
    };
    await payment.save();

    // Update order status if fully refunded
    if (payment.status === "refunded") {
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: "refunded"
      });
    }

    return res.json({
      message: "Refund processed successfully",
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    });
  } catch (error) {
    console.error("[backend] POST /api/payments/refund failed:", error);
    return res.status(500).json({ message: "Refund processing failed." });
  }
}

// Get all payments (admin)
export async function getAllPayments(req, res) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate("orderId", "orderNumber totalAmount")
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Payment.countDocuments(query);

    return res.json({
      payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("[backend] GET /api/payments/admin/all failed:", error);
    return res.status(500).json({ message: "Failed to fetch payments." });
  }
}

// Get payment analytics (admin)
export async function getPaymentAnalytics(req, res) {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(90, Math.max(1, parseInt(days) || 30));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const payments = await Payment.find({
      createdAt: { $gte: startDate },
      status: { $in: ["completed", "captured"] }
    });

    const totalTransactions = payments.length;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = payments.reduce((sum, p) => sum + p.refundedAmount, 0);

    // By payment method
    const byMethod = {};
    for (const payment of payments) {
      byMethod[payment.method] = (byMethod[payment.method] || 0) + payment.amount;
    }

    // By date
    const byDate = {};
    for (const payment of payments) {
      const dateKey = payment.createdAt.toISOString().split("T")[0];
      byDate[dateKey] = (byDate[dateKey] || 0) + payment.amount;
    }

    const revenueSeries = Object.entries(byDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      summary: {
        totalTransactions,
        totalRevenue,
        totalRefunded,
        netRevenue: totalRevenue - totalRefunded,
        days: daysNum
      },
      byMethod,
      revenueSeries
    });
  } catch (error) {
    console.error("[backend] GET /api/payments/admin/analytics failed:", error);
    return res.status(500).json({ message: "Failed to fetch analytics." });
  }
}

