import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { ListChecks, CheckCircle2, Loader2, Clock, UserCircle2 } from "lucide-react";
import { requireUser } from "~/lib/require-user.server";
import { AppShell, PageHeader } from "~/components/app-shell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { StatusDot } from "~/components/status";
import { JudgmentApi, type ActionTask } from "~/lib/judgment.client";

export async function loader({ request }: LoaderFunctionArgs) {
  requireUser(request);
  return null;
}

function dueState(dueDate: string, status: string) {
  if (status === "completed") return { label: "Completed", tone: "pass" as const };
  const diff = new Date(dueDate).getTime() - Date.now();
  if (diff < 0) return { label: "Overdue", tone: "fail" as const };
  const days = Math.ceil(diff / 86400000);
  return { label: days <= 1 ? "Due today" : `Due in ${days}d`, tone: "warn" as const };
}

export default function ActionsRoute() {
  const [tasks, setTasks] = useState<ActionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "completed" | "all">("open");
  const [completing, setCompleting] = useState<string | null>(null);

  function load() {
    JudgmentApi.listTasks()
      .then((t) => setTasks(Array.isArray(t) ? t : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function complete(id: string) {
    setCompleting(id);
    try {
      await JudgmentApi.completeTask(id);
      setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status: "completed" } : t)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCompleting(null);
    }
  }

  const filtered = tasks.filter((t) => (filter === "all" ? true : t.status === filter));
  const openCount = tasks.filter((t) => t.status === "open").length;

  return (
    <AppShell>
      <PageHeader
        title="Corrective Actions"
        description="Findings become owned, tracked actions. Drive each to closure so issues never quietly disappear."
      />

      <div className="mb-5 flex items-center gap-2">
        {(["open", "completed", "all"] as const).map((f) => (
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
              <ListChecks className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {filter === "open" ? "No open actions" : "Nothing here"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filter === "open"
                ? "Every corrective action is closed. The loop is shut."
                : "No actions match this filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const due = dueState(task.dueDate, task.status);
            return (
              <Card key={task._id} className="shadow-sm">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <ListChecks className="h-4 w-4 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
                        <Badge variant={due.tone}>{due.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{task.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <UserCircle2 className="h-3.5 w-3.5" />
                          {task.assigneeRole}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <StatusDot status={task.status} />
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {task.status === "open" && (
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() => complete(task._id)}
                      disabled={completing === task._id}
                    >
                      {completing === task._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Mark complete
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
