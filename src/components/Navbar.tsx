import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Sparkles, Menu, X, LogOut, Settings } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { totalItems, setIsOpen } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const displayName =
    user?.user_metadata?.username ||
    (user?.email ? user.email.split("@")[0] : "");

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex justify-between items-center p-4">
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
        <div className="flex items-center gap-2">
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

          {/* User Greeting + Dropdown */}
          {user ? (
            <>
              {displayName && (
                <span className="hidden md:inline text-sm text-muted-foreground mr-1">
                  Hi, <span className="font-medium capitalize">{displayName}</span>
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:flex"
                    title="User account"
                  >
                    <User className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      {displayName && (
                        <p className="text-sm font-medium capitalize">Hi, {displayName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <button
              className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:flex"
              title="User account"
            >
              <User className="h-5 w-5" />
            </button>
          )}

          {/* Cart */}
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

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-muted-foreground md:hidden"
            title="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            {user ? (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" size="sm" className="gradient-accent text-accent-foreground shadow-accent-glow">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Shop
              </Link>
              <Link
                to="/products?category=electronics"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Electronics
              </Link>
              <Link
                to="/products?category=fashion"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Fashion
              </Link>
              <Link
                to="/products?category=fitness"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Fitness
              </Link>
              <div className="pt-3 border-t border-border space-y-2">
                {user ? (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground">{user.email}</div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button variant="default" className="w-full gradient-accent text-accent-foreground shadow-accent-glow">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
