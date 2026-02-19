import { supabase } from "./supabaseClient";
import type { CartItem } from "@/contexts/CartContext";

export interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type PaymentMethod = "card" | "upi" | "cod";

export interface Order {
  id: string;
  user_id: string;
  items: CartItem[];
  total_price: number;
  address: Address;
  payment_method: PaymentMethod;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  order_id: string;
  created_at: string;
  updated_at: string;
}

export async function createOrder(
  userId: string,
  items: CartItem[],
  address: Address,
  paymentMethod: PaymentMethod
): Promise<{ order: Order | null; error: Error | null }> {
  try {
    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const orderData = {
      user_id: userId,
      items: items.map(({ product, quantity }) => ({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        product_price: product.price,
        quantity,
        subtotal: product.price * quantity,
      })),
      total_price: totalPrice,
      address,
      payment_method: paymentMethod,
      status: "pending",
      order_id: orderId,
    };

    const { data, error } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error("Error creating order:", error);
      return { order: null, error: new Error(error.message) };
    }

    return { order: data as Order, error: null };
  } catch (err) {
    return { order: null, error: err as Error };
  }
}

export async function getUserOrders(userId: string): Promise<{ orders: Order[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return { orders: [], error: new Error(error.message) };
    }

    return { orders: (data || []) as Order[], error: null };
  } catch (err) {
    return { orders: [], error: err as Error };
  }
}

export async function getOrderById(orderId: string): Promise<{ order: Order | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error) {
      console.error("Error fetching order:", error);
      return { order: null, error: new Error(error.message) };
    }

    return { order: data as Order, error: null };
  } catch (err) {
    return { order: null, error: err as Error };
  }
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("order_id", orderId);

    if (error) {
      console.error("Error cancelling order:", error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}
