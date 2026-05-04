import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import {
  useAdminUi,
  useAdminRole,
  useCategories,
  usePriceTypes,
  useService,
  servicesActions,
  type Servicio,
  type PlantillaCampoTipo,
} from "@/lib/services-store";

export const Route = createFileRoute("/services/$id")({
  component: ServiceDetail,
});

function ServiceDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { service, hydrated } = useService(id);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  if (loading || !session || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse bg-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <AppShell title="Plantilla no encontrada">
        <div className="glass-card rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Esta plantilla ya no existe.</p>
          <Link
            to="/services"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a plantillas
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Plantilla de servicio - ${service.nombre}`}
      subtitle={
        <span className="flex items-center gap-2">
          <Link to="/services" className="hover:text-foreground">
            Plantillas
          </Link>
          <span>/</span>
          <span>Constructor</span>
        </span>
      }
    >
      <Editor service={service} />
    </AppShell>
  );
}

function Editor({ service }: { service: Servicio }) {
  const adminUi = useAdminUi();
  const { role } = useAdminRole();
  const categorias = useCategories();
  const tiposPrecio = usePriceTypes();
  const [confirm, setConfirm] = useState<null | {
    title: string;
    message: string;
    confirmText?: string;
    requirePassword?: boolean;
    onConfirm: () => void;
  }>(null);

  const def = service.definicion;
  const campos = def.campos ?? [];
  const unidad = tiposPrecio.find((t) => t.code === (def.config.precio.unidadCode ?? ""));
  const unidadTexto = unidad ? `${unidad.label}${unidad.unitLabel ? ` / ${unidad.unitLabel}` : ""}` : "—";
  const defaultUnidadCode = tiposPrecio[0]?.code ?? "";
  const unidadCode = def.config.precio.unidadCode ?? "";
  const isTurno = unidadCode.includes("turno");

  const updateDef = (next: Servicio["definicion"]) => servicesActions.update(service.id, { definicion: next });
  const updateConfig = (patch: Partial<Servicio["definicion"]["config"]>) =>
    updateDef({ ...def, config: { ...def.config, ...patch } });

  return (
    <div className="space-y-6">
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          requirePassword={confirm.requirePassword}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const action = confirm.onConfirm;
            setConfirm(null);
            action();
          }}
        />
      )}
      {role !== "aguila" && (
        <div className="rounded-2xl border border-border bg-muted p-4 text-sm">
          <div className="font-semibold">Tus cambios requieren aprobación</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Se registran como solicitudes pendientes para que un rol superior las apruebe.
          </div>
          <div className="mt-3">
            <Link
              to="/history"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Ver historial y aprobaciones
            </Link>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid lg:grid-cols-2">
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Nombre"
                help="Nombre visible de la plantilla en el catálogo. No define valores, solo identifica el formulario."
              >
                <input
                  value={service.nombre}
                  onChange={(e) => servicesActions.update(service.id, { nombre: e.target.value })}
                  className="input-base"
                />
              </Field>
              <Field label="Categoría" help="Agrupa plantillas para filtrarlas en el listado (ej: Electricidad, Salud).">
                <select
                  value={service.categoryId ?? ""}
                  onChange={(e) => servicesActions.update(service.id, { categoryId: e.target.value })}
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
              <div className="md:col-span-2">
                <Field
                  label="Descripción"
                  help="Texto breve para entender el uso de la plantilla. Se puede mostrar como ayuda en la app."
                >
                  <textarea
                    value={service.descripcion}
                    onChange={(e) =>
                      servicesActions.update(service.id, { descripcion: e.target.value })
                    }
                    className="input-base min-h-[92px] resize-y"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ToggleSquare
                label={adminUi.labels.estadoActivo}
                help="Activa o desactiva la plantilla en el catálogo. No afecta valores, solo disponibilidad."
                checked={service.activo}
                onChange={(v) => servicesActions.update(service.id, { activo: v })}
              />
            </div>

            <div className="mt-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{adminUi.labels.configuracionServicio}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Activá/desactivá bloques. El admin define estructura, no valores.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <ConfigPrecio
                  value={def.config.precio}
                  tiposPrecio={tiposPrecio}
                  defaultUnidadCode={defaultUnidadCode}
                  unidadLabel={adminUi.labels.unidadCotizacion}
                  onChange={(next) => {
                    const nextPatch: Partial<Servicio["definicion"]["config"]> = { precio: next };
                    const nextUnidad = (next.unidadCode ?? "") as string;
                    if (next.activo && nextUnidad.includes("turno")) {
                      nextPatch.duracion = {
                        ...def.config.duracion,
                        activo: true,
                        obligatorio: true,
                        tipo: "turno",
                        opciones: def.config.duracion.opciones?.length
                          ? def.config.duracion.opciones
                          : ["45 min", "60 min", "90 min", "Personalizado"],
                      };
                    } else if (def.config.duracion.tipo === "turno") {
                      nextPatch.duracion = {
                        ...def.config.duracion,
                        tipo: "libre",
                        opciones: undefined,
                      };
                    }
                    updateConfig(nextPatch);
                  }}
                />
                <ConfigDuracion
                  label={adminUi.labels.duracionEstimada}
                  value={def.config.duracion}
                  isTurno={isTurno}
                  onChange={(next) => updateConfig({ duracion: next })}
                />
                <ConfigModalidad
                  label="Modalidad"
                  ubicacionLabel={adminUi.labels.ubicacion}
                  modalidad={def.config.modalidad}
                  ubicacion={def.config.ubicacion}
                  onChange={(next) => updateConfig(next)}
                />
                <ConfigUrgencia
                  label={adminUi.labels.urgencia}
                  value={def.config.urgencia}
                  onChange={(next) => updateConfig({ urgencia: next })}
                />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{adminUi.labels.camposPersonalizados}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Campos específicos de la plantilla (orientado a la app móvil).
                  </p>
                </div>
                <AddCustomFieldMenu serviceId={service.id} />
              </div>

              {campos.length === 0 ? (
                <div className="mt-6 border border-border bg-muted p-10 text-center">
                  <p className="text-sm font-medium">No hay campos todavía</p>
                  <p className="mt-1 text-xs text-muted-foreground">Agregá el primer campo para empezar.</p>
                </div>
              ) : (
                <ul className="mt-5 space-y-3">
                  {campos.map((c) => (
                    <CampoPersonalizadoCard
                      key={c.id}
                      serviceId={service.id}
                      campo={c}
                      allCampos={campos}
                      canDelete={role !== "buho"}
                      onRequestRemoveCampo={() =>
                        setConfirm({
                          title: "Eliminar campo",
                          message: `¿Eliminar el campo "${c.nombre}"?`,
                          confirmText: "Eliminar",
                          requirePassword: true,
                          onConfirm: () => servicesActions.removeCustomField(service.id, c.id),
                        })
                      }
                      onRequestRemoveOption={(campoId, optionId) => {
                        const campo = campos.find((x) => x.id === campoId);
                        const opt = campo?.opciones?.find((o) => o.id === optionId);
                        setConfirm({
                          title: "Eliminar opción",
                          message: `¿Eliminar la opción "${opt?.label ?? "opción"}"?`,
                          confirmText: "Eliminar",
                          requirePassword: true,
                          onConfirm: () => servicesActions.removeCustomFieldOption(service.id, campoId, optionId),
                        });
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="border-t border-border p-6 lg:border-l lg:border-t-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Visualización
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-muted px-5 py-5 text-foreground">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {adminUi.labels.unidadCotizacion}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {adminUi.labels.estadoActivo}
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div className="text-2xl font-semibold">{def.config.precio.activo ? unidadTexto : "Precio desactivado"}</div>
                <TogglePill
                  checked={service.activo}
                  onChange={(v) => servicesActions.update(service.id, { activo: v })}
                  tone="dark"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
                {def.config.duracion.activo && (
                  <span className="border border-white/35 bg-white/10 px-2 py-1">
                    {def.config.duracion.tipo === "turno" ? "Duración del turno" : adminUi.labels.duracionEstimada}
                    {def.config.duracion.obligatorio ? " (oblig.)" : ""}
                  </span>
                )}
                {def.config.modalidad.activo && (
                  <span className="border border-white/35 bg-white/10 px-2 py-1">
                    Modalidad: {formatModalidad(def.config.modalidad.opciones)}
                  </span>
                )}
                {def.config.modalidad.activo && def.config.ubicacion.requiere && (
                  <span className="border border-white/35 bg-white/10 px-2 py-1">{adminUi.labels.ubicacion}</span>
                )}
                {def.config.urgencia.permite && (
                  <span className="border border-white/35 bg-white/10 px-2 py-1">
                    {adminUi.labels.urgencia}
                  </span>
                )}
                <span className="border border-white/35 bg-white/10 px-2 py-1">{campos.length} campos</span>
              </div>
            </div>

            <div className="mt-6">
              <VistaPreviaPlantilla
                config={def.config}
                campos={campos}
                unidadTexto={unidadTexto}
                labels={{
                  duracionEstimada: adminUi.labels.duracionEstimada,
                  ubicacion: adminUi.labels.ubicacion,
                  urgencia: adminUi.labels.urgencia,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TIPO_CAMPO_LABEL: Record<PlantillaCampoTipo, string> = {
  texto_corto: "Texto corto",
  texto_largo: "Texto largo",
  numero: "Número",
  dropdown: "Dropdown",
  multiselect: "Checkbox (múltiple)",
  switch: "Switch (sí/no)",
  fotos: "Fotos",
};

function AddCustomFieldMenu({ serviceId }: { serviceId: string }) {
  const [open, setOpen] = useState(false);
  const tipos = Object.keys(TIPO_CAMPO_LABEL) as PlantillaCampoTipo[];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> Agregar campo
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-border bg-card p-1.5">
            {tipos.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  servicesActions.addCustomField(serviceId, t);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                <span>{TIPO_CAMPO_LABEL[t]}</span>
                <span className="text-[10px] text-muted-foreground">{t}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CampoPersonalizadoCard({
  serviceId,
  campo,
  allCampos,
  canDelete,
  onRequestRemoveCampo,
  onRequestRemoveOption,
}: {
  serviceId: string;
  campo: Servicio["definicion"]["campos"][number];
  allCampos: Servicio["definicion"]["campos"];
  canDelete: boolean;
  onRequestRemoveCampo: () => void;
  onRequestRemoveOption: (campoId: string, optionId: string) => void;
}) {
  const candidates = useMemo(() => {
    return (allCampos ?? []).filter(
      (c) => c.id !== campo.id && (c.tipo === "switch" || c.tipo === "dropdown"),
    );
  }, [allCampos, campo.id]);

  return (
    <li className="border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
              {TIPO_CAMPO_LABEL[campo.tipo]}
            </span>
            <HelpHint text="Este campo se agrega al formulario de la app. Podés marcarlo obligatorio, y si es dropdown/checkbox, definir opciones." />
            {campo.obligatorio && (
              <span className="border border-border bg-background px-2 py-1 text-[10px] font-semibold text-foreground">
                Obligatorio
              </span>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onRequestRemoveCampo}
                className="ml-auto flex h-8 w-8 items-center justify-center border border-border bg-card text-foreground transition hover:bg-muted"
                title="Eliminar campo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <input
              value={campo.nombre}
              onChange={(e) => servicesActions.updateCustomField(serviceId, campo.id, { nombre: e.target.value })}
              placeholder="Nombre del campo"
              className="input-base font-medium"
            />
            <select
              value={campo.tipo}
              onChange={(e) =>
                servicesActions.updateCustomField(serviceId, campo.id, { tipo: e.target.value as PlantillaCampoTipo })
              }
              className="input-base"
            >
              {(Object.keys(TIPO_CAMPO_LABEL) as PlantillaCampoTipo[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_CAMPO_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          {(campo.tipo === "dropdown" || campo.tipo === "multiselect") && (
            <div className="space-y-2 border border-border bg-muted p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Opciones
                <HelpHint text="Estas opciones se muestran en la app. En Checkbox (múltiple) se pueden elegir varias." />
              </p>
              {(campo.opciones ?? []).map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input
                    value={o.label}
                    onChange={(e) =>
                      servicesActions.updateCustomFieldOption(serviceId, campo.id, o.id, e.target.value)
                    }
                    className="input-base flex-1 py-1.5 text-xs"
                  />
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onRequestRemoveOption(campo.id, o.id)}
                      className="flex h-8 w-8 items-center justify-center border border-border bg-card text-foreground transition hover:bg-muted"
                      title="Eliminar opción"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => servicesActions.addCustomFieldOption(serviceId, campo.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar opción
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <ToggleCompact
              label="Obligatorio"
              checked={campo.obligatorio}
              onChange={(v) => servicesActions.updateCustomField(serviceId, campo.id, { obligatorio: v })}
            />
            {candidates.length > 0 && (
              <CondicionalEditor
                serviceId={serviceId}
                campo={campo}
                candidates={candidates}
              />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function CondicionalEditor({
  serviceId,
  campo,
  candidates,
}: {
  serviceId: string;
  campo: Servicio["definicion"]["campos"][number];
  candidates: Servicio["definicion"]["campos"];
}) {
  const dependeDe = campo.visibleSi?.dependeDe ?? "";
  const esIgualA = campo.visibleSi?.esIgualA ?? "";
  const target = candidates.find((c) => c.id === dependeDe);

  const update = (next: { dependeDe: string; esIgualA?: string } | null) => {
    servicesActions.updateCustomField(serviceId, campo.id, { visibleSi: next as any });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <span>
        Mostrar solo si
        <HelpHint text="Regla simple para mostrar/ocultar este campo según el valor de otro campo (dropdown o switch)." />
      </span>
      <select
        value={dependeDe}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) update(null);
          else update({ dependeDe: v, esIgualA: "" });
        }}
        className="border border-border bg-card px-2 py-1 text-xs"
      >
        <option value="">— siempre —</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      {target && (
        <>
          <span>es</span>
          {target.tipo === "switch" ? (
            <select
              value={esIgualA}
              onChange={(e) => update({ dependeDe, esIgualA: e.target.value })}
              className="border border-border bg-card px-2 py-1 text-xs"
            >
              <option value="">—</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          ) : (
            <select
              value={esIgualA}
              onChange={(e) => update({ dependeDe, esIgualA: e.target.value })}
              className="border border-border bg-card px-2 py-1 text-xs"
            >
              <option value="">—</option>
              {(target.opciones ?? []).map((o) => (
                <option key={o.id} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </>
      )}
    </div>
  );
}

function VistaPreviaPlantilla({
  config,
  campos,
  unidadTexto,
  labels,
}: {
  config: Servicio["definicion"]["config"];
  campos: Servicio["definicion"]["campos"];
  unidadTexto: string;
  labels: { duracionEstimada: string; ubicacion: string; urgencia: string };
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[] | number | boolean>>({});
  const setAnswer = (id: string, v: string | string[] | number | boolean) => setAnswers((a) => ({ ...a, [id]: v }));

  const visibleCampos = useMemo(() => {
    const all = campos ?? [];
    return all.filter((c) => isCampoVisible(c, all, answers));
  }, [answers, campos]);

  const items = useMemo(() => {
    const out: Array<
      | { kind: "precio"; id: string; label: string; required: boolean }
      | { kind: "duracion"; id: string; label: string; required: boolean }
      | { kind: "modalidad"; id: string; label: string; required: boolean; options: string[] }
      | { kind: "ubicacion"; id: string; label: string; required: boolean }
      | { kind: "urgencia"; id: string; label: string; required: boolean }
      | { kind: "campo"; id: string; campo: Servicio["definicion"]["campos"][number] }
    > = [];

    if (config.precio.activo) out.push({ kind: "precio", id: "cfg_precio", label: "Precio", required: false });
    if (config.duracion.activo)
      out.push({
        kind: "duracion",
        id: "cfg_duracion",
        label: config.duracion.tipo === "turno" ? "Duración del turno" : labels.duracionEstimada,
        required: Boolean(config.duracion.obligatorio),
      });
    if (config.modalidad.activo)
      out.push({
        kind: "modalidad",
        id: "cfg_modalidad",
        label: "Modalidad",
        required: true,
        options: config.modalidad.opciones.map(modalidadLabel),
      });
    if (config.modalidad.activo && config.ubicacion.requiere)
      out.push({
        kind: "ubicacion",
        id: "cfg_ubicacion",
        label: labels.ubicacion,
        required: true,
      });
    if (config.urgencia.permite) out.push({ kind: "urgencia", id: "cfg_urgencia", label: labels.urgencia, required: false });

    visibleCampos.forEach((campo) => out.push({ kind: "campo", id: campo.id, campo }));
    return out;
  }, [config, labels.duracionEstimada, labels.ubicacion, labels.urgencia, visibleCampos]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold">Vista previa</h3>
      <p className="mt-1 text-xs text-muted-foreground">Así se vería el formulario generado según tu configuración.</p>

      <div className="mt-6 space-y-5">
        {items.length === 0 ? (
          <p className="border border-border bg-muted p-6 text-center text-sm text-muted-foreground">
            No hay campos para mostrar.
          </p>
        ) : (
          items.map((it) => {
            if (it.kind === "precio") {
              return (
                <div key={it.id}>
                  <label className="block text-sm font-semibold">
                    {it.label}
                    {it.required && <span className="ml-1 text-destructive">*</span>}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">({unidadTexto})</span>
                  </label>
                  <div className="mt-2">
                    <input disabled value="" className="input-base opacity-70" placeholder="Se completa en la app" />
                  </div>
                </div>
              );
            }
            if (it.kind === "duracion") {
              if (config.duracion.tipo === "turno") {
                const opts = config.duracion.opciones?.length ? config.duracion.opciones : ["45 min", "60 min", "90 min", "Personalizado"];
                return (
                  <div key={it.id}>
                    <label className="block text-sm font-semibold">
                      {it.label}
                      {it.required && <span className="ml-1 text-destructive">*</span>}
                    </label>
                    <div className="mt-2">
                      <select
                        value={(answers[it.id] as string) ?? ""}
                        onChange={(e) => setAnswer(it.id, e.target.value)}
                        className="input-base"
                      >
                        <option value="">Seleccioná una opción</option>
                        {opts.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              }
              return (
                <div key={it.id}>
                  <label className="block text-sm font-semibold">
                    {it.label}
                    {it.required && <span className="ml-1 text-destructive">*</span>}
                  </label>
                  <div className="mt-2">
                    <input
                      value={(answers[it.id] as string) ?? ""}
                      onChange={(e) => setAnswer(it.id, e.target.value)}
                      className="input-base"
                      placeholder="Ej: 2 horas"
                    />
                  </div>
                </div>
              );
            }
            if (it.kind === "modalidad") {
              return (
                <div key={it.id}>
                  <label className="block text-sm font-semibold">
                    {it.label}
                    {it.required && <span className="ml-1 text-destructive">*</span>}
                  </label>
                  <div className="mt-2">
                    <select
                      value={(answers[it.id] as string) ?? ""}
                      onChange={(e) => setAnswer(it.id, e.target.value)}
                      className="input-base"
                    >
                      <option value="">Seleccioná una opción</option>
                      {it.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            }
            if (it.kind === "ubicacion") {
              return (
                <div key={it.id}>
                  <label className="block text-sm font-semibold">
                    {it.label}
                    {it.required && <span className="ml-1 text-destructive">*</span>}
                  </label>
                  <div className="mt-2">
                    <input
                      value={(answers[it.id] as string) ?? ""}
                      onChange={(e) => setAnswer(it.id, e.target.value)}
                      className="input-base"
                      placeholder="Ej: Dirección, barrio o zona"
                    />
                  </div>
                </div>
              );
            }
            if (it.kind === "urgencia") {
              const v = Boolean(answers[it.id]);
              return (
                <div key={it.id}>
                  <label className="block text-sm font-semibold">{it.label}</label>
                  <div className="mt-2">
                    <ToggleCompact label="¿Es urgente?" checked={v} onChange={(next) => setAnswer(it.id, next)} />
                  </div>
                </div>
              );
            }
            const c = it.campo;
            return (
              <div key={c.id}>
                <label className="block text-sm font-semibold">
                  {c.nombre}
                  {c.obligatorio && <span className="ml-1 text-destructive">*</span>}
                </label>
                <div className="mt-2">{renderPlantillaCampoInput(c, answers, setAnswer)}</div>
              </div>
            );
          })
        )}

        {items.length > 0 && (
          <button
            type="button"
            className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}

function renderPlantillaCampoInput(
  campo: Servicio["definicion"]["campos"][number],
  answers: Record<string, string | string[] | number | boolean>,
  setAnswer: (id: string, v: string | string[] | number | boolean) => void,
) {
  if (campo.tipo === "numero") {
    return (
      <input
        type="number"
        value={(answers[campo.id] as number) ?? ""}
        onChange={(e) => setAnswer(campo.id, e.target.value ? Number(e.target.value) : 0)}
        className="input-base"
        placeholder="0"
      />
    );
  }
  if (campo.tipo === "texto_corto") {
    return (
      <input
        value={(answers[campo.id] as string) ?? ""}
        onChange={(e) => setAnswer(campo.id, e.target.value)}
        className="input-base"
        placeholder=""
      />
    );
  }
  if (campo.tipo === "texto_largo") {
    return (
      <textarea
        value={(answers[campo.id] as string) ?? ""}
        onChange={(e) => setAnswer(campo.id, e.target.value)}
        className="input-base min-h-[92px] resize-y"
        placeholder=""
      />
    );
  }
  if (campo.tipo === "dropdown") {
    return (
      <select
        value={(answers[campo.id] as string) ?? ""}
        onChange={(e) => setAnswer(campo.id, e.target.value)}
        className="input-base"
      >
        <option value="">Seleccioná una opción</option>
        {campo.opciones?.map((o) => (
          <option key={o.id} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (campo.tipo === "multiselect") {
    const current = (answers[campo.id] as string[] | undefined) ?? [];
    return (
      <div className="flex flex-wrap gap-2">
        {(campo.opciones ?? []).map((o) => {
          const selected = current.includes(o.label);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() =>
                setAnswer(
                  campo.id,
                  selected ? current.filter((x) => x !== o.label) : [...current, o.label],
                )
              }
              className={`border border-border px-3.5 py-1.5 text-xs font-semibold transition ${
                selected ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (campo.tipo === "fotos") {
    return (
      <div className="border border-border bg-muted p-3 text-xs text-muted-foreground">
        Carga de fotos (se completa en la app)
      </div>
    );
  }
  const v = Boolean(answers[campo.id]);
  return (
    <div className="flex gap-2">
      {[
        { label: "Sí", value: true },
        { label: "No", value: false },
      ].map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => setAnswer(campo.id, opt.value)}
          className={`flex-1 border border-border px-4 py-2.5 text-sm font-semibold transition ${
            v === opt.value ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function isCampoVisible(
  campo: Servicio["definicion"]["campos"][number],
  allCampos: Servicio["definicion"]["campos"],
  answers: Record<string, string | string[] | number | boolean>,
) {
  const rule = campo.visibleSi;
  if (!rule || !rule.dependeDe) return true;
  const depId = rule.dependeDe;
  const expected = rule.esIgualA ?? "";
  if (!expected) return true;

  const depCampo = (allCampos ?? []).find((c) => c.id === depId);
  if (!depCampo) return true;

  const depValue = answers[depId];
  if (depCampo.tipo === "switch") {
    const actual = depValue === true ? "si" : "no";
    return actual === expected;
  }
  if (depCampo.tipo === "dropdown") {
    return typeof depValue === "string" ? depValue === expected : false;
  }
  return true;
}

function ConfigPrecio({
  value,
  tiposPrecio,
  defaultUnidadCode,
  unidadLabel,
  onChange,
}: {
  value: Servicio["definicion"]["config"]["precio"];
  tiposPrecio: ReturnType<typeof usePriceTypes>;
  defaultUnidadCode: string;
  unidadLabel: string;
  onChange: (next: Servicio["definicion"]["config"]["precio"]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [unitLabel, setUnitLabel] = useState("");

  const normalizedCode = useMemo(() => normalizeUnitCode(code), [code]);
  const canSave = Boolean(normalizedCode) && Boolean(label.trim());

  return (
    <div className={`border border-border p-4 ${value.activo ? "bg-muted" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Precio
            <HelpHint text="Define si el servicio pide precio y con qué unidad se cotiza. No se define un número acá." />
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">Activar precio</div>
        </div>
        <TogglePill
          checked={value.activo}
          onChange={(v) =>
            onChange({
              ...value,
              activo: v,
              unidadCode: v ? ((value.unidadCode ?? defaultUnidadCode) as any) : value.unidadCode,
            })
          }
        />
      </div>

      {value.activo && (
        <div className="mt-4 space-y-3">
          <Field label={unidadLabel} help="Cómo se expresa el precio: por hora, por trabajo, por turno, etc.">
            <select
              value={value.unidadCode ?? ""}
              onChange={(e) => onChange({ ...value, unidadCode: (e.target.value || null) as any })}
              className="input-base"
            >
              <option value="">Seleccioná una unidad</option>
              {tiposPrecio.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}{t.unitLabel ? ` / ${t.unitLabel}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Agregar nueva unidad
          </button>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAdding(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold">Nueva unidad</div>
                <div className="mt-1 text-xs text-muted-foreground">Se agrega a las opciones del dropdown.</div>
              </div>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Código</div>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input-base"
                  placeholder="por_hora"
                />
                <div className="mt-1 text-[10px] text-muted-foreground">Guardado como: {normalizedCode || "—"}</div>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Etiqueta</div>
                <input value={label} onChange={(e) => setLabel(e.target.value)} className="input-base" placeholder="Por hora" />
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidad (opcional)</div>
                <input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} className="input-base" placeholder="hora" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={async () => {
                  const finalCode = normalizedCode;
                  if (!finalCode) return;
                  await servicesActions.addPriceType(finalCode, label.trim(), "", { unitLabel: unitLabel.trim() || undefined });
                  onChange({ ...value, activo: true, unidadCode: finalCode as any });
                  setCode("");
                  setLabel("");
                  setUnitLabel("");
                  setAdding(false);
                }}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                Crear unidad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigDuracion({
  label,
  value,
  isTurno,
  onChange,
}: {
  label: string;
  value: Servicio["definicion"]["config"]["duracion"];
  isTurno: boolean;
  onChange: (next: Servicio["definicion"]["config"]["duracion"]) => void;
}) {
  const forced = isTurno;
  const isActive = forced ? true : value.activo;

  const toggleOption = (opt: string) => {
    const current = value.opciones ?? [];
    const has = current.includes(opt);
    const next = has ? current.filter((x) => x !== opt) : [...current, opt];
    onChange({ ...value, activo: true, tipo: "turno", opciones: next.length > 0 ? next : undefined });
  };

  return (
    <div className={`border border-border p-4 ${isActive ? "bg-muted" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {isTurno ? "Duración del turno" : "Activar duración"}
            <HelpHint
              text={
                isTurno
                  ? "Si cotizás por turno, la duración se define como opciones del turno dentro de la plantilla."
                  : "Define si esta plantilla solicita una duración estimada. No es una duración numérica fija."
              }
            />
          </div>
        </div>
        <TogglePill
          checked={isActive}
          disabled={forced}
          onChange={(v) => onChange({ ...value, activo: v, tipo: v ? value.tipo : "libre", opciones: v ? value.opciones : undefined })}
        />
      </div>
      {isActive && (
        <div className="mt-4">
          <ToggleCompact
            label="Obligatorio"
            checked={value.obligatorio}
            onChange={(v) => onChange({ ...value, activo: true, obligatorio: v })}
          />
          {isTurno && (
            <div className="mt-3 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Opciones del turno <HelpHint text="Estas opciones se mostrarán como dropdown en la app." />
              </div>
              <div className="flex flex-wrap gap-2">
                {["45 min", "60 min", "90 min", "Personalizado"].map((opt) => {
                  const selected = (value.opciones ?? ["45 min", "60 min", "90 min", "Personalizado"]).includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleOption(opt)}
                      className={`border border-border px-3.5 py-1.5 text-xs font-semibold transition ${
                        selected ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConfigModalidad({
  label,
  ubicacionLabel,
  modalidad,
  ubicacion,
  onChange,
}: {
  label: string;
  ubicacionLabel: string;
  modalidad: Servicio["definicion"]["config"]["modalidad"];
  ubicacion: Servicio["definicion"]["config"]["ubicacion"];
  onChange: (patch: Partial<Servicio["definicion"]["config"]>) => void;
}) {
  const toggleOption = (opt: "virtual" | "presencial" | "domicilio") => {
    const current = modalidad.opciones ?? [];
    const has = current.includes(opt);
    const nextOptions = has ? current.filter((x) => x !== opt) : [...current, opt];
    onChange({
      modalidad: { ...modalidad, activo: true, opciones: nextOptions },
      ubicacion: { ...ubicacion, requiere: nextOptions.some((x) => x !== "virtual") ? ubicacion.requiere : false },
    });
  };

  return (
    <div className={`border border-border p-4 ${modalidad.activo ? "bg-muted" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
            <HelpHint text="Define dónde puede hacerse el servicio (virtual/presencial/a domicilio). Si lo activás, podés decidir si se pide ubicación." />
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">Activar modalidad</div>
        </div>
        <TogglePill
          checked={modalidad.activo}
          onChange={(v) =>
            onChange({
              modalidad: { ...modalidad, activo: v, opciones: v ? modalidad.opciones : [] },
              ubicacion: { ...ubicacion, requiere: v ? ubicacion.requiere : false },
            })
          }
        />
      </div>

      {modalidad.activo && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {([
              { id: "virtual", label: "Virtual" },
              { id: "presencial", label: "Presencial" },
              { id: "domicilio", label: "A domicilio" },
            ] as const).map((opt) => {
              const selected = (modalidad.opciones ?? []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleOption(opt.id)}
                  className={`border border-border px-3.5 py-1.5 text-xs font-semibold transition ${
                    selected ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 border border-border bg-card px-3 py-2.5">
            <div className="text-xs font-semibold text-foreground">Requiere {ubicacionLabel.toLowerCase()}</div>
            <TogglePill
              checked={ubicacion.requiere}
              onChange={(v) => onChange({ ubicacion: { ...ubicacion, requiere: v } })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigUrgencia({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Servicio["definicion"]["config"]["urgencia"];
  onChange: (next: Servicio["definicion"]["config"]["urgencia"]) => void;
}) {
  return (
    <div className={`border border-border p-4 ${value.permite ? "bg-muted" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
            <HelpHint text="Si está activo, la app puede mostrar un selector para marcar urgencia y ajustar lógica de búsqueda/cotización." />
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">Permitir urgencia</div>
        </div>
        <TogglePill checked={value.permite} onChange={(v) => onChange({ ...value, permite: v })} />
      </div>
    </div>
  );
}

function modalidadLabel(opt: Servicio["definicion"]["config"]["modalidad"]["opciones"][number]) {
  if (opt === "virtual") return "Virtual";
  if (opt === "presencial") return "Presencial";
  return "A domicilio";
}

function formatModalidad(opts: Servicio["definicion"]["config"]["modalidad"]["opciones"]) {
  const labels = (opts ?? []).map(modalidadLabel);
  return labels.length > 0 ? labels.join(" / ") : "—";
}

function normalizeUnitCode(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 48);
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {help ? <HelpHint text={help} /> : null}
      </span>
      {children}
    </label>
  );
}

function ToggleCompact({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold shadow-sm transition ${
        checked ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
      }`}
    >
      <span>{label}</span>
      <span className="text-[10px] opacity-80">{checked ? "Sí" : "No"}</span>
    </button>
  );
}

function ToggleSquare({
  label,
  help,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {help ? <HelpHint text={help} /> : null}
      </span>
      <span
        className={`inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold ${
          checked ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
        }`}
      >
        {checked ? "Activo" : "Inactivo"}
      </span>
    </button>
  );
}

function TogglePill({
  checked,
  onChange,
  tone = "light",
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  tone?: "light" | "dark";
  disabled?: boolean;
}) {
  const cls =
    tone === "dark"
      ? {
          track: checked ? "bg-primary border-white/55" : "bg-white/10 border-white/45",
          thumb: "bg-white shadow-[0_8px_16px_rgba(0,0,0,0.35)]",
        }
      : {
          track: checked ? "bg-primary border-border" : "bg-muted border-border",
          thumb: "bg-background shadow-[0_8px_16px_rgba(0,0,0,0.12)]",
        };

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-16 items-center rounded-full border p-0.5 transition ${cls.track} ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
      title={checked ? "Activo" : "Inactivo"}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-7 w-7 rounded-full transition-transform ${cls.thumb} ${
          checked ? "translate-x-8" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function HelpHint({ text }: { text: string }) {
  return (
    <span className="group relative ml-2 inline-flex align-middle">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card text-[10px] font-bold leading-none text-foreground">
        ?
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-semibold text-foreground opacity-0 shadow-[0_18px_35px_rgba(0,0,0,0.18)] transition group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
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
