import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Folder } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useAdminRole, useCategories, useServices, servicesActions } from "@/lib/services-store";

export const Route = createFileRoute("/categories/")({
  component: CategoriesIndex,
});

function CategoriesIndex() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { role } = useAdminRole();
  const categorias = useCategories();
  const services = useServices();
  const [creating, setCreating] = useState(false);
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    services.forEach((s) => {
      const k = s.categoryId ?? "";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return map;
  }, [services]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse bg-primary" />
      </div>
    );
  }

  return (
    <AppShell
      title="Categorías"
      subtitle="Organizá plantillas por categoría."
      actions={
        role !== "buho" ? (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Agregar categoría
          </button>
        ) : null
      }
    >
      {creating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCreating(false)} />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const name = nombre.trim();
              if (!name) return;
              setBusy(true);
              try {
                await servicesActions.addCategory(name);
                setNombre("");
                setCreating(false);
                if (role !== "aguila") navigate({ to: "/history" as any });
              } finally {
                setBusy(false);
              }
            }}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold">Nueva categoría</div>
                <div className="mt-1 text-xs text-muted-foreground">Se usa para agrupar plantillas.</div>
              </div>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-5">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nombre
              </div>
              <input
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input-base"
                placeholder="Ej: Salud"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}

      {categorias.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Folder className="h-6 w-6" />
          </div>
          <div className="mt-4 text-xl font-semibold">No hay categorías</div>
          <div className="mt-1 text-sm text-muted-foreground">Creá una categoría para empezar.</div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categorias.map((c) => {
            const n = counts.get(c.id) ?? 0;
            return (
              <Link
                key={c.id}
                to={"/categories/$id" as any}
                params={{ id: c.id } as any}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{c.nombre}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Ver plantillas de esta categoría</div>
                  </div>
                  <div className="border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-foreground">
                    {n}
                  </div>
                </div>
                <div className="p-4 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{n}</span> servicios
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
