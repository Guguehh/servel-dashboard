import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { servicesActions } from "@/lib/services-store";

type AdminRole = "aguila" | "halcon" | "buho";

type LocalUserRecord = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatarDataUrl: string;
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
  createdAt: number;
  updatedAt: number;
};

type LocalUserPublic = Pick<LocalUserRecord, "id" | "email" | "name" | "role" | "avatarDataUrl" | "createdAt" | "updatedAt">;

type LocalSession = { userId: string; createdAt: number };

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  verifyPassword: (password: string) => Promise<{ ok: boolean; error: string | null }>;
  listAccounts: () => LocalUserPublic[];
  createAccount: (payload: { email: string; password: string; name: string; role: AdminRole }) => Promise<{ error: string | null }>;
  updateAccount: (id: string, patch: Partial<Pick<LocalUserPublic, "name" | "role" | "avatarDataUrl">>) => Promise<{ error: string | null }>;
  setAccountPassword: (id: string, newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LOCAL_USERS_KEY = "servel.local_users.v1";
const LOCAL_SESSION_KEY = "servel.local_session.v1";
const LOCAL_LOGIN_GUARD_KEY = "servel.local_login_guard.v1";

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const SUPERADMIN_EMAILS = new Set(["admin@admin.com", "admin@admin"]);

function passwordPolicyError(password: string) {
  if (password.length < 8) return "La clave debe tener al menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(password)) return "La clave debe incluir al menos una letra.";
  if (!/[0-9]/.test(password)) return "La clave debe incluir al menos un número.";
  if (!/[^a-zA-Z0-9]/.test(password)) return "La clave debe incluir al menos un símbolo.";
  return null;
}

function toB64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function fromB64(b64: string) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function hashPassword(password: string, saltB64: string, iterations: number) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromB64(saltB64), iterations },
    key,
    256,
  );
  return toB64(new Uint8Array(bits));
}

function constantTimeEqual(a: string, b: string) {
  const ab = fromB64(a);
  const bb = fromB64(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i]! ^ bb[i]!;
  return diff === 0;
}

