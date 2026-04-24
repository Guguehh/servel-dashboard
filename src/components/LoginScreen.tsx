import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Mail, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import orangeAbstract from "@/assets/orange-abstract.jpg";

export function LoginScreen() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("agus1234!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left visual */}
      <aside className="relative hidden overflow-hidden lg:block">
        <img
          src={orangeAbstract}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          width={1024}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.62_0.23_35/0.55)] via-transparent to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">Momentum</span>
          </div>
          <div className="max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight">
              Maximize human productivity.
            </h2>
            <p className="mt-4 text-base text-white/85">
              Replace all your software. Every app, AI agent, and human in one place.
            </p>
          </div>
        </div>
      </aside>

      {/* Right form */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold">Momentum</span>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 sm:p-10">
            <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to continue to your workspace.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
                  Email
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-input bg-white/70 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_oklch(0.71_0.21_45/0.15)]"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground" htmlFor="password">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-input bg-white/70 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_oklch(0.71_0.21_45/0.15)]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Signing in..." : "Login"}
              </button>

              <p className="pt-2 text-center text-xs text-muted-foreground">
                Use{" "}
                <span className="font-medium text-foreground">admin@admin.com</span> /{" "}
                <span className="font-medium text-foreground">agus1234!</span>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
