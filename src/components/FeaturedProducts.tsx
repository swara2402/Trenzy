import { products } from "@/lib/data";
import ProductCard from "./ProductCard";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function FeaturedProducts() {
  const featured = products.filter((p) => p.popularity >= 80).slice(0, 4);

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">Trending Now</h2>
          <p className="mt-1 text-sm text-muted-foreground">Most popular picks this week</p>
        </div>
        <Link
          to="/products"
          className="hidden items-center gap-1 text-sm font-medium text-accent hover:underline md:flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {featured.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </section>
  );
}
