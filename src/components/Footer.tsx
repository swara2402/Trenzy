import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4 lg:gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 group">
              <Sparkles className="h-5 w-5 text-accent transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              <span className="font-display text-xl font-bold tracking-tight">
                SmartCart <span className="text-gradient">AI</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-loose text-muted-foreground max-w-xs">
              AI-powered shopping for the modern generation. Discover, shop, and share — smarter and faster than ever before.
            </p>
          </div>

          <div>
            <h4 className="font-display text-base font-semibold text-foreground">Shop</h4>
            <ul className="mt-4 space-y-3">
              {["All Products", "Electronics", "Fashion", "Fitness"].map((item) => (
                <li key={item}>
                  <Link to="/products" className="text-sm font-medium text-muted-foreground transition-all hover:text-accent hover:translate-x-1 inline-block">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-base font-semibold text-foreground">Company</h4>
            <ul className="mt-4 space-y-3">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-sm font-medium text-muted-foreground transition-all hover:text-accent hover:translate-x-1 inline-block">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-base font-semibold text-foreground">Support</h4>
            <ul className="mt-4 space-y-3">
              {["Help Center", "Returns", "Shipping", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-sm font-medium text-muted-foreground transition-all hover:text-accent hover:translate-x-1 inline-block">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-muted-foreground">
            © {new Date().getFullYear()} SmartCart AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            <div className="h-3 w-px bg-border"></div>
            <Link to="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
