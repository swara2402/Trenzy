import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { Product } from "@/lib/data";
import { getAuthToken, getStoredUser, type AuthUser } from "@/lib/auth";
import { getCart as fetchCart, updateCart as saveCart } from "@/lib/user";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "smartcart_cart";

function loadCartFromStorage(): CartItem[] {
  try {
    const stored = window.localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // ignore localStorage errors
  }
}

function mergeCartItems(a: CartItem[], b: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();

  for (const item of [...a, ...b]) {
    const existing = merged.get(item.product.id);
    if (existing) {
      merged.set(item.product.id, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      merged.set(item.product.id, item);
    }
  }

  return Array.from(merged.values());
}

function areCartItemsEqual(a: CartItem[], b: CartItem[]): boolean {
  if (a.length !== b.length) return false;

  const aMap = new Map(a.map((item) => [item.product.id, item.quantity]));
  for (const item of b) {
    if (aMap.get(item.product.id) !== item.quantity) return false;
  }

  return true;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const hasHydratedRef = useRef(false);
  const isSyncingRef = useRef(false);

  // Check for user authentication
  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    hasHydratedRef.current = true;
  }, []);

  // Sync cart with backend when user logs in
  useEffect(() => {
    async function syncWithBackend() {
      const token = getAuthToken();
      if (!token || isSyncingRef.current) return;

      isSyncingRef.current = true;
      try {
        const data = await fetchCart();
        if (data.cart && data.cart.length > 0) {
          // Fetch product details for each cart item
          const mergedItems: CartItem[] = [];
          for (const cartItem of data.cart) {
            try {
              const response = await fetch(`${API_BASE_URL}/api/products?search=${cartItem.productId}&limit=1`);
              if (response.ok) {
                const result = await response.json();
                if (result.products && result.products.length > 0) {
                  mergedItems.push({
                    product: result.products[0],
                    quantity: cartItem.quantity,
                  });
                }
              }
            } catch (e) {
              console.error("Failed to fetch product for cart sync:", e);
            }
          }

          if (mergedItems.length > 0) {
            // Merge local cart with backend cart (local takes precedence for quantities)
            const localItems = loadCartFromStorage();
            const finalItems = mergeCartItems(mergedItems, localItems);
            setItems(finalItems);
            saveCartToStorage(finalItems);
          }
        }
      } catch (error) {
        console.error("Failed to sync cart with backend:", error);
      } finally {
        isSyncingRef.current = false;
      }
    }

    if (user && hasHydratedRef.current) {
      syncWithBackend();
    }
  }, [user]);

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    saveCartToStorage(items);
    
    // Also sync to backend if user is logged in
    const token = getAuthToken();
    if (token && items.length > 0 && !isSyncingRef.current) {
      const cartData = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      saveCart(cartData).catch(console.error);
    }
  }, [items]);

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const syncCart = useCallback(async () => {
    if (!user) return;
    isSyncingRef.current = true;
    try {
      const data = await fetchCart();
      if (data.cart && data.cart.length > 0) {
        const mergedItems: CartItem[] = [];
        for (const cartItem of data.cart) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/products?search=${cartItem.productId}&limit=1`);
            if (response.ok) {
              const result = await response.json();
              if (result.products && result.products.length > 0) {
                mergedItems.push({
                  product: result.products[0],
                  quantity: cartItem.quantity,
                });
              }
            }
          } catch (e) {
            console.error("Failed to fetch product for cart sync:", e);
          }
        }

        if (mergedItems.length > 0) {
          const localItems = loadCartFromStorage();
          const finalItems = mergeCartItems(mergedItems, localItems);
          setItems(finalItems);
          saveCartToStorage(finalItems);
        }
      }
    } catch (error) {
      console.error("Failed to sync cart:", error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [user]);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setIsOpen, syncCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
