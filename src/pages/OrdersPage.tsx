import { Link } from "react-router-dom";
import { ArrowLeft, Package, ShoppingBag, Calendar, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { getUserOrders as fetchUserOrders, cancelOrder, paymentMethodLabel, type Order, type OrderItem } from "@/lib/orders";
import { getStoredUser, getCurrentUser, type AuthUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function OrdersPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadInitialData = async () => {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        await loadOrders(storedUser.id);
      } else {
        // Try to fetch fresh user data
        const freshUser = await getCurrentUser();
        if (freshUser) {
          setUser(freshUser);
          await loadOrders(freshUser.id);
        } else {
          setLoading(false);
        }
      }
    };

    loadInitialData();
  }, []);

  const loadOrders = async (userId: string) => {
    setLoading(true);
    const { orders, error } = await fetchUserOrders(userId);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } else {
      setOrders(orders);
    }
    setLoading(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    const shouldCancel = window.confirm("Cancel this order?");
    if (!shouldCancel) return;

    setCancellingOrderId(orderId);
    const { success, error } = await cancelOrder(orderId);
    setCancellingOrderId(null);
    if (success) {
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully",
      });
      if (user) {
        loadOrders(user.id);
      }
    } else {
      toast({
        title: "Error",
        description: error?.message || "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Please sign in</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your orders</p>
            <Link to="/login">
              <Button>Sign In</Button>
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
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-4xl font-extrabold mb-8 tracking-tight">My Orders</h1>

          {orders.length === 0 ? (
            <div className="rounded-3xl glassmorphism-card shadow-elevated p-10">
              <div className="flex flex-col items-center justify-center py-16">
                <ShoppingBag className="h-20 w-20 text-muted-foreground/50 mb-6" />
                <h2 className="text-2xl font-bold mb-3 font-display">No orders yet</h2>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Order history will be displayed here once you place your first order. Discover what we have for you.
                </p>
                <Link to="/products">
                  <Button size="lg" className="rounded-xl gradient-accent text-white shadow-accent-glow hover:scale-105 transition-transform border-0">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl glassmorphism-card shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <span className="font-mono font-semibold">{order.order_id}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        order.status === "delivered" ? "bg-green-500/10 text-green-500" :
                        order.status === "cancelled" ? "bg-red-500/10 text-red-500" :
                        order.status === "shipped" ? "bg-blue-500/10 text-blue-500" :
                        "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {order.status}
                      </span>
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOrder(order.order_id)}
                          disabled={cancellingOrderId === order.order_id}
                        >
                          {cancellingOrderId === order.order_id ? "Cancelling..." : "Cancel"}
                        </Button>
                      )}
                      <Link to={`/orders/${order.order_id}`}>
                        <Button variant="outline" size="sm">Details</Button>
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {order.items.map((item: OrderItem) => (
                      <div key={`${order.order_id}-${item.product_id}`} className="flex gap-4 p-4 rounded-xl border border-white/5 bg-secondary/30">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold mt-1">₹{item.subtotal.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {order.address.city}, {order.address.state}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-display text-xl font-bold">₹{order.total_price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
