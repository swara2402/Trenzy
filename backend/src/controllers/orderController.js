import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { asTrimmedString, isSafeId, validatePaginationLimit } from "../middleware/validate.js";

// Create a new order
export async function createOrder(req, res) {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required." });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || 
        !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || 
        !shippingAddress.postalCode) {
      return res.status(400).json({ message: "Complete shipping address is required." });
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required." });
    }

    const validPaymentMethods = ["card", "upi", "cod", "razorpay"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }

    // Validate items and calculate total
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: "Invalid item data." });
      }

      const product = await Product.findOne({ id: item.productId });
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.productId}` });
      }

      const subtotal = product.price * item.quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        quantity: item.quantity,
        subtotal
      });

      totalAmount += subtotal;

      // Update product popularity and stock
      product.popularity = (product.popularity || 0) + 1;
      if (product.stock !== undefined) {
        product.stock = Math.max(0, product.stock - item.quantity);
        product.inStock = product.stock > 0;
      }
      await product.save();
    }

    // Generate order number
    const orderNumber = Order.generateOrderNumber();

    // Create order
    const order = await Order.create({
      userId: req.auth.sub,
      orderNumber,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "completed" : "pending",
      notes: asTrimmedString(notes) || "",
      statusHistory: [{ status: "placed", timestamp: new Date(), note: "Order placed" }]
    });

    // Add to user's purchase history
    await User.findByIdAndUpdate(req.auth.sub, {
      $push: {
        purchaseHistory: { $each: orderItems.map(item => item.productId) }
      }
    });

    // Clear user's cart
    await User.findByIdAndUpdate(req.auth.sub, { cart: [] });

    return res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error("[backend] POST /api/orders failed:", error);
    return res.status(500).json({ message: "Failed to create order." });
  }
}

// Get user's orders
export async function getUserOrders(req, res) {
  try {
    const limit = validatePaginationLimit(req.query.limit, { min: 1, max: 50, defaultValue: 20 });
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId: req.auth.sub })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ userId: req.auth.sub });

    return res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("[backend] GET /api/orders failed:", error);
    return res.status(500).json({ message: "Failed to fetch orders." });
  }
}

// Get single order by ID
export async function getOrderById(req, res) {
  try {
    const { orderId } = req.params;
    if (!isSafeId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID." });
    }

    const order = await Order.findOne({ 
      _id: orderId,
      userId: req.auth.sub 
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.json({ order });
  } catch (error) {
    console.error("[backend] GET /api/orders/:orderId failed:", error);
    return res.status(500).json({ message: "Failed to fetch order." });
  }
}

// Get order by order number
export async function getOrderByNumber(req, res) {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ 
      orderNumber,
      userId: req.auth.sub 
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.json({ order });
  } catch (error) {
    console.error("[backend] GET /api/orders/number/:orderNumber failed:", error);
    return res.status(500).json({ message: "Failed to fetch order." });
  }
}

// Cancel order
export async function cancelOrder(req, res) {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!isSafeId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID." });
    }

    const order = await Order.findOne({ 
      _id: orderId,
      userId: req.auth.sub 
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["placed", "processing"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ 
        message: "Order cannot be cancelled. It may already be shipped or delivered." 
      });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        { id: item.productId },
        { 
          $inc: { stock: item.quantity },
          $set: { inStock: true }
        }
      );
    }

    // Update order status
    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = asTrimmedString(reason) || "Cancelled by customer";
    order.statusHistory.push({
      status: "cancelled",
      timestamp: new Date(),
      note: order.cancellationReason
    });

    await order.save();

    return res.json({
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    console.error("[backend] DELETE /api/orders/:orderId failed:", error);
    return res.status(500).json({ message: "Failed to cancel order." });
  }
}

// Update order status (admin only)
export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status, note, trackingNumber, estimatedDelivery } = req.body;

    if (!isSafeId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID." });
    }

    const validStatuses = ["placed", "processing", "shipped", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Handle stock for cancelled orders
    if (status === "cancelled" && ["placed", "processing"].includes(order.orderStatus)) {
      for (const item of order.items) {
        await Product.findOneAndUpdate(
          { id: item.productId },
          { 
            $inc: { stock: item.quantity },
            $set: { inStock: true }
          }
        );
      }
    }

    // Update order
    order.orderStatus = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: asTrimmedString(note) || `Status updated to ${status}`
    });

    if (trackingNumber !== undefined) {
      order.trackingNumber = asTrimmedString(trackingNumber) || "";
    }

    if (estimatedDelivery) {
      order.estimatedDelivery = new Date(estimatedDelivery);
    }

    if (status === "shipped") {
      order.shippedAt = new Date();
    } else if (status === "delivered") {
      order.deliveredAt = new Date();
    } else if (status === "cancelled") {
      order.cancelledAt = new Date();
    }

    await order.save();

    return res.json({
      message: "Order status updated",
      order
    });
  } catch (error) {
    console.error("[backend] PATCH /api/orders/:orderId/status failed:", error);
    return res.status(500).json({ message: "Failed to update order status." });
  }
}

// Get all orders (admin)
export async function getAllOrders(req, res) {
  try {
    const limit = validatePaginationLimit(req.query.limit, { min: 1, max: 100, defaultValue: 20 });
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const status = asTrimmedString(req.query.status);
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    return res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("[backend] GET /api/orders/admin/all failed:", error);
    return res.status(500).json({ message: "Failed to fetch orders." });
  }
}

// Get order analytics (admin)
export async function getOrderAnalytics(req, res) {
  try {
    const { days = 7 } = req.query;
    const daysNum = Math.min(90, Math.max(1, parseInt(days) || 7));
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const orders = await Order.find({
      createdAt: { $gte: startDate }
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(o => o.orderStatus !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const ordersByStatus = {};
    const revenueByDate = {};
    const ordersByDate = {};

    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      
      // By status
      ordersByStatus[order.orderStatus] = (ordersByStatus[order.orderStatus] || 0) + 1;
      
      // By date
      if (order.orderStatus !== "cancelled") {
        revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + order.totalAmount;
      }
      ordersByDate[dateKey] = (ordersByDate[dateKey] || 0) + 1;
    }

    const revenueSeries = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const orderSeries = Object.entries(ordersByDate)
      .map(([date, count]) => ({ date, orders: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top selling products
    const productSales = {};
    for (const order of orders) {
      if (order.orderStatus !== "cancelled") {
        for (const item of order.items) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              productId: item.productId,
              productName: item.productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.subtotal;
        }
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return res.json({
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        days: daysNum
      },
      ordersByStatus,
      revenueSeries,
      orderSeries,
      topProducts
    });
  } catch (error) {
    console.error("[backend] GET /api/orders/admin/analytics failed:", error);
    return res.status(500).json({ message: "Failed to fetch analytics." });
  }
}

