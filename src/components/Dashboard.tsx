import {
  ArrowUpRight,
  Plus,
  Wrench,
  TrendingUp,
  CircleDollarSign,
  HelpCircle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useServices } from "@/lib/services-store";
import { AppShell } from "@/components/AppShell";
import orangeAbstract from "@/assets/orange-abstract.jpg";

const heatmapRows = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const heatmap: number[][] = [
  [0, 0, 1, 1, 2, 2, 3, 3, 2, 1, 0, 0, 0],
  [0, 1, 1, 2, 2, 3, 3, 3, 2, 1, 1, 0, 0],
  [0, 0, 1, 2, 3, 3, 3, 3, 3, 2, 1, 0, 0],
  [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0],
  [0, 0, 1, 2, 3, 3, 3, 3, 2, 2, 1, 0, 0],
];
const heatmapHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const heatmapClasses = [
  "bg-[oklch(0.93_0.02_70)]",
  "bg-[oklch(0.88_0.08_55)]",
  "bg-[oklch(0.78_0.16_45)]",
  "bg-[oklch(0.65_0.22_35)]",
];

export function Dashboard() {
  const { user } = useAuth();
  const services = useServices();

  const totalQuotes = services.reduce((acc, s) => acc + s.stats.quotes, 0);
  const completed = services.reduce((acc, s) => acc + s.stats.completed, 0);
  const conversion = totalQuotes ? Math.round((completed / totalQuotes) * 100) : 0;
  const avgQuestions = services.length
    ? (services.reduce((a, s) => a + s.questions.length, 0) / services.length).toFixed(1)
    : "0";

  const topServices = [...services].sort((a, b) => b.stats.quotes - a.stats.quotes).slice(0, 4);

  return (
    <AppShell
      title={`Hi, ${(user?.email ?? "there").split("@")[0]} 👋`}
      subtitle="Here's how your quoters are performing this month."
      actions={
        <Link
          to="/services"
          className="hidden items-center gap-2 rounded-full gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] sm:inline-flex"
        >
          <Plus className="h-3.5 w-3.5" /> New service
        </Link>
      }
    >
      <div className="grid grid-cols-12 gap-5">
        {/* Total Quotes */}
        <Card className="col-span-12 sm:col-span-6 xl:col-span-3">
          <CardHeader title="Total quotes" />
          <div className="mt-3 text-3xl font-bold">{totalQuotes.toLocaleString()}</div>
          <div className="mt-1 text-xs text-[oklch(0.55_0.18_140)]">
            +{Math.max(1, Math.round(totalQuotes * 0.12))} this week
          </div>
          <div className="mt-5 space-y-2">
            {topServices.slice(0, 3).map((s) => {
              const pct = totalQuotes ? Math.round((s.stats.quotes / totalQuotes) * 100) : 0;
              return (
                <div key={s.id}>
                  <div className="flex justify-between text-[11px]">
                    <span className="truncate text-foreground/80">{s.name}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[oklch(0.94_0.02_70)]">
                    <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Hero card */}
        <div className="col-span-12 xl:col-span-6">
          <div className="relative h-full min-h-[280px] overflow-hidden rounded-3xl shadow-elegant">
            <img
              src={orangeAbstract}
              alt="Servel quoter studio"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/0 to-black/30" />
            <div className="absolute bottom-6 left-6 max-w-sm rounded-2xl bg-white/15 p-5 text-white backdrop-blur-md">
              <h3 className="font-display text-lg font-bold leading-tight">
                Build smart quoters in minutes
              </h3>
              <p className="mt-1 text-xs text-white/85">
                Define services, ask the right questions, set the rules — and let Servel quote
                for you.
              </p>
              <Link
                to="/services"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-primary"
              >
                Open services <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Conversion */}
        <Card className="col-span-12 sm:col-span-6 xl:col-span-3">
          <CardHeader title="Conversion rate" icon={TrendingUp} />
          <div className="mt-3 text-3xl font-bold">{conversion}%</div>
          <div className="mt-1 text-xs text-muted-foreground">Quotes → completed jobs</div>

          <div className="mt-6 flex items-end gap-1.5">
            {[40, 55, 48, 62, 58, 70, 65, 78, 72, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md gradient-primary opacity-80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </Card>

        {/* Active services */}
        <Card className="col-span-6 xl:col-span-3">
          <CardHeader title="Active services" icon={Wrench} />
          <div className="mt-3 text-3xl font-bold">{services.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Avg {avgQuestions} questions / quoter
          </div>
        </Card>

        {/* Avg ticket */}
        <Card className="col-span-6 xl:col-span-3">
          <CardHeader title="Avg quote value" icon={CircleDollarSign} />
          <div className="mt-3 text-3xl font-bold">$487</div>
          <div className="mt-1 text-xs text-[oklch(0.55_0.18_140)]">+8.4% vs last month</div>
        </Card>

        {/* Heatmap */}
        <Card className="col-span-12 xl:col-span-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-semibold">When quotes are requested</span>
              <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                <Legend color="oklch(0.93 0.02 70)" label="Low" />
                <Legend color="oklch(0.88 0.08 55)" label="Medium" />
                <Legend color="oklch(0.78 0.16 45)" label="High" />
                <Legend color="oklch(0.65 0.22 35)" label="Peak" />
              </div>
            </div>
            <Link
              to="/analytics"
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 flex gap-3">
            <div className="flex flex-col justify-between py-1 text-[10px] font-medium text-muted-foreground">
              {heatmapRows.map((r) => (
                <span key={r}>{r}</span>
              ))}
            </div>
            <div className="flex-1">
              <div className="grid grid-rows-5 gap-1.5">
                {heatmap.map((row, ri) => (
                  <div
                    key={ri}
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
                  >
                    {row.map((v, ci) => (
                      <div
                        key={ci}
                        className={`aspect-square rounded-md transition hover:scale-110 ${heatmapClasses[v]}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div
                className="mt-2 grid gap-1.5 text-center text-[9px] text-muted-foreground"
                style={{ gridTemplateColumns: `repeat(${heatmapHours.length}, minmax(0, 1fr))` }}
              >
                {heatmapHours.map((h) => (
                  <div key={h}>{h}h</div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Most answered questions */}
        <Card className="col-span-12 xl:col-span-6">
          <CardHeader title="Most answered questions" icon={HelpCircle} />
          <div className="mt-4 space-y-3">
            {services
              .flatMap((s) => s.questions.map((q) => ({ q, s })))
              .slice(0, 5)
              .map(({ q, s }, i) => {
                const pct = 95 - i * 12;
                return (
                  <div key={q.id}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="truncate">
                        <span className="font-medium">{q.label}</span>
                        <span className="text-muted-foreground"> · {s.name}</span>
                      </span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[oklch(0.94_0.02_70)]">
                      <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            {services.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Create a service to start collecting answers.
              </p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-card hover-lift rounded-3xl p-5 ${className}`}>{children}</div>;
}

function CardHeader({
  title,
  icon: Icon,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {title}
      </span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
