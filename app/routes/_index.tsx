import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  ListChecks,
  ArrowRight,
  Activity,
  FileWarning,
} from "lucide-react";
import { requireUser } from "~/lib/require-user.server";
import { AppShell, PageHeader } from "~/components/app-shell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { JudgmentApi, type Overview } from "~/lib/judgment.client";

export async function loader({ request }: LoaderFunctionArgs) {
  requireUser(request);
  return null;
}

const EVENT_LABELS: Record<string, string> = {
  config_created: "Audit program created",
  submitted: "Evidence submitted",
  judgment_generated: "Assessment scored",
  task_created: "Corrective action opened",
  task_completed: "Corrective action completed",
  issue_resolved: "Finding resolved",
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "danger" | "warn";
}) {
  const toneClass =
    tone === "danger"
      ? "text-red-600"
      : tone === "warn"
        ? "text-amber-600"
        : "text-slate-900";
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">{label}</span>
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <div className={`mt-3 text-3xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardRoute() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    JudgmentApi.overview()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  return (
    <AppShell>
      <PageHeader
        title="Compliance Dashboard"
        description="A live view of audit posture, open findings, and corrective actions across your organization."
        action={
          <Button asChild>
            <Link to="/audits/new">
              <ClipboardCheck className="h-4 w-4" />
              New audit program
            </Link>
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ShieldCheck}
              label="Compliance rate"
              value={s?.complianceRate != null ? `${s.complianceRate}%` : "—"}
              hint={`${s?.passed ?? 0} of ${s?.assessments ?? 0} assessments passed`}
            />
            <StatCard
              icon={ClipboardCheck}
              label="Audit programs"
              value={s?.audits ?? 0}
              hint="Active checklists"
            />
            <StatCard
              icon={AlertTriangle}
              label="Open findings"
              value={s?.openIssues ?? 0}
              hint="Awaiting resolution"
              tone={s && s.openIssues > 0 ? "warn" : "default"}
            />
            <StatCard
              icon={ListChecks}
              label="Overdue actions"
              value={s?.overdueActions ?? 0}
              hint={`${s?.openActions ?? 0} open in total`}
              tone={s && s.overdueActions > 0 ? "danger" : "default"}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Audit programs table */}
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Audit programs</h2>
                <Link
                  to="/audits"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <Card className="overflow-hidden shadow-sm">
                {data && data.byConfig.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Program</th>
                          <th className="px-4 py-3 text-center">Requirements</th>
                          <th className="px-4 py-3 text-center">Pass rate</th>
                          <th className="px-4 py-3 text-center">Open findings</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.byConfig.map((c) => (
                          <tr key={c.pluginId} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {c.requirements}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {c.passRate != null ? (
                                <span
                                  className={
                                    c.passRate >= 80
                                      ? "font-medium text-emerald-600"
                                      : c.passRate >= 50
                                        ? "font-medium text-amber-600"
                                        : "font-medium text-red-600"
                                  }
                                >
                                  {c.passRate}%
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {c.openIssues > 0 ? (
                                <Badge variant="warn">{c.openIssues}</Badge>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to={`/audits/${c.pluginId}`}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Open
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyPrograms />
                )}
              </Card>
            </div>

            {/* Recent activity */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent activity</h2>
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  {data && data.recentEvents.length > 0 ? (
                    <ul className="space-y-4">
                      {data.recentEvents.slice(0, 8).map((e) => (
                        <li key={e._id} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                            <Activity className="h-3.5 w-3.5 text-slate-500" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm text-slate-700">
                              {EVENT_LABELS[e.eventType] ?? e.eventType}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {e.configId} ·{" "}
                              {new Date(e.timestamp).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileWarning className="h-6 w-6 text-slate-300" />
                      <p className="mt-2 text-sm text-slate-400">No activity yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function EmptyPrograms() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <ClipboardCheck className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">No audit programs yet</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Upload an SOP or compliance document and let AI extract the requirements into a ready-to-run
        audit checklist.
      </p>
      <Button asChild className="mt-4">
        <Link to="/audits/new">Create your first audit</Link>
      </Button>
    </div>
  );
}
