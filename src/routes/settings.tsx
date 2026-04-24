import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { session, loading, user, signOut } = useAuth();
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
    <AppShell title="Settings" subtitle="Manage your workspace preferences.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Account</h3>
          <p className="text-xs text-muted-foreground">Signed in as the workspace admin.</p>
          <div className="mt-5 space-y-3">
            <Row label="Email" value={user?.email ?? "—"} />
            <Row label="Plan" value="Pro · unlimited quoters" />
            <Row label="Workspace" value="Servel" />
          </div>
          <button
            onClick={() => signOut()}
            className="mt-6 rounded-full border border-border bg-white/70 px-5 py-2 text-xs font-semibold transition hover:bg-white"
          >
            Sign out
          </button>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Quoter defaults</h3>
          <p className="text-xs text-muted-foreground">
            These defaults are applied when you create a new service.
          </p>
          <div className="mt-5 space-y-3">
            <Row label="Currency" value="USD ($)" />
            <Row label="Default unit" value="Unit" />
            <Row label="Min. price floor" value="—" />
          </div>
        </div>

        <div className="glass-card col-span-full rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Branding</h3>
          <p className="text-xs text-muted-foreground">
            Customize how quoters look to your specialists.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PaletteSwatch label="Primary" color="oklch(0.71 0.21 45)" />
            <PaletteSwatch label="Surface" color="oklch(0.975 0.012 75)" />
            <PaletteSwatch label="Accent" color="oklch(0.62 0.23 35)" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function PaletteSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <div className="h-12 w-full rounded-xl shadow-soft" style={{ background: color }} />
      <div className="mt-2 text-[11px] font-semibold">{label}</div>
      <div className="text-[10px] text-muted-foreground">{color}</div>
    </div>
  );
}
