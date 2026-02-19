import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60" />

      <div className="container relative mx-auto px-4 py-24 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">AI-Powered Shopping</span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
            Shop smarter,{" "}
            <span className="text-accent">not harder.</span>
          </h1>

          <p className="mt-4 max-w-lg text-base text-primary-foreground/70 md:text-lg">
            Discover products curated just for you with AI-powered recommendations. 
            Fast, intelligent, and designed for the way you shop.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-xl gradient-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-accent-glow transition-all hover:opacity-90"
            >
              Start Shopping <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/products?tag=trending"
              className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/20 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Trending Now
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
