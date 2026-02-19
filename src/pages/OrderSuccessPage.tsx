import { Link, useParams } from "react-router-dom";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { getOrderById, type Order } from "@/lib/orders";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId).then(({ order, error }) => {
        if (error) {
          console.error("Error fetching order:", error);
        }
        setOrder(order);
        setLoading(false);
      });
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Order not found</h1>
            <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist</p>
            <Link to="/orders">
              <Button>View My Orders</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-4"
            >
              <CheckCircle className="h-10 w-10 text-accent" />
            </motion.div>
            <h1 className="font-display text-4xl font-bold mb-2">Order Placed Successfully!</h1>
            <p className="text-muted-foreground">Your order has been confirmed and will be processed soon</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-sm text-muted-foreground">Order ID</span>
                <span className="font-mono font-semibold">{order.order_id}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="font-display text-2xl font-bold">${order.total_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-sm text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">{order.payment_method.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="px-3 py-1 rounded-full bg-accent/10 text-accent font-medium capitalize">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="font-display text-xl font-bold mb-4">Shipping Address</h2>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.address.fullName}</p>
              <p className="text-muted-foreground">{order.address.addressLine1}</p>
              {order.address.addressLine2 && (
                <p className="text-muted-foreground">{order.address.addressLine2}</p>
              )}
              <p className="text-muted-foreground">
                {order.address.city}, {order.address.state} {order.address.zipCode}
              </p>
              <p className="text-muted-foreground">{order.address.country}</p>
              <p className="text-muted-foreground mt-2">Phone: {order.address.phone}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                View All Orders
              </Button>
            </Link>
            <Link to="/products" className="flex-1">
              <Button className="w-full gradient-accent text-accent-foreground font-semibold shadow-accent-glow hover:opacity-90">
                Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
