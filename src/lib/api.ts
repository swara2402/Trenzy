import type { Product } from "@/lib/data";
import { getAuthToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

interface FetchProductsParams {
  category?: string;
  color?: string;
  search?: string;
  sort?: "popular" | "price-low" | "price-high" | "rating" | "newest";
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  page?: number;
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<Product[]> {
  const query = new URLSearchParams();

  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.sort) query.set("sort", params.sort);
  if (typeof params.minPrice === "number") query.set("minPrice", String(params.minPrice));
  if (typeof params.maxPrice === "number") query.set("maxPrice", String(params.maxPrice));
  if (params.color) query.set("color", params.color);
  if (typeof params.limit === "number") query.set("limit", String(params.limit));
  if (typeof params.page === "number") query.set("page", String(params.page));

  const url = `${API_BASE_URL}/api/products${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  const data = await response.json();
  return (data.products || []) as Product[];
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Order API functions
export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note: string;
  }>;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface CreateOrderParams {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  notes?: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function createOrder(params: CreateOrderParams): Promise<{ order: Order; error: Error | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return { order: null, error: new Error(data.message || "Failed to create order") };
    }

    return { order: data.order, error: null };
  } catch (err) {
    return { order: null, error: err as Error };
  }
}

export async function getUserOrders(page = 1, limit = 20): Promise<{ orders: Order[]; error: Error | null; pagination?: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders?page=${page}&limit=${limit}`, {
      headers: await getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { orders: [], error: new Error(data.message || "Failed to fetch orders") };
    }

    return { orders: data.orders, pagination: data.pagination, error: null };
  } catch (err) {
    return { orders: [], error: err as Error };
  }
}

export async function getOrderById(orderId: string): Promise<{ order: Order | null; error: Error | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      headers: await getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { order: null, error: new Error(data.message || "Failed to fetch order") };
    }

    return { order: data.order, error: null };
  } catch (err) {
    return { order: null, error: err as Error };
  }
}

export async function cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: new Error(data.message || "Failed to cancel order") };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}

// Payment API functions
export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  paymentId: string;
  key: string;
}

export async function createRazorpayOrder(orderId: string, amount: number): Promise<{ razorpayOrder: RazorpayOrder | null; error: Error | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ orderId, amount }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { razorpayOrder: null, error: new Error(data.message || "Failed to create payment order") };
    }

    return { 
      razorpayOrder: {
        orderId: data.orderId,
        amount: data.amount / 100, // Convert from paise
        currency: data.currency,
        paymentId: data.paymentId,
        key: data.key,
      }, 
      error: null 
    };
  } catch (err) {
    return { razorpayOrder: null, error: err as Error };
  }
}

export async function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  paymentId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/verify`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: new Error(data.message || "Payment verification failed") };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}

// Analytics API functions
export interface SearchSuggestion {
  type: "product" | "search";
  id?: string;
  name?: string;
  brand?: string;
  category?: string;
  image?: string;
  price?: number;
  query?: string;
}

export async function getSearchSuggestions(query: string, limit = 8): Promise<SearchSuggestion[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/search-suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch {
    return [];
  }
}

export async function trackProductView(productId: string, source?: string, duration?: number): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/analytics/product-view`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ productId, source, duration }),
    });
  } catch {
    // Silently fail - analytics should not break the app
  }
}

export async function trackCartAction(productId: string, action: "add" | "remove" | "update", quantity?: number, source?: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/analytics/cart-action`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ productId, action, quantity, source }),
    });
  } catch {
    // Silently fail
  }
}

export async function trackSearchQuery(query: string, resultsCount?: number, clickedProductId?: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/analytics/search`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ query, resultsCount, clickedProductId }),
    });
  } catch {
    // Silently fail
  }
}

export async function trackCartAbandonment(cartValue: number, itemCount: number): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/analytics/cart-abandonment`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ cartValue, itemCount }),
    });
  } catch {
    // Silently fail
  }
}

export interface DashboardAnalytics {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    averageOrderValue: number;
  };
  revenueSeries: Array<{ date: string; revenue: number }>;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  lowStockProducts: Array<{ id: string; name: string; brand: string; stock: number; inStock: boolean }>;
  recentOrders: Order[];
}

export async function getDashboardAnalytics(days = 7): Promise<DashboardAnalytics | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/dashboard?days=${days}`, {
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

