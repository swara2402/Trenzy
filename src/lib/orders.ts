import type { CartItem } from "@/contexts/CartContext";
import { getStoredUser } from "./auth";

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

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_price: number;
  address: Address;
  payment_method: PaymentMethod;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  order_id: string;
  created_at: string;
  updated_at: string;
}

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  card: "Credit / Debit Card",
  upi: "UPI",
  cod: "Cash on Delivery",
};

const ORDERS_KEY = "smartcart_orders";

function getOrdersFromStorage(): Order[] {
  try {
    const stored = window.localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveOrdersToStorage(orders: Order[]): void {
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore localStorage errors
  }
}

export async function createOrder(
  _userId: string,
  items: CartItem[],
  address: Address,
  paymentMethod: PaymentMethod
): Promise<{ order: Order | null; error: Error | null }> {
  try {
    const user = getStoredUser();
    if (!user) {
      return { order: null, error: new Error("User not authenticated") };
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
    
    const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const orderData: Order = {
      id: orderId,
      user_id: user.id,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to localStorage
    const orders = getOrdersFromStorage();
    orders.unshift(orderData);
    saveOrdersToStorage(orders);

    return { order: orderData, error: null };
  } catch (err) {
    return { order: null, error: err as Error };
  }
}

export async function getUserOrders(_userId: string): Promise<{ orders: Order[]; error: Error | null }> {
  try {
    const user = getStoredUser();
    if (!user) {
      return { orders: [], error: new Error("User not authenticated") };
    }

    const orders = getOrdersFromStorage();
    const userOrders = orders
      .filter(order => order.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { orders: userOrders, error: null };
  } catch (err) {
    return { orders: [], error: err as Error };
  }
}

export async function getAllOrders(): Promise<{ orders: Order[]; error: Error | null }> {
  try {
    const user = getStoredUser();
    if (!user || !user.isAdmin) {
      return { orders: [], error: new Error("Admin access required") };
    }

    const orders = getOrdersFromStorage();
    return { orders: orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), error: null };
  } catch (err) {
    return { orders: [], error: err as Error };
  }
}

export async function getOrderById(orderId: string): Promise<{ order: Order | null; error: Error | null }> {
  try {
    const orders = getOrdersFromStorage();
    const order = orders.find(o => o.order_id === orderId);
    
    if (!order) {
      return { order: null, error: new Error("Order not found") };
    }

    return { order, error: null };
  } catch (err) {
    return { order: null, error: err as Error };
  }
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const orders = getOrdersFromStorage();
    const orderIndex = orders.findIndex(o => o.order_id === orderId);
    
    if (orderIndex === -1) {
      return { success: false, error: new Error("Order not found") };
    }

    orders[orderIndex].status = "cancelled";
    orders[orderIndex].updated_at = new Date().toISOString();
    saveOrdersToStorage(orders);

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}
