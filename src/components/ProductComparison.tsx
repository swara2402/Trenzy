import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ShoppingCart, Heart, ArrowRightLeft, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import type { Product } from "@/lib/data";

interface ProductComparisonProps {
  products: Product[];
  maxProducts?: number;
  onRemove?: (productId: string) => void;
}

export function ProductComparison({ products, maxProducts = 4, onRemove }: ProductComparisonProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(products.slice(0, maxProducts));
  
  useEffect(() => {
    setSelectedProducts(products.slice(0, maxProducts));
  }, [products, maxProducts]);

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    onRemove?.(productId);
  };

  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  if (selectedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products to compare</p>
        <Link to="/products" className="text-primary hover:underline mt-2 inline-block">
          Browse products
        </Link>
      </div>
    );
  }

  // Comparison attributes to display
  const attributes = [
    { key: "price", label: "Price", type: "price" },
    { key: "originalPrice", label: "Original Price", type: "price" },
    { key: "rating", label: "Rating", type: "rating" },
    { key: "reviewCount", label: "Reviews", type: "number" },
    { key: "brand", label: "Brand", type: "text" },
    { key: "category", label: "Category", type: "text" },
    { key: "inStock", label: "Availability", type: "boolean" },
    { key: "stock", label: "Stock", type: "stock" },
    { key: "description", label: "Description", type: "longText" },
    { key: "features", label: "Features", type: "list" },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Product Headers */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedProducts.length}, 1fr)` }}>
          <div className="sticky left-0 bg-background p-4 font-medium">Product</div>
          {selectedProducts.map((product) => (
            <div key={product.id} className="bg-background p-4 relative border rounded-lg">
              <button
                onClick={() => removeProduct(product.id)}
                className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-contain mb-4 rounded"
              />
              <Link to={`/product/${product.id}`} className="font-medium hover:text-primary line-clamp-2">
                {product.name}
              </Link>
              <p className="text-sm text-muted-foreground">{product.brand}</p>
            </div>
          ))}
        </div>

        {/* Comparison Rows */}
        {attributes.map((attr) => (
          <div 
            key={attr.key} 
            className="grid gap-4 border-t"
            style={{ gridTemplateColumns: `200px repeat(${selectedProducts.length}, 1fr)` }}
          >
            <div className="sticky left-0 bg-muted/30 p-4 text-sm font-medium">
              {attr.label}
            </div>
            {selectedProducts.map((product) => {
              const value = product[attr.key as keyof Product];
              return (
                <div key={product.id} className="p-4 text-sm">
                  {renderAttributeValue(attr.type, value)}
                </div>
              );
            })}
          </div>
        ))}

        {/* Action Buttons */}
        <div 
          className="grid gap-4 border-t"
          style={{ gridTemplateColumns: `200px repeat(${selectedProducts.length}, 1fr)` }}
        >
          <div className="sticky left-0 bg-muted/30 p-4 font-medium">Actions</div>
          {selectedProducts.map((product) => (
            <div key={product.id} className="p-4 flex flex-col gap-2">
              <Button
                onClick={() => addToCart({ product, quantity: 1 })}
                disabled={!product.inStock}
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                onClick={() => toggleWishlist(product)}
                className="w-full"
              >
                <Heart 
                  className={`h-4 w-4 mr-2 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`} 
                />
                {isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderAttributeValue(type: string, value: any): React.ReactNode {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (type) {
    case "price":
      return (
        <span className="font-semibold">
          ₹{typeof value === "number" ? value.toFixed(2) : value}
        </span>
      );
    case "rating":
      return (
        <div className="flex items-center gap-1">
          <span className="font-semibold">{value}</span>
          <span className="text-yellow-500">★</span>
        </div>
      );
    case "boolean":
      return value ? (
        <span className="text-green-600 flex items-center gap-1">
          <Check className="h-4 w-4" /> Available
        </span>
      ) : (
        <span className="text-red-500 flex items-center gap-1">
          <Minus className="h-4 w-4" /> Out of Stock
        </span>
      );
    case "stock":
      return (
        <span className={value <= 5 ? "text-orange-500 font-medium" : ""}>
          {value} units
        </span>
      );
    case "list":
      if (Array.isArray(value)) {
        return (
          <ul className="list-disc list-inside space-y-1">
            {value.slice(0, 5).map((item: string, i: number) => (
              <li key={i} className="text-xs">{item}</li>
            ))}
            {value.length > 5 && <li className="text-xs text-muted-foreground">+{value.length - 5} more</li>}
          </ul>
        );
      }
      return <span className="text-muted-foreground">-</span>;
    case "longText":
      return (
        <p className="text-xs text-muted-foreground line-clamp-3">
          {String(value)}
        </p>
      );
    default:
      return String(value);
  }
}

// Comparison Bar Component
export function ComparisonBar({ 
  products, 
  onCompare 
}: { 
  products: Product[]; 
  onCompare: () => void;
}) {
  if (products.length < 2) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium">{products.length} products selected</span>
          <div className="flex gap-2">
            {products.slice(0, 4).map((product) => (
              <div key={product.id} className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded border"
                />
                <button
                  onClick={() => {
                    const index = products.findIndex(p => p.id === product.id);
                    if (index > -1) {
                      products.splice(index, 1);
                    }
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => products.splice(0)}>
            Clear All
          </Button>
          <Button onClick={onCompare}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Compare Now
          </Button>
        </div>
      </div>
    </div>
  );
}

