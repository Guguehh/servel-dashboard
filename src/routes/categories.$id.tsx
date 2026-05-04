import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useCategories, useServices } from "@/lib/services-store";

export const Route = createFileRoute("/categories/$id")({
  component: CategoryDetail,
});

function CategoryDetail() {
  const { id } = Route.useParams();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const categorias = useCategories();
  const services = useServices();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const categoria = categorias.find((c) => c.id === id);
  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return services.filter((s) => {
      if ((s.categoryId ?? "") !== id) return false;
      if (!term) return true;
      return s.nombre.toLowerCase().includes(term) || s.descripcion.toLowerCase().includes(term);
    });
  }, [id, q, services]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse bg-primary" />
      </div>
    );
  }

  if (!categoria) {
    return (
      <AppShell title="Categoría no encontrada">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="text-sm text-muted-foreground">Esta categoría ya no existe.</div>
          <Link
            to="/categories"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a categorías
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Categoría - ${categoria.nombre}`}
      subtitle={
        <span className="flex items-center gap-2">
          <Link to="/categories" className="hover:text-foreground">
            Categorías
          </Link>
          <span>/</span>
          <span>{categoria.nombre}</span>
        </span>
      }
      actions={
        <Link
          to="/services"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Ver catálogo
        </Link>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Plantillas</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{items.length} resultados</div>
          </div>
          <div className="w-full sm:w-[320px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="input-base pl-10"
                placeholder="Buscar en esta categoría…"
              />
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-border bg-card p-10 text-center">
          <div className="text-sm font-medium">No hay servicios en esta categoría</div>
          <div className="mt-1 text-xs text-muted-foreground">Asigná una plantilla a esta categoría desde el constructor.</div>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => (
            <Link
              key={s.id}
              to="/services/$id"
              params={{ id: s.id }}
              className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground"
            >
              <div className="border-b border-border p-4">
                <div className="truncate text-sm font-semibold text-foreground">{s.nombre}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{s.descripcion}</div>
              </div>
              <div className="p-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{s.definicion.campos?.length ?? 0}</span> campos
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
