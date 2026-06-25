import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type TipoPrecioBase = "fijo" | "por_hora" | "rango" | (string & {});

export interface Categoria {
  id: string;
  nombre: string;
}

export type AdminRole = "aguila" | "halcon" | "buho";

export type AdminChangeStatus = "pendiente" | "aprobado" | "rechazado";
export type AdminChangeKind =
  | "create_category"
  | "update_category"
  | "delete_category"
  | "create_service"
  | "update_service"
  | "delete_service";

export interface AdminChangeRequest {
  id: string;
  actorEmail: string;
  actorRole: AdminRole;
  kind: AdminChangeKind;
  entityType: "categories" | "services";
  entityId?: string | null;
  payload: Json;
  status: AdminChangeStatus;
  approverEmail?: string | null;
  createdAt: number;
  decidedAt?: number | null;
}

export interface AdminAuditLogEntry {
  id: string;
  actorEmail: string;
  actorRole: AdminRole;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Json | null;
  after?: Json | null;
  createdAt: number;
}

export interface TipoPrecio {
  code: string;
  label: string;
  description?: string | null;
  unitLabel?: string | null;
  allowsProducts: boolean;
}

export interface RangoPrecio {
  id: string;
  minCantidad: number;
  maxCantidad: number | null;
  precioPorUnidad: number;
}

export interface ProductoServicio {
  id: string;
  etiqueta: string;
  precio?: number;
  descripcion?: string;
  cantidad?: number;
}

export type TipoCampoCotizador = "texto" | "numero" | "seleccion" | "multiseleccion" | "booleano";

export interface OpcionCampoCotizador {
  id: string;
  etiqueta: string;
}

export interface ReglaCondicionalCampo {
  dependeDe: string;
  esIgualA?: string;
}

export interface CampoCotizador {
  id: string;
  etiqueta: string;
  tipo: TipoCampoCotizador;
  requerido: boolean;
  etapa?: "busqueda" | "cotizacion";
  unidad?: string;
  opciones?: OpcionCampoCotizador[];
  visibleSi?: ReglaCondicionalCampo | null;
}

export interface Servicio {
  id: string;
  categoryId?: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  basePrice?: number | null;
  visitPrice?: number | null;
  hasQuantityPricing?: boolean;
  priceRanges?: RangoPrecio[];
  minPrice?: number | null;
  definicion: PlantillaServicioDefinition;
  creadoEn: number;
}

export type PlantillaUnidadCode = string & {};
export type PlantillaModalidadOpcion = "virtual" | "presencial" | "domicilio";

export type PlantillaCampoTipo =
  | "texto_corto"
  | "texto_largo"
  | "numero"
  | "dropdown"
  | "multiselect"
  | "switch"
  | "fotos";

export interface PlantillaCampoOpcion {
  id: string;
  label: string;
}

export interface PlantillaCampo {
  id: string;
  defaultKey?: string;
  nombre: string;
  tipo: PlantillaCampoTipo;
  obligatorio: boolean;
  opciones?: PlantillaCampoOpcion[];
  visibleSi?: ReglaCondicionalCampo | null;
}

export interface PlantillaServicioConfig {
  precio: {
    activo: boolean;
    unidadCode?: PlantillaUnidadCode | null;
    permiteRangos?: boolean;
    permiteMinimo?: boolean;
  };
  duracion: {
    activo: boolean;
    obligatorio: boolean;
    tipo: "libre" | "turno";
    modo?: "estimada" | "exacta";
    opciones?: string[];
  };
  modalidad: { activo: boolean; opciones: PlantillaModalidadOpcion[] };
  ubicacion: { requiere: boolean };
  urgencia: { permite: boolean };
  productos: { permite: boolean };
}

export interface PlantillaServicioDefinition {
  version: 2;
  config: PlantillaServicioConfig;
  campos: PlantillaCampo[];
}

export interface AdminUiConfig {
  features: {
    editNumericPrices: boolean;
    editProductPrices: boolean;
  };
  labels: {
    unidadCotizacion: string;
    duracionEstimada: string;
    ubicacion: string;
    urgencia: string;
    productos: string;
    estadoActivo: string;
    camposPersonalizados: string;
    configuracionServicio: string;
  };
}

export type AdminUiPatch = {
  features?: Partial<AdminUiConfig["features"]>;
  labels?: Partial<AdminUiConfig["labels"]>;
};

type StoreSnapshot = {
  categorias: Categoria[];
  tiposPrecio: TipoPrecio[];
  adminUi: AdminUiConfig;
  categoriaCampoDefaults: Record<string, PlantillaCampo[]>;
  servicios: Servicio[];
  adminRole: AdminRole;
  actorEmail: string | null;
  changeRequests: AdminChangeRequest[];
  auditLog: AdminAuditLogEntry[];
  loaded: boolean;
  error: string | null;
  demo: boolean;
};

const listeners = new Set<() => void>();
let snapshot: StoreSnapshot = {
  categorias: [],
  tiposPrecio: [
    { code: "fijo", label: "Fijo", description: null, unitLabel: null, allowsProducts: true },
    { code: "por_hora", label: "Por hora", description: null, unitLabel: "hora", allowsProducts: true },
    { code: "por_trabajo", label: "Por trabajo", description: null, unitLabel: "trabajo", allowsProducts: true },
    { code: "por_dia", label: "Por día", description: null, unitLabel: "día", allowsProducts: true },
    { code: "rango", label: "Por rango", description: null, unitLabel: null, allowsProducts: true },
    { code: "por_m2", label: "Por m²", description: "Cobro por metro cuadrado.", unitLabel: "m²", allowsProducts: true },
  ],
  adminUi: {
    features: { editNumericPrices: false, editProductPrices: false },
    labels: {
      unidadCotizacion: "Unidad de cotización",
      duracionEstimada: "Duración estimada",
      ubicacion: "Ubicación",
      urgencia: "Urgencia",
      productos: "Productos",
      estadoActivo: "Estado (Activo)",
      camposPersonalizados: "Campos personalizados",
      configuracionServicio: "Configuración del servicio",
    },
  },
  categoriaCampoDefaults: {},
  servicios: [],
  adminRole: "buho",
  actorEmail: null,
  changeRequests: [],
  auditLog: [],
  loaded: false,
  error: null,
  demo: false,
};
let loadingPromise: Promise<void> | null = null;
const pendingUpdates = new Map<string, { timer: number; patch: Partial<Servicio> }>();
const SEEDED_KEY = "servel.demo_seeded.v1";
const ADMIN_UI_KEY = "servel.admin_ui.v1";
const REQUESTS_KEY = "servel.admin_change_requests.v1";
const AUDIT_KEY = "servel.admin_audit_log.v1";
const CATEGORY_DEFAULTS_KEY = "servel.category_defaults.v1";
let seedingPromise: Promise<void> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: Partial<StoreSnapshot>) {
  snapshot = { ...snapshot, ...next };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return snapshot;
}

function asArray<T>(value: Json | null | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as unknown as T[];
  return [];
}

function jid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePriceRanges(value: Json | null | undefined): RangoPrecio[] {
  const raw = asArray<any>(value);
  const out: RangoPrecio[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const id = typeof r.id === "string" && r.id.trim() ? r.id : jid("rng");
    const minCantidad =
      typeof r.minCantidad === "number" && Number.isFinite(r.minCantidad)
        ? r.minCantidad
        : typeof r.min_cantidad === "number" && Number.isFinite(r.min_cantidad)
          ? r.min_cantidad
          : 1;
    const maxRaw =
      typeof r.maxCantidad === "number" && Number.isFinite(r.maxCantidad)
        ? r.maxCantidad
        : typeof r.max_cantidad === "number" && Number.isFinite(r.max_cantidad)
          ? r.max_cantidad
          : null;
    const maxCantidad = maxRaw === null ? null : maxRaw;
    const precioPorUnidad =
      typeof r.precioPorUnidad === "number" && Number.isFinite(r.precioPorUnidad)
        ? r.precioPorUnidad
        : typeof r.precio_por_unidad === "number" && Number.isFinite(r.precio_por_unidad)
          ? r.precio_por_unidad
          : 0;
    out.push({ id, minCantidad, maxCantidad, precioPorUnidad });
  }
  return out;
}

function isMissingTableError(msg: string) {
  return msg.includes("schema cache") || msg.includes("Could not find the table");
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

const SUPERADMIN_EMAILS = new Set(["admin@admin.com", "admin@admin"]);

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function normalizeRole(role: unknown): AdminRole | null {
  if (role === "aguila" || role === "halcon" || role === "buho") return role;
  return null;
}

function resolveAdminRole(email: string | null | undefined, hintedRole: AdminRole | null) {
  const e = normalizeEmail(email);
  if (SUPERADMIN_EMAILS.has(e)) return "aguila" as const;
  if (hintedRole === "aguila") return "halcon" as const;
  if (hintedRole === "halcon" || hintedRole === "buho") return hintedRole;
  if (e === "halcon@admin.com" || e === "halcón@admin.com") return "halcon" as const;
  if (e === "buho@admin.com" || e === "búho@admin.com") return "buho" as const;
  return "buho" as const;
}

function inferRoleFromEmail(email: string | null | undefined): AdminRole {
  return resolveAdminRole(email, null);
}

function readRequestsFromStorage(): AdminChangeRequest[] {
  if (typeof window === "undefined") return [];
  return safeParseJson<AdminChangeRequest[]>(localStorage.getItem(REQUESTS_KEY)) ?? [];
}

function writeRequestsToStorage(value: AdminChangeRequest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(value));
}

function readAuditFromStorage(): AdminAuditLogEntry[] {
  if (typeof window === "undefined") return [];
  return safeParseJson<AdminAuditLogEntry[]>(localStorage.getItem(AUDIT_KEY)) ?? [];
}

function writeAuditToStorage(value: AdminAuditLogEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUDIT_KEY, JSON.stringify(value));
}

async function getActor() {
  try {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email ?? null;
    if (email) {
      const hintedRole = normalizeRole((data.user as any)?.user_metadata?.role);
      return { email, role: resolveAdminRole(email, hintedRole) };
    }
  } catch {
  }

  if (typeof window !== "undefined") {
    const ls = safeParseJson<{ userId: string }>(localStorage.getItem("servel.local_session.v1"));
    if (ls?.userId) {
      const users = safeParseJson<any[]>(localStorage.getItem("servel.local_users.v1")) ?? [];
      const u = users.find((x) => x && typeof x === "object" && x.id === ls.userId);
      const email = typeof u?.email === "string" ? u.email : null;
      const hintedRole = normalizeRole(u?.role);
      return { email, role: resolveAdminRole(email, hintedRole) };
    }
  }

  return { email: null, role: "buho" as AdminRole };
}

function mergeAdminUi(base: AdminUiConfig, patch: AdminUiPatch | null | undefined): AdminUiConfig {
  if (!patch) return base;
  return {
    features: { ...base.features, ...(patch.features ?? {}) },
    labels: { ...base.labels, ...(patch.labels ?? {}) },
  };
}

function readAdminUiFromStorage(): AdminUiConfig | null {
  if (typeof window === "undefined") return null;
  return safeParseJson<AdminUiConfig>(localStorage.getItem(ADMIN_UI_KEY));
}

