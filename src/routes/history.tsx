import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useAdminRole, useAuditLog, useChangeRequests, servicesActions } from "@/lib/services-store";

export const Route = createFileRoute("/history")({
  component: History,
});

function History() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { role, email } = useAdminRole();
  const requests = useChangeRequests();
  const audit = useAuditLog();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const visibleRequests = useMemo(() => {
    if (role === "aguila") return requests;
    if (role === "halcon") return requests.filter((r) => r.actorRole === "buho" || r.actorEmail === (email ?? ""));
    return requests.filter((r) => r.actorEmail === (email ?? ""));
  }, [email, requests, role]);

  const pending = visibleRequests.filter((r) => r.status === "pendiente");
  const decided = visibleRequests.filter((r) => r.status !== "pendiente");

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse bg-primary" />
      </div>
    );
  }

  return (
    <AppShell title="Historial de cambios" subtitle="Aprobaciones y registro de cambios del panel admin.">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-bold">Solicitudes pendientes</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {pending.length} pendientes · Rol actual: {role}
              </div>
            </div>
            <div className="border border-border bg-muted px-3 py-2 text-[11px] font-semibold text-foreground">
              <Clock className="mr-2 inline h-4 w-4" />
              Pendientes
            </div>
          </div>

          {pending.length === 0 ? (
            <div className="mt-6 border border-border bg-muted p-8 text-center text-sm text-muted-foreground">
              No hay solicitudes pendientes.
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {pending.map((r) => {
                const canDecide = role === "aguila" || (role === "halcon" && r.actorRole === "buho");
                return (
                  <li key={r.id} className="border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {r.kind} · {r.entityType}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                          {r.actorRole} · {r.actorEmail}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleString("es-AR")}
                        </div>
                      </div>
                      {canDecide && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={async () => {
                              setBusyId(r.id);
                              try {
                                await servicesActions.approveChangeRequest(r.id);
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                          >
                            <Check className="h-4 w-4" /> Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={async () => {
                              setBusyId(r.id);
                              try {
                                await servicesActions.rejectChangeRequest(r.id);
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
                          >
                            <X className="h-4 w-4" /> Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Historial</div>
          <div className="mt-1 text-xs text-muted-foreground">Últimos cambios aplicados (audit log).</div>

          {audit.length === 0 ? (
            <div className="mt-6 border border-border bg-muted p-8 text-center text-sm text-muted-foreground">
              Todavía no hay registros.
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {audit.slice(0, 30).map((a) => (
                <li key={a.id} className="border border-border bg-background p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {a.action} · {a.entityType}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {a.actorRole} · {a.actorEmail}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString("es-AR")}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {decided.length > 0 && (
            <div className="mt-6 border-t border-border pt-6">
              <div className="text-sm font-semibold">Solicitudes ya resueltas</div>
              <div className="mt-1 text-xs text-muted-foreground">{decided.length} en total</div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
