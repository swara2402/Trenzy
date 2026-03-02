import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, ArrowRight } from "lucide-react";
import { login, isAdminUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user } = await login(email, password);
      
      if (!isAdminUser(user)) {
        setError("This account is not authorized for admin access.");
        setLoading(false);
        return;
      }

      setLoading(false);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-accent" />
            <span className="font-display text-2xl font-bold">
              SmartCart <span className="text-accent">Admin</span>
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold">Admin Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with an admin-authorized account</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-11"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 gradient-accent text-accent-foreground font-semibold shadow-accent-glow hover:opacity-90"
            disabled={loading}
          >
            {loading ? "Checking access..." : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}