function writeAdminUiToStorage(value: AdminUiConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_UI_KEY, JSON.stringify(value));
}

function readCategoryDefaultsFromStorage(): Record<string, PlantillaCampo[]> {
  if (typeof window === "undefined") return {};
  const raw = safeParseJson<Record<string, PlantillaCampo[]>>(localStorage.getItem(CATEGORY_DEFAULTS_KEY));
  if (!raw || typeof raw !== "object") return {};
  return raw;
}

function writeCategoryDefaultsToStorage(value: Record<string, PlantillaCampo[]>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CATEGORY_DEFAULTS_KEY, JSON.stringify(value));
}

async function persistCategoryDefaults(next: Record<string, PlantillaCampo[]>) {
  writeCategoryDefaultsToStorage(next);
  commit({ categoriaCampoDefaults: next });
  if (snapshot.demo) return;
  const res = await supabase
    .from("admin_settings")
    .upsert({ key: "category_defaults", value: next as unknown as Json } as any)
    .select("key")
    .maybeSingle();
  if (res.error) {
    if (isMissingTableError(res.error.message ?? "")) return;
    throw res.error;
  }
}

function demoDataset(now: number): { categorias: Categoria[]; tiposPrecio: TipoPrecio[]; servicios: Servicio[] } {
  const categorias: Categoria[] = [
    { id: "demo-cat-electricidad", nombre: "Electricidad" },
    { id: "demo-cat-plomeria", nombre: "Plomería" },
    { id: "demo-cat-pintura", nombre: "Pintura" },
    { id: "demo-cat-limpieza", nombre: "Limpieza" },
    { id: "demo-cat-jardineria", nombre: "Jardinería" },
    { id: "demo-cat-climatizacion", nombre: "Climatización" },
    { id: "demo-cat-cerrajeria", nombre: "Cerrajería" },
    { id: "demo-cat-educacion", nombre: "Educación" },
    { id: "demo-cat-salud", nombre: "Salud" },
    { id: "demo-cat-alquiler", nombre: "Alquiler" },
  ];

  const tiposPrecio: TipoPrecio[] = [
    { code: "fijo", label: "Fijo", description: "Cobro por servicio.", unitLabel: null, allowsProducts: true },
    { code: "por_hora", label: "Por hora", description: "Cobro por hora de trabajo.", unitLabel: "hora", allowsProducts: true },
    { code: "por_trabajo", label: "Por trabajo", description: "Cobro por trabajo completo.", unitLabel: "trabajo", allowsProducts: true },
    { code: "por_dia", label: "Por día", description: "Cobro por día de servicio.", unitLabel: "día", allowsProducts: true },
    { code: "por_clase", label: "Por clase", description: "Cobro por clase.", unitLabel: "clase", allowsProducts: true },
    { code: "por_semana", label: "Por semana", description: "Cobro por semana.", unitLabel: "semana", allowsProducts: true },
    { code: "por_mes", label: "Por mes", description: "Cobro por mes.", unitLabel: "mes", allowsProducts: true },
    { code: "por_consulta", label: "Por consulta", description: "Cobro por consulta.", unitLabel: "consulta", allowsProducts: true },
    { code: "por_turno_60", label: "Por turno (60 min)", description: "Cobro por turno de 60 minutos.", unitLabel: "turno", allowsProducts: true },
    { code: "rango", label: "Por rango", description: "Cobro por cantidad/rangos.", unitLabel: null, allowsProducts: true },
    { code: "por_m2", label: "Por m²", description: "Cobro por metro cuadrado.", unitLabel: "m²", allowsProducts: true },
  ];

  const cat = (nombre: string) => categorias.find((c) => c.nombre === nombre)?.id;

  const def = (patch: Partial<PlantillaServicioDefinition>): PlantillaServicioDefinition => ({
    version: 2,
    config: {
      precio: { activo: false, unidadCode: null },
      duracion: { activo: false, obligatorio: false, tipo: "libre", modo: "estimada" },
      modalidad: { activo: false, opciones: [] },
      ubicacion: { requiere: false },
      urgencia: { permite: false },
      productos: { permite: true },
      ...(patch.config ?? {}),
    },
    campos: patch.campos ?? [],
  });

  const servicios: Servicio[] = [
    {
      id: "demo-srv-1",
      categoryId: cat("Electricidad"),
      nombre: "Electricista a domicilio",
      descripcion: "Plantilla general para trabajos eléctricos.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_hora" },
          duracion: { activo: true, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: true },
          productos: { permite: true },
        },
        campos: [
          {
            id: "demo-fld-1",
            nombre: "Tipo de trabajo",
            tipo: "dropdown",
            obligatorio: true,
            opciones: [
              { id: "demo-opt-1", label: "Instalación" },
              { id: "demo-opt-2", label: "Reparación" },
              { id: "demo-opt-3", label: "Mantenimiento" },
            ],
          },
          { id: "demo-fld-2", nombre: "Descripción del problema", tipo: "texto_largo", obligatorio: false },
        ],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 12,
    },
    {
      id: "demo-srv-2",
      categoryId: cat("Electricidad"),
      nombre: "Instalación de Punto de Carga EV",
      descripcion: "Plantilla para instalación de cargadores EV.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_trabajo" },
          duracion: { activo: true, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: false },
          productos: { permite: true },
        },
        campos: [
          {
            id: "demo-fld-3",
            nombre: "Potencia del cargador",
            tipo: "dropdown",
            obligatorio: true,
            opciones: [
              { id: "demo-opt-4", label: "3.6 kW" },
              { id: "demo-opt-5", label: "7.4 kW" },
              { id: "demo-opt-6", label: "11 kW" },
            ],
          },
          { id: "demo-fld-4", nombre: "Marca/Modelo", tipo: "texto_corto", obligatorio: false },
        ],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 11,
    },
    {
      id: "demo-srv-3",
      categoryId: cat("Plomería"),
      nombre: "Destapación de cañerías",
      descripcion: "Plantilla para destapaciones y obstrucciones.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_trabajo" },
          duracion: { activo: false, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: true },
          productos: { permite: true },
        },
        campos: [
          { id: "demo-fld-5", nombre: "Sector", tipo: "texto_corto", obligatorio: true },
          {
            id: "demo-fld-6",
            nombre: "¿Está completamente tapado?",
            tipo: "switch",
            obligatorio: false,
          },
        ],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 10,
    },
    {
      id: "demo-srv-4",
      categoryId: cat("Pintura"),
      nombre: "Pintura interior",
      descripcion: "Plantilla para pintura y retoques.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_m2" },
          duracion: { activo: false, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: false },
          productos: { permite: false },
        },
        campos: [
          { id: "demo-fld-7", nombre: "Metros cuadrados", tipo: "numero", obligatorio: true },
          { id: "demo-fld-8", nombre: "¿Incluye techo?", tipo: "switch", obligatorio: false },
        ],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 9,
    },
    {
      id: "demo-srv-5",
      categoryId: cat("Limpieza"),
      nombre: "Limpieza profunda",
      descripcion: "Plantilla para limpieza profunda.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_hora" },
          duracion: { activo: true, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: false },
          productos: { permite: true },
        },
        campos: [
          { id: "demo-fld-9", nombre: "Ambientes", tipo: "texto_corto", obligatorio: true },
          { id: "demo-fld-10", nombre: "¿Hay mascotas?", tipo: "switch", obligatorio: false },
        ],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 8,
    },
    {
      id: "demo-srv-6",
      categoryId: cat("Jardinería"),
      nombre: "Corte de césped",
      descripcion: "Plantilla para corte y mantenimiento.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_m2" },
          duracion: { activo: false, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: false },
          productos: { permite: true },
        },
        campos: [
          { id: "demo-fld-11", nombre: "Metros cuadrados", tipo: "numero", obligatorio: true },
          { id: "demo-fld-12", nombre: "¿Retiro de residuos?", tipo: "switch", obligatorio: false },
        ],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: "demo-srv-7",
      categoryId: cat("Climatización"),
      nombre: "Instalación de aire acondicionado",
      descripcion: "Plantilla para instalación de split.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_trabajo" },
          duracion: { activo: true, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: false },
          productos: { permite: true },
        },
        campos: [{ id: "demo-fld-13", nombre: "Frigorías", tipo: "numero", obligatorio: false }],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 6,
    },
    {
      id: "demo-srv-8",
      categoryId: cat("Cerrajería"),
      nombre: "Apertura de puerta",
      descripcion: "Plantilla para aperturas y asistencia.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_trabajo" },
          duracion: { activo: false, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: true },
          productos: { permite: true },
        },
        campos: [{ id: "demo-fld-14", nombre: "Tipo de cerradura", tipo: "texto_corto", obligatorio: true }],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 5,
    },
    {
      id: "demo-srv-9",
      categoryId: cat("Electricidad"),
      nombre: "Reparación de cortocircuito",
      descripcion: "Plantilla para diagnóstico de fallas.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_trabajo" },
          duracion: { activo: true, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: true },
          productos: { permite: false },
        },
        campos: [{ id: "demo-fld-15", nombre: "Síntomas", tipo: "texto_largo", obligatorio: false }],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 4,
    },
    {
      id: "demo-srv-10",
      categoryId: cat("Plomería"),
      nombre: "Instalación de grifería",
      descripcion: "Plantilla para instalación o recambio.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_trabajo" },
          duracion: { activo: true, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: false },
          productos: { permite: true },
        },
        campos: [{ id: "demo-fld-16", nombre: "Tipo de grifería", tipo: "texto_corto", obligatorio: false }],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 3,
    },
    {
      id: "demo-srv-11",
      categoryId: cat("Educación"),
      nombre: "Clases particulares",
      descripcion: "Plantilla para clases (academia, idiomas, música, etc.).",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_clase" },
          duracion: { activo: true, obligatorio: true, tipo: "libre" },
          modalidad: { activo: true, opciones: ["virtual", "presencial", "domicilio"] },
          ubicacion: { requiere: true },
          urgencia: { permite: false },
          productos: { permite: false },
        },
        campos: [
          { id: "demo-fld-17", nombre: "Cantidad de alumnos", tipo: "numero", obligatorio: true },
          {
            id: "demo-fld-19",
            nombre: "Nivel de enseñanza",
            tipo: "dropdown",
            obligatorio: false,
            opciones: [
              { id: "demo-opt-20", label: "Primario" },
              { id: "demo-opt-21", label: "Secundario" },
              { id: "demo-opt-22", label: "Universitario" },
              { id: "demo-opt-23", label: "Básica" },
              { id: "demo-opt-24", label: "Intermedia" },
              { id: "demo-opt-25", label: "Avanzada" },
            ],
          },
          { id: "demo-fld-20", nombre: "Clases por semana (si aplica)", tipo: "numero", obligatorio: false },
        ],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 2,
    },
    {
      id: "demo-srv-12",
      categoryId: cat("Salud"),
      nombre: "Consulta de salud",
      descripcion: "Plantilla para consultas (presencial/online) con cobertura médica.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_consulta" },
          duracion: { activo: false, obligatorio: false, tipo: "libre" },
          modalidad: { activo: true, opciones: ["virtual", "presencial"] },
          ubicacion: { requiere: true },
          urgencia: { permite: true },
          productos: { permite: false },
        },
        campos: [
          {
            id: "demo-fld-22",
            nombre: "Duración de la consulta",
            tipo: "dropdown",
            obligatorio: true,
            opciones: [
              { id: "demo-opt-29", label: "30 min" },
              { id: "demo-opt-30", label: "45 min" },
              { id: "demo-opt-31", label: "1 hora" },
              { id: "demo-opt-32", label: "Personalizado" },
            ],
          },
          { id: "demo-fld-23", nombre: "Cobertura médica", tipo: "switch", obligatorio: false },
        ],
      }),
      creadoEn: now - 1000 * 60 * 60 * 24 * 1,
    },
    {
      id: "demo-srv-13",
      categoryId: cat("Alquiler"),
      nombre: "Alquiler de canchas",
      descripcion: "Plantilla para alquiler de canchas por turno con tarifas simples o personalizadas.",
      activo: true,
      definicion: def({
        config: {
          precio: { activo: true, unidadCode: "por_turno_60" },
          duracion: {
            activo: true,
            obligatorio: true,
            tipo: "turno",
            opciones: ["45 min", "60 min", "90 min", "Personalizado"],
          },
          modalidad: { activo: true, opciones: ["presencial"] },
          ubicacion: { requiere: true },
          urgencia: { permite: false },
          productos: { permite: false },
        },
        campos: [
          { id: "demo-fld-25", nombre: "Cantidad de canchas", tipo: "numero", obligatorio: true },
          {
            id: "demo-fld-26",
            nombre: "Características",
            tipo: "multiselect",
            obligatorio: false,
            opciones: [
              { id: "demo-opt-37", label: "Techada" },
              { id: "demo-opt-38", label: "Aire libre" },
              { id: "demo-opt-39", label: "Estacionamiento" },
            ],
          },
          {
            id: "demo-fld-27",
            nombre: "Personalizar la tarifa",
            tipo: "switch",
            obligatorio: false,
          },
          {
            id: "demo-fld-28",
            nombre: "Precio fijo (turno 60 min)",
            tipo: "numero",
            obligatorio: true,
            visibleSi: { dependeDe: "demo-fld-27", esIgualA: "no" },
          },
          {
            id: "demo-fld-29",
            nombre: "Lunes a viernes (día)",
            tipo: "numero",
            obligatorio: false,
            visibleSi: { dependeDe: "demo-fld-27", esIgualA: "si" },
          },
          {
            id: "demo-fld-30",
            nombre: "Lunes a viernes (noche)",
            tipo: "numero",
            obligatorio: false,
            visibleSi: { dependeDe: "demo-fld-27", esIgualA: "si" },
          },
          {
            id: "demo-fld-31",
            nombre: "Fines de semana",
            tipo: "numero",
            obligatorio: false,
            visibleSi: { dependeDe: "demo-fld-27", esIgualA: "si" },
          },
          { id: "demo-fld-32", nombre: "Fotos", tipo: "fotos", obligatorio: false },
          { id: "demo-fld-33", nombre: "Detalles", tipo: "texto_largo", obligatorio: false },
        ],
      }),
      creadoEn: now - 1000 * 60 * 60 * 16,
    },
  ];

  return { categorias, tiposPrecio, servicios };
}

