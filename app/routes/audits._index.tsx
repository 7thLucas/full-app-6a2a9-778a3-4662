import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { ClipboardCheck, Plus, FileText, ArrowRight } from "lucide-react";
import { requireUser } from "~/lib/require-user.server";
import { AppShell, PageHeader } from "~/components/app-shell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { JudgmentApi, type AuditConfig } from "~/lib/judgment.client";

export async function loader({ request }: LoaderFunctionArgs) {
  requireUser(request);
  return null;
}

export default function AuditsRoute() {
  const [configs, setConfigs] = useState<AuditConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    JudgmentApi.listConfigs()
      .then((c) => setConfigs(Array.isArray(c) ? c : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Audit Programs"
        description="Checklists generated from your SOPs and standards. Run inspections, capture evidence, and score requirements."
        action={
          <Button asChild>
            <Link to="/audits/new">
              <Plus className="h-4 w-4" />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : configs.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No audit programs yet</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Upload a SOP, policy, or standard and Audra will extract the requirements into a
              structured audit checklist you can run in the field.
            </p>
            <Button asChild className="mt-5">
              <Link to="/audits/new">Create your first audit</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card key={config.pluginId} className="flex flex-col shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="neutral">{config.criteria?.length ?? 0} requirements</Badge>
                </div>
                <h3 className="mt-4 text-base font-semibold leading-snug text-slate-900">
                  {config.name}
                </h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{config.rules}</p>
                <div className="mt-5 flex items-center gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link to={`/audits/${config.pluginId}/inspect`}>Start inspection</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/audits/${config.pluginId}`}>
                      Details <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
