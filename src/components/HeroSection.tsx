import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-center">
      {/* Background layer */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear hover:scale-110 opacity-40 dark:opacity-20 blend-overlay"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-[2px]" />
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] mix-blend-screen opacity-60 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-[120px] mix-blend-screen opacity-60 animate-pulse delay-1000" />

      <div className="container relative mx-auto px-4 py-24 md:py-36 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center flex flex-col items-center"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full glassmorphism px-5 py-2 hover:bg-white/10 transition-colors shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-foreground tracking-wide">AI-Powered Shopping Experience</span>
          </motion.div>

          <h1 className="font-display text-5xl font-extrabold leading-[1.1] text-foreground md:text-7xl lg:text-8xl tracking-tight">
            Shop smarter, <br className="hidden md:block"/>
            <span className="text-gradient">not harder.</span>
          </h1>

          <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground md:text-xl font-light leading-relaxed">
            Discover products curated precisely for you with our next-generation AI engine. 
            Fast, intuitive, and designed for modern life.
          </p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link
              to="/products"
              className="group inline-flex items-center gap-2 rounded-xl gradient-accent px-8 py-4 text-sm font-semibold text-white shadow-accent-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_40px_hsl(var(--accent)/0.4)]"
            >
              Start Shopping 
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/products?tag=trending"
              className="inline-flex items-center gap-2 rounded-xl glassmorphism border-border/50 bg-background/50 px-8 py-4 text-sm font-semibold text-foreground transition-all duration-300 hover:bg-background hover:scale-[1.02] shadow-sm hover:shadow-md"
            >
              Trending Now
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
