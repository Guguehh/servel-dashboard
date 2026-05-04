import { Link, useLocation } from "@tanstack/react-router";
import {
  Folder,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle,
  History,
  Users,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAdminRole } from "@/lib/services-store";
import logoSrc from "@/assets/Isotipo-Monocromo-Negro 1.svg";

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
  const { role } = useAdminRole();
  const location = useLocation();
  const initial = (user?.email ?? "S")[0].toUpperCase();
  const nav = [
    { to: "/dashboard", label: "HOME", icon: LayoutDashboard },
    { to: "/services", label: "SERVICIOS", icon: Wrench },
    { to: "/categories", label: "CATEGORÍAS", icon: Folder },
    { to: "/history", label: "HISTORIAL", icon: History },
    ...(role === "aguila" ? [{ to: "/accounts", label: "USUARIOS", icon: Users } as const] : []),
    { to: "/profile", label: "PERFIL", icon: UserCircle },
    { to: "/settings", label: "Configuración", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1400px] gap-0 px-4 py-0 sm:px-6 lg:px-8">
        <aside className="sticky top-0 hidden h-screen w-20 shrink-0 lg:block">
          <div className="flex h-full flex-col border-r border-border bg-background">
            <div className="flex flex-col items-center gap-2 px-2 pt-5">
              <img src={logoSrc} alt="Servel" className="h-12 w-12 object-contain" />
            </div>

            <nav className="mt-6 flex-1 px-2">
              <ul className="space-y-1">
                {nav.map((item) => {
                  const active =
                    item.to &&
                    (location.pathname === item.to ||
                      (item.to !== "/dashboard" && location.pathname.startsWith(item.to)));
                  const base =
                    "group flex w-full flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[10px] font-semibold transition";
                  const cls = active
                    ? `${base} bg-primary text-primary-foreground`
                    : `${base} text-foreground hover:bg-muted`;

                  return (
                    <li key={item.label}>
                      <Link to={item.to} className={cls}>
                        <item.icon className="h-5 w-5" />
                        <span className="leading-none">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="px-2 pb-5">
              <div className="flex flex-col items-center gap-2 pt-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground">
                  {initial}
                </div>
                <button
                  onClick={() => signOut()}
                  title="Cerrar sesión"
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[10px] font-semibold text-foreground transition hover:bg-muted"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-6">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  onClick={() => signOut()}
                  title="Cerrar sesión"
                  className="flex h-10 w-10 items-center justify-center border border-border bg-card text-foreground transition hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <div className="flex h-10 w-10 items-center justify-center border border-border bg-card text-sm font-semibold text-foreground">
                  {initial}
                </div>
              </div>
            </div>
          </header>

          <main className="px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
