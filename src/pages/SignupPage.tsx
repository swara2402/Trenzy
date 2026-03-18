import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "@/lib/auth";
import { Sparkles, User, Mail, Lock, ArrowRight, Store } from "lucide-react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const SignupPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "vendor">("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup(username, email, password, role);
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
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
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent/30 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-accent/20 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>

          {/* Logo/Header */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:scale-105 transition-transform">
              <Sparkles className="h-8 w-8 text-accent animate-pulse" />
              <span className="font-display text-3xl font-black tracking-tight">
                SmartCart <span className="text-gradient">AI</span>
              </span>
            </Link>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">Create account</h1>
            <p className="mt-3 text-base text-muted-foreground">
              Join SmartCart AI and start shopping smarter
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
              />
            </div>

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
                placeholder="Create a strong password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                Account Type
              </label>
              <RadioGroup
                value={role}
                onValueChange={(val: "buyer" | "vendor") => setRole(val)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="buyer" id="buyer" className="peer sr-only" />
                  <label
                    htmlFor="buyer"
                    className="flex flex-col items-center justify-between rounded-xl border border-white/10 bg-secondary/30 p-4 hover:bg-secondary/50 peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/10 cursor-pointer transition-colors font-medium"
                  >
                    Shopper
                  </label>
                </div>
                <div>
                  <RadioGroupItem value="vendor" id="vendor" className="peer sr-only" />
                  <label
                    htmlFor="vendor"
                    className="flex flex-col items-center justify-between rounded-xl border border-white/10 bg-secondary/30 p-4 hover:bg-secondary/50 peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/10 cursor-pointer transition-colors font-medium"
                  >
                    Seller
                  </label>
                </div>
              </RadioGroup>
            </div>

            {error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-destructive/10 border border-destructive/20 p-3"
              >
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            ) : (
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
                <p className="text-xs text-muted-foreground">
                  You&apos;ll receive an email to confirm your account.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 rounded-xl gradient-accent text-white font-bold text-lg shadow-accent-glow hover:scale-[1.02] transition-transform duration-300 border-0"
              disabled={loading}
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  Create Account <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
