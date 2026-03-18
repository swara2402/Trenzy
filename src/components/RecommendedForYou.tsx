import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { getRecommendations } from "@/lib/recommendations";
import type { Product } from "@/lib/data";
import { getAuthToken } from "@/lib/auth";

export default function RecommendedForYou() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await getRecommendations(8);
        setProducts(data.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (!getAuthToken()) {
    return null;
  }

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Recommended for You</h2>
        <p className="mt-2 text-sm text-muted-foreground">Loading personalized picks...</p>
      </section>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div>
        <h2 className="font-display text-2xl font-bold md:text-3xl">Recommended for You</h2>
        <p className="mt-1 text-sm text-muted-foreground">Based on your browsing and preferences</p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.slice(0, 8).map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}
