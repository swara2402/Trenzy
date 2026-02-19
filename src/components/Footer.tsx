import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="font-display text-lg font-bold">SmartCart AI</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              AI-powered shopping for the modern generation. Discover, shop, and share — smarter.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold">Shop</h4>
            <ul className="mt-3 space-y-2">
              {["All Products", "Electronics", "Fashion", "Fitness"].map((item) => (
                <li key={item}>
                  <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold">Company</h4>
            <ul className="mt-3 space-y-2">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold">Support</h4>
            <ul className="mt-3 space-y-2">
              {["Help Center", "Returns", "Shipping", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 SmartCart AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