async function seedDemoIfEmpty() {
  if (typeof window === "undefined") return;
  let seededFlag = false;
  try {
    seededFlag = localStorage.getItem(SEEDED_KEY) === "1";
  } catch {
    seededFlag = false;
  }

  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    const [{ count: catsCount, error: catsCountErr }, { count: svcCount, error: svcCountErr }] =
      await Promise.all([
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
      ]);

    if (catsCountErr) throw catsCountErr;
    if (svcCountErr) throw svcCountErr;
    const servicesEmpty = (svcCount ?? 0) === 0;
    const categoriesEmpty = (catsCount ?? 0) === 0;

    if (!servicesEmpty) {
      if (!seededFlag) localStorage.setItem(SEEDED_KEY, "1");
      return;
    }

    const categoryNames = [
      "Electricidad",
      "Plomería",
      "Pintura",
      "Limpieza",
      "Jardinería",
      "Climatización",
      "Cerrajería",
      "Educación",
      "Salud",
      "Alquiler",
    ];

    let categories = [] as Array<{ id: string; name: string }>;
    if (categoriesEmpty) {
      const { data: insertedCats, error: insCatsErr } = await supabase
        .from("categories")
        .insert(categoryNames.map((name) => ({ name })))
        .select("id,name");
      if (insCatsErr) throw insCatsErr;
      if (!insertedCats) throw new Error("No se pudieron crear categorías demo.");
      categories = insertedCats;
    } else {
      const { data: existingCats, error: existingErr } = await supabase
        .from("categories")
        .select("id,name");
      if (existingErr) throw existingErr;
      if (!existingCats) throw new Error("No se pudieron cargar categorías.");
      categories = existingCats;

      const missing = categoryNames.filter((n) => !categories.some((c) => c.name === n));
      if (missing.length > 0) {
        const { data: insertedMissing, error: missingErr } = await supabase
          .from("categories")
          .insert(missing.map((name) => ({ name })))
          .select("id,name");
        if (missingErr) throw missingErr;
        if (insertedMissing) categories = [...categories, ...insertedMissing];
      }
    }

    const catId = (name: string) => categories.find((c) => c.name === name)?.id ?? null;

    const serviceRows = [
      {
        category_id: catId("Electricidad"),
        name: "Electricista a domicilio",
        description: "Instalaciones, arreglos y mantenimiento eléctrico.",
        base_price_type: "por_hora",
        active: true,
        base_price: 25,
        visit_price: 10,
        has_quantity_pricing: false,
        allows_products: true,
        price_ranges: [],
        min_price: 25,
        work_place: "Domicilio",
        previous_requirements: "Tener acceso al tablero y despejar el área.",
        duration: 60,
        products: [
          { id: jid("prd"), etiqueta: "Cambio de toma", precio: 8, descripcion: "", cantidad: 1 },
          { id: jid("prd"), etiqueta: "Instalación de lámpara", precio: 15, descripcion: "", cantidad: 1 },
        ],
        emergency: ["enabled"],
        quote_fields: [
          {
            id: jid("cmp"),
            etiqueta: "Tipo de trabajo",
            tipo: "seleccion",
            requerido: true,
            opciones: [
              { id: jid("opt"), etiqueta: "Instalación" },
              { id: jid("opt"), etiqueta: "Reparación" },
              { id: jid("opt"), etiqueta: "Mantenimiento" },
            ],
            visibleSi: null,
          },
          { id: jid("cmp"), etiqueta: "¿Es una urgencia?", tipo: "booleano", requerido: false, visibleSi: null },
          { id: jid("cmp"), etiqueta: "Dirección", tipo: "texto", requerido: true, visibleSi: null },
        ],
      },
      {
        category_id: catId("Electricidad"),
        name: "Instalación de Punto de Carga EV",
        description: "Instalación y puesta en marcha de cargador para vehículo eléctrico.",
        base_price_type: "por_hora",
        active: true,
        base_price: 40,
        visit_price: 20,
        has_quantity_pricing: false,
        allows_products: true,
        price_ranges: [],
        min_price: 80,
        work_place: "Domicilio",
        previous_requirements: "Contar con acceso al medidor y/o tablero. Confirmar potencia disponible.",
        duration: 120,
        products: [
          { id: jid("prd"), etiqueta: "Cableado extra (10m)", precio: 18, descripcion: "", cantidad: 1 },
          { id: jid("prd"), etiqueta: "Protección diferencial", precio: 22, descripcion: "", cantidad: 1 },
        ],
        emergency: [],
        quote_fields: [
          {
            id: jid("cmp"),
            etiqueta: "Potencia del cargador",
            tipo: "seleccion",
            requerido: true,
            opciones: [
              { id: jid("opt"), etiqueta: "3.6 kW" },
              { id: jid("opt"), etiqueta: "7.4 kW" },
              { id: jid("opt"), etiqueta: "11 kW" },
            ],
            visibleSi: null,
          },
          {
            id: jid("cmp"),
            etiqueta: "Ubicación de instalación",
            tipo: "seleccion",
            requerido: true,
            opciones: [
              { id: jid("opt"), etiqueta: "Cochera" },
              { id: jid("opt"), etiqueta: "Garage" },
              { id: jid("opt"), etiqueta: "Exterior" },
            ],
            visibleSi: null,
          },
          { id: jid("cmp"), etiqueta: "Dirección", tipo: "texto", requerido: true, visibleSi: null },
        ],
      },
      {
        category_id: catId("Electricidad"),
        name: "Reparación de cortocircuito",
        description: "Diagnóstico y reparación de fallas eléctricas (cortes, saltos de térmica).",
        base_price_type: "fijo",
        active: true,
        base_price: 35,
        visit_price: 0,
        has_quantity_pricing: false,
        allows_products: false,
        price_ranges: [],
        min_price: 35,
        work_place: "Domicilio",
        previous_requirements: "Indicar si la falla es total o parcial.",
        duration: 90,
        products: [],
        emergency: ["enabled"],
        quote_fields: [
          { id: jid("cmp"), etiqueta: "¿Se cortó la luz en toda la vivienda?", tipo: "booleano", requerido: true, visibleSi: null },
          { id: jid("cmp"), etiqueta: "Descripción del problema", tipo: "texto", requerido: false, visibleSi: null },
          { id: jid("cmp"), etiqueta: "Dirección", tipo: "texto", requerido: true, visibleSi: null },
        ],
      },
      {
        category_id: catId("Plomería"),
        name: "Destapación de cañerías",
        description: "Destapación de desagües de cocina/baño y revisión de obstrucciones.",
        base_price_type: "fijo",
        active: true,
        base_price: 30,
        visit_price: 0,
        has_quantity_pricing: false,
        allows_products: true,
        price_ranges: [],
        min_price: 30,
        work_place: "Domicilio",
        previous_requirements: "Indicar si el desagüe está completamente tapado.",
        duration: 60,
        products: [
          { id: jid("prd"), etiqueta: "Sonda adicional", precio: 8, descripcion: "", cantidad: 1 },
        ],
        emergency: ["enabled"],
        quote_fields: [
          {
            id: jid("cmp"),
            etiqueta: "Sector",
            tipo: "seleccion",
            requerido: true,
            opciones: [
              { id: jid("opt"), etiqueta: "Cocina" },
              { id: jid("opt"), etiqueta: "Baño" },
              { id: jid("opt"), etiqueta: "Lavadero" },
            ],
            visibleSi: null,
          },
          { id: jid("cmp"), etiqueta: "¿Hay pérdida de agua?", tipo: "booleano", requerido: false, visibleSi: null },
          { id: jid("cmp"), etiqueta: "Dirección", tipo: "texto", requerido: true, visibleSi: null },
        ],
      },
      {
        category_id: catId("Plomería"),
        name: "Instalación de grifería",
        description: "Instalación o recambio de grifería en cocina/baño.",
        base_price_type: "fijo",
        active: true,
        base_price: 45,
        visit_price: 0,
        has_quantity_pricing: false,
        allows_products: true,
        price_ranges: [],
        min_price: 45,
        work_place: "Domicilio",
        previous_requirements: "Contar con la grifería comprada o solicitarla como adicional.",
        duration: 90,
        products: [
          { id: jid("prd"), etiqueta: "Sellador", precio: 5, descripcion: "", cantidad: 1 },
        ],
        emergency: [],
        quote_fields: [
          {
            id: jid("cmp"),
            etiqueta: "Tipo de grifería",
            tipo: "seleccion",
            requerido: true,
            opciones: [
              { id: jid("opt"), etiqueta: "Cocina" },
              { id: jid("opt"), etiqueta: "Lavatorio" },
              { id: jid("opt"), etiqueta: "Ducha" },
            ],
            visibleSi: null,
          },
          { id: jid("cmp"), etiqueta: "¿Incluye retiro de la anterior?", tipo: "booleano", requerido: false, visibleSi: null },
          { id: jid("cmp"), etiqueta: "Dirección", tipo: "texto", requerido: true, visibleSi: null },
        ],
      },
      {
        category_id: catId("Pintura"),
        name: "Pintura interior",
        description: "Pintura de paredes, techos y retoques.",
        base_price_type: "rango",
        active: true,
        base_price: null,
        visit_price: null,
        has_quantity_pricing: true,
        allows_products: false,
        price_ranges: [
          { id: jid("rng"), minCantidad: 1, maxCantidad: 20, precioPorUnidad: 12 },
          { id: jid("rng"), minCantidad: 21, maxCantidad: 80, precioPorUnidad: 10 },
          { id: jid("rng"), minCantidad: 81, maxCantidad: null, precioPorUnidad: 8 },
        ],
        min_price: 120,
        work_place: "Domicilio",
        previous_requirements: "Despejar paredes/muebles y ventilar el ambiente.",
        duration: 180,
        products: [],
        emergency: [],
        quote_fields: [
          { id: jid("cmp"), etiqueta: "Metros cuadrados", tipo: "numero", requerido: true, unidad: "m²", visibleSi: null },
          { id: jid("cmp"), etiqueta: "¿Incluye preparación de paredes?", tipo: "booleano", requerido: false, visibleSi: null },
          { id: jid("cmp"), etiqueta: "Dirección", tipo: "texto", requerido: true, visibleSi: null },
        ],
      },
      {
        category_id: catId("Limpieza"),
        name: "Limpieza profunda",
        description: "Limpieza profunda de ambientes y superficies.",
        base_price_type: "por_hora",
        active: true,
        base_price: 18,
        visit_price: 0,
        has_quantity_pricing: false,
        allows_products: true,
        price_ranges: [],
        min_price: 36,
        work_place: "Domicilio",
        previous_requirements: "Indicar si hay mascotas o alergias.",
        duration: 180,
        products: [],
        emergency: [],
        quote_fields: [
          {
            id: jid("cmp"),
            etiqueta: "Ambientes",
            tipo: "multiseleccion",
            requerido: true,
            opciones: [
              { id: jid("opt"), etiqueta: "Cocina" },
              { id: jid("opt"), etiqueta: "Baño" },
              { id: jid("opt"), etiqueta: "Dormitorios" },
              { id: jid("opt"), etiqueta: "Living" },
            ],
            visibleSi: null,
          },
          { id: jid("cmp"), etiqueta: "¿Hay mascotas?", tipo: "booleano", requerido: false, visibleSi: null },
          { id: jid("cmp"), etiqueta: "Dirección", tipo: "texto", requerido: true, visibleSi: null },
        ],
      },
      {
        category_id: catId("Jardinería"),
        name: "Corte de césped",
        description: "Corte y mantenimiento de césped con opción de retiro de residuos.",
        base_price_type: "rango",
        active: true,
        base_price: null,
        visit_price: null,
        has_quantity_pricing: true,
        allows_products: true,
        price_ranges: [
          { id: jid("rng"), minCantidad: 1, maxCantidad: 50, precioPorUnidad: 2.5 },
          { id: jid("rng"), minCantidad: 51, maxCantidad: 150, precioPorUnidad: 2.0 },
          { id: jid("rng"), minCantidad: 151, maxCantidad: null, precioPorUnidad: 1.6 },
        ],
        min_price: 25,
        work_place: "Domicilio",
        previous_requirements: "Acceso al patio/jardín.",
        duration: 90,
        products: [{ id: jid("prd"), etiqueta: "Retiro de residuos", precio: 10, descripcion: "", cantidad: 1 }],
        emergency: [],
        quote_fields: [
          { id: jid("cmp"), etiqueta: "Metros cuadrados", tipo: "numero", requerido: true, unidad: "m²", visibleSi: null },
          { id: jid("cmp"), etiqueta: "¿Retiro de residuos?", tipo: "booleano", requerido: false, visibleSi: null },
          { id: jid("cmp"), etiqueta: "Dirección", tipo: "texto", requerido: true, visibleSi: null },
        ],
      },
      {
        category_id: catId("Climatización"),
        name: "Instalación de aire acondicionado",
        description: "Instalación de equipo split, prueba y puesta a punto.",
        base_price_type: "fijo",
        active: true,
        base_price: 80,
        visit_price: 0,
        has_quantity_pricing: false,
        allows_products: true,
        price_ranges: [],
        min_price: 80,
        work_place: "Domicilio",
        previous_requirements: "Confirmar ubicación interior/exterior y acceso a pared.",
        duration: 180,
        products: [
          { id: jid("prd"), etiqueta: "Soporte exterior", precio: 12, descripcion: "", cantidad: 1 },
          { id: jid("prd"), etiqueta: "Caños extra (1m)", precio: 6, descripcion: "", cantidad: 1 },
        ],
        emergency: [],
        quote_fields: [
          {
            id: jid("cmp"),
            etiqueta: "Tipo de equipo",
            tipo: "seleccion",
            requerido: true,
            opciones: [
              { id: jid("opt"), etiqueta: "Split 3000 frigorías" },
              { id: jid("opt"), etiqueta: "Split 4500 frigorías" },
              { id: jid("opt"), etiqueta: "Split 6000 frigorías" },
            ],
            visibleSi: null,
          },
          { id: jid("cmp"), etiqueta: "Dirección", tipo: "texto", requerido: true, visibleSi: null },
        ],
      },
      {
        category_id: catId("Cerrajería"),
        name: "Apertura de puerta",
        description: "Apertura de puerta y asistencia por pérdida de llaves.",
        base_price_type: "fijo",
        active: true,
        base_price: 25,
        visit_price: 0,
        has_quantity_pricing: false,
        allows_products: true,
        price_ranges: [],
        min_price: 25,
        work_place: "Domicilio",
        previous_requirements: "Indicar tipo de cerradura/puerta.",
        duration: 45,
        products: [{ id: jid("prd"), etiqueta: "Copia de llave", precio: 7, descripcion: "", cantidad: 1 }],
        emergency: ["enabled"],
        quote_fields: [
          {
            id: jid("cmp"),
            etiqueta: "Tipo de cerradura",
            tipo: "seleccion",
            requerido: true,
            opciones: [
              { id: jid("opt"), etiqueta: "Común" },
              { id: jid("opt"), etiqueta: "Doble paleta" },
              { id: jid("opt"), etiqueta: "Multipunto" },
            ],
            visibleSi: null,
          },
          { id: jid("cmp"), etiqueta: "¿Puerta blindada?", tipo: "booleano", requerido: false, visibleSi: null },
          { id: jid("cmp"), etiqueta: "Dirección", tipo: "texto", requerido: true, visibleSi: null },
        ],
      },
    ];

    const { error: insSvcErr } = await supabase.from("services").insert(serviceRows);
    if (insSvcErr) throw insSvcErr;

    localStorage.setItem(SEEDED_KEY, "1");
  })().finally(() => {
    seedingPromise = null;
  });

  return seedingPromise;
}

