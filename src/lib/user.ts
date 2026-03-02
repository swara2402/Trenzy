import { getAuthToken } from "./auth";
import type { Product } from "./data";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

// Profile
export async function getProfile() {
  return fetchWithAuth("/api/users/profile");
}

export async function updateProfile(data: { username?: string; email?: string }) {
  return fetchWithAuth("/api/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Addresses
export async function getAddresses() {
  return fetchWithAuth("/api/users/addresses");
}

export async function addAddress(address: {
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}) {
  return fetchWithAuth("/api/users/addresses", {
    method: "POST",
    body: JSON.stringify(address),
  });
}

export async function updateAddress(
  addressId: string,
  address: {
    label?: string;
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
  }
) {
  return fetchWithAuth(`/api/users/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(address),
  });
}

export async function deleteAddress(addressId: string) {
  return fetchWithAuth(`/api/users/addresses/${addressId}`, {
    method: "DELETE",
  });
}

// Wishlist
export async function getWishlist() {
  return fetchWithAuth("/api/users/wishlist");
}

export async function addToWishlist(productId: string) {
  return fetchWithAuth(`/api/users/wishlist/${productId}`, {
    method: "POST",
  });
}

export async function removeFromWishlist(productId: string) {
  return fetchWithAuth(`/api/users/wishlist/${productId}`, {
    method: "DELETE",
  });
}

// Cart
export async function getCart() {
  return fetchWithAuth("/api/users/cart");
}

export async function updateCart(cart: { productId: string; quantity: number }[]) {
  return fetchWithAuth("/api/users/cart", {
    method: "PUT",
    body: JSON.stringify({ cart }),
  });
}

// Reviews
export interface Review {
  id: string;
  userId: { _id: string; username: string };
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function getReviews(productId: string) {
  return fetchWithAuth(`/api/users/reviews?productId=${productId}`);
}

export async function addReview(productId: string, rating: number, comment: string) {
  return fetchWithAuth("/api/users/reviews", {
    method: "POST",
    body: JSON.stringify({ productId, rating, comment }),
  });
}
