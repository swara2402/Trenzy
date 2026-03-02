import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, CreditCard, MapPin, Package } from "lucide-react";
import { format } from "date-fns";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getOrderById, paymentMethodLabel, type Order, type OrderItem } from "@/lib/orders";
import { useEffect, useState } from "react";

export default function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      const { order: nextOrder } = await getOrderById(orderId);
      setOrder(nextOrder);
      setLoading(false);
    };

    void loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading order...</p>
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
            <p className="text-muted-foreground mb-6">This order does not exist or is not accessible.</p>
            <Link to="/orders">
              <Button>Back to Orders</Button>
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
        <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold">Order {order.order_id}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(order.created_at), "MMM dd, yyyy")}
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {paymentMethodLabel[order.payment_method]}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent font-medium capitalize">
                {order.status}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((item: OrderItem) => (
                <div key={`${order.order_id}-${item.product_id}`} className="flex gap-4 p-3 rounded-lg bg-muted/50">
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold mt-1">${item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t border-border">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-display text-xl font-bold">${order.total_price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Shipping Address</h2>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">{order.address.fullName}</p>
                <p className="text-muted-foreground">{order.address.addressLine1}</p>
                {order.address.addressLine2 && <p className="text-muted-foreground">{order.address.addressLine2}</p>}
                <p className="text-muted-foreground">
                  {order.address.city}, {order.address.state} {order.address.zipCode}
                </p>
                <p className="text-muted-foreground">{order.address.country}</p>
                <p className="text-muted-foreground">Phone: {order.address.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
