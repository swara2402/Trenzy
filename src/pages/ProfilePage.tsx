import { Link } from "react-router-dom";
import { ArrowLeft, User, Mail, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Please sign in</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your profile</p>
            <Link to="/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">
                  {user.user_metadata?.username || "User"}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Profile editing functionality will be implemented here. This is a placeholder page.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
