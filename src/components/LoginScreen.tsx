import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Mail, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import servelHero from "@/assets/servel-hero.png";

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
          src={servelHero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70 grayscale"
          width={1024}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-black/0 to-black/0" />
      </aside>

      {/* Right form */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ingresar</div>
          </div>

          <div className="glass-card rounded-3xl p-8 sm:p-10">
            <h1 className="font-display text-3xl font-bold tracking-tight">Ingresar</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Iniciá sesión para continuar.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
                  Correo
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-base py-3 pl-10 pr-4"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base py-3 pl-10 pr-4"
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
                {loading ? "Ingresando..." : "Ingresar"}
              </button>

              <p className="pt-2 text-center text-xs text-muted-foreground">
                Usá{" "}
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
