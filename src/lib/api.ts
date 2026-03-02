import type { Product } from "@/lib/data";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface FetchProductsParams {
  category?: string;
  search?: string;
  sort?: "popular" | "price-low" | "price-high" | "rating";
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<Product[]> {
  const query = new URLSearchParams();

  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.sort) query.set("sort", params.sort);
  if (typeof params.minPrice === "number") query.set("minPrice", String(params.minPrice));
  if (typeof params.maxPrice === "number") query.set("maxPrice", String(params.maxPrice));
  if (typeof params.limit === "number") query.set("limit", String(params.limit));

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