function defaultAvatarDataUrl(role: AdminRole, name: string) {
  const initials = name
    .trim()
    .split(/\s+/g)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  const cfg =
    role === "aguila"
      ? { bg: "#111827", fg: "#FFFFFF" }
      : role === "halcon"
        ? { bg: "#0B5FFF", fg: "#FFFFFF" }
        : { bg: "#F3F4F6", fg: "#111827" };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="28" fill="${cfg.bg}"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="ui-sans-serif, system-ui, -apple-system" font-size="44" font-weight="800" fill="${cfg.fg}">${initials || "?"}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function readLocalUsers(): LocalUserRecord[] {
  if (typeof window === "undefined") return [];
  return safeParseJson<LocalUserRecord[]>(localStorage.getItem(LOCAL_USERS_KEY)) ?? [];
}

function writeLocalUsers(users: LocalUserRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function readLocalSession(): LocalSession | null {
  if (typeof window === "undefined") return null;
  return safeParseJson<LocalSession>(localStorage.getItem(LOCAL_SESSION_KEY));
}

function writeLocalSession(s: LocalSession | null) {
  if (typeof window === "undefined") return;
  if (!s) localStorage.removeItem(LOCAL_SESSION_KEY);
  else localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(s));
}

function ensureSeededLocalUsers() {
  if (typeof window === "undefined") return;
  const existing = readLocalUsers();
  if (existing.length > 0) return;

  const now = Date.now();
  const base = [
    { email: "admin@admin.com", password: "agus1234!", name: "Admin", role: "aguila" as AdminRole },
    { email: "halcon@admin.com", password: "halcon1234!", name: "Halcón", role: "halcon" as AdminRole },
    { email: "buho@admin.com", password: "buho1234!", name: "Búho", role: "buho" as AdminRole },
  ];

  Promise.all(
    base.map(async (u) => {
      const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
      const iterations = 210_000;
      const hash = await hashPassword(u.password, salt, iterations);
      const rec: LocalUserRecord = {
        id: uid(),
        email: normalizeEmail(u.email),
        name: u.name,
        role: u.role,
        avatarDataUrl: defaultAvatarDataUrl(u.role, u.name),
        passwordHash: hash,
        passwordSalt: salt,
        passwordIterations: iterations,
        createdAt: now,
        updatedAt: now,
      };
      return rec;
    }),
  ).then((users) => writeLocalUsers(users));
}

let localSeedPromise: Promise<void> | null = null;

async function ensureLocalSeeded() {
  if (typeof window === "undefined") return;
  if (readLocalUsers().length > 0) return;
  if (localSeedPromise) return localSeedPromise;
  localSeedPromise = (async () => {
    ensureSeededLocalUsers();
    for (let i = 0; i < 50; i++) {
      if (readLocalUsers().length > 0) return;
      await new Promise((r) => setTimeout(r, 25));
    }
  })().finally(() => {
    localSeedPromise = null;
  });
  return localSeedPromise;
}

type LoginGuardState = { failuresByEmail: Record<string, { fails: number; lockedUntil: number }> };

function readLoginGuard(): LoginGuardState {
  if (typeof window === "undefined") return { failuresByEmail: {} };
  return safeParseJson<LoginGuardState>(localStorage.getItem(LOCAL_LOGIN_GUARD_KEY)) ?? { failuresByEmail: {} };
}

function writeLoginGuard(state: LoginGuardState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_LOGIN_GUARD_KEY, JSON.stringify(state));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [localUser, setLocalUser] = useState<LocalUserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureSeededLocalUsers();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const ls = readLocalSession();
      if (ls) {
        const u = readLocalUsers().find((x) => x.id === ls.userId);
        if (u) {
          const pub: LocalUserPublic = {
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            avatarDataUrl: u.avatarDataUrl,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          };
          setLocalUser(pub);
        } else {
          writeLocalSession(null);
        }
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const effectiveSession = useMemo(() => {
    if (session) return session;
    if (!localUser) return null;
    const fake = {
      user: {
        id: localUser.id,
        email: localUser.email,
        user_metadata: {
          full_name: localUser.name,
          avatar_url: localUser.avatarDataUrl,
          role: localUser.role,
        },
      },
    } as unknown as Session;
    return fake;
  }, [localUser, session]);

  const effectiveUser = useMemo(() => {
    if (session?.user) return session.user;
    if (!localUser) return null;
    const fake = {
      id: localUser.id,
      email: localUser.email,
      user_metadata: {
        full_name: localUser.name,
        avatar_url: localUser.avatarDataUrl,
        role: localUser.role,
      },
    } as unknown as User;
    return fake;
  }, [localUser, session]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    servicesActions.refreshActor().catch(() => {});
  }, [localUser?.id, session]);

  const signIn = async (email: string, password: string) => {
    const normalized = normalizeEmail(email);
    if (!normalized) return { error: "Ingresá tu correo." };
    if (!password) return { error: "Ingresá tu clave." };
    await ensureLocalSeeded();

    const guard = readLoginGuard();
    const entry = guard.failuresByEmail[normalized] ?? { fails: 0, lockedUntil: 0 };
    if (entry.lockedUntil > Date.now()) {
      return { error: "Demasiados intentos. Probá de nuevo en unos minutos." };
    }

    const supa = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (!supa.error) {
      writeLocalSession(null);
      setLocalUser(null);
      guard.failuresByEmail[normalized] = { fails: 0, lockedUntil: 0 };
      writeLoginGuard(guard);
      return { error: null };
    }

    const users = readLocalUsers();
    const found = users.find((u) => u.email === normalized);
    if (!found) {
      const nextFails = entry.fails + 1;
      guard.failuresByEmail[normalized] = {
        fails: nextFails,
        lockedUntil: nextFails >= 5 ? Date.now() + 5 * 60_000 : 0,
      };
      writeLoginGuard(guard);
      return { error: "Credenciales inválidas." };
    }

    const computed = await hashPassword(password, found.passwordSalt, found.passwordIterations);
    if (!constantTimeEqual(found.passwordHash, computed)) {
      const nextFails = entry.fails + 1;
      guard.failuresByEmail[normalized] = {
        fails: nextFails,
        lockedUntil: nextFails >= 5 ? Date.now() + 5 * 60_000 : 0,
      };
      writeLoginGuard(guard);
      return { error: "Credenciales inválidas." };
    }

    guard.failuresByEmail[normalized] = { fails: 0, lockedUntil: 0 };
    writeLoginGuard(guard);
    writeLocalSession({ userId: found.id, createdAt: Date.now() });
    setLocalUser({
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
      avatarDataUrl: found.avatarDataUrl,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    });
    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      writeLocalSession(null);
      setLocalUser(null);
    }
  };

  const verifyPassword = async (password: string) => {
    const email = effectiveSession?.user?.email;
    const id = (effectiveSession?.user as any)?.id as string | undefined;
    if (!email || !id) return { ok: false, error: "No hay usuario autenticado." };
    if (!password) return { ok: false, error: "Ingresá tu clave." };

    if (!session && localUser) {
      const rec = readLocalUsers().find((u) => u.id === id);
      if (!rec) return { ok: false, error: "Usuario local no encontrado." };
      const computed = await hashPassword(password, rec.passwordSalt, rec.passwordIterations);
      return constantTimeEqual(rec.passwordHash, computed) ? { ok: true, error: null } : { ok: false, error: "Clave incorrecta." };
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY =
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      return { ok: false, error: "Faltan variables de entorno de Supabase." };
    }

    const verifier = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storage: undefined,
      },
    });

    const { error } = await verifier.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: "Clave incorrecta." };
    await verifier.auth.signOut();
    return { ok: true, error: null };
  };

  const listAccounts = () => {
    const users = readLocalUsers();
    return users
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: SUPERADMIN_EMAILS.has(u.email) ? "aguila" : (u.role === "aguila" ? "halcon" : u.role),
        avatarDataUrl: u.avatarDataUrl,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  };

  const isSuperAdmin = SUPERADMIN_EMAILS.has(normalizeEmail(effectiveUser?.email ?? ""));

  const createAccount = async (payload: { email: string; password: string; name: string; role: AdminRole }) => {
    if (!isSuperAdmin) return { error: "No tenés permisos para crear cuentas." };
    const email = normalizeEmail(payload.email);
    const name = payload.name.trim();
    if (!isValidEmail(email)) return { error: "Email inválido." };
    if (!name) return { error: "Nombre requerido." };
    if (SUPERADMIN_EMAILS.has(email)) return { error: "La cuenta padre ya existe." };
    if (payload.role === "aguila") return { error: "Sólo existe una cuenta águila (admin@admin.com)." };
    const pwdErr = passwordPolicyError(payload.password);
    if (pwdErr) return { error: pwdErr };
    const users = readLocalUsers();
    if (users.some((u) => u.email === email)) return { error: "Ya existe una cuenta con ese email." };
    const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
    const iterations = 210_000;
    const hash = await hashPassword(payload.password, salt, iterations);
    const now = Date.now();
    const rec: LocalUserRecord = {
      id: uid(),
      email,
      name,
      role: payload.role,
      avatarDataUrl: defaultAvatarDataUrl(payload.role, name),
      passwordHash: hash,
      passwordSalt: salt,
      passwordIterations: iterations,
      createdAt: now,
      updatedAt: now,
    };
    writeLocalUsers([rec, ...users]);
    return { error: null };
  };

  const updateAccount = async (id: string, patch: Partial<Pick<LocalUserPublic, "name" | "role" | "avatarDataUrl">>) => {
    if (!isSuperAdmin) return { error: "No tenés permisos para editar cuentas." };
    const users = readLocalUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) return { error: "Cuenta no encontrada." };
    const isTargetSuperAdmin = SUPERADMIN_EMAILS.has(users[idx]!.email);
    if (!isTargetSuperAdmin && patch.role === "aguila") return { error: "Sólo existe una cuenta águila (admin@admin.com)." };
    const next: LocalUserRecord = {
      ...users[idx]!,
      name: typeof patch.name === "string" ? patch.name.trim() : users[idx]!.name,
      role: isTargetSuperAdmin ? "aguila" : ((patch.role as AdminRole | undefined) ?? users[idx]!.role),
      avatarDataUrl: typeof patch.avatarDataUrl === "string" ? patch.avatarDataUrl : users[idx]!.avatarDataUrl,
      updatedAt: Date.now(),
    };
    if (!next.name) return { error: "Nombre requerido." };
    const nextUsers = users.slice();
    nextUsers[idx] = next;
    writeLocalUsers(nextUsers);
    if (localUser?.id === id) {
      setLocalUser({
        id: next.id,
        email: next.email,
        name: next.name,
        role: next.role,
        avatarDataUrl: next.avatarDataUrl,
        createdAt: next.createdAt,
        updatedAt: next.updatedAt,
      });
    }
    return { error: null };
  };

  const setAccountPassword = async (id: string, newPassword: string) => {
    if (!isSuperAdmin) return { error: "No tenés permisos para cambiar claves." };
    const pwdErr = passwordPolicyError(newPassword);
    if (pwdErr) return { error: pwdErr };
    const users = readLocalUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) return { error: "Cuenta no encontrada." };
    const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
    const iterations = 210_000;
    const hash = await hashPassword(newPassword, salt, iterations);
    const next: LocalUserRecord = {
      ...users[idx]!,
      passwordHash: hash,
      passwordSalt: salt,
      passwordIterations: iterations,
      updatedAt: Date.now(),
    };
    const nextUsers = users.slice();
    nextUsers[idx] = next;
    writeLocalUsers(nextUsers);
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        session: effectiveSession,
        user: effectiveUser,
        loading,
        signIn,
        signOut,
        verifyPassword,
        listAccounts,
        createAccount,
        updateAccount,
        setAccountPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
