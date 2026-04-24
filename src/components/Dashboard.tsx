import {
  Bell,
  Search,
  LayoutDashboard,
  FileText,
  Package,
  Folder,
  MessageSquare,
  CheckSquare,
  Bot,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Plus,
  LogOut,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import orangeAbstract from "@/assets/orange-abstract.jpg";

const navMain = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: FileText, label: "Templates" },
  { icon: Package, label: "Products", badge: "13" },
  { icon: Folder, label: "Docs", badge: "56" },
  { icon: MessageSquare, label: "Messages", badge: "4" },
];

const navMore = [
  { icon: CheckSquare, label: "To-do lists" },
  { icon: Bot, label: "AI Assistants" },
];

const interactions = [
  { name: "Dann Petty", color: "oklch(0.78 0.16 45)" },
  { name: "Flux Academy", color: "oklch(0.62 0.18 290)" },
  { name: "Michelle Choi", color: "oklch(0.7 0.13 200)" },
];

// Heatmap matrix (5 rows × 13 cols), values 0-3 = intensity
const heatmapRows = ["FEB", "FTI", "FKG", "FKH", "FKS"];
const heatmap: number[][] = [
  [0, 0, 0, 0, 1, 2, 3, 3, 2, 0, 0, 0, 0],
  [0, 0, 0, 1, 2, 3, 3, 3, 2, 1, 0, 0, 0],
  [0, 0, 1, 2, 3, 3, 3, 3, 3, 2, 1, 0, 0],
  [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0],
  [0, 0, 1, 2, 3, 3, 3, 3, 3, 2, 1, 0, 0],
];
const heatmapDays = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];

const heatmapClasses = [
  "bg-[oklch(0.93_0.02_70)]",
  "bg-[oklch(0.88_0.08_55)]",
  "bg-[oklch(0.78_0.16_45)]",
  "bg-[oklch(0.65_0.22_35)]",
];

const calendarDays = Array.from({ length: 28 }, (_, i) => i + 1);

