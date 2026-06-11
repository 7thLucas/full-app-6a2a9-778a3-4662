import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { requireUser } from "~/lib/require-user.server";
import { AppShell, PageHeader } from "~/components/app-shell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { SeverityBadge, StatusDot } from "~/components/status";
import { JudgmentApi, type Issue } from "~/lib/judgment.client";

export async function loader({ request }: LoaderFunctionArgs) {
  requireUser(request);
  return null;
}

export default function FindingsRoute() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const [resolving, setResolving] = useState<string | null>(null);

  function load() {
    JudgmentApi.listIssues()
      .then((i) => setIssues(Array.isArray(i) ? i : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function resolve(id: string) {
    setResolving(id);
    try {
      await JudgmentApi.resolveIssue(id);
      setIssues((prev) =>
        prev.map((i) => (i._id === id ? { ...i, status: "resolved" } : i)),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResolving(null);
    }
  }

  const filtered = issues.filter((i) => (filter === "all" ? true : i.status === filter));
  const openCount = issues.filter((i) => i.status === "open").length;

  return (
    <AppShell>
      <PageHeader
        title="Findings"
        description="Every failed or partial assessment surfaces here. Resolve findings to close the loop and prevent repeat issues."
      />

      <div className="mb-5 flex items-center gap-2">
        {(["open", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f}
            {f === "open" && openCount > 0 && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">{openCount}</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {filter === "open" ? "No open findings" : "Nothing here"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filter === "open"
                ? "All findings are resolved. Your compliance posture is clean."
                : "No findings match this filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <Card key={issue._id} className="shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{issue.title}</h3>
                      <SeverityBadge severity={issue.severity} />
                      <span className="flex items-center gap-1 text-xs capitalize text-slate-400">
                        <StatusDot status={issue.status} />
                        {issue.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{issue.description}</p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {issue.configId} ·{" "}
                      {new Date(issue.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {issue.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => resolve(issue._id)}
                    disabled={resolving === issue._id}
                  >
                    {resolving === issue._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Resolve
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
