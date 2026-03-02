import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getStoredUser } from "@/lib/auth";
import { getWishlist as fetchWishlist, addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemoveFromWishlist } from "@/lib/user";

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_KEY = "smartcart_wishlist";

function loadWishlistFromStorage(): string[] {
  try {
    const stored = window.localStorage.getItem(WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWishlistToStorage(wishlist: string[]): void {
  try {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  } catch {
    // ignore localStorage errors
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>(loadWishlistFromStorage);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  // Fetch wishlist from backend on mount if user is logged in
  useEffect(() => {
    async function fetchWishlistFromBackend() {
      if (user) {
        try {
          const data = await fetchWishlist();
          if (data.wishlist) {
            setWishlist(data.wishlist);
            saveWishlistToStorage(data.wishlist);
          }
        } catch (error) {
          console.error("Failed to fetch wishlist from backend:", error);
        }
      }
      setLoading(false);
    }
    fetchWishlistFromBackend();
  }, [user]);

  // Persist to localStorage whenever wishlist changes
  useEffect(() => {
    saveWishlistToStorage(wishlist);
  }, [wishlist]);

  const addToWishlist = useCallback(async (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });

    if (user) {
      try {
        await apiAddToWishlist(productId);
      } catch (error) {
        console.error("Failed to add to wishlist on backend:", error);
      }
    }
  }, [user]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));

    if (user) {
      try {
        await apiRemoveFromWishlist(productId);
      } catch (error) {
        console.error("Failed to remove from wishlist on backend:", error);
      }
    }
  }, [user]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist, loading }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
