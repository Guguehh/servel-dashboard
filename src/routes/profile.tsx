import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useAdminRole } from "@/lib/services-store";
import { Switch } from "@/components/ui/switch";
import { LogOut, Moon } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const THEME_KEY = "servel.theme.v1";
type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(THEME_KEY);
  return v === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function ProfilePage() {
  const { session, loading, user, signOut } = useAuth();
  const { role } = useAdminRole();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<Theme>(() => readTheme());

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const name = useMemo(() => {
    const meta = (user as any)?.user_metadata as any | undefined;
    const fromMeta = typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
    return fromMeta || (user?.email ?? "");
  }, [user]);

  const avatarUrl = useMemo(() => {
    const meta = (user as any)?.user_metadata as any | undefined;
    return typeof meta?.avatar_url === "string" ? meta.avatar_url : "";
  }, [user]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse bg-primary" />
      </div>
    );
  }

  return (
    <AppShell title="Perfil" subtitle="Tu cuenta y preferencias.">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Cuenta</div>
          <div className="mt-1 text-xs text-muted-foreground">Datos de tu usuario.</div>

          <div className="mt-5 flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-border bg-muted">
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{name}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email ?? "—"}</div>
            </div>
            <div className="ml-auto rounded-xl border border-border bg-background px-3 py-2 text-[11px] font-semibold text-foreground">
              {role}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Row label="Correo" value={user?.email ?? "—"} />
            <Row label="Rol" value={role} />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-bold">Apariencia</div>
              <div className="mt-1 text-xs text-muted-foreground">Preferencias visuales del panel.</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground">
              <Moon className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Modo oscuro</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Activa el tema oscuro para la web.</div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
