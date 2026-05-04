import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { servicesActions, useAdminRole, useAdminUi, useCategories, useDataStatus, usePriceTypes } from "@/lib/services-store";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }
  return fallback;
}

function SettingsPage() {
  const { session, loading, verifyPassword } = useAuth();
  const navigate = useNavigate();
  const categorias = useCategories();
  const tiposPrecio = usePriceTypes();
  const adminUi = useAdminUi();
  const { role } = useAdminRole();
  const { demo, error } = useDataStatus();

  const [newCategory, setNewCategory] = useState("");
  const [ptCode, setPtCode] = useState("");
  const [ptLabel, setPtLabel] = useState("");
  const [ptDesc, setPtDesc] = useState("");
  const [ptUnit, setPtUnit] = useState("");
  const [ptAllowsProducts, setPtAllowsProducts] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | {
    title: string;
    message: string;
    confirmText?: string;
    requirePassword?: boolean;
    onConfirm: () => Promise<void>;
  }>(null);

  const normalizedPtCode = useMemo(() => {
    const raw = ptCode.trim().toLowerCase();
    return raw
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 48);
  }, [ptCode]);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse bg-primary" />
      </div>
    );
  }

  return (
    <AppShell title="Configuración" subtitle="Catálogo global y reglas de la app.">
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          requirePassword={confirm.requirePassword}
          verifyPassword={verifyPassword}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            const fn = confirm.onConfirm;
            setConfirm(null);
            await fn();
          }}
        />
      )}
      {(error || actionError || demo) && (
        <div className="mb-5 rounded-2xl border border-border bg-muted p-4 text-sm">
          <div className="font-semibold">
            {demo ? "Modo demo local (sin base de datos)" : "Estado de conexión"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {demo
              ? "Los cambios no se guardan para la app. Activá la base de datos para aplicar cambios globales."
              : (actionError ?? error ?? "Conectado")}
          </div>
          {!demo && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => servicesActions.refresh()}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:bg-muted"
              >
                Reintentar carga
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Textos y campos</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Define nombres de campos/títulos visibles en todo el panel.
          </div>

          <div className="mt-5 grid gap-3">
            <EditableInline
              label="TOGGLE: ACTIVO"
              value={adminUi.labels.estadoActivo}
              onSave={async (v) => servicesActions.updateAdminUi({ labels: { estadoActivo: v } })}
            />
            <EditableInline
              label="TÍTULO: CONFIGURACIÓN"
              value={adminUi.labels.configuracionServicio}
              onSave={async (v) => servicesActions.updateAdminUi({ labels: { configuracionServicio: v } })}
            />
            <EditableInline
              label="TÍTULO: CAMPOS PERSONALIZADOS"
              value={adminUi.labels.camposPersonalizados}
              onSave={async (v) => servicesActions.updateAdminUi({ labels: { camposPersonalizados: v } })}
            />
            <EditableInline
              label="CAMPO: UNIDAD DE COTIZACIÓN"
              value={adminUi.labels.unidadCotizacion}
              onSave={async (v) => servicesActions.updateAdminUi({ labels: { unidadCotizacion: v } })}
            />
            <EditableInline
              label="CAMPO: DURACIÓN"
              value={adminUi.labels.duracionEstimada}
              onSave={async (v) => servicesActions.updateAdminUi({ labels: { duracionEstimada: v } })}
            />
            <EditableInline
              label="CAMPO: UBICACIÓN"
              value={adminUi.labels.ubicacion}
              onSave={async (v) => servicesActions.updateAdminUi({ labels: { ubicacion: v } })}
            />
            <EditableInline
              label="CAMPO: URGENCIA"
              value={adminUi.labels.urgencia}
              onSave={async (v) => servicesActions.updateAdminUi({ labels: { urgencia: v } })}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                setBusy(true);
                setActionError(null);
                try {
                  await servicesActions.updateAdminUi({
                    features: { editNumericPrices: false, editProductPrices: false },
                  });
                } catch (err: unknown) {
                  setActionError(getErrorMessage(err, "No se pudo actualizar la configuración."));
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
            >
              Ocultar edición de precios
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Categorías</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Se aplican a todo el catálogo de servicios.
          </div>

          <div className="mt-5 flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nueva categoría"
              className="input-base"
            />
            <button
              type="button"
              onClick={async () => {
                setBusy(true);
                setActionError(null);
                try {
                  await servicesActions.addCategory(newCategory);
                  setNewCategory("");
                } catch (err: unknown) {
                  setActionError(getErrorMessage(err, "No se pudo crear la categoría."));
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy || role === "buho"}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> Añadir
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {categorias.map((c) => (
              <EditableRow
                key={c.id}
                label="NOMBRE"
                value={c.nombre}
                onSave={async (v) => {
                  setActionError(null);
                  await servicesActions.updateCategory(c.id, v);
                }}
                onDelete={async () => {
                  setConfirm({
                    title: "Eliminar categoría",
                    message: `¿Eliminar la categoría "${c.nombre}"?`,
                    confirmText: "Eliminar",
                    requirePassword: true,
                    onConfirm: async () => {
                      setBusy(true);
                      setActionError(null);
                      try {
                        await servicesActions.removeCategory(c.id);
                      } catch (err: unknown) {
                        setActionError(getErrorMessage(err, "No se pudo eliminar la categoría."));
                      } finally {
                        setBusy(false);
                      }
                    },
                  });
                }}
                canDelete={role !== "buho"}
              />
            ))}
            {categorias.length === 0 && (
              <div className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
                No hay categorías.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="text-lg font-bold">Tipos de precio base</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Controla las opciones disponibles para todos los servicios.
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Código
              </div>
              <input
                value={ptCode}
                onChange={(e) => setPtCode(e.target.value)}
                placeholder="por_dia"
                className="input-base"
              />
              <div className="mt-1 text-[10px] text-muted-foreground">
                Guardado como: {normalizedPtCode || "—"}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Etiqueta
              </div>
              <input
                value={ptLabel}
                onChange={(e) => setPtLabel(e.target.value)}
                placeholder="Por día"
                className="input-base"
              />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Descripción
              </div>
              <input
                value={ptDesc}
                onChange={(e) => setPtDesc(e.target.value)}
                placeholder="Cobro por día de servicio"
                className="input-base"
              />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Unidad (opcional)
              </div>
              <input
                value={ptUnit}
                onChange={(e) => setPtUnit(e.target.value)}
                placeholder="m² / hora / día"
                className="input-base"
              />
              <button
                type="button"
                onClick={() => setPtAllowsProducts((v) => !v)}
                className="mt-2 inline-flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:bg-muted"
              >
                <span>Permite productos</span>
                <span className="font-semibold">{ptAllowsProducts ? "Sí" : "No"}</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={async () => {
                setBusy(true);
                setActionError(null);
                try {
                  await servicesActions.addPriceType(normalizedPtCode, ptLabel, ptDesc, {
                    unitLabel: ptUnit,
                    allowsProducts: ptAllowsProducts,
                  });
                  setPtCode("");
                  setPtLabel("");
                  setPtDesc("");
                  setPtUnit("");
                  setPtAllowsProducts(true);
                } catch (err: unknown) {
                  setActionError(getErrorMessage(err, "No se pudo crear el tipo de precio."));
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy || !normalizedPtCode || !ptLabel.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> Añadir tipo
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {tiposPrecio.map((t) => (
              <div key={t.code} className="rounded-2xl border border-border bg-muted p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground">CÓDIGO</div>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                      {t.code}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setConfirm({
                        title: "Eliminar tipo de precio",
                        message: `¿Eliminar "${t.code}"?`,
                        confirmText: "Eliminar",
                        requirePassword: true,
                        onConfirm: async () => {
                          setBusy(true);
                          setActionError(null);
                          try {
                            await servicesActions.removePriceType(t.code);
                          } catch (err: unknown) {
                            setActionError(getErrorMessage(err, "No se pudo eliminar el tipo de precio."));
                          } finally {
                            setBusy(false);
                          }
                        },
                      });
                    }}
                    disabled={busy || role === "buho"}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  <EditableInline
                    label="ETIQUETA"
                    value={t.label}
                    onSave={async (v) => servicesActions.updatePriceType(t.code, { label: v })}
                  />
                  <EditableInline
                    label="DESCRIPCIÓN"
                    value={t.description ?? ""}
                    onSave={async (v) => servicesActions.updatePriceType(t.code, { description: v })}
                  />
                  <EditableInline
                    label="UNIDAD"
                    value={t.unitLabel ?? ""}
                    onSave={async (v) => servicesActions.updatePriceType(t.code, { unitLabel: v })}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      setBusy(true);
                      setActionError(null);
                      try {
                        await servicesActions.updatePriceType(t.code, { allowsProducts: !t.allowsProducts });
                      } catch (err: unknown) {
                      setActionError(getErrorMessage(err, "No se pudo actualizar el tipo de precio."));
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy}
                    className="inline-flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                  >
                    <span>Permite productos</span>
                    <span>{t.allowsProducts ? "Sí" : "No"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function EditableInline({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (next: string) => Promise<void>;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          if (v.trim() !== value.trim()) void onSave(v);
        }}
        className="input-base"
      />
    </div>
  );
}

function EditableRow({
  label,
  value,
  onSave,
  onDelete,
  canDelete,
}: {
  label: string;
  value: string;
  onSave: (next: string) => Promise<void>;
  onDelete: () => Promise<void>;
  canDelete: boolean;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted p-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => {
            if (v.trim() !== value.trim()) void onSave(v);
          }}
          className="input-base"
        />
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={() => void onDelete()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold transition hover:bg-muted"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmText = "Confirmar",
  requirePassword = false,
  verifyPassword,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmText?: string;
  requirePassword?: boolean;
  verifyPassword: (password: string) => Promise<{ ok: boolean; error: string | null }>;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
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
                await onConfirm();
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
