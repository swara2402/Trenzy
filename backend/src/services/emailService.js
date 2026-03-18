import nodemailer from "nodemailer";

// Create transporter (configure with your email service)
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

// Email templates
const templates = {
  orderPlaced: (order, user) => ({
    subject: `Order Confirmed - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmed!</h1>
        <p>Hi ${user.username},</p>
        <p>Thank you for your order. Your order has been placed successfully.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
        </div>
        
        <h3>Items Ordered:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #eee;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${item.productName}</td>
                <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">₹${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Shipping Address:</h3>
          <p>${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.addressLine1}<br>
          ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + "<br>" : ""}
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
          ${order.shippingAddress.country}</p>
        </div>
        
        <p>You can track your order status on our website.</p>
        <p>Thank you for shopping with SmartCart AI!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  }),

  orderShipped: (order, user) => ({
    subject: `Order Shipped - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Your Order Has Been Shipped!</h1>
        <p>Hi ${user.username},</p>
        <p>Great news! Your order has been shipped and is on its way.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Shipment Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Shipped Date:</strong> ${new Date(order.shippedAt).toLocaleDateString()}</p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ""}
          ${order.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>` : ""}
        </div>
        
        <p>Thank you for shopping with SmartCart AI!</p>
      </div>
    `,
  }),

  orderDelivered: (order, user) => ({
    subject: `Order Delivered - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">Order Delivered!</h1>
        <p>Hi ${user.username},</p>
        <p>Your order has been delivered successfully. We hope you enjoy your purchase!</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Delivered Date:</strong> ${new Date(order.deliveredAt).toLocaleDateString()}</p>
        </div>
        
        <p>Please take a moment to rate your experience. Your feedback helps us improve!</p>
        <p>Thank you for shopping with SmartCart AI!</p>
      </div>
    `,
  }),

  orderCancelled: (order, user) => ({
    subject: `Order Cancelled - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc3545;">Order Cancelled</h1>
        <p>Hi ${user.username},</p>
        <p>Your order has been cancelled as requested.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Cancelled Date:</strong> ${new Date(order.cancelledAt).toLocaleDateString()}</p>
          ${order.cancellationReason ? `<p><strong>Reason:</strong> ${order.cancellationReason}</p>` : ""}
        </div>
        
        <p>If you did not request this cancellation, please contact us immediately.</p>
        <p>Thank you for shopping with SmartCart AI!</p>
      </div>
    `,
  }),

  paymentConfirmed: (order, payment, user) => ({
    subject: `Payment Confirmed - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">Payment Confirmed!</h1>
        <p>Hi ${user.username},</p>
        <p>Your payment has been successfully processed.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Amount Paid:</strong> ₹${payment.amount.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${payment.method}</p>
          <p><strong>Transaction ID:</strong> ${payment.razorpayPaymentId || "N/A"}</p>
        </div>
        
        <p>Thank you for shopping with SmartCart AI!</p>
      </div>
    `,
  }),

  lowStockAlert: (product, admin) => ({
    subject: `Low Stock Alert: ${product.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ffc107;">Low Stock Alert</h1>
        <p>Hi Admin,</p>
        <p>The following product is running low on stock:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Product Name:</strong> ${product.name}</p>
          <p><strong>Product ID:</strong> ${product.id}</p>
          <p><strong>Current Stock:</strong> <span style="color: #dc3545; font-weight: bold;">${product.stock || 0}</span></p>
          <p><strong>Category:</strong> ${product.category}</p>
        </div>
        
        <p>Please restock this item soon to avoid missing sales.</p>
      </div>
    `,
  }),
};

// Send email function
async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.log("[email] Email not configured, skipping:", { to, subject });
    return { success: false, reason: "Email not configured" };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SmartCart AI" <noreply@smartcart.ai>',
      to,
      subject,
      html,
    });

    console.log("[email] Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[email] Failed to send email:", error);
    return { success: false, error: error.message };
  }
}

// Email sending functions
export async function sendOrderPlacedEmail(order, user) {
  if (!user.email) return { success: false, reason: "No email address" };
  
  const template = templates.orderPlaced(order, user);
  return sendEmail(user.email, template.subject, template.html);
}

export async function sendOrderShippedEmail(order, user) {
  if (!user.email) return { success: false, reason: "No email address" };
  
  const template = templates.orderShipped(order, user);
  return sendEmail(user.email, template.subject, template.html);
}

export async function sendOrderDeliveredEmail(order, user) {
  if (!user.email) return { success: false, reason: "No email address" };
  
  const template = templates.orderDelivered(order, user);
  return sendEmail(user.email, template.subject, template.html);
}

export async function sendOrderCancelledEmail(order, user) {
  if (!user.email) return { success: false, reason: "No email address" };
  
  const template = templates.orderCancelled(order, user);
  return sendEmail(user.email, template.subject, template.html);
}

export async function sendPaymentConfirmedEmail(order, payment, user) {
  if (!user.email) return { success: false, reason: "No email address" };
  
  const template = templates.paymentConfirmed(order, payment, user);
  return sendEmail(user.email, template.subject, template.html);
}

export async function sendLowStockAlert(product, adminEmail) {
  if (!adminEmail) return { success: false, reason: "No admin email" };
  
  const template = templates.lowStockAlert(product, {});
  return sendEmail(adminEmail, template.subject, template.html);
}

// Check if email is configured
export function isEmailConfigured() {
  return !!transporter;
}