function toService(row: {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  base_price_type: string;
  base_price?: number | null;
  visit_price?: number | null;
  has_quantity_pricing?: boolean | null;
  active: boolean;
  allows_products?: boolean | null;
  price_ranges?: Json | null;
  min_price?: number | null;
  emergency: Json;
  quote_fields: Json;
  work_place?: string | null;
  created_at: string;
}): Servicio {
  const emerg = asArray<unknown>(row.emergency);

  const defaultDef: PlantillaServicioDefinition = {
    version: 2,
    config: {
      precio: { activo: true, unidadCode: (row.base_price_type as PlantillaUnidadCode) ?? null },
      duracion: { activo: false, obligatorio: false, tipo: "libre", modo: "estimada" },
      modalidad: { activo: false, opciones: [] },
      ubicacion: { requiere: false },
      urgencia: { permite: emerg.length > 0 },
      productos: { permite: row.allows_products ?? true },
    },
    campos: [],
  };

  const qf = row.quote_fields as unknown;
  let definicion: PlantillaServicioDefinition = defaultDef;

  if (qf && typeof qf === "object" && !Array.isArray(qf)) {
    const v = (qf as any).version;
    const campos = (qf as any).campos;
    const config = (qf as any).config;
    if (v === 2 && Array.isArray(campos) && config && typeof config === "object") {
      definicion = qf as PlantillaServicioDefinition;
    }
  } else if (Array.isArray(qf)) {
    const legacyCampos = (qf as CampoCotizador[]).map<PlantillaCampo>((c) => ({
      id: c.id,
      nombre: c.etiqueta,
      tipo:
        c.tipo === "texto"
          ? "texto_corto"
          : c.tipo === "numero"
            ? "numero"
            : c.tipo === "booleano"
              ? "switch"
              : c.tipo === "multiseleccion"
                ? "multiselect"
                : "dropdown",
      obligatorio: Boolean(c.requerido),
      opciones:
        c.tipo === "seleccion" || c.tipo === "multiseleccion"
          ? (c.opciones ?? []).map((o) => ({ id: o.id, label: o.etiqueta }))
          : undefined,
      visibleSi: c.visibleSi ?? null,
    }));
    definicion = { ...defaultDef, campos: legacyCampos };
  }

  definicion = {
    ...definicion,
    config: {
      ...definicion.config,
      urgencia: { permite: definicion.config.urgencia?.permite ?? emerg.length > 0 },
      productos: { permite: definicion.config.productos?.permite ?? (row.allows_products ?? true) },
      precio: {
        ...(definicion.config.precio ?? { activo: true, unidadCode: null }),
        activo: definicion.config.precio?.activo ?? true,
        unidadCode: (definicion.config.precio?.unidadCode as PlantillaUnidadCode) ?? (row.base_price_type as any),
      },
      duracion: {
        activo:
          definicion.config.duracion?.activo ??
          (((definicion.config.precio?.unidadCode as any) ?? row.base_price_type ?? "") as string).includes("turno"),
        obligatorio:
          definicion.config.duracion?.obligatorio ??
          (((definicion.config.precio?.unidadCode as any) ?? row.base_price_type ?? "") as string).includes("turno"),
        modo: definicion.config.duracion?.modo === "exacta" ? "exacta" : "estimada",
        tipo: normalizeDuracionTipo(
          definicion.config as any,
          (definicion.config.precio?.unidadCode as any) ?? row.base_price_type ?? "",
        ),
        opciones: normalizeDuracionOpciones(
          definicion.config as any,
          (definicion.config.precio?.unidadCode as any) ?? row.base_price_type ?? "",
        ),
      },
      modalidad: normalizeModalidadFromConfig(definicion.config as any, row.work_place ?? null),
      ubicacion: normalizeUbicacionFromConfig(definicion.config as any),
    },
  };

  return {
    id: row.id,
    categoryId: row.category_id ?? undefined,
    nombre: row.name,
    descripcion: row.description,
    activo: row.active,
    basePrice: typeof row.base_price === "number" ? row.base_price : null,
    visitPrice: typeof row.visit_price === "number" ? row.visit_price : null,
    hasQuantityPricing: Boolean(row.has_quantity_pricing),
    priceRanges: normalizePriceRanges(row.price_ranges),
    minPrice: typeof row.min_price === "number" ? row.min_price : null,
    definicion,
    creadoEn: new Date(row.created_at).getTime(),
  };
}

