import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { TrendingUp, AlertCircle, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { useServices } from "@/lib/services-store";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const services = useServices();

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

  const totalQuotes = services.reduce((a, s) => a + s.stats.quotes, 0);
  const totalCompleted = services.reduce((a, s) => a + s.stats.completed, 0);
  const conversion = totalQuotes ? Math.round((totalCompleted / totalQuotes) * 100) : 0;

  return (
    <AppShell
      title="Analytics"
      subtitle="Performance insights across all your service quoters."
    >
      <div className="grid grid-cols-12 gap-5">
        <Stat
          label="Quotes generated"
          value={totalQuotes.toLocaleString()}
          delta="+12.4%"
          positive
        />
        <Stat label="Jobs completed" value={totalCompleted.toLocaleString()} delta="+8.1%" positive />
        <Stat label="Conversion" value={`${conversion}%`} delta="+2.3pp" positive />
        <Stat label="Avg quote value" value="$487" delta="−1.2%" positive={false} />

        <div className="glass-card col-span-12 rounded-3xl p-6 xl:col-span-8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-base font-semibold">Performance per service</h3>
              <p className="text-xs text-muted-foreground">
                Quotes vs completed jobs across all your quoters.
              </p>
            </div>
            <Trophy className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-6 space-y-5">
            {services.map((s) => {
              const conv = s.stats.quotes ? Math.round((s.stats.completed / s.stats.quotes) * 100) : 0;
              const widthQ = totalQuotes ? (s.stats.quotes / totalQuotes) * 100 : 0;
              const widthC = totalQuotes ? (s.stats.completed / totalQuotes) * 100 : 0;
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-muted-foreground">
                      {s.stats.quotes} quotes · {conv}% conversion
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[oklch(0.94_0.02_70)]">
                    <div
                      className="h-full bg-[oklch(0.85_0.12_55)]"
                      style={{ width: `${widthQ}%` }}
                    />
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[oklch(0.94_0.02_70)]">
                    <div className="h-full gradient-primary" style={{ width: `${widthC}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[oklch(0.85_0.12_55)]" /> Quotes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm gradient-primary" /> Completed
            </span>
          </div>
        </div>

        <div className="glass-card col-span-12 rounded-3xl p-6 xl:col-span-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Drop-off points</h3>
          </div>
          <p className="text-xs text-muted-foreground">Where users abandon your forms most often.</p>

          <div className="mt-5 space-y-3">
            {services
              .flatMap((s) => s.questions.slice(-1).map((q) => ({ q, s })))
              .slice(0, 5)
              .map(({ q, s }, i) => {
                const pct = 35 - i * 5;
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-border bg-white/60 p-3.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="truncate font-medium">{q.label}</span>
                      <span className="font-semibold text-destructive">{pct}%</span>
                    </div>
                    <div className="mt-1 truncate text-[10px] text-muted-foreground">
                      {s.name}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[oklch(0.94_0.02_70)]">
                      <div
                        className="h-full bg-destructive/70"
                        style={{ width: `${pct * 2}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="glass-card col-span-12 rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Quote volume — last 12 weeks</h3>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2">
            {[35, 48, 42, 60, 55, 72, 68, 80, 76, 88, 82, 95].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-xl gradient-primary opacity-90 transition hover:opacity-100"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  delta,
  positive,
}: {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <div className="glass-card hover-lift col-span-6 rounded-3xl p-5 xl:col-span-3">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div
        className={`mt-1 text-xs ${
          positive ? "text-[oklch(0.55_0.18_140)]" : "text-destructive"
        }`}
      >
        {delta} vs last month
      </div>
    </div>
  );
}
