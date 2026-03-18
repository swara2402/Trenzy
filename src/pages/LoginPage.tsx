import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login } from "@/lib/auth";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    try {
      const storedEmail = window.localStorage.getItem("smartcart_remember_email");
      if (storedEmail) {
        setEmail(storedEmail);
        setRememberMe(true);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);

      try {
        if (rememberMe) {
          window.localStorage.setItem("smartcart_remember_email", email);
        } else {
          window.localStorage.removeItem("smartcart_remember_email");
        }
      } catch {
        // ignore localStorage errors
      }

      // Redirect to the page user was trying to access, or home
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-3xl glassmorphism-card shadow-elevated p-8 md:p-10 relative overflow-hidden border-white/10 backdrop-blur-3xl">
          {/* Decorative glowing orbs */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/30 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent/20 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>

          {/* Logo/Header */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:scale-105 transition-transform">
              <Sparkles className="h-8 w-8 text-accent animate-pulse" />
              <span className="font-display text-3xl font-black tracking-tight">
                SmartCart <span className="text-gradient">AI</span>
              </span>
            </Link>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="mt-3 text-base text-muted-foreground">
              Sign in to your account to continue shopping
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <span>Remember me</span>
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-destructive/10 border border-destructive/20 p-3"
              >
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full h-14 rounded-xl gradient-accent text-white font-bold text-lg shadow-accent-glow hover:scale-[1.02] transition-transform duration-300 border-0"
              disabled={loading}
            >
              {loading ? (
                "Logging in..."
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-accent hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
