import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { ArrowLeft, Play, ListChecks, FileText } from "lucide-react";
import { requireUser } from "~/lib/require-user.server";
import { AppShell, PageHeader } from "~/components/app-shell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { SeverityBadge, VerdictBadge, StatusDot } from "~/components/status";
import { JudgmentApi, type AuditConfig, type Submission } from "~/lib/judgment.client";

export async function loader({ request }: LoaderFunctionArgs) {
  requireUser(request);
  return null;
}

export default function AuditDetailRoute() {
  const { configId } = useParams();
  const [config, setConfig] = useState<AuditConfig | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configId) return;
    JudgmentApi.dashboard(configId)
      .then((d) => {
        setConfig(d.config);
        setSubmissions(d.submissions ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [configId]);

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to="/audits"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to audits
        </Link>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-64" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : config ? (
        <>
          <PageHeader
            title={config.name}
            description={config.rules}
            action={
              <Button asChild>
                <Link to={`/audits/${config.pluginId}/inspect`}>
                  <Play className="h-4 w-4" /> Start inspection
                </Link>
              </Button>
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ListChecks className="h-4 w-4 text-slate-400" />
                Requirements ({config.criteria?.length ?? 0})
              </h2>
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <ul className="divide-y divide-slate-100">
                    {(config.criteria ?? []).map((c, i) => (
                      <li key={c.id} className="flex items-start gap-4 px-5 py-4">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{c.name}</span>
                            <span className="text-xs text-slate-400">{c.category}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{c.passCriteria}</p>
                        </div>
                        <SeverityBadge severity={c.severity} />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-slate-400" />
                Recent assessments
              </h2>
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  {submissions.length > 0 ? (
                    <ul className="space-y-3">
                      {submissions.slice(0, 10).map((sub) => (
                        <li
                          key={sub._id}
                          className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <StatusDot status={sub.status} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-800">
                                {String(
                                  sub.inputData?.employeeName ??
                                    sub.inputData?.unit ??
                                    "Assessment",
                                )}
                              </p>
                              <p className="text-xs text-slate-400">
                                {new Date(sub.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <VerdictBadge verdict={sub.result?.verdict} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-400">No assessments yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
