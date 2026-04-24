import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Wrench, ArrowUpRight, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { useServices, servicesActions, UNIT_LABELS, type Unit } from "@/lib/services-store";

export const Route = createFileRoute("/services/")({
  component: ServicesIndex,
});

function ServicesIndex() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const services = useServices();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<Unit>("unit");
  const [base, setBase] = useState<string>("");

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const svc = servicesActions.create(
      name.trim(),
      unit,
      base ? Number(base) : undefined,
    );
    setCreating(false);
    setName("");
    setBase("");
    navigate({ to: "/services/$id", params: { id: svc.id } });
  };

  return (
    <AppShell
      title="Services"
      subtitle="Each service is a smart quoter you can configure."
      actions={
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
        >
          <Plus className="h-3.5 w-3.5" /> New service
        </button>
      }
    >
      {creating && (
        <form
          onSubmit={submit}
          className="glass-card mb-6 rounded-3xl p-6"
        >
          <h3 className="font-display text-lg font-semibold">Create a new service</h3>
          <p className="text-xs text-muted-foreground">Give it a name and choose how you charge.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="Task name">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Window installation"
                className="input-base"
              />
            </Field>
            <Field label="Unit of measurement">
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="input-base"
              >
                {Object.entries(UNIT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Base price (optional)">
              <input
                type="number"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                placeholder="0"
                className="input-base"
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-medium hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full gradient-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
            >
              Create service
            </button>
          </div>
        </form>
      )}

      {services.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
            <Wrench className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold">No services yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first quoter to start configuring questions, rules and pricing.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow"
          >
            <Plus className="h-3.5 w-3.5" /> Create service
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <div key={s.id} className="glass-card hover-lift group rounded-3xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.96_0.04_60)] text-primary">
                  <Wrench className="h-4 w-4" />
                </div>
                <span className="rounded-full bg-[oklch(0.94_0.04_65)] px-2.5 py-1 text-[10px] font-medium text-primary-deep">
                  {UNIT_LABELS[s.unit]}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold leading-tight">{s.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.questions.length} {s.questions.length === 1 ? "question" : "questions"}
                {s.basePrice ? ` · base $${s.basePrice}` : ""}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-white/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Quotes
                  </div>
                  <div className="mt-0.5 text-lg font-bold">{s.stats.quotes}</div>
                </div>
                <div className="rounded-2xl bg-white/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Won
                  </div>
                  <div className="mt-0.5 text-lg font-bold">{s.stats.completed}</div>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <Link
                  to="/services/$id"
                  params={{ id: s.id }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
                >
                  Configure <ArrowUpRight className="h-3 w-3" />
                </Link>
                <Link
                  to="/services/$id"
                  params={{ id: s.id }}
                  search={{ preview: true }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/70 text-foreground/70 transition hover:bg-white"
                  title="Preview"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${s.name}"?`)) servicesActions.remove(s.id);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/70 text-destructive transition hover:bg-white"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
