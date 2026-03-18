import { getAuthToken } from "@/lib/auth";
import type { Product } from "@/lib/data";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export interface UserPreferences {
  categories: string[];
  brands: string[];
  tags: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface PriceHistoryPoint {
  price: number;
  recordedAt: string;
}

export interface PriceTrendResponse {
  productId: string;
  productName: string;
  currentPrice: number;
  history: PriceHistoryPoint[];
  model: {
    type: string;
    predictedPrice: number;
    slope?: number;
    intercept?: number;
  };
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

export async function trackBrowsingHistory(productId: string) {
  return fetchWithAuth(`/api/users/browse/${productId}`, { method: "POST" });
}

export async function getRecommendations(limit = 8): Promise<{ products: Product[] }> {
  return fetchWithAuth(`/api/users/recommendations?limit=${limit}`);
}

export async function getFeed(limit = 12): Promise<{ products: Product[] }> {
  return fetchWithAuth(`/api/users/feed?limit=${limit}`);
}

export async function getCartSuggestions(limit = 4): Promise<{ products: Product[] }> {
  const token = getAuthToken();
  if (!token) return { products: [] };
  return fetchWithAuth(`/api/users/cart/suggestions?limit=${limit}`);
}

export async function getPreferences(): Promise<{ preferences: UserPreferences }> {
  return fetchWithAuth("/api/users/preferences");
}

export async function updatePreferences(preferences: Partial<UserPreferences>): Promise<{ preferences: UserPreferences }> {
  return fetchWithAuth("/api/users/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}

export async function getPeopleAlsoBought(productId: string, limit = 4): Promise<{ products: Product[] }> {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/people-also-bought?limit=${limit}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

export async function getPriceTrend(productId: string, limit = 30): Promise<PriceTrendResponse> {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/price-trend?limit=${limit}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}
