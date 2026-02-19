import { Link } from "react-router-dom";
import { ArrowLeft, Package, ShoppingBag, Calendar, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { getUserOrders, cancelOrder, type Order } from "@/lib/orders";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadOrders(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadOrders(session.user.id);
      } else {
        setOrders([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadOrders = async (userId: string) => {
    setLoading(true);
    const { orders, error } = await getUserOrders(userId);
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
    const { success, error } = await cancelOrder(orderId);
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

        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold mb-8">My Orders</h1>

          {orders.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Order history will be displayed here once you place your first order.
                </p>
                <Link to="/products">
                  <Button>Start Shopping</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-border bg-card p-6">
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
                          {order.payment_method.toUpperCase()}
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
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4 p-3 rounded-lg bg-muted/50">
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

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {order.address.city}, {order.address.state}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-display text-xl font-bold">${order.total_price.toFixed(2)}</p>
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
