import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { categories } from "@/lib/data";

export default function CategorySection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="font-display text-2xl font-bold md:text-3xl">Browse Categories</h2>
      <p className="mt-1 text-sm text-muted-foreground">Find what you're looking for</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Link
              to={`/products?category=${cat.id}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center shadow-card transition-all hover:border-accent/30 hover:shadow-card-hover"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm font-semibold">{cat.name}</span>
              <span className="text-xs text-muted-foreground">{cat.count} items</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
