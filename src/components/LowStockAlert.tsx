import { useState, useEffect } from "react";
import { AlertTriangle, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LowStockProduct {
  id: string;
  name: string;
  brand: string;
  stock: number;
}

interface LowStockAlertProps {
  products?: LowStockProduct[];
  threshold?: number;
  onRestock?: (productId: string) => void;
}

export function LowStockAlert({ products = [], threshold = 5, onRestock }: LowStockAlertProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter products that are actually low on stock and not dismissed
  const lowStockProducts = products.filter(
    (p) => p.stock <= threshold && !dismissed.has(p.id)
  );

  if (lowStockProducts.length === 0) {
    return null;
  }

  const dismissProduct = (productId: string) => {
    setDismissed((prev) => new Set([...prev, productId]));
  };

  const criticalProducts = lowStockProducts.filter((p) => p.stock === 0);
  const warningProducts = lowStockProducts.filter((p) => p.stock > 0);

  return (
    <div className="space-y-2">
      {isExpanded ? (
        <>
          {/* Critical stock (out of stock) */}
          {criticalProducts.length > 0 && (
            <Alert variant="destructive" className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span>Out of Stock</span>
                <span className="text-xs font-normal">
                  {criticalProducts.length} product{criticalProducts.length > 1 ? "s" : ""}
                </span>
              </AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                {criticalProducts.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => onRestock?.(product.id)}
                      >
                        Restock
                      </Button>
                      <button
                        onClick={() => dismissProduct(product.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {criticalProducts.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{criticalProducts.length - 3} more out of stock
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Warning stock (low but not out) */}
          {warningProducts.length > 0 && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="flex items-center justify-between text-yellow-800">
                <span>Low Stock Warning</span>
                <span className="text-xs font-normal">
                  {warningProducts.length} product{warningProducts.length > 1 ? "s" : ""}
                </span>
              </AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                {warningProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{product.name}</span>
                      <span className="text-yellow-700 font-medium">
                        ({product.stock} left)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => onRestock?.(product.id)}
                      >
                        Restock
                      </Button>
                      <button
                        onClick={() => dismissProduct(product.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {warningProducts.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{warningProducts.length - 5} more low stock
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start border-yellow-500 text-yellow-700"
          onClick={() => setIsExpanded(true)}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          {lowStockProducts.length} product{lowStockProducts.length > 1 ? "s" : ""} need attention
        </Button>
      )}

      {isExpanded && lowStockProducts.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => setIsExpanded(false)}
        >
          Collapse alerts
        </Button>
      )}
    </div>
  );
}

