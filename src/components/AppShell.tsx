import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Wrench, BarChart3, Settings, Sparkles, LogOut, Bell } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/services", label: "Services", icon: Wrench },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const initial = (user?.email ?? "S")[0].toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/70 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2 px-6 pt-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-base font-bold">Servel</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Quoter studio
            </div>
          </div>
        </div>

        <nav className="mt-8 flex-1 px-4">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <ul className="mt-2 space-y-1">
            {nav.map((item) => {
              const active =
                location.pathname === item.to ||
                (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "gradient-primary text-primary-foreground shadow-glow"
                        : "text-foreground/80 hover:bg-sidebar-accent"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="m-4 rounded-2xl gradient-primary p-4 text-primary-foreground shadow-elegant">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" /> No-code quoters
          </div>
          <p className="mt-1 text-xs text-primary-foreground/85">
            Build dynamic pricing forms in minutes — no developer required.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border/60 bg-background/70 px-6 py-4 backdrop-blur-xl">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold sm:text-2xl">{title}</h1>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
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

        <main className="flex-1 px-6 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
