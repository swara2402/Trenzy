import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/lib/data";

const RECENTLY_VIEWED_KEY = "smartcart_recently_viewed";
const MAX_RECENT = 20;

interface RecentlyViewedProps {
  currentProductId?: string;
  limit?: number;
}

export function RecentlyViewed({ currentProductId, limit = 8 }: RecentlyViewedProps) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        const products = JSON.parse(stored) as Product[];
        // Filter out current product if viewing one
        const filtered = currentProductId 
          ? products.filter(p => p.id !== currentProductId)
          : products;
        setRecentProducts(filtered.slice(0, limit));
      }
    } catch (e) {
      console.error("Failed to load recently viewed:", e);
    }
  }, [currentProductId, limit]);

  if (recentProducts.length === 0) {
    return null;
  }

  const displayedProducts = isExpanded ? recentProducts : recentProducts.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recently Viewed
        </h3>
        {recentProducts.length > 4 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show Less" : `View All (${recentProducts.length})`}
            <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayedProducts.map((product) => (
          <div 
            key={product.id} 
            className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <Link to={`/product/${product.id}`}>
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 object-cover"
              />
            </Link>
            <div className="p-3">
              <Link to={`/product/${product.id}`}>
                <p className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                  {product.name}
                </p>
              </Link>
              <p className="text-sm text-muted-foreground">{product.brand}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold">₹{product.price.toFixed(2)}</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => addToCart(product)}
                  disabled={!product.inStock}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook to track recently viewed products
export function useRecentlyViewed() {
  const addToRecentlyViewed = (product: Product) => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      let products: Product[] = stored ? JSON.parse(stored) : [];

      // Remove if already exists
      products = products.filter(p => p.id !== product.id);

      // Add to beginning
      products.unshift(product);

      // Limit
      products = products.slice(0, MAX_RECENT);

      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(products));
    } catch (e) {
      console.error("Failed to save recently viewed:", e);
    }
  };

  const clearRecentlyViewed = () => {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  };

  return { addToRecentlyViewed, clearRecentlyViewed };
}

