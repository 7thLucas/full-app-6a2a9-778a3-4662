// Browser-safe client helpers for the Judgment engine REST API.
// All endpoints are mounted under /api by the module route auto-discovery.

export type Verdict = "pass" | "partial" | "fail" | "risk" | "ready" | "not_ready";
export type Severity = "low" | "medium" | "high" | "critical";

export interface SchemaProperty {
  type?: string | string[];
  title?: string;
  description?: string;
  enum?: string[];
  items?: { type?: string };
  default?: unknown;
  "x-ui"?: { widget?: string };
  [key: string]: unknown;
}

export interface Criterion {
  id: string;
  category: string;
  name: string;
  passCriteria: string;
  severity: Severity;
  weight: number;
  autoFailIfMissing: boolean;
}

export interface AuditConfig {
  _id?: string;
  pluginId: string;
  name: string;
  rules: string;
  inputSchema: {
    type: string;
    properties: Record<string, SchemaProperty>;
    required: string[];
  };
  outputSchema?: Record<string, unknown>;
  criteria: Criterion[];
  variables?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface JudgmentResult {
  verdict: Verdict;
  score: number;
  confidence: number;
  severity: Severity;
  reason: string;
  fixSuggestion: string;
  requiresHumanReview: boolean;
  resultData?: Record<string, unknown>;
}

export interface Submission {
  _id: string;
  configId: string;
  inputData: Record<string, unknown>;
  files: Array<{ filename: string; fileUrl: string }>;
  result: JudgmentResult | null;
  status: "PENDING" | "DONE" | "ERROR";
  error?: string | null;
  createdAt: string;
}

export interface Issue {
  _id: string;
  configId: string;
  submissionId: string;
  severity: string;
  status: "open" | "resolved";
  title: string;
  description: string;
  createdAt: string;
}

export interface ActionTask {
  _id: string;
  configId: string;
  issueId: string;
  title: string;
  assigneeRole: string;
  dueDate: string;
  status: "open" | "completed";
  description: string;
  createdAt: string;
}

export interface Overview {
  stats: {
    audits: number;
    assessments: number;
    passed: number;
    failed: number;
    complianceRate: number | null;
    openIssues: number;
    openActions: number;
    overdueActions: number;
  };
  byConfig: Array<{
    pluginId: string;
    name: string;
    requirements: number;
    assessments: number;
    passRate: number | null;
    openIssues: number;
    updatedAt: string | null;
  }>;
  recentEvents: Array<{
    _id: string;
    configId: string;
    eventType: string;
    payload: Record<string, unknown>;
    timestamp: string;
  }>;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

async function postJSON<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `Request failed (${res.status})`);
  return data as T;
}

export const JudgmentApi = {
  overview: () => getJSON<Overview>("/api/judgment/overview"),
  listConfigs: () => getJSON<AuditConfig[]>("/api/judgment/configs"),
  getConfig: (id: string) => getJSON<AuditConfig>(`/api/judgment/configs/${id}`),
  dashboard: (id: string) =>
    getJSON<{ config: AuditConfig; labels: Record<string, string>; submissions: Submission[] }>(
      `/api/judgment/configs/${id}/dashboard`,
    ),
  listIssues: () => getJSON<Issue[]>("/api/judgment/issues"),
  listTasks: () => getJSON<ActionTask[]>("/api/judgment/tasks"),
  listSubmissions: () => getJSON<Submission[]>("/api/judgment/submissions"),

  createConfigDirect: (config: Partial<AuditConfig>) =>
    postJSON<AuditConfig>("/api/judgment/configs/direct", config),

  parseFromFile: async (file: File): Promise<AuditConfig[]> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/judgment/configs/parse", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as any)?.error || `Parse failed (${res.status})`);
    return data as AuditConfig[];
  },

  submit: async (
    configId: string,
    inputData: Record<string, unknown>,
    files: File[],
  ): Promise<Submission> => {
    const form = new FormData();
    form.append("inputData", JSON.stringify(inputData));
    for (const f of files) form.append("files", f, f.name);
    const res = await fetch(`/api/judgment/configs/${configId}/submit`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as any)?.error || `Submit failed (${res.status})`);
    return data as Submission;
  },

  resolveIssue: (issueId: string) =>
    postJSON<{ success: boolean; issue: Issue }>(`/api/judgment/issues/${issueId}/resolve`),
  completeTask: (taskId: string) =>
    postJSON<{ success: boolean; task: ActionTask }>(`/api/judgment/tasks/${taskId}/complete`),
};

export function verdictLabel(v?: Verdict): string {
  switch (v) {
    case "pass":
    case "ready":
      return "Pass";
    case "partial":
    case "risk":
      return "Needs improvement";
    case "fail":
    case "not_ready":
      return "Fail";
    default:
      return "Pending";
  }
}

export function verdictTone(v?: Verdict): "pass" | "warn" | "fail" | "neutral" {
  switch (v) {
    case "pass":
    case "ready":
      return "pass";
    case "partial":
    case "risk":
      return "warn";
    case "fail":
    case "not_ready":
      return "fail";
    default:
      return "neutral";
  }
}
