import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bolt,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import {
  useAdminUi,
  useAdminRole,
  useCategories,
  useDataStatus,
  usePriceTypes,
  useServices,
  servicesActions,
} from "@/lib/services-store";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/services/")({
  component: ServicesIndex,
});

function ServicesIndex() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const categorias = useCategories();
  const tiposPrecio = usePriceTypes();
  const { error, demo } = useDataStatus();
  const { role } = useAdminRole();
  const services = useServices();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [confirm, setConfirm] = useState<null | {
    title: string;
    message: string;
    confirmText?: string;
    requirePassword?: boolean;
    onConfirm: () => void;
  }>(null);
  const [nombre, setNombre] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [precioActivo, setPrecioActivo] = useState(true);
  const [unidadCode, setUnidadCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!categoryId && categorias.length > 0) setCategoryId(categorias[0]!.id);
  }, [categoryId, categorias]);

  useEffect(() => {
    if (!unidadCode && tiposPrecio.length > 0) setUnidadCode(tiposPrecio[0]!.code);
  }, [unidadCode, tiposPrecio]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse bg-primary" />
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setBusy(true);
    setActionError(null);
    try {
      if (role !== "aguila") {
        const isTurno = precioActivo && (unidadCode || "").includes("turno");
        await servicesActions.requestCreateService({
          nombre: nombre.trim(),
          categoryId: categoryId || undefined,
          definicion: {
            version: 2,
            config: {
              precio: {
                activo: precioActivo,
                unidadCode: precioActivo ? (unidadCode as any) : null,
              },
              duracion: isTurno
                ? { activo: true, obligatorio: true, tipo: "turno", opciones: ["45 min", "60 min", "90 min", "Personalizado"] }
                : { activo: false, obligatorio: false, tipo: "libre", modo: "estimada" },
              modalidad: { activo: false, opciones: [] },
              ubicacion: { requiere: false },
              urgencia: { permite: false },
              productos: { permite: true },
            },
            campos: [],
          },
        });
        setCreating(false);
        setNombre("");
        navigate({ to: "/history" });
        return;
      }

      const svc = await servicesActions.create(nombre.trim());
      const isTurno = precioActivo && (unidadCode || "").includes("turno");
      const camposDefaults = categoryId ? servicesActions.createCamposFromCategoryDefaults(categoryId) : [];
      await servicesActions.update(svc.id, {
        categoryId: categoryId || undefined,
        definicion: {
          ...svc.definicion,
          config: {
            ...svc.definicion.config,
            precio: {
              ...svc.definicion.config.precio,
              activo: precioActivo,
              unidadCode: precioActivo
                ? ((unidadCode || svc.definicion.config.precio.unidadCode) as any)
                : svc.definicion.config.precio.unidadCode,
            },
            duracion: isTurno
              ? {
                  ...svc.definicion.config.duracion,
                  activo: true,
                  obligatorio: true,
                  tipo: "turno",
                  opciones: ["45 min", "60 min", "90 min", "Personalizado"],
                }
              : svc.definicion.config.duracion,
          },
          campos: camposDefaults,
        },
      });
      setCreating(false);
      setNombre("");
      navigate({ to: "/services/$id", params: { id: svc.id } });
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err && "message" in err && typeof (err as any).message === "string"
          ? (err as any).message
          : "No se pudo crear el servicio.";
      setActionError(msg);
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await servicesActions.seedDemo();
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err && "message" in err && typeof (err as any).message === "string"
          ? (err as any).message
          : "No se pudo cargar el set de demo.";
      setActionError(msg);
    } finally {
      setBusy(false);
    }
  };

  const activos = services.filter((s) => s.activo).length;
  const totalCampos = services.reduce((acc, s) => acc + (s.definicion.campos?.length ?? 0), 0);
  const totalConfigs = services.reduce((acc, s) => {
    const c = s.definicion.config;
    return (
      acc +
      (c.precio.activo ? 1 : 0) +
      (c.duracion.activo ? 1 : 0) +
      (c.modalidad.activo ? 1 : 0) +
      (c.ubicacion.requiere ? 1 : 0) +
      (c.urgencia.permite ? 1 : 0)
    );
  }, 0);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (categoryFilter !== "all") {
        if ((s.categoryId ?? "") !== categoryFilter) return false;
      }
      if (!q) return true;
      return (
        s.nombre.toLowerCase().includes(q) ||
        s.descripcion.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, query, services]);

  const trend = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (13 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const dayKey = (d: Date) =>
      d.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "");

    return days.map((d, i) => {
      const base = Math.max(2, activos);
      const wave = Math.round(base + Math.sin(i / 2) * (base / 2) + (i % 3) * 0.6);
      return { dia: dayKey(d), solicitudes: Math.max(0, wave) };
    });
  }, [activos]);

  return (
    <AppShell
      title="Plantillas de servicio - Catálogo"
      subtitle="Definí la estructura de los servicios (no sus valores)."
      actions={
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          disabled={busy}
        >
          <Plus className="h-4 w-4" /> Añadir plantilla
        </button>
      }
    >
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const action = confirm.onConfirm;
            setConfirm(null);
            action();
          }}
        />
      )}
      {(error || actionError || demo) && (
        <div className="mb-5 rounded-2xl border border-border bg-muted p-4 text-sm">
          <div className="font-semibold">
            {demo ? "Modo demo local (sin base de datos)" : "No se pudieron cargar/crear servicios en la base de datos."}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {demo
              ? "No existen las tablas en Supabase. Se muestran servicios de ejemplo para que puedas avanzar con la UI."
              : ((actionError ?? error) as string)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => servicesActions.refresh()}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:bg-muted"
              disabled={busy}
            >
              Reintentar carga
            </button>
            <button
              type="button"
              onClick={seed}
              className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={busy}
            >
              Cargar servicios demo
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-12 gap-5">
        <OverviewCard
          title="Servicios activos"
          value={activos.toLocaleString()}
          subtitle={`${services.length} en total`}
          icon={Wrench}
        />
        <OverviewCard
          title="Campos personalizados"
          value={totalCampos.toLocaleString()}
          subtitle="En todos los servicios"
          icon={Bolt}
        />
        <OverviewCard
          title="Configuraciones activas"
          value={totalConfigs.toLocaleString()}
          subtitle="Precio, duración, ubicación, urgencia"
          icon={Bolt}
        />

        <div className="glass-card col-span-12 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Tendencias de servicio</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Solicitudes de servicios eléctricos por día (últimos 14 días).
              </p>
            </div>
            <div className="border border-border bg-muted px-3 py-1.5 text-[11px] font-semibold text-foreground">
              Últimos 14 días
            </div>
          </div>

          <div className="mt-5 h-52">
            <ChartContainer
              config={{
                solicitudes: { label: "Solicitudes", color: "var(--primary)" },
              }}
              className="h-full w-full"
            >
              <AreaChart data={trend} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <XAxis
                  dataKey="dia"
                  axisLine={{ stroke: "var(--foreground)", strokeWidth: 1 }}
                  tickLine={false}
                  tickMargin={10}
                  interval={1}
                  tick={{ fill: "var(--foreground)", fontSize: 10 }}
                />
                <YAxis
                  axisLine={{ stroke: "var(--foreground)", strokeWidth: 1 }}
                  tickLine={false}
                  width={28}
                  tick={{ fill: "var(--foreground)", fontSize: 10 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="linear"
                  dataKey="solicitudes"
                  stroke="var(--color-solicitudes)"
                  fill="rgba(0, 102, 255, 0.12)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </div>

      {creating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCreating(false)} />
          <form onSubmit={submit} className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-semibold">Añadir nuevo servicio</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Define lo básico ahora. Podés editar campos y reglas después.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Field label="Nombre">
                <input
                  autoFocus
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Instalación eléctrica"
                  className="input-base"
                />
              </Field>
              <Field label="Categoría">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input-base"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex flex-col justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPrecioActivo((v) => !v)}
                  className="flex items-center justify-between gap-3 border border-border bg-card px-4 py-3 text-left transition hover:bg-muted"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Activar precio
                  </span>
                  <span
                    className={`inline-flex border border-border px-2 py-1 text-[10px] font-semibold ${
                      precioActivo ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                    }`}
                  >
                    {precioActivo ? "Activo" : "Inactivo"}
                  </span>
                </button>
              </div>
            </div>

            {precioActivo && (
              <div className="mt-4">
                <Field label="Unidad de cotización">
                  <select value={unidadCode} onChange={(e) => setUnidadCode(e.target.value)} className="input-base">
                    {tiposPrecio.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.label}{t.unitLabel ? ` / ${t.unitLabel}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

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
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Crear servicio
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Plantillas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestiona la estructura del formulario que se renderiza en la app móvil.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Añadir plantilla
          </button>
        </div>

        {services.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition ${
                  categoryFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Todas
              </button>
              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id)}
                  className={`rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition ${
                    categoryFilter === c.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
            <div className="w-full sm:w-[320px]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-base"
                placeholder="Buscar plantillas…"
              />
            </div>
          </div>
        )}

        {services.length === 0 ? (
          <div className="glass-card mt-5 rounded-2xl border border-border bg-card p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Wrench className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">Todavía no hay servicios</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Crea tu primer servicio para empezar.
            </p>
            <button
              onClick={() => setCreating(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Crear servicio
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredServices.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                canDelete={role !== "buho"}
                onRequestDelete={() =>
                  setConfirm({
                    title: "Eliminar plantilla",
                    message: `¿Eliminar "${s.nombre}"?`,
                    confirmText: "Eliminar",
                    requirePassword: true,
                    onConfirm: () => servicesActions.remove(s.id),
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
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

function OverviewCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="glass-card col-span-12 rounded-2xl border border-border bg-card p-6 sm:col-span-6 xl:col-span-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">{title}</div>
          <div className="mt-2 text-4xl font-bold tabular-nums">{value}</div>
          <div className="mt-2 text-xs font-semibold text-muted-foreground">{subtitle}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  canDelete,
  onRequestDelete,
}: {
  service: (ReturnType<typeof useServices>[number]);
  canDelete: boolean;
  onRequestDelete: () => void;
}) {
  const adminUi = useAdminUi();
  const categorias = useCategories();
  const tiposPrecio = usePriceTypes();
  const categoria = categorias.find((c) => c.id === service.categoryId)?.nombre ?? "Servicio";
  const unidad = tiposPrecio.find((t) => t.code === (service.definicion.config.precio.unidadCode ?? ""));
  const unidadTexto = unidad ? `${unidad.label}${unidad.unitLabel ? ` / ${unidad.unitLabel}` : ""}` : "—";
  const modalidadTexto = formatModalidad(service.definicion.config.modalidad.opciones);

  const icon =
    categoria === "Electricidad" ? (
      <Bolt className="h-5 w-5" />
    ) : (
      <Wrench className="h-5 w-5" />
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center border border-border bg-background text-foreground">
              {icon}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{service.nombre}</div>
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{service.descripcion}</div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ToggleSwitch
            checked={service.activo}
            onChange={(v) => servicesActions.update(service.id, { activo: v })}
          />
        </div>
      </div>

      <div className="grid gap-3 p-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          {service.definicion.config.duracion.activo && (
            <span className="inline-flex items-center gap-1.5 border border-border bg-muted px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-foreground" />
              {adminUi.labels.duracionEstimada}: {service.definicion.config.duracion.obligatorio ? "Obligatoria" : "Opcional"}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 border border-border bg-muted px-3 py-1.5">
            <Wrench className="h-3.5 w-3.5 text-foreground" />
            Categoría: {categoria}
          </span>
          {service.definicion.config.modalidad.activo && (
            <span className="inline-flex items-center gap-1.5 border border-border bg-muted px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-foreground" />
              Modalidad: {modalidadTexto}
            </span>
          )}
          {service.definicion.config.modalidad.activo && service.definicion.config.ubicacion.requiere && (
            <span className="inline-flex items-center gap-1.5 border border-border bg-muted px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-foreground" />
              Requiere {adminUi.labels.ubicacion.toLowerCase()}
            </span>
          )}
          {service.definicion.config.urgencia.permite && (
            <span className="inline-flex items-center border border-border bg-background px-2 py-1 text-[10px] font-semibold text-foreground">
              Urgente
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3 text-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {adminUi.labels.unidadCotizacion}
            </span>
            <span className="text-lg font-semibold">
              {service.definicion.config.precio.activo ? unidadTexto : "Desactivado"}
            </span>
          </div>
          <Link
            to="/services/$id"
            params={{ id: service.id }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Abrir constructor <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {canDelete && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onRequestDelete();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full border border-border p-0.5 shadow-sm transition ${
        checked ? "bg-primary" : "bg-muted"
      }`}
      title={checked ? "Activo" : "Inactivo"}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-background shadow-[0_8px_16px_rgba(0,0,0,0.12)] transition-transform ${
          checked ? "translate-x-7" : "translate-x-0"
        }`}
      />
      <span className="sr-only">{checked ? "Activo" : "Inactivo"}</span>
    </button>
  );
}

function modalidadLabel(opt: "virtual" | "presencial" | "domicilio") {
  if (opt === "virtual") return "Virtual";
  if (opt === "presencial") return "Presencial";
  return "A domicilio";
}

function ConfirmDialog({
  title,
  message,
  confirmText = "Confirmar",
  requirePassword = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmText?: string;
  requirePassword?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { verifyPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="text-lg font-bold">{title}</div>
        <div className="mt-2 text-sm text-muted-foreground">{message}</div>
        {requirePassword && (
          <div className="mt-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Clave del usuario
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              placeholder="Ingresá tu clave para confirmar"
            />
            {err && <div className="mt-2 text-xs font-semibold text-destructive">{err}</div>}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy || (requirePassword && !password)}
            onClick={async () => {
              setBusy(true);
              setErr(null);
              try {
                if (requirePassword) {
                  const res = await verifyPassword(password);
                  if (!res.ok) {
                    setErr(res.error ?? "Clave incorrecta.");
                    return;
                  }
                }
                onConfirm();
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatModalidad(opts: Array<"virtual" | "presencial" | "domicilio">) {
  const labels = (opts ?? []).map(modalidadLabel);
  return labels.length > 0 ? labels.join(" / ") : "—";
}