function toServiceUpdate(patch: Partial<Servicio>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ("categoryId" in patch) out.category_id = patch.categoryId ?? null;
  if ("nombre" in patch) out.name = patch.nombre ?? "";
  if ("descripcion" in patch) out.description = patch.descripcion ?? "";
  if ("activo" in patch) out.active = Boolean(patch.activo);
  if ("basePrice" in patch) out.base_price = patch.basePrice ?? null;
  if ("visitPrice" in patch) out.visit_price = patch.visitPrice ?? null;
  if ("hasQuantityPricing" in patch) out.has_quantity_pricing = Boolean(patch.hasQuantityPricing);
  if ("priceRanges" in patch) out.price_ranges = patch.priceRanges ?? [];
  if ("minPrice" in patch) out.min_price = patch.minPrice ?? null;
  if ("definicion" in patch) {
    out.quote_fields = patch.definicion ?? null;
    const precio = patch.definicion?.config?.precio;
    const productos = patch.definicion?.config?.productos;
    const ubicacion = patch.definicion?.config?.ubicacion;
    const urgencia = patch.definicion?.config?.urgencia;
    const modalidad = patch.definicion?.config?.modalidad;
    if (precio) out.base_price_type = (precio.unidadCode as any) ?? "fijo";
    if (productos) out.allows_products = Boolean(productos.permite);
    if (urgencia) out.emergency = urgencia.permite ? ["enabled"] : [];
    if (modalidad) {
      out.work_place = modalidadToWorkPlace(modalidad);
    } else if (ubicacion) {
      out.work_place = ubicacion.requiere ? "Domicilio" : null;
    }
  }

  return out;
}

function normalizeModalidadFromConfig(
  config: Partial<PlantillaServicioConfig> & { ubicacion?: any; modalidad?: any },
  workPlace: string | null,
): PlantillaServicioConfig["modalidad"] {
  const raw = config.modalidad;
  if (raw && typeof raw === "object") {
    const activo = Boolean(raw.activo);
    const opciones = Array.isArray(raw.opciones) ? (raw.opciones.filter(Boolean) as PlantillaModalidadOpcion[]) : [];
    return { activo, opciones };
  }

  const legacyModo = config.ubicacion?.modo as string | undefined;
  const fromLegacyModo =
    legacyModo === "remoto"
      ? (["virtual"] as PlantillaModalidadOpcion[])
      : legacyModo === "ambos"
        ? (["virtual", "domicilio"] as PlantillaModalidadOpcion[])
        : legacyModo === "domicilio"
          ? (["domicilio"] as PlantillaModalidadOpcion[])
          : [];

  if (fromLegacyModo.length > 0) return { activo: true, opciones: fromLegacyModo };

  const fromWorkPlace =
    workPlace === "Remoto"
      ? (["virtual"] as PlantillaModalidadOpcion[])
      : workPlace === "Ambos"
        ? (["virtual", "domicilio"] as PlantillaModalidadOpcion[])
        : workPlace === "Domicilio"
          ? (["domicilio"] as PlantillaModalidadOpcion[])
          : [];

  return { activo: fromWorkPlace.length > 0, opciones: fromWorkPlace };
}

function normalizeUbicacionFromConfig(
  config: Partial<PlantillaServicioConfig> & { ubicacion?: any; modalidad?: any },
): PlantillaServicioConfig["ubicacion"] {
  const raw = config.ubicacion;
  if (raw && typeof raw === "object" && typeof raw.requiere === "boolean" && !("modo" in raw)) {
    return { requiere: Boolean(raw.requiere) };
  }

  const legacyRequiere = Boolean(config.ubicacion?.requiere);
  return { requiere: legacyRequiere };
}

function modalidadToWorkPlace(modalidad: PlantillaServicioConfig["modalidad"]) {
  if (!modalidad.activo) return null;
  const opts = modalidad.opciones ?? [];
  const hasVirtual = opts.includes("virtual");
  const hasInPerson = opts.includes("presencial") || opts.includes("domicilio");
  if (!hasVirtual && !hasInPerson) return null;
  if (hasVirtual && hasInPerson) return "Ambos";
  return hasVirtual ? "Remoto" : "Domicilio";
}

function normalizeDuracionTipo(
  config: Partial<PlantillaServicioConfig> & { duracion?: any },
  unidadCode: string,
): PlantillaServicioConfig["duracion"]["tipo"] {
  const raw = config.duracion;
  if (raw && typeof raw === "object" && (raw.tipo === "libre" || raw.tipo === "turno")) return raw.tipo;
  return unidadCode.includes("turno") ? "turno" : "libre";
}

function normalizeDuracionOpciones(
  config: Partial<PlantillaServicioConfig> & { duracion?: any },
  unidadCode: string,
): string[] | undefined {
  const raw = config.duracion;
  if (raw && typeof raw === "object" && Array.isArray(raw.opciones)) {
    const cleaned = raw.opciones.filter((x: unknown) => typeof x === "string" && x.trim()).map((x: string) => x.trim());
    return cleaned.length > 0 ? cleaned : undefined;
  }
  if (!unidadCode.includes("turno")) return undefined;
  return ["45 min", "60 min", "90 min", "Personalizado"];
}

async function insertAudit(action: string, entityType: string, entityId: string | null | undefined, before: Json | null, after: Json | null) {
  const actorEmail = snapshot.actorEmail ?? "desconocido";
  const actorRole = snapshot.adminRole;
  const entry: AdminAuditLogEntry = {
    id: `local-${uid()}`,
    actorEmail,
    actorRole,
    action,
    entityType,
    entityId: entityId ?? null,
    before,
    after,
    createdAt: Date.now(),
  };

  if (snapshot.demo) {
    const next = [entry, ...snapshot.auditLog].slice(0, 200);
    writeAuditToStorage(next);
    commit({ auditLog: next });
    return;
  }

  const res = await supabase.from("admin_audit_log" as any).insert({
    actor_email: actorEmail,
    actor_role: actorRole,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    before: before ?? null,
    after: after ?? null,
  } as any);
  if (res.error) {
    const msg = res.error.message ?? "";
    if (isMissingTableError(msg)) {
      const next = [entry, ...readAuditFromStorage()].slice(0, 200);
      writeAuditToStorage(next);
      commit({ auditLog: next });
      return;
    }
  }
}

async function upsertPendingChangeRequest(kind: AdminChangeKind, entityType: AdminChangeRequest["entityType"], entityId: string | null, payload: Json) {
  let actorEmail = snapshot.actorEmail ?? null;
  let actorRole = snapshot.adminRole;
  if (!actorEmail) {
    const actor = await getActor();
    actorEmail = actor.email;
    actorRole = actor.role;
    commit({ adminRole: actorRole, actorEmail });
  }
  const normalizedActorEmail = actorEmail ?? "desconocido";

  const existing = snapshot.changeRequests.find(
    (r) =>
      r.status === "pendiente" &&
      r.kind === kind &&
      r.entityType === entityType &&
      (r.entityId ?? null) === (entityId ?? null) &&
      r.actorEmail === normalizedActorEmail,
  );

  if (snapshot.demo) {
    const next: AdminChangeRequest = existing
      ? { ...existing, payload, createdAt: Date.now() }
      : {
          id: `local-${uid()}`,
          actorEmail: normalizedActorEmail,
          actorRole,
          kind,
          entityType,
          entityId,
          payload,
          status: "pendiente",
          approverEmail: null,
          createdAt: Date.now(),
          decidedAt: null,
        };
    const list = existing
      ? [next, ...snapshot.changeRequests.filter((r) => r.id !== existing.id)]
      : [next, ...snapshot.changeRequests];
    const trimmed = list.slice(0, 200);
    writeRequestsToStorage(trimmed);
    commit({ changeRequests: trimmed });
    return;
  }

  if (existing) {
    const res = await supabase
      .from("admin_change_requests" as any)
      .update({ payload } as any)
      .eq("id", existing.id);
    if (!res.error) {
      const next = [{ ...existing, payload }, ...snapshot.changeRequests.filter((r) => r.id !== existing.id)];
      commit({ changeRequests: next });
      return;
    }
  }

  const insert = await supabase
    .from("admin_change_requests" as any)
    .insert({
      actor_email: normalizedActorEmail,
      actor_role: actorRole,
      kind,
      entity_type: entityType,
      entity_id: entityId ?? null,
      payload,
      status: "pendiente",
    } as any)
    .select("*")
    .single();

  if (insert.error) {
    const msg = insert.error.message ?? "";
    if (isMissingTableError(msg)) {
      const next: AdminChangeRequest = {
        id: `local-${uid()}`,
        actorEmail: normalizedActorEmail,
        actorRole,
        kind,
        entityType,
        entityId,
        payload,
        status: "pendiente",
        approverEmail: null,
        createdAt: Date.now(),
        decidedAt: null,
      };
      const list = [next, ...readRequestsFromStorage()].slice(0, 200);
      writeRequestsToStorage(list);
      commit({ changeRequests: list });
      return;
    }
    throw insert.error;
  }

  const r: any = insert.data;
  const next: AdminChangeRequest = {
    id: r.id,
    actorEmail: r.actor_email,
    actorRole: r.actor_role,
    kind: r.kind,
    entityType: r.entity_type,
    entityId: r.entity_id,
    payload: r.payload,
    status: r.status,
    approverEmail: r.approver_email,
    createdAt: new Date(r.created_at).getTime(),
    decidedAt: r.decided_at ? new Date(r.decided_at).getTime() : null,
  };
  commit({ changeRequests: [next, ...snapshot.changeRequests] });
}

