import { useEffect, useState, useSyncExternalStore } from "react";

export type QuestionType = "number" | "select" | "multiselect" | "boolean";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface ConditionalRule {
  /** Question id this rule depends on */
  dependsOn: string;
  /** For select/multiselect: option label that must match. For boolean: "yes"/"no". For number: comparator. */
  equals?: string;
}

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  unit?: string;
  required: boolean;
  options?: QuestionOption[];
  /** When set, this question only appears if the rule matches */
  visibleIf?: ConditionalRule | null;
}

export type Unit = "unit" | "m2" | "ml" | "hour" | "fixed";

export interface Service {
  id: string;
  name: string;
  unit: Unit;
  basePrice?: number;
  minPrice?: number;
  urgencySurcharge: boolean;
  quantityVariation: boolean;
  questions: Question[];
  createdAt: number;
  /** Demo metrics so dashboard/analytics show meaningful numbers */
  stats: {
    quotes: number;
    completed: number;
  };
}

const STORAGE_KEY = "servel.services.v1";

const DEFAULTS: Service[] = [
  {
    id: "svc-gate",
    name: "Automatic gate installation",
    unit: "unit",
    basePrice: 480,
    minPrice: 350,
    urgencySurcharge: true,
    quantityVariation: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    stats: { quotes: 184, completed: 96 },
    questions: [
      {
        id: "q-type",
        label: "Gate type",
        type: "select",
        required: true,
        options: [
          { id: "o-sliding", label: "Sliding" },
          { id: "o-swing", label: "Swing" },
        ],
      },
      {
        id: "q-width",
        label: "Gate width",
        type: "number",
        unit: "m",
        required: true,
        visibleIf: { dependsOn: "q-type", equals: "Sliding" },
      },
      {
        id: "q-rail",
        label: "Include rail kit?",
        type: "boolean",
        required: false,
        visibleIf: { dependsOn: "q-type", equals: "Sliding" },
      },
      {
        id: "q-extras",
        label: "Add-ons",
        type: "multiselect",
        required: false,
        options: [
          { id: "o-remote", label: "Remote control" },
          { id: "o-keypad", label: "Keypad" },
          { id: "o-camera", label: "Camera" },
        ],
      },
    ],
  },
  {
    id: "svc-paint",
    name: "Interior wall painting",
    unit: "m2",
    basePrice: 14,
    minPrice: 120,
    urgencySurcharge: false,
    quantityVariation: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    stats: { quotes: 312, completed: 201 },
    questions: [
      { id: "q-area", label: "Total area", type: "number", unit: "m²", required: true },
      {
        id: "q-coats",
        label: "Number of coats",
        type: "select",
        required: true,
        options: [
          { id: "o-1", label: "1" },
          { id: "o-2", label: "2" },
          { id: "o-3", label: "3" },
        ],
      },
      {
        id: "q-prep",
        label: "Surface preparation needed?",
        type: "boolean",
        required: false,
      },
    ],
  },
];

function read(): Service[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return JSON.parse(raw) as Service[];
  } catch {
    return DEFAULTS;
  }
}

let cache: Service[] | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Service[] {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): Service[] {
  return DEFAULTS;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function commit(next: Service[]) {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

export function useServices() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
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
  create(name: string, unit: Unit, basePrice?: number): Service {
    const svc: Service = {
      id: `svc-${uid()}`,
      name,
      unit,
      basePrice,
      urgencySurcharge: false,
      quantityVariation: false,
      questions: [],
      createdAt: Date.now(),
      stats: { quotes: 0, completed: 0 },
    };
    commit([svc, ...getSnapshot()]);
    return svc;
  },
  update(id: string, patch: Partial<Service>) {
    commit(getSnapshot().map((s) => (s.id === id ? { ...s, ...patch } : s)));
  },
  remove(id: string) {
    commit(getSnapshot().filter((s) => s.id !== id));
  },
  addQuestion(serviceId: string, type: QuestionType) {
    const base: Question = {
      id: `q-${uid()}`,
      label: "Untitled question",
      type,
      required: false,
      options:
        type === "select" || type === "multiselect"
          ? [
              { id: uid(), label: "Option 1" },
              { id: uid(), label: "Option 2" },
            ]
          : undefined,
    };
    commit(
      getSnapshot().map((s) =>
        s.id === serviceId ? { ...s, questions: [...s.questions, base] } : s,
      ),
    );
  },
  updateQuestion(serviceId: string, questionId: string, patch: Partial<Question>) {
    commit(
      getSnapshot().map((s) =>
        s.id === serviceId
          ? {
              ...s,
              questions: s.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
            }
          : s,
      ),
    );
  },
  removeQuestion(serviceId: string, questionId: string) {
    commit(
      getSnapshot().map((s) =>
        s.id === serviceId ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) } : s,
      ),
    );
  },
  moveQuestion(serviceId: string, questionId: string, dir: -1 | 1) {
    commit(
      getSnapshot().map((s) => {
        if (s.id !== serviceId) return s;
        const idx = s.questions.findIndex((q) => q.id === questionId);
        if (idx === -1) return s;
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= s.questions.length) return s;
        const next = [...s.questions];
        const [item] = next.splice(idx, 1);
        next.splice(newIdx, 0, item);
        return { ...s, questions: next };
      }),
    );
  },
  addOption(serviceId: string, questionId: string) {
    commit(
      getSnapshot().map((s) =>
        s.id === serviceId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      options: [
                        ...(q.options ?? []),
                        { id: uid(), label: `Option ${(q.options?.length ?? 0) + 1}` },
                      ],
                    }
                  : q,
              ),
            }
          : s,
      ),
    );
  },
  updateOption(serviceId: string, questionId: string, optionId: string, label: string) {
    commit(
      getSnapshot().map((s) =>
        s.id === serviceId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options?.map((o) => (o.id === optionId ? { ...o, label } : o)),
                    }
                  : q,
              ),
            }
          : s,
      ),
    );
  },
  removeOption(serviceId: string, questionId: string, optionId: string) {
    commit(
      getSnapshot().map((s) =>
        s.id === serviceId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId
                  ? { ...q, options: q.options?.filter((o) => o.id !== optionId) }
                  : q,
              ),
            }
          : s,
      ),
    );
  },
};

export const UNIT_LABELS: Record<Unit, string> = {
  unit: "Unit",
  m2: "m²",
  ml: "Linear meter",
  hour: "Hour",
  fixed: "Fixed price",
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  number: "Number input",
  select: "Dropdown",
  multiselect: "Multi-select",
  boolean: "Yes / No",
};
