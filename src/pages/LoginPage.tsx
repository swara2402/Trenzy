import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

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
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Add your email",
        description: "Enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Reset link sent",
      description: "Check your email for a password reset link.",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {/* Logo/Header */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
              <span className="font-display text-2xl font-bold">
                SmartCart <span className="text-accent">AI</span>
              </span>
            </Link>
            <h1 className="font-display text-3xl font-bold">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
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
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-accent hover:underline"
              >
                Forgot password?
              </button>
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
              className="w-full h-11 gradient-accent text-accent-foreground font-semibold shadow-accent-glow hover:opacity-90"
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