async function loadAll() {
  commit({ error: null });
  const actor = await getActor();

  const [
    { data: cats, error: catsErr },
    { data: tipos, error: tiposErr },
    { data: svcs, error: svcsErr },
    { data: uiRow, error: uiErr },
    { data: catDefaultsRow, error: catDefaultsErr },
    { data: reqs, error: reqsErr },
    { data: audit, error: auditErr },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("created_at", { ascending: true }),
    supabase.from("price_types").select("*").order("created_at", { ascending: true }),
    supabase.from("services").select("*").order("created_at", { ascending: false }),
    supabase.from("admin_settings").select("value").eq("key", "ui").maybeSingle(),
    supabase.from("admin_settings").select("value").eq("key", "category_defaults").maybeSingle(),
    supabase.from("admin_change_requests" as any).select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("admin_audit_log" as any).select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  if (catsErr) throw catsErr;
  if (svcsErr) throw svcsErr;

  const categorias: Categoria[] =
    cats?.map((c) => ({ id: c.id, nombre: c.name })) ?? [];
  const tiposPrecio: TipoPrecio[] = tiposErr
    ? isMissingTableError(tiposErr.message ?? "")
      ? snapshot.tiposPrecio
      : (() => {
          throw tiposErr;
        })()
    : tipos?.map((t: any) => ({
        code: t.code,
        label: t.label,
        description: t.description ?? null,
        unitLabel: t.unit_label ?? null,
        allowsProducts: typeof t.allows_products === "boolean" ? t.allows_products : true,
      })) ?? snapshot.tiposPrecio;
  const servicios: Servicio[] = svcs?.map((s) => toService(s)) ?? [];
  const stored = readAdminUiFromStorage();
  const fromDb =
    uiErr && isMissingTableError(uiErr.message ?? "")
      ? null
      : uiRow && typeof (uiRow as any).value === "object"
        ? ((uiRow as any).value as AdminUiConfig)
        : null;
  let adminUi = mergeAdminUi(snapshot.adminUi, stored);
  adminUi = mergeAdminUi(adminUi, fromDb);
  writeAdminUiToStorage(adminUi);

  const storedCatDefaults = readCategoryDefaultsFromStorage();
  const fromDbCatDefaults =
    catDefaultsErr && isMissingTableError(catDefaultsErr.message ?? "")
      ? null
      : catDefaultsRow && typeof (catDefaultsRow as any).value === "object"
        ? ((catDefaultsRow as any).value as Record<string, PlantillaCampo[]>)
        : null;
  const categoriaCampoDefaults = { ...storedCatDefaults, ...(fromDbCatDefaults ?? {}) };
  writeCategoryDefaultsToStorage(categoriaCampoDefaults);

  const changeRequests: AdminChangeRequest[] =
    reqsErr && isMissingTableError(reqsErr.message ?? "")
      ? readRequestsFromStorage()
      : (reqs as any[] | null)?.map((r) => ({
          id: r.id,
          actorEmail: r.actor_email,
          actorRole: r.actor_role,
          kind: r.kind,
          entityType: r.entity_type,
          entityId: r.entity_id,
          payload: r.payload,
          status: r.status,
          approverEmail: r.approver_email,
          createdAt: new Date(r.created_at).getTime(),
          decidedAt: r.decided_at ? new Date(r.decided_at).getTime() : null,
        })) ?? [];
  const auditLog: AdminAuditLogEntry[] =
    auditErr && isMissingTableError(auditErr.message ?? "")
      ? readAuditFromStorage()
      : (audit as any[] | null)?.map((a) => ({
          id: a.id,
          actorEmail: a.actor_email,
          actorRole: a.actor_role,
          action: a.action,
          entityType: a.entity_type,
          entityId: a.entity_id,
          before: a.before ?? null,
          after: a.after ?? null,
          createdAt: new Date(a.created_at).getTime(),
        })) ?? [];

  commit({
    categorias,
    tiposPrecio,
    servicios,
    adminUi,
    categoriaCampoDefaults,
    loaded: true,
    demo: false,
    adminRole: actor.role,
    actorEmail: actor.email,
    changeRequests,
    auditLog,
  });
}

function ensureLoaded() {
  if (snapshot.loaded) return;
  if (loadingPromise) return;
  const stored = readAdminUiFromStorage();
  if (stored) commit({ adminUi: mergeAdminUi(snapshot.adminUi, stored) });
  const storedDefaults = readCategoryDefaultsFromStorage();
  if (storedDefaults && Object.keys(storedDefaults).length > 0) commit({ categoriaCampoDefaults: storedDefaults });
  loadingPromise = loadAll()
    .catch((err: unknown) => {
      const msg =
        typeof err === "object" && err && "message" in err && typeof (err as any).message === "string"
          ? (err as any).message
          : "No se pudo cargar datos desde la base de datos.";
      if (isMissingTableError(msg)) {
        const now = Date.now();
        const demo = demoDataset(now);
        const adminUi = mergeAdminUi(snapshot.adminUi, readAdminUiFromStorage());
        commit({ ...demo, adminUi, loaded: true, demo: true, error: msg });
        return;
      }
      commit({ loaded: true, error: msg, demo: false });
    })
    .finally(() => {
      loadingPromise = null;
    });
}

async function flushUpdate(id: string) {
  const entry = pendingUpdates.get(id);
  if (!entry) return;
  pendingUpdates.delete(id);
  if (snapshot.adminRole !== "aguila") {
    await upsertPendingChangeRequest(
      "update_service",
      "services",
      id,
      { patch: entry.patch } as unknown as Json,
    );
    return;
  }

  const payload = toServiceUpdate(entry.patch);
  const first = await supabase.from("services").update(payload as any).eq("id", id);
  if (!first.error) {
    await insertAudit("update_service", "services", id, null, entry.patch as unknown as Json);
    return;
  }
  const msg = first.error.message ?? "";
  if (msg.includes("allows_products") && "allows_products" in payload) {
    const { allows_products, ...rest } = payload as any;
    const retry = await supabase.from("services").update(rest as any).eq("id", id);
    if (!retry.error) {
      await insertAudit("update_service", "services", id, null, entry.patch as unknown as Json);
      return;
    }
  }
  await loadAll();
}

export function useCategories() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => ensureLoaded(), []);
  return snap.categorias;
}

export function usePriceTypes() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => ensureLoaded(), []);
  return snap.tiposPrecio;
}

export function useAdminUi() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => ensureLoaded(), []);
  return snap.adminUi;
}

export function useAdminRole() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => ensureLoaded(), []);
  return { role: snap.adminRole, email: snap.actorEmail };
}

export function useChangeRequests() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => ensureLoaded(), []);
  return snap.changeRequests;
}

export function useAuditLog() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => ensureLoaded(), []);
  return snap.auditLog;
}

export function useDataStatus() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => ensureLoaded(), []);
  return { loaded: snap.loaded, error: snap.error, demo: snap.demo };
}

export function useServices() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => ensureLoaded(), []);
  return snap.servicios;
}

