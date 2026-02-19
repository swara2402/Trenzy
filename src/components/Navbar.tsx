import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Sparkles, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { totalItems, setIsOpen } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <nav className="flex justify-between items-center p-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent" />
        <span className="font-display text-xl font-bold tracking-tight">
          SmartCart <span className="text-accent">AI</span>
        </span>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden items-center gap-8 md:flex">
        <Link to="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Shop
        </Link>
        <Link to="/products?category=electronics" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Electronics
        </Link>
        <Link to="/products?category=fashion" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Fashion
        </Link>
        <Link to="/products?category=fitness" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Fitness
        </Link>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.form
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSearch}
              className="overflow-hidden"
            >
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="h-9 w-full rounded-lg border border-border bg-secondary px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-accent"
              />
            </motion.form>
          )}
        </AnimatePresence>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="Search products"
        >
          <Search className="h-5 w-5" />
        </button>

        <button className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:flex" title="User account">
          <User className="h-5 w-5" />
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {totalItems}
            </span>
          )}
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-muted-foreground md:hidden"
          title="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex space-x-4">
        <Link to="/login">
          <Button variant="outline">Login</Button>
        </Link>
        <Link to="/signup">
          <Button variant="outline">Sign Up</Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
