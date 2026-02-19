import { Link } from "react-router-dom";
import { Star, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/lib/data";
import { useCart } from "@/contexts/CartContext";

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const { addToCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover">
        <Link to={`/product/${product.id}`}>
          <div className="aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>

        {product.originalPrice && (
          <span className="absolute left-3 top-3 rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </span>
        )}

        <button
          onClick={() => addToCart(product)}
          aria-label={`Add ${product.name} to cart`}
          className="absolute bottom-[calc(50%+8px)] right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-all duration-300 hover:bg-accent hover:text-accent-foreground group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingBag className="h-4 w-4" />
        </button>

        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground">{product.brand}</p>
          <Link to={`/product/${product.id}`}>
            <h3 className="mt-1 text-sm font-semibold leading-snug text-card-foreground transition-colors hover:text-accent">
              {product.name}
            </h3>
          </Link>
          <div className="mt-2 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="text-xs font-medium">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-display text-base font-bold">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
