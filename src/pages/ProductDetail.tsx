import { useParams, Link } from "react-router-dom";
import { getProductById, getReviewsForProduct, products } from "@/lib/data";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { Star, ShoppingBag, ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = getProductById(id || "");
  const reviews = getReviewsForProduct(id || "");
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Product not found</p>
          <Link to="/products" className="mt-2 text-sm text-accent hover:underline">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const recommended = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {/* Images */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="overflow-hidden rounded-2xl border border-border">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === i ? "border-accent" : "border-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <p className="text-sm font-medium text-muted-foreground">{product.brand}</p>
            <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">{product.name}</h1>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="text-sm font-semibold">{product.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold">${product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">${product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <span className="rounded-lg bg-accent/10 px-2 py-0.5 text-sm font-bold text-accent">
                  Save ${(product.originalPrice - product.price).toFixed(2)}
                </span>
              )}
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            {/* Features */}
            <div className="mt-5 space-y-2">
              {product.features.map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-teal" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                onClick={() => addToCart(product)}
                className="flex-1 gradient-accent text-accent-foreground font-semibold shadow-accent-glow hover:opacity-90"
                size="lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>

            {/* AI recommendation hint */}
            <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-accent">AI Pick</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                This product matches your browsing preferences. People who viewed this also loved similar items in {product.category}.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-bold">Customer Reviews</h2>
            <div className="mt-6 space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{review.userName}</span>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < review.rating ? "fill-accent text-accent" : "text-border"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended */}
        {recommended.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-bold">You Might Also Like</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {recommended.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}