export function useService(id: string | undefined) {
  const services = useServices();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!id) return { service: undefined, hydrated };
  return { service: services.find((s) => s.id === id), hydrated };
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const servicesActions = {
  async seedDemo() {
    if (snapshot.demo) return;
    await seedDemoIfEmpty();
    await loadAll();
  },

  async refresh() {
    await loadAll();
  },

  async refreshActor() {
    const actor = await getActor();
    commit({ adminRole: actor.role, actorEmail: actor.email });
  },

  createCamposFromCategoryDefaults(categoryId: string): PlantillaCampo[] {
    const defaults = snapshot.categoriaCampoDefaults[categoryId] ?? [];
    if (defaults.length === 0) return [];

    const idMap = new Map<string, string>();
    defaults.forEach((d) => {
      idMap.set(d.id, `fld-${uid()}`);
    });

    return defaults.map((d) => {
      const newId = idMap.get(d.id) ?? `fld-${uid()}`;
      const opciones =
        d.opciones?.map((o) => ({ id: `opt-${uid()}`, label: o.label })) ?? undefined;
      const visibleSiRaw = d.visibleSi ?? null;
      const visibleSi =
        visibleSiRaw && typeof visibleSiRaw === "object" && typeof (visibleSiRaw as any).dependeDe === "string"
          ? idMap.has((visibleSiRaw as any).dependeDe)
            ? { ...(visibleSiRaw as any), dependeDe: idMap.get((visibleSiRaw as any).dependeDe)! }
            : null
          : null;

      return {
        id: newId,
        defaultKey: d.defaultKey ?? d.id,
        nombre: d.nombre,
        tipo: d.tipo,
        obligatorio: d.obligatorio,
        opciones,
        visibleSi,
      };
    });
  },

  async requestCreateService(payload: {
    nombre: string;
    descripcion?: string;
    categoryId?: string;
    activo?: boolean;
    definicion?: PlantillaServicioDefinition;
  }) {
    const nombre = payload.nombre.trim();
    if (!nombre) return;
    const definicionBase: PlantillaServicioDefinition =
      payload.definicion ??
      ({
        version: 2,
        config: {
          precio: { activo: false, unidadCode: (snapshot.tiposPrecio[0]?.code ?? "fijo") as PlantillaUnidadCode },
          duracion: { activo: false, obligatorio: false, tipo: "libre", modo: "estimada" },
          modalidad: { activo: false, opciones: [] },
          ubicacion: { requiere: false },
          urgencia: { permite: false },
          productos: { permite: true },
        },
        campos: [],
      } as PlantillaServicioDefinition);
    const definicion: PlantillaServicioDefinition =
      payload.categoryId && (definicionBase.campos?.length ?? 0) === 0
        ? { ...definicionBase, campos: this.createCamposFromCategoryDefaults(payload.categoryId) }
        : { ...definicionBase, campos: definicionBase.campos ?? [] };
    const base: Pick<Servicio, "nombre" | "descripcion" | "categoryId" | "activo" | "definicion"> = {
      nombre,
      descripcion: payload.descripcion ?? "",
      categoryId: payload.categoryId,
      activo: payload.activo ?? true,
      definicion,
    };
    await upsertPendingChangeRequest("create_service", "services", null, base as unknown as Json);
  },

  async approveChangeRequest(id: string) {
    const req = snapshot.changeRequests.find((r) => r.id === id);
    if (!req || req.status !== "pendiente") return;
    const actorEmail = snapshot.actorEmail ?? "desconocido";
    const isLocalRequest = req.id.startsWith("local-");

    const canApprove =
      snapshot.adminRole === "aguila" || (snapshot.adminRole === "halcon" && req.actorRole === "buho");
    if (!canApprove) throw new Error("No tenés permisos para aprobar este cambio.");

    if (snapshot.demo) {
      if (req.kind === "create_category") {
        const name = typeof (req.payload as any)?.name === "string" ? (req.payload as any).name : "";
        if (name) commit({ categorias: [...snapshot.categorias, { id: `demo-cat-${jid("new")}`, nombre: name }] });
      } else if (req.kind === "update_category" && req.entityId) {
        const name = typeof (req.payload as any)?.name === "string" ? (req.payload as any).name : "";
        if (name) commit({ categorias: snapshot.categorias.map((c) => (c.id === req.entityId ? { ...c, nombre: name } : c)) });
      } else if (req.kind === "delete_category" && req.entityId) {
        commit({ categorias: snapshot.categorias.filter((c) => c.id !== req.entityId) });
      } else if (req.kind === "delete_service" && req.entityId) {
        commit({ servicios: snapshot.servicios.filter((s) => s.id !== req.entityId) });
      } else if (req.kind === "update_service" && req.entityId) {
        const patch = (req.payload as any)?.patch as Partial<Servicio> | undefined;
        if (patch) commit({ servicios: snapshot.servicios.map((s) => (s.id === req.entityId ? { ...s, ...patch } : s)) });
      } else if (req.kind === "create_service") {
        const p = req.payload as any;
        const nombre = typeof p?.nombre === "string" ? p.nombre : "";
        if (nombre) {
          const svc: Servicio = {
            id: `demo-srv-${jid("new")}`,
            categoryId: typeof p?.categoryId === "string" ? p.categoryId : undefined,
            nombre,
            descripcion: typeof p?.descripcion === "string" ? p.descripcion : "",
            activo: typeof p?.activo === "boolean" ? p.activo : true,
            definicion: p?.definicion as PlantillaServicioDefinition,
            creadoEn: Date.now(),
          };
          commit({ servicios: [svc, ...snapshot.servicios] });
        }
      }

      const next = snapshot.changeRequests.map((r) =>
        r.id === id ? { ...r, status: "aprobado" as AdminChangeStatus, approverEmail: actorEmail, decidedAt: Date.now() } : r,
      );
      writeRequestsToStorage(next);
      commit({ changeRequests: next });
      writeAuditToStorage([
        {
          id: `local-${uid()}`,
          actorEmail,
          actorRole: snapshot.adminRole,
          action: `approve:${req.kind}`,
          entityType: req.entityType,
          entityId: req.entityId ?? null,
          before: null,
          after: req.payload,
          createdAt: Date.now(),
        },
        ...snapshot.auditLog,
      ]);
      commit({ auditLog: readAuditFromStorage() });
      return;
    }

    if (req.kind === "create_category") {
      const name = typeof (req.payload as any)?.name === "string" ? (req.payload as any).name : "";
      if (name) {
        const ins = await supabase.from("categories").insert({ name }).select("id,name").single();
        if (ins.error) throw ins.error;
        await insertAudit("create_category", "categories", ins.data.id, null, { id: ins.data.id, name: ins.data.name } as any);
      }
    } else if (req.kind === "update_category" && req.entityId) {
      const name = typeof (req.payload as any)?.name === "string" ? (req.payload as any).name : "";
      if (name) {
        const up = await supabase.from("categories").update({ name }).eq("id", req.entityId);
        if (up.error) throw up.error;
        await insertAudit("update_category", "categories", req.entityId, null, { name } as any);
      }
    } else if (req.kind === "delete_category" && req.entityId) {
      const del = await supabase.from("categories").delete().eq("id", req.entityId);
      if (del.error) throw del.error;
      await insertAudit("delete_category", "categories", req.entityId, null, null);
    } else if (req.kind === "delete_service" && req.entityId) {
      const del = await supabase.from("services").delete().eq("id", req.entityId);
      if (del.error) throw del.error;
      await insertAudit("delete_service", "services", req.entityId, null, null);
    } else if (req.kind === "update_service" && req.entityId) {
      const patch = (req.payload as any)?.patch as Partial<Servicio> | undefined;
      if (patch) {
        const up = await supabase.from("services").update(toServiceUpdate(patch) as any).eq("id", req.entityId);
        if (up.error) throw up.error;
        await insertAudit("update_service", "services", req.entityId, null, patch as any);
      }
    } else if (req.kind === "create_service") {
      const p = req.payload as any;
      const nombre = typeof p?.nombre === "string" ? p.nombre : "";
      if (nombre) {
        const base: Partial<Servicio> = {
          nombre,
          descripcion: typeof p?.descripcion === "string" ? p.descripcion : "",
          categoryId: typeof p?.categoryId === "string" ? p.categoryId : undefined,
          activo: typeof p?.activo === "boolean" ? p.activo : true,
          definicion: p?.definicion as PlantillaServicioDefinition,
        };
        const row = toServiceUpdate(base);
        const ins = await supabase.from("services").insert(row as any).select("*").single();
        if (ins.error) throw ins.error;
        const svc = toService(ins.data as any);
        await insertAudit("create_service", "services", svc.id, null, { id: svc.id, nombre: svc.nombre } as any);
      }
    }

    if (isLocalRequest) {
      const next = snapshot.changeRequests.map((r) =>
        r.id === id ? { ...r, status: "aprobado" as AdminChangeStatus, approverEmail: actorEmail, decidedAt: Date.now() } : r,
      );
      writeRequestsToStorage(next);
      commit({ changeRequests: next });
      await loadAll();
      return;
    }

    const upd = await supabase
      .from("admin_change_requests" as any)
      .update({ status: "aprobado", approver_email: actorEmail, decided_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (upd.error) {
      if (isMissingTableError(upd.error.message ?? "")) {
        const next = snapshot.changeRequests.map((r) =>
          r.id === id ? { ...r, status: "aprobado" as AdminChangeStatus, approverEmail: actorEmail, decidedAt: Date.now() } : r,
        );
        writeRequestsToStorage(next);
        commit({ changeRequests: next });
        await loadAll();
        return;
      }
      throw upd.error;
    }
    await loadAll();
  },

  async rejectChangeRequest(id: string) {
    const req = snapshot.changeRequests.find((r) => r.id === id);
    if (!req || req.status !== "pendiente") return;
    const actorEmail = snapshot.actorEmail ?? "desconocido";
    const isLocalRequest = req.id.startsWith("local-");

    const canReject =
      snapshot.adminRole === "aguila" || (snapshot.adminRole === "halcon" && req.actorRole === "buho");
    if (!canReject) throw new Error("No tenés permisos para rechazar este cambio.");

    if (snapshot.demo) {
      const next = snapshot.changeRequests.map((r) =>
        r.id === id ? { ...r, status: "rechazado" as AdminChangeStatus, approverEmail: actorEmail, decidedAt: Date.now() } : r,
      );
      writeRequestsToStorage(next);
      commit({ changeRequests: next });
      await insertAudit(`reject:${req.kind}`, req.entityType, req.entityId ?? null, null, req.payload);
      return;
    }

    if (isLocalRequest) {
      const next = snapshot.changeRequests.map((r) =>
        r.id === id ? { ...r, status: "rechazado" as AdminChangeStatus, approverEmail: actorEmail, decidedAt: Date.now() } : r,
      );
      writeRequestsToStorage(next);
      commit({ changeRequests: next });
      await insertAudit(`reject:${req.kind}`, req.entityType, req.entityId ?? null, null, req.payload);
      await loadAll();
      return;
    }

    const upd = await supabase
      .from("admin_change_requests" as any)
      .update({ status: "rechazado", approver_email: actorEmail, decided_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (upd.error) {
      if (isMissingTableError(upd.error.message ?? "")) {
        const next = snapshot.changeRequests.map((r) =>
          r.id === id ? { ...r, status: "rechazado" as AdminChangeStatus, approverEmail: actorEmail, decidedAt: Date.now() } : r,
        );
        writeRequestsToStorage(next);
        commit({ changeRequests: next });
        await insertAudit(`reject:${req.kind}`, req.entityType, req.entityId ?? null, null, req.payload);
        await loadAll();
        return;
      }
      throw upd.error;
    }
    await insertAudit(`reject:${req.kind}`, req.entityType, req.entityId ?? null, null, req.payload);
    await loadAll();
  },

  async updateAdminUi(patch: AdminUiPatch) {
    const next = mergeAdminUi(snapshot.adminUi, patch);
    writeAdminUiToStorage(next);
    commit({ adminUi: next });
    if (snapshot.demo) return;
    const res = await supabase
      .from("admin_settings")
      .upsert({ key: "ui", value: next as unknown as Json } as any)
      .select("key")
      .maybeSingle();
    if (res.error) {
      if (isMissingTableError(res.error.message ?? "")) return;
      throw res.error;
    }
  },

  async addCategory(nombre: string) {
    const name = nombre.trim();
    if (!name) return;
    if (snapshot.adminRole !== "aguila") {
      await upsertPendingChangeRequest("create_category", "categories", null, { name } as unknown as Json);
      return;
    }
    if (snapshot.demo) {
      const cat: Categoria = { id: `demo-cat-${jid("new")}`, nombre: name };
      commit({ categorias: [...snapshot.categorias, cat] });
      return;
    }
    const { data, error } = await supabase.from("categories").insert({ name }).select("id,name").single();
    if (error) throw error;
    const cat: Categoria = { id: data.id, nombre: data.name };
    commit({ categorias: [...snapshot.categorias, cat] });
    await insertAudit("create_category", "categories", data.id, null, { id: data.id, name: data.name } as unknown as Json);
  },

  async updateCategory(id: string, nombre: string) {
    const name = nombre.trim();
    if (!name) return;
    if (snapshot.adminRole !== "aguila") {
      await upsertPendingChangeRequest("update_category", "categories", id, { name } as unknown as Json);
      return;
    }
    if (snapshot.demo) {
      commit({ categorias: snapshot.categorias.map((c) => (c.id === id ? { ...c, nombre: name } : c)) });
      return;
    }
    const { error } = await supabase.from("categories").update({ name }).eq("id", id);
    if (error) throw error;
    commit({ categorias: snapshot.categorias.map((c) => (c.id === id ? { ...c, nombre: name } : c)) });
    await insertAudit("update_category", "categories", id, null, { name } as unknown as Json);
  },

  async removeCategory(id: string) {
    if (snapshot.adminRole !== "aguila") {
      await upsertPendingChangeRequest("delete_category", "categories", id, {} as unknown as Json);
      return;
    }
    if (snapshot.demo) {
      commit({ categorias: snapshot.categorias.filter((c) => c.id !== id) });
      return;
    }
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    commit({ categorias: snapshot.categorias.filter((c) => c.id !== id) });
    await insertAudit("delete_category", "categories", id, null, null);
  },

  async addPriceType(
    code: string,
    label: string,
    description?: string,
    options?: { unitLabel?: string; allowsProducts?: boolean },
  ) {
    const c = code.trim();
    const l = label.trim();
    if (!c || !l) return;
    const tipo: TipoPrecio = {
      code: c,
      label: l,
      description: description?.trim() || null,
      unitLabel: options?.unitLabel?.trim() || null,
      allowsProducts: options?.allowsProducts ?? true,
    };
    if (snapshot.demo) {
      commit({ tiposPrecio: [...snapshot.tiposPrecio, tipo] });
      return;
    }
    const first = await supabase.from("price_types").insert({
      code: tipo.code,
      label: tipo.label,
      description: tipo.description ?? null,
      unit_label: tipo.unitLabel ?? null,
      allows_products: tipo.allowsProducts,
    });
    if (first.error) {
      const msg = first.error.message ?? "";
      if (msg.includes("unit_label") || msg.includes("allows_products")) {
        const retry = await supabase.from("price_types").insert({
          code: tipo.code,
          label: tipo.label,
          description: tipo.description ?? null,
        });
        if (retry.error) throw retry.error;
      } else {
        throw first.error;
      }
    }
    commit({ tiposPrecio: [...snapshot.tiposPrecio, tipo] });
  },

  async updatePriceType(code: string, patch: Partial<Omit<TipoPrecio, "code">>) {
    const next = snapshot.tiposPrecio.map((t) =>
      t.code === code ? { ...t, ...patch, description: patch.description ?? t.description ?? null } : t,
    );
    if (snapshot.demo) {
      commit({ tiposPrecio: next });
      return;
    }
    const target = next.find((t) => t.code === code);
    if (!target) return;
    const first = await supabase
      .from("price_types")
      .update({
        label: target.label,
        description: target.description ?? null,
        unit_label: target.unitLabel ?? null,
        allows_products: target.allowsProducts,
      })
      .eq("code", code);
    if (first.error) {
      const msg = first.error.message ?? "";
      if (msg.includes("unit_label") || msg.includes("allows_products")) {
        const retry = await supabase
          .from("price_types")
          .update({ label: target.label, description: target.description ?? null })
          .eq("code", code);
        if (retry.error) throw retry.error;
      } else {
        throw first.error;
      }
    }
    commit({ tiposPrecio: next });
  },

  async removePriceType(code: string) {
    if (snapshot.demo) {
      commit({ tiposPrecio: snapshot.tiposPrecio.filter((t) => t.code !== code) });
      return;
    }
    const { error } = await supabase.from("price_types").delete().eq("code", code);
    if (error) throw error;
    commit({ tiposPrecio: snapshot.tiposPrecio.filter((t) => t.code !== code) });
  },

  async create(nombre: string): Promise<Servicio> {
    const now = Date.now();
    const defaultUnidad = (snapshot.tiposPrecio[0]?.code ?? "por_trabajo") as PlantillaUnidadCode;
    const definicion: PlantillaServicioDefinition = {
      version: 2,
      config: {
        precio: { activo: false, unidadCode: defaultUnidad },
        duracion: { activo: false, obligatorio: false, tipo: "libre", modo: "estimada" },
        modalidad: { activo: false, opciones: [] },
        ubicacion: { requiere: false },
        urgencia: { permite: false },
        productos: { permite: true },
      },
      campos: [],
    };

    if (snapshot.adminRole !== "aguila") {
      throw new Error("Creación no permitida: requiere aprobación.");
    }

    if (snapshot.demo) {
      const svc: Servicio = {
        id: `demo-srv-${jid("new")}`,
        categoryId: snapshot.categorias[0]?.id,
        nombre,
        descripcion: "",
        activo: true,
        definicion,
        creadoEn: now,
      };
      commit({ servicios: [svc, ...snapshot.servicios] });
      return svc;
    }

    const insertRow = (withOptionalCols: boolean) => {
      const work_place = modalidadToWorkPlace(definicion.config.modalidad);

      const row: Record<string, unknown> = {
        name: nombre,
        description: "",
        category_id: snapshot.categorias[0]?.id ?? null,
        base_price_type: definicion.config.precio.unidadCode ?? defaultUnidad,
        active: true,
        emergency: definicion.config.urgencia.permite ? ["enabled"] : [],
        quote_fields: definicion,
        work_place,
      };
      if (withOptionalCols) row.allows_products = Boolean(definicion.config.productos.permite);
      return row;
    };

    const first = await supabase.from("services").insert(insertRow(true) as any).select("*").single();
    if (first.error) {
      const msg = first.error.message ?? "";
      if (msg.includes("allows_products")) {
        const retry = await supabase.from("services").insert(insertRow(false) as any).select("*").single();
        if (retry.error) throw retry.error;
        const svc = toService(retry.data as any);
        commit({ servicios: [svc, ...snapshot.servicios] });
        return svc;
      }
      throw first.error;
    }
    const svc = toService(first.data as any);
    commit({ servicios: [svc, ...snapshot.servicios] });
    await insertAudit("create_service", "services", svc.id, null, { id: svc.id, nombre: svc.nombre } as unknown as Json);
    return svc;
  },

  async update(id: string, patch: Partial<Servicio>) {
    if (snapshot.demo) {
      commit({
        servicios: snapshot.servicios.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      });
      return;
    }
    commit({
      servicios: snapshot.servicios.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

    if (typeof window === "undefined") {
      const { error } = await supabase.from("services").update(toServiceUpdate(patch) as any).eq("id", id);
      if (error) await loadAll();
      return;
    }

    const existing = pendingUpdates.get(id);
    if (existing) {
      window.clearTimeout(existing.timer);
      pendingUpdates.set(id, {
        timer: window.setTimeout(() => flushUpdate(id), 500),
        patch: { ...existing.patch, ...patch },
      });
      return;
    }

    pendingUpdates.set(id, {
      timer: window.setTimeout(() => flushUpdate(id), 500),
      patch,
    });
  },

  async remove(id: string) {
    if (snapshot.adminRole !== "aguila") {
      await upsertPendingChangeRequest("delete_service", "services", id, {} as unknown as Json);
      return;
    }
    if (snapshot.demo) {
      commit({ servicios: snapshot.servicios.filter((s) => s.id !== id) });
      return;
    }
    commit({ servicios: snapshot.servicios.filter((s) => s.id !== id) });
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) await loadAll();
    else await insertAudit("delete_service", "services", id, null, null);
  },

  async addCustomField(serviceId: string, tipo: PlantillaCampoTipo = "texto_corto") {
    const s = snapshot.servicios.find((x) => x.id === serviceId);
    if (!s) return;
    const categoryId = s.categoryId ?? null;
    const defaultKey = categoryId ? `dfl-${uid()}` : undefined;
    const campo: PlantillaCampo = {
      id: `fld-${uid()}`,
      defaultKey,
      nombre: "Nuevo campo",
      tipo,
      obligatorio: false,
      visibleSi: null,
      opciones:
        tipo === "dropdown" || tipo === "multiselect"
          ? [
              { id: `opt-${uid()}`, label: "Opción 1" },
              { id: `opt-${uid()}`, label: "Opción 2" },
            ]
          : undefined,
    };
    await this.update(serviceId, {
      definicion: { ...s.definicion, campos: [...(s.definicion.campos ?? []), campo] },
    });

    if (categoryId && defaultKey) {
      const base = snapshot.categoriaCampoDefaults[categoryId] ?? [];
      const nextDefaultCampo: PlantillaCampo = {
        id: defaultKey,
        defaultKey,
        nombre: campo.nombre,
        tipo: campo.tipo,
        obligatorio: campo.obligatorio,
        opciones: campo.opciones?.map((o) => ({ id: `opt-${uid()}`, label: o.label })),
        visibleSi: null,
      };
      await persistCategoryDefaults({
        ...snapshot.categoriaCampoDefaults,
        [categoryId]: [...base, nextDefaultCampo],
      });
    }
  },

  async updateCustomField(serviceId: string, fieldId: string, patch: Partial<PlantillaCampo>) {
    const s = snapshot.servicios.find((x) => x.id === serviceId);
    if (!s) return;
    const original = (s.definicion.campos ?? []).find((c) => c.id === fieldId) ?? null;
    const categoryId = s.categoryId ?? null;
    const defaultKey = original?.defaultKey ?? null;
    const campos = (s.definicion.campos ?? []).map((c) => {
      if (c.id !== fieldId) return c;
      const next: PlantillaCampo = { ...c, ...patch };
      if ("tipo" in patch) {
        if (patch.tipo === "dropdown" || patch.tipo === "multiselect") {
          if (!next.opciones || next.opciones.length === 0) {
            next.opciones = [
              { id: `opt-${uid()}`, label: "Opción 1" },
              { id: `opt-${uid()}`, label: "Opción 2" },
            ];
          }
        } else {
          delete (next as any).opciones;
        }
      }
      return next;
    });
    await this.update(serviceId, { definicion: { ...s.definicion, campos } });

    if (categoryId && defaultKey) {
      const current = snapshot.categoriaCampoDefaults[categoryId] ?? [];
      const idx = current.findIndex((d) => d.id === defaultKey);
      if (idx >= 0) {
        const existing = current[idx]!;
        const nextDefault: PlantillaCampo = {
          ...existing,
          nombre: typeof patch.nombre === "string" ? patch.nombre : existing.nombre,
          tipo: (patch.tipo as any) ?? existing.tipo,
          obligatorio: typeof patch.obligatorio === "boolean" ? patch.obligatorio : existing.obligatorio,
        };
        const nextList = [...current];
        nextList[idx] = nextDefault;
        await persistCategoryDefaults({ ...snapshot.categoriaCampoDefaults, [categoryId]: nextList });
      }
    }
  },

  async removeCustomField(serviceId: string, fieldId: string) {
    const s = snapshot.servicios.find((x) => x.id === serviceId);
    if (!s) return;
    const target = (s.definicion.campos ?? []).find((c) => c.id === fieldId) ?? null;
    const categoryId = s.categoryId ?? null;
    const defaultKey = target?.defaultKey ?? null;
    await this.update(serviceId, {
      definicion: { ...s.definicion, campos: (s.definicion.campos ?? []).filter((c) => c.id !== fieldId) },
    });

    if (categoryId && defaultKey) {
      const current = snapshot.categoriaCampoDefaults[categoryId] ?? [];
      const nextList = current.filter((d) => d.id !== defaultKey);
      if (nextList.length !== current.length) {
        await persistCategoryDefaults({ ...snapshot.categoriaCampoDefaults, [categoryId]: nextList });
      }
    }
  },

  async moveCustomField(serviceId: string, fieldId: string, dir: -1 | 1) {
    const s = snapshot.servicios.find((x) => x.id === serviceId);
    if (!s) return;
    const current = [...(s.definicion.campos ?? [])];
    const idx = current.findIndex((c) => c.id === fieldId);
    const newIdx = idx + dir;
    if (idx < 0 || newIdx < 0 || newIdx >= current.length) return;
    const [item] = current.splice(idx, 1);
    current.splice(newIdx, 0, item);
    await this.update(serviceId, { definicion: { ...s.definicion, campos: current } });
  },

  async addCustomFieldOption(serviceId: string, fieldId: string) {
    const s = snapshot.servicios.find((x) => x.id === serviceId);
    if (!s) return;
    const campos = (s.definicion.campos ?? []).map((c) =>
      c.id === fieldId
        ? { ...c, opciones: [...(c.opciones ?? []), { id: `opt-${uid()}`, label: "Nueva opción" }] }
        : c,
    );
    await this.update(serviceId, { definicion: { ...s.definicion, campos } });
  },

  async updateCustomFieldOption(serviceId: string, fieldId: string, optionId: string, label: string) {
    const s = snapshot.servicios.find((x) => x.id === serviceId);
    if (!s) return;
    const campos = (s.definicion.campos ?? []).map((c) =>
      c.id === fieldId ? { ...c, opciones: c.opciones?.map((o) => (o.id === optionId ? { ...o, label } : o)) } : c,
    );
    await this.update(serviceId, { definicion: { ...s.definicion, campos } });
  },

  async removeCustomFieldOption(serviceId: string, fieldId: string, optionId: string) {
    const s = snapshot.servicios.find((x) => x.id === serviceId);
    if (!s) return;
    const campos = (s.definicion.campos ?? []).map((c) =>
      c.id === fieldId ? { ...c, opciones: c.opciones?.filter((o) => o.id !== optionId) } : c,
    );
    await this.update(serviceId, { definicion: { ...s.definicion, campos } });
  },
};
