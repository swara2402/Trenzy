import { Sparkles, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Sparkles,
    title: "Smart Recommendations",
    description: "AI learns your style and suggests products you'll actually love.",
  },
  {
    icon: Users,
    title: "Group Shopping",
    description: "Create a group, blend your tastes, and find products everyone agrees on.",
  },
  {
    icon: TrendingUp,
    title: "Trend Radar",
    description: "Stay ahead with AI-curated trends based on real-time shopping data.",
  },
];

export default function AIBanner() {
  return (
    <section className="gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-primary-foreground md:text-3xl">
            Powered by <span className="text-accent">Intelligence</span>
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/60">
            Not just another store — it's your AI shopping companion.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur-sm"
            >
              <feat.icon className="h-8 w-8 text-accent" />
              <h3 className="mt-3 font-display text-lg font-semibold text-primary-foreground">{feat.title}</h3>
              <p className="mt-2 text-sm text-primary-foreground/60">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
