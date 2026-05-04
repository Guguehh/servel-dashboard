import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Shield, Upload, KeyRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useAdminRole } from "@/lib/services-store";

export const Route = createFileRoute("/accounts")({
  component: AccountsPage,
});

type AdminRole = "aguila" | "halcon" | "buho";

function AccountsPage() {
  const { session, loading, listAccounts, createAccount, updateAccount, setAccountPassword, verifyPassword } = useAuth();
  const { role } = useAdminRole();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const accounts = useMemo(() => listAccounts(), [listAccounts, version]);

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pwdId, setPwdId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!loading && session && role !== "aguila") navigate({ to: "/dashboard" });
  }, [loading, role, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse bg-primary" />
      </div>
    );
  }

  const editing = editingId ? accounts.find((a) => a.id === editingId) ?? null : null;
  const pwdEditing = pwdId ? accounts.find((a) => a.id === pwdId) ?? null : null;

  return (
    <AppShell
      title="Usuarios"
      subtitle="Gestión local de cuentas (para demo). En producción se recomienda Supabase Auth + perfiles."
      actions={
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Crear cuenta
        </button>
      }
    >
      {creating && (
        <CreateAccountDialog
          onClose={() => setCreating(false)}
          onCreate={async (payload) => {
            const res = await createAccount(payload);
            if (!res.error) {
              setCreating(false);
              setVersion((v) => v + 1);
            }
            return res;
          }}
        />
      )}

      {editing && (
        <EditAccountDialog
          account={editing}
          onClose={() => setEditingId(null)}
          onSave={async (patch) => {
            const res = await updateAccount(editing.id, patch);
            if (!res.error) {
              setEditingId(null);
              setVersion((v) => v + 1);
            }
            return res;
          }}
        />
      )}

      {pwdEditing && (
        <ChangePasswordDialog
          accountEmail={pwdEditing.email}
          onClose={() => setPwdId(null)}
          verifyPassword={verifyPassword}
          onSave={async (newPwd) => {
            const res = await setAccountPassword(pwdEditing.id, newPwd);
            if (!res.error) {
              setPwdId(null);
              setVersion((v) => v + 1);
            }
            return res;
          }}
        />
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold">Cuentas locales</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Estas cuentas viven en el navegador (localStorage). Útil para pruebas de roles y aprobaciones.
            </div>
          </div>
          <div className="flex items-center gap-2 border border-border bg-muted px-3 py-2 text-[11px] font-semibold text-foreground">
            <Shield className="h-4 w-4" /> Sólo águila
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => (
            <div key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-3 border-b border-border p-4">
                <img src={a.avatarDataUrl} className="h-10 w-10 rounded-xl border border-border object-cover" alt="" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{a.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{a.email}</div>
                </div>
                <div className="ml-auto border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-foreground">
                  {a.role}
                </div>
              </div>
              <div className="p-4">
                <div className="text-[11px] text-muted-foreground">
                  Actualizado: {new Date(a.updatedAt).toLocaleString("es-AR")}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(a.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPwdId(a.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <KeyRound className="h-4 w-4" /> Cambiar clave
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function CreateAccountDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (payload: { email: string; password: string; name: string; role: AdminRole }) => Promise<{ error: string | null }>;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("buho");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const res = await onCreate({ email, password, name, role });
            if (res.error) setError(res.error);
          } finally {
            setBusy(false);
          }
        }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold">Crear cuenta</div>
            <div className="mt-1 text-xs text-muted-foreground">Email + clave + nombre + rol.</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nombre</div>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" />
          </div>
          <div className="md:col-span-2">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" />
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rol</div>
            <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="input-base">
              <option value="aguila">aguila</option>
              <option value="halcon">halcon</option>
              <option value="buho">buho</option>
            </select>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Clave</div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" />
          </div>
        </div>

        {error && <div className="mt-4 text-xs font-semibold text-destructive">{error}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
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
  );
}

function EditAccountDialog({
  account,
  onClose,
  onSave,
}: {
  account: { id: string; email: string; name: string; role: AdminRole; avatarDataUrl: string };
  onClose: () => void;
  onSave: (patch: Partial<{ name: string; role: AdminRole; avatarDataUrl: string }>) => Promise<{ error: string | null }>;
}) {
  const [name, setName] = useState(account.name);
  const [role, setRole] = useState<AdminRole>(account.role);
  const [avatar, setAvatar] = useState(account.avatarDataUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const res = await onSave({ name, role, avatarDataUrl: avatar });
            if (res.error) setError(res.error);
          } finally {
            setBusy(false);
          }
        }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold">Editar cuenta</div>
            <div className="mt-1 text-xs text-muted-foreground">{account.email}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[120px_1fr]">
          <div className="space-y-2">
            <img src={avatar} className="h-24 w-24 rounded-2xl border border-border object-cover" alt="" />
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted">
              <Upload className="h-4 w-4" /> Foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1_500_000) {
                    setError("La imagen es demasiado grande (máx 1.5MB).");
                    return;
                  }
                  const fr = new FileReader();
                  fr.onload = () => {
                    if (typeof fr.result === "string") setAvatar(fr.result);
                  };
                  fr.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <div className="grid gap-3">
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nombre</div>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" />
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rol</div>
              <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="input-base">
                <option value="aguila">aguila</option>
                <option value="halcon">halcon</option>
                <option value="buho">buho</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="mt-4 text-xs font-semibold text-destructive">{error}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

function ChangePasswordDialog({
  accountEmail,
  verifyPassword,
  onClose,
  onSave,
}: {
  accountEmail: string;
  verifyPassword: (password: string) => Promise<{ ok: boolean; error: string | null }>;
  onClose: () => void;
  onSave: (newPassword: string) => Promise<{ error: string | null }>;
}) {
  const [adminPassword, setAdminPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const ok = await verifyPassword(adminPassword);
            if (!ok.ok) {
              setError(ok.error ?? "Clave incorrecta.");
              return;
            }
            const res = await onSave(newPassword);
            if (res.error) setError(res.error);
          } finally {
            setBusy(false);
          }
        }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold">Cambiar clave</div>
            <div className="mt-1 text-xs text-muted-foreground">{accountEmail}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tu clave (para confirmar)
            </div>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="input-base"
              placeholder="Ingresá tu clave"
            />
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nueva clave
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-base"
              placeholder="Mín. 8 + letra + número + símbolo"
            />
          </div>
        </div>

        {error && <div className="mt-4 text-xs font-semibold text-destructive">{error}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy || !adminPassword || !newPassword}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            Cambiar
          </button>
        </div>
      </form>
    </div>
  );
}
