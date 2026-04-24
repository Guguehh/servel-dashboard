import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Eye,
  Pencil,
  GripVertical,
  Hash,
  ListChecks,
  ToggleRight,
  CheckSquare,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import {
  useService,
  servicesActions,
  UNIT_LABELS,
  QUESTION_TYPE_LABELS,
  type Unit,
  type QuestionType,
  type Question,
} from "@/lib/services-store";

const searchSchema = z.object({
  preview: z.boolean().optional(),
});

export const Route = createFileRoute("/services/$id")({
  validateSearch: (s) => searchSchema.parse(s),
  component: ServiceDetail,
});

const TYPE_ICONS: Record<QuestionType, React.ComponentType<{ className?: string }>> = {
  number: Hash,
  select: ListChecks,
  multiselect: CheckSquare,
  boolean: ToggleRight,
};

function ServiceDetail() {
  const { id } = Route.useParams();
  const { preview } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { service, hydrated } = useService(id);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  if (loading || !session || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full gradient-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <AppShell title="Service not found">
        <div className="glass-card rounded-3xl p-10 text-center">
          <p className="text-sm text-muted-foreground">This service doesn't exist anymore.</p>
          <Link
            to="/services"
            className="mt-5 inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to services
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={service.name}
      subtitle={
        <span className="flex items-center gap-2">
          <Link to="/services" className="hover:text-foreground">
            Services
          </Link>
          <span>/</span>
          <span>{preview ? "Preview" : "Configure"}</span>
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/services/$id"
            params={{ id }}
            search={{ preview: !preview }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              preview
                ? "border border-border bg-white/70 text-foreground/80 hover:bg-white"
                : "gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02]"
            }`}
          >
            {preview ? (
              <>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Preview
              </>
            )}
          </Link>
        </div>
      }
    >
      {preview ? <PreviewMode service={service} /> : <ConfigureMode service={service} />}
    </AppShell>
  );
}

/* -------------------------------- Configure ------------------------------- */

function ConfigureMode({ service }: { service: NonNullable<ReturnType<typeof useService>["service"]> }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <QuestionsList service={service} />
      </div>
      <aside className="space-y-6">
        <ServicePanel service={service} />
        <PricingPanel service={service} />
      </aside>
    </div>
  );
}

function ServicePanel({ service }: { service: NonNullable<ReturnType<typeof useService>["service"]> }) {
  return (
    <div className="glass-card rounded-3xl p-5">
      <h3 className="font-display text-sm font-semibold">Service details</h3>
      <div className="mt-4 space-y-4">
        <Field label="Task name">
          <input
            value={service.name}
            onChange={(e) => servicesActions.update(service.id, { name: e.target.value })}
            className="input-base"
          />
        </Field>
        <Field label="Unit of measurement">
          <select
            value={service.unit}
            onChange={(e) =>
              servicesActions.update(service.id, { unit: e.target.value as Unit })
            }
            className="input-base"
          >
            {Object.entries(UNIT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Base price">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $
            </span>
            <input
              type="number"
              value={service.basePrice ?? ""}
              onChange={(e) =>
                servicesActions.update(service.id, {
                  basePrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="0"
              className="input-base pl-7"
            />
          </div>
        </Field>
      </div>
    </div>
  );
}

function PricingPanel({ service }: { service: NonNullable<ReturnType<typeof useService>["service"]> }) {
  return (
    <div className="glass-card rounded-3xl p-5">
      <h3 className="font-display text-sm font-semibold">Pricing rules</h3>
      <div className="mt-4 space-y-4">
        <Field label="Minimum price">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $
            </span>
            <input
              type="number"
              value={service.minPrice ?? ""}
              onChange={(e) =>
                servicesActions.update(service.id, {
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="0"
              className="input-base pl-7"
            />
          </div>
        </Field>
        <Toggle
          label="Urgency surcharge"
          description="Add a fee for urgent jobs"
          checked={service.urgencySurcharge}
          onChange={(v) => servicesActions.update(service.id, { urgencySurcharge: v })}
        />
        <Toggle
          label="Quantity variation"
          description="Adjust price based on quantity"
          checked={service.quantityVariation}
          onChange={(v) => servicesActions.update(service.id, { quantityVariation: v })}
        />
      </div>
    </div>
  );
}

/* -------------------------------- Questions ------------------------------- */

function QuestionsList({
  service,
}: {
  service: NonNullable<ReturnType<typeof useService>["service"]>;
}) {
  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Questions</h3>
          <p className="text-xs text-muted-foreground">
            Drag to reorder. These are the questions specialists will see.
          </p>
        </div>
        <AddQuestionMenu serviceId={service.id} />
      </div>

      {service.questions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-white/50 p-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-2 text-sm font-medium">Add your first question</p>
          <p className="text-xs text-muted-foreground">
            Pick a question type from the menu above to get started.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {service.questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              service={service}
              question={q}
              isFirst={idx === 0}
              isLast={idx === service.questions.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AddQuestionMenu({ serviceId }: { serviceId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
      >
        <Plus className="h-3.5 w-3.5" /> Add question
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-white p-1.5 shadow-elegant">
            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => {
              const Icon = TYPE_ICONS[t];
              return (
                <button
                  key={t}
                  onClick={() => {
                    servicesActions.addQuestion(serviceId, t);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground/80 transition hover:bg-accent"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {QUESTION_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function QuestionCard({
  service,
  question,
  isFirst,
  isLast,
}: {
  service: NonNullable<ReturnType<typeof useService>["service"]>;
  question: Question;
  isFirst: boolean;
  isLast: boolean;
}) {
  const Icon = TYPE_ICONS[question.type];
  const previousQuestions = service.questions.filter(
    (q) => q.id !== question.id && (q.type === "select" || q.type === "boolean"),
  );

  return (
    <li className="rounded-2xl border border-border bg-white/70 p-4 transition hover:border-primary/30 hover:shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            disabled={isFirst}
            onClick={() => servicesActions.moveQuestion(service.id, question.id, -1)}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <GripVertical className="h-3 w-3 text-muted-foreground/60" />
          <button
            disabled={isLast}
            onClick={() => servicesActions.moveQuestion(service.id, question.id, 1)}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-[oklch(0.96_0.04_60)] px-2.5 py-1 text-[10px] font-semibold text-primary-deep">
              <Icon className="h-3 w-3" />
              {QUESTION_TYPE_LABELS[question.type]}
            </span>
            {question.required && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                Required
              </span>
            )}
            {question.visibleIf && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                Conditional
              </span>
            )}
            <button
              onClick={() => servicesActions.removeQuestion(service.id, question.id)}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_140px]">
            <input
              value={question.label}
              onChange={(e) =>
                servicesActions.updateQuestion(service.id, question.id, { label: e.target.value })
              }
              placeholder="Question text"
              className="input-base font-medium"
            />
            {question.type === "number" && (
              <input
                value={question.unit ?? ""}
                onChange={(e) =>
                  servicesActions.updateQuestion(service.id, question.id, { unit: e.target.value })
                }
                placeholder="Unit (cm, m...)"
                className="input-base"
              />
            )}
          </div>

          {(question.type === "select" || question.type === "multiselect") && (
            <div className="space-y-2 rounded-xl bg-[oklch(0.97_0.012_70)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Options
              </p>
              {question.options?.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input
                    value={o.label}
                    onChange={(e) =>
                      servicesActions.updateOption(service.id, question.id, o.id, e.target.value)
                    }
                    className="input-base flex-1 py-1.5 text-xs"
                  />
                  <button
                    onClick={() => servicesActions.removeOption(service.id, question.id, o.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => servicesActions.addOption(service.id, question.id)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add option
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <Toggle
              compact
              label="Required"
              checked={question.required}
              onChange={(v) =>
                servicesActions.updateQuestion(service.id, question.id, { required: v })
              }
            />
            {previousQuestions.length > 0 && (
              <ConditionalEditor
                serviceId={service.id}
                question={question}
                candidates={previousQuestions}
              />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function ConditionalEditor({
  serviceId,
  question,
  candidates,
}: {
  serviceId: string;
  question: Question;
  candidates: Question[];
}) {
  const dependsOn = question.visibleIf?.dependsOn ?? "";
  const equals = question.visibleIf?.equals ?? "";
  const target = candidates.find((c) => c.id === dependsOn);

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <span>Show only if</span>
      <select
        value={dependsOn}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) {
            servicesActions.updateQuestion(serviceId, question.id, { visibleIf: null });
          } else {
            servicesActions.updateQuestion(serviceId, question.id, {
              visibleIf: { dependsOn: v, equals: "" },
            });
          }
        }}
        className="rounded-lg border border-border bg-white px-2 py-1 text-xs"
      >
        <option value="">— always show —</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      {target && (
        <>
          <span>equals</span>
          {target.type === "boolean" ? (
            <select
              value={equals}
              onChange={(e) =>
                servicesActions.updateQuestion(serviceId, question.id, {
                  visibleIf: { dependsOn, equals: e.target.value },
                })
              }
              className="rounded-lg border border-border bg-white px-2 py-1 text-xs"
            >
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          ) : (
            <select
              value={equals}
              onChange={(e) =>
                servicesActions.updateQuestion(serviceId, question.id, {
                  visibleIf: { dependsOn, equals: e.target.value },
                })
              }
              className="rounded-lg border border-border bg-white px-2 py-1 text-xs"
            >
              <option value="">—</option>
              {target.options?.map((o) => (
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

/* --------------------------------- Preview -------------------------------- */

function PreviewMode({
  service,
}: {
  service: NonNullable<ReturnType<typeof useService>["service"]>;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[] | number | boolean>>({});

  const setAnswer = (id: string, v: string | string[] | number | boolean) =>
    setAnswers((a) => ({ ...a, [id]: v }));

  const visibleQuestions = useMemo(() => {
    return service.questions.filter((q) => {
      if (!q.visibleIf || !q.visibleIf.dependsOn) return true;
      const depAnswer = answers[q.visibleIf.dependsOn];
      const target = service.questions.find((x) => x.id === q.visibleIf!.dependsOn);
      if (!target) return true;
      if (target.type === "boolean") {
        return q.visibleIf.equals === (depAnswer === true ? "yes" : depAnswer === false ? "no" : "");
      }
      return depAnswer === q.visibleIf.equals;
    });
  }, [service.questions, answers]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
        <Eye className="h-3 w-3" /> Specialist preview
      </div>
      <div className="glass-card rounded-3xl p-8">
        <h2 className="font-display text-2xl font-bold">{service.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Charged per {UNIT_LABELS[service.unit].toLowerCase()}
          {service.basePrice ? ` · base price $${service.basePrice}` : ""}
        </p>

        <div className="mt-8 space-y-6">
          {visibleQuestions.length === 0 && (
            <p className="rounded-2xl bg-[oklch(0.97_0.012_70)] p-6 text-center text-sm text-muted-foreground">
              No questions to show yet. Add some in the editor.
            </p>
          )}
          {visibleQuestions.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-semibold">
                {q.label}
                {q.required && <span className="ml-1 text-destructive">*</span>}
                {q.unit && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">({q.unit})</span>
                )}
              </label>
              <div className="mt-2">{renderInput(q, answers, setAnswer)}</div>
            </div>
          ))}
        </div>

        {visibleQuestions.length > 0 && (
          <button className="mt-8 w-full rounded-2xl gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.01]">
            Get my quote
          </button>
        )}
      </div>
    </div>
  );
}

function renderInput(
  q: Question,
  answers: Record<string, string | string[] | number | boolean>,
  setAnswer: (id: string, v: string | string[] | number | boolean) => void,
) {
  if (q.type === "number") {
    return (
      <input
        type="number"
        value={(answers[q.id] as number) ?? ""}
        onChange={(e) => setAnswer(q.id, e.target.value ? Number(e.target.value) : "")}
        className="input-base"
        placeholder="0"
      />
    );
  }
  if (q.type === "select") {
    return (
      <select
        value={(answers[q.id] as string) ?? ""}
        onChange={(e) => setAnswer(q.id, e.target.value)}
        className="input-base"
      >
        <option value="">Select an option</option>
        {q.options?.map((o) => (
          <option key={o.id} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (q.type === "multiselect") {
    const current = (answers[q.id] as string[] | undefined) ?? [];
    return (
      <div className="flex flex-wrap gap-2">
        {q.options?.map((o) => {
          const selected = current.includes(o.label);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() =>
                setAnswer(
                  q.id,
                  selected ? current.filter((x) => x !== o.label) : [...current, o.label],
                )
              }
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                selected
                  ? "gradient-primary border-transparent text-primary-foreground shadow-glow"
                  : "border-border bg-white/70 text-foreground/80 hover:bg-white"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }
  // boolean
  const v = answers[q.id] as boolean | undefined;
  return (
    <div className="flex gap-2">
      {[
        { label: "Yes", value: true },
        { label: "No", value: false },
      ].map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => setAnswer(q.id, opt.value)}
          className={`flex-1 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
            v === opt.value
              ? "gradient-primary border-transparent text-primary-foreground shadow-glow"
              : "border-border bg-white/70 hover:bg-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- Helpers -------------------------------- */

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

function Toggle({
  label,
  description,
  checked,
  onChange,
  compact,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center ${compact ? "gap-2" : "justify-between gap-3"}`}>
      {!compact && (
        <div>
          <div className="text-xs font-semibold">{label}</div>
          {description && <div className="text-[11px] text-muted-foreground">{description}</div>}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? "gradient-primary shadow-glow" : "bg-[oklch(0.9_0.012_70)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      {compact && <span className="text-xs font-semibold">{label}</span>}
    </div>
  );
}
