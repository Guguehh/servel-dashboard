import { Bolt, Plus, Wrench, Boxes, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCategories, useDataStatus, usePriceTypes, useServices, servicesActions } from "@/lib/services-store";
import { AppShell } from "@/components/AppShell";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis } from "recharts";

export function Dashboard() {
  const categorias = useCategories();
  const { error, demo } = useDataStatus();
  const services = useServices();

  const total = services.length;
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
  const usuarios = null;
  const especialistas = null;
  const configServicios = total;

  const topActivos = [...services]
    .filter((s) => s.activo)
    .sort((a, b) => (b.definicion.campos?.length ?? 0) - (a.definicion.campos?.length ?? 0))
    .slice(0, 6);

  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dia = d
      .toLocaleDateString("es-AR", { weekday: "short" })
      .replace(".", "")
      .toUpperCase();
    const base = Math.max(1, activos);
    const solicitudes = Math.max(0, Math.round(base + (i % 4) * 0.6 + Math.sin(i / 1.9) * (base / 2)));
    return { dia, solicitudes };
  });

  return (
    <AppShell
      title="HOME"
      actions={
        <Link
          to="/services"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Añadir nuevo servicio
        </Link>
      }
    >
      {(error || demo) && (
        <div className="mb-5 rounded-2xl border border-border bg-muted p-4 text-sm">
          <div className="font-semibold">
            {demo ? "Modo demo local (sin base de datos)" : "No se pudo cargar el catálogo desde la base de datos."}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {demo ? "No existen las tablas en Supabase. Se muestran datos de ejemplo." : error}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => servicesActions.refresh()}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:bg-muted"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => servicesActions.seedDemo()}
              className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Cargar demo
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-12 gap-5">
        <MetricBlock
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          value={total.toLocaleString()}
          suffix="SERVICIOS"
          label="CATÁLOGO (APP)"
          trend={`${categorias.length} CATEG.`}
          icon={Wrench}
        />
        <MetricBlock
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          value={activos.toLocaleString()}
          suffix="ACTIVOS"
          label="VISIBLES EN APP"
          trend={`${totalCampos} CAMPOS`}
          icon={Bolt}
        />
        <MetricBlock
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          value={(usuarios ?? 0).toLocaleString()}
          suffix="USUARIOS"
          label="REGISTRADOS"
          trend={`${(especialistas ?? 0).toLocaleString()} ESPEC.`}
          icon={Boxes}
        />
        <MetricBlock
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          value={(configServicios ?? 0).toLocaleString()}
          suffix="CONFIGS"
          label="SERVICIOS CONFIG."
          trend={`${totalConfigs} BLOQUES`}
          icon={TrendingUp}
        />

        <div className="col-span-12">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {(topActivos.length ? topActivos : services.slice(0, 6)).map((s) => (
              <ServiceStatusCard key={s.id} service={s} />
            ))}
          </div>
        </div>

        <div className="col-span-12 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Visualización de datos
              </div>
              <div className="mt-1 text-lg font-bold">Solicitudes de servicios eléctricos por día</div>
            </div>
            <div className="text-right text-[11px] font-semibold text-muted-foreground">
              Últimos 14 días
            </div>
          </div>

          <div className="mt-5 h-64">
            <ChartContainer
              config={{
                solicitudes: { label: "Solicitudes", color: "var(--primary)" },
              }}
              className="h-full w-full"
            >
              <AreaChart data={trend} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <XAxis
                  dataKey="dia"
                  axisLine={{ stroke: "var(--foreground)", strokeWidth: 1 }}
                  tickLine={false}
                  tickMargin={10}
                  interval={1}
                  tick={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    fontSize: 10,
                    fill: "var(--foreground)",
                  }}
                />
                <YAxis
                  axisLine={{ stroke: "var(--foreground)", strokeWidth: 1 }}
                  tickLine={false}
                  width={28}
                  tick={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    fontSize: 10,
                    fill: "var(--foreground)",
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="linear"
                  dataKey="solicitudes"
                  stroke="var(--color-solicitudes)"
                  fill="rgba(0, 102, 255, 0.12)"
                  strokeWidth={3}
                  dot={({ cx, cy, payload }) => (
                    <rect
                      key={`dot-${payload?.dia ?? "na"}-${cx ?? 0}-${cy ?? 0}`}
                      x={(cx ?? 0) - 3}
                      y={(cy ?? 0) - 3}
                      width={6}
                      height={6}
                      fill="var(--foreground)"
                      opacity={cx == null || cy == null ? 0 : 1}
                    />
                  )}
                  activeDot={false}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MetricBlock({
  value,
  suffix,
  label,
  trend,
  icon: Icon,
  className = "",
}: {
  value: string;
  suffix: string;
  label: string;
  trend: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div />
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-primary">{trend}</span>
          <div className="flex h-9 w-9 items-center justify-center border border-border bg-background">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-4xl font-bold tabular-nums text-foreground">
          {value} <span className="text-2xl font-bold">{suffix}</span>
        </div>
        <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

function ServiceStatusCard({
  service,
}: {
  service: ReturnType<typeof useServices>[number];
}) {
  const categorias = useCategories();
  const priceTypes = usePriceTypes();
  const categoria = categorias.find((c) => c.id === service.categoryId)?.nombre ?? "—";
  const unidad = priceTypes.find((t) => t.code === (service.definicion.config.precio.unidadCode ?? ""));
  const unidadTexto = unidad ? `${unidad.label}${unidad.unitLabel ? ` / ${unidad.unitLabel}` : ""}` : "—";
  const resumenPrecio = service.definicion.config.precio.activo ? unidadTexto : "Sin precio";
  const campos = service.definicion.campos?.length ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted px-4 py-3 text-foreground">
        <div className="text-xs font-semibold uppercase tracking-wider">
          {service.nombre.toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 bg-primary"
            style={{
              boxShadow: service.activo ? "0 0 0 3px rgba(0, 102, 255, 0.18)" : "none",
              opacity: service.activo ? 1 : 0.35,
            }}
          />
          <span className="text-[10px] font-semibold uppercase text-muted-foreground">
            {service.activo ? "ACTIVO" : "OFF"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[1fr_140px]">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">
            {service.descripcion || "—"}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
            <span className="border border-border bg-muted px-3 py-1">
              CATEGORÍA: {categoria.toUpperCase()}
            </span>
            <span className="border border-border bg-muted px-3 py-1">
              CAMPOS: {campos}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-1 flex-col justify-center rounded-xl border border-border bg-muted px-4 py-4 text-foreground">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              UNIDAD
            </div>
            <div className="mt-2 text-xl font-semibold tabular-nums">{resumenPrecio}</div>
          </div>
          <Link
            to="/services/$id"
            params={{ id: service.id }}
            className="rounded-xl bg-primary px-4 py-3 text-center text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Abrir
          </Link>
        </div>
      </div>
    </div>
  );
}
