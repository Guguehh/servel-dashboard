import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full gradient-primary" />
      </div>
    );
  }

  return (
    <AppShell title="Analíticas" subtitle="Esta sección fue removida del panel.">
      <div className="glass-card rounded-3xl p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Si necesitás reportes, los armamos con los datos reales de tu base.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/services" })}
          className="mt-5 inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a servicios
        </button>
      </div>
    </AppShell>
  );
}