export function Dashboard() {
  const { user, signOut } = useAuth();
  const initial = (user?.email ?? "O")[0].toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/70 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2 px-6 pt-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-base font-bold">Momentum</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Team's workspace
            </div>
          </div>
        </div>

        <nav className="mt-8 flex-1 px-4">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            General
          </p>
          <ul className="mt-2 space-y-1">
            {navMain.map((item) => (
              <li key={item.label}>
                <a
                  href="#"
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                    item.active
                      ? "gradient-primary text-primary-foreground shadow-glow"
                      : "text-foreground/80 hover:bg-sidebar-accent"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-medium ${
                        item.active ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            More
          </p>
          <ul className="mt-2 space-y-1">
            {navMore.map((item) => (
              <li key={item.label}>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80 transition hover:bg-sidebar-accent"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Interactions
          </p>
          <ul className="mt-2 space-y-1">
            {interactions.map((p) => (
              <li key={p.name}>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground/80 transition hover:bg-sidebar-accent"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: p.color }}
                  >
                    {p.name[0]}
                  </span>
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="m-4 rounded-2xl gradient-primary p-4 text-primary-foreground shadow-elegant">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" /> Upgrade to PRO
          </div>
          <p className="mt-1 text-xs text-primary-foreground/85">
            Unlock unlimited AI assistants & advanced analytics.
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border/60 bg-background/70 px-6 py-4 backdrop-blur-xl">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Preparation of technical specifications..."
                className="w-full rounded-full border border-border bg-white/70 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_oklch(0.71_0.21_45/0.12)]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-medium text-foreground/80 transition hover:bg-white">
              <Calendar className="h-3.5 w-3.5" /> Monthly
              <ChevronRight className="h-3 w-3 rotate-90" />
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/70 transition hover:bg-white">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full gradient-primary" />
            </button>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/70 transition hover:bg-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-primary-foreground">
              {initial}
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 sm:px-8 lg:px-10">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">
              Hi, {(user?.email ?? "Oliver").split("@")[0]}!
            </h1>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Let's customize your <span className="gradient-text">workspace.</span>
            </p>
          </div>

          <div className="grid grid-cols-12 gap-5">
            {/* Updates */}
            <Card className="col-span-12 sm:col-span-6 xl:col-span-3">
              <CardHeader title="Updates" />
              <div className="mt-3 text-3xl font-bold">1,892</div>
              <div className="text-xs text-muted-foreground">Total updates for the project</div>

              <div className="mt-5 flex items-end gap-2">
                <div className="flex-1 rounded-2xl bg-[oklch(0.96_0.03_60)] p-3">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-primary-deep">
                    <span className="h-1.5 w-1.5 rounded-full gradient-primary" />
                    Development
                  </div>
                  <div className="mt-1 text-xl font-bold">1,302</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full w-[90%] gradient-primary" />
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">90%</div>
                </div>
                <div className="flex h-24 w-10 flex-col-reverse overflow-hidden rounded-full bg-[oklch(0.96_0.03_60)]">
                  <div className="h-1/3 gradient-primary" />
                </div>
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>6%</span>
                <span>4%</span>
              </div>
            </Card>

            {/* Hero card */}
            <div className="col-span-12 xl:col-span-6">
              <div className="relative h-full min-h-[280px] overflow-hidden rounded-3xl shadow-elegant">
                <img
                  src={orangeAbstract}
                  alt="Abstract gradient"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/0 to-black/20" />
                <div className="absolute bottom-6 left-6 max-w-xs rounded-2xl bg-white/15 p-5 text-white backdrop-blur-md">
                  <h3 className="font-display text-lg font-bold leading-tight">
                    Maximize human productivity
                  </h3>
                  <p className="mt-1 text-xs text-white/85">
                    Replace all your software. Every app, AI agent, and human in one place.
                  </p>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <Card className="col-span-12 xl:col-span-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">February 2026</span>
                <div className="flex gap-1">
                  <IconBtn>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
                {calendarDays.map((d) => {
                  const active = d === 19;
                  return (
                    <div
                      key={d}
                      className={`flex h-8 items-center justify-center rounded-lg transition ${
                        active
                          ? "gradient-primary font-semibold text-primary-foreground shadow-glow"
                          : "hover:bg-accent"
                      }`}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3 border-t border-border/60 pt-4">
                <AgendaItem
                  title="Business Analysis"
                  meta="Prepare a list of competitors and references"
                  time="09:30 AM"
                />
                <AgendaItem
                  title="Preparation of the MVP"
                  meta="Final review of all flows and the launch plan"
                  time="07:15 AM"
                  highlighted
                />
              </div>
            </Card>

            {/* Iterations */}
            <Card className="col-span-6 xl:col-span-3">
              <CardHeader title="Iterations" />
              <div className="mt-3 text-3xl font-bold">282</div>
              <div className="mt-1 text-xs text-[oklch(0.55_0.18_140)]">
                +30.12% from previous weeks
              </div>
            </Card>

            {/* KPI */}
            <Card className="col-span-6 xl:col-span-3">
              <CardHeader title="KPI" />
              <div className="mt-3 text-3xl font-bold">3.78</div>
              <div className="mt-1 text-xs text-destructive">−5.6% from previous weeks</div>
            </Card>

            {/* Weekly Workload */}
            <Card className="col-span-12 xl:col-span-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-semibold">Weekly Workload</span>
                  <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                    <Legend color="oklch(0.93 0.02 70)" label="Low" />
                    <Legend color="oklch(0.88 0.08 55)" label="Medium" />
                    <Legend color="oklch(0.78 0.16 45)" label="High" />
                    <Legend color="oklch(0.65 0.22 35)" label="Fully Occupied" />
                  </div>
                </div>
                <a
                  href="#"
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  View all
                </a>
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
                  <div className="mt-2 grid grid-cols-13 gap-1.5 text-center text-[9px] text-muted-foreground"
                    style={{ gridTemplateColumns: `repeat(${heatmapDays.length}, minmax(0, 1fr))` }}>
                    {heatmapDays.map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Meetings */}
            <Card className="col-span-6 xl:col-span-3">
              <CardHeader title="Meetings" />
              <div className="mt-3 text-3xl font-bold">4.8h</div>
              <div className="mt-1 text-xs text-[oklch(0.55_0.18_140)]">
                +28.3% from previous weeks
              </div>
            </Card>

            {/* Finished */}
            <Card className="col-span-6 xl:col-span-3">
              <CardHeader title="Finished" />
              <div className="mt-3 text-3xl font-bold">94%</div>
              <div className="mt-1 text-xs text-[oklch(0.55_0.18_140)]">
                +3.0% from previous weeks
              </div>
            </Card>

            {/* CTA */}
            <div className="col-span-12 xl:col-span-6">
              <button className="group flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-4 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01]">
                <Plus className="h-4 w-4" /> Make an appointment
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card hover-lift rounded-3xl p-5 ${className}`}>{children}</div>
  );
}

function CardHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold">{title}</span>
      <a
        href="#"
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
      >
        View all <ArrowUpRight className="h-3 w-3" />
      </a>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white/70 transition hover:bg-white">
      {children}
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function AgendaItem({
  title,
  meta,
  time,
  highlighted = false,
}: {
  title: string;
  meta: string;
  time: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3 text-xs transition ${
        highlighted ? "bg-[oklch(0.96_0.04_60)]" : "hover:bg-accent/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground">{time}</span>
      </div>
      <p className="mt-0.5 text-muted-foreground">{meta}</p>
    </div>
  );
}
