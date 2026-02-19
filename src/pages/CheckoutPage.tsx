import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft, ShoppingBag, CreditCard, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { createOrder, type Address, type PaymentMethod } from "@/lib/orders";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState<Address>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to place an order",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setLoading(true);

    const { order, error } = await createOrder(user.id, items, address, paymentMethod);

    setLoading(false);

    if (error || !order) {
      toast({
        title: "Order failed",
        description: error?.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Clear cart and redirect to order success
    clearCart();
    navigate(`/order-success/${order.order_id}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">Add some items to your cart before checkout</p>
            <Link to="/products">
              <Button>Continue Shopping</Button>
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
          <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Order Summary */}
            <div className="order-2 md:order-1">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-4">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
                        <p className="text-sm font-semibold mt-1">${(product.price * quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="font-display text-2xl font-bold">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="order-1 md:order-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Shipping Address */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-display text-xl font-bold mb-4">Shipping Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        required
                        value={address.fullName}
                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressLine1">Address Line 1 *</Label>
                      <Input
                        id="addressLine1"
                        required
                        value={address.addressLine1}
                        onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                        placeholder="123 Main Street"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input
                        id="addressLine2"
                        value={address.addressLine2}
                        onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                        placeholder="Apartment, suite, etc. (optional)"
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          required
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          placeholder="New York"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          required
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          placeholder="NY"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          required
                          value={address.zipCode}
                          onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                          placeholder="10001"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          required
                          value={address.country}
                          onChange={(e) => setAddress({ ...address, country: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-display text-xl font-bold mb-4">Payment Method</h2>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                    <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-secondary cursor-pointer">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Cash on Delivery</div>
                          <div className="text-xs text-muted-foreground">Pay when you receive</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-secondary cursor-pointer">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex-1 cursor-pointer flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        <div>
                          <div className="font-medium">UPI</div>
                          <div className="text-xs text-muted-foreground">Pay via UPI apps</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-secondary cursor-pointer">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-xs text-muted-foreground">Pay with card</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gradient-accent text-accent-foreground font-semibold shadow-accent-glow hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? "Placing Order..." : `Place Order — $${totalPrice.toFixed(2)}`}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
