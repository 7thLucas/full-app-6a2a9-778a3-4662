import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ListChecks,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import { requireUser } from "~/lib/require-user.server";
import { AppShell } from "~/components/app-shell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";
import { SeverityBadge, VerdictBadge } from "~/components/status";
import { EvidenceField, type FieldState } from "~/components/evidence-field";
import {
  JudgmentApi,
  verdictTone,
  type AuditConfig,
  type Submission,
} from "~/lib/judgment.client";

export async function loader({ request }: LoaderFunctionArgs) {
  requireUser(request);
  return null;
}

export default function InspectRoute() {
  const { configId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<AuditConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<FieldState>({ values: {}, files: {} });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Submission | null>(null);

  useEffect(() => {
    if (!configId) return;
    JudgmentApi.getConfig(configId)
      .then(setConfig)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [configId]);

  const fields = useMemo(() => {
    if (!config?.inputSchema?.properties) return [];
    return Object.entries(config.inputSchema.properties);
  }, [config]);

  const requiredSet = useMemo(
    () => new Set(config?.inputSchema?.required ?? []),
    [config],
  );

  const missingRequired = useMemo(() => {
    return [...requiredSet].filter((key) => {
      const v = state.values[key];
      const hasFiles = (state.files[key]?.length ?? 0) > 0;
      return !hasFiles && (v === undefined || v === "" || v === null || v === false);
    });
  }, [requiredSet, state]);

  async function handleSubmit() {
    if (!config) return;
    setSubmitting(true);
    setError(null);
    try {
      const allFiles = Object.values(state.files).flat();
      const sub = await JudgmentApi.submit(config.pluginId, state.values, allFiles);
      setResult(sub);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setError(e.message || "Failed to submit for review.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetInspection() {
    setResult(null);
    setState({ values: {}, files: {} });
  }

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to={configId ? `/audits/${configId}` : "/audits"}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to audit
        </Link>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-96" />
        </div>
      ) : error && !config ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : config ? (
        <>
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Live inspection
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {config.name}
              </h1>
            </div>
          </div>

          {result ? (
            <ReviewResult
              submission={result}
              config={config}
              onReset={resetInspection}
              onDone={() => navigate(`/audits/${config.pluginId}`)}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Evidence form (centerpiece) */}
              <div className="lg:col-span-2">
                <Card className="shadow-sm">
                  <CardContent className="space-y-6 p-6">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Capture evidence</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Answer each item and attach supporting documents or photos. Audra reviews
                        the evidence and assists your pass/fail decision.
                      </p>
                    </div>
                    <Separator />
                    {error && (
                      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    <div className="space-y-5">
                      {fields.map(([key, prop]) => (
                        <EvidenceField
                          key={key}
                          fieldKey={key}
                          prop={prop}
                          required={requiredSet.has(key)}
                          state={state}
                          onChange={setState}
                        />
                      ))}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-400">
                        {missingRequired.length > 0
                          ? `${missingRequired.length} required field${missingRequired.length === 1 ? "" : "s"} remaining`
                          : "All required fields complete"}
                      </p>
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting || missingRequired.length > 0}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Reviewing evidence…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" /> Submit for AI review
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Requirements reference */}
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ListChecks className="h-4 w-4 text-slate-400" />
                  Requirements
                </h2>
                <Card className="shadow-sm">
                  <CardContent className="p-0">
                    <ul className="divide-y divide-slate-100">
                      {(config.criteria ?? []).map((c, i) => (
                        <li key={c.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-500">
                                {i + 1}
                              </span>
                              <span className="text-sm font-medium text-slate-800">{c.name}</span>
                            </div>
                            <SeverityBadge severity={c.severity} />
                          </div>
                          <p className="mt-1 pl-7 text-xs text-slate-500">{c.passCriteria}</p>
                        </li>
                      ))}
                      {(config.criteria ?? []).length === 0 && (
                        <li className="px-4 py-6 text-center text-sm text-slate-400">
                          No requirements defined
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      ) : null}
    </AppShell>
  );
}

function ReviewResult({
  submission,
  config,
  onReset,
  onDone,
}: {
  submission: Submission;
  config: AuditConfig;
  onReset: () => void;
  onDone: () => void;
}) {
  const result = submission.result;
  const tone = verdictTone(result?.verdict);
  const failed = tone === "fail" || tone === "warn";

  const toneStyles = {
    pass: { ring: "border-emerald-200", bg: "bg-emerald-50", icon: CheckCircle2, color: "text-emerald-600" },
    warn: { ring: "border-amber-200", bg: "bg-amber-50", icon: AlertCircle, color: "text-amber-600" },
    fail: { ring: "border-red-200", bg: "bg-red-50", icon: XCircle, color: "text-red-600" },
    neutral: { ring: "border-slate-200", bg: "bg-slate-50", icon: AlertCircle, color: "text-slate-500" },
  }[tone];

  const Icon = toneStyles.icon;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card className={`overflow-hidden border ${toneStyles.ring} shadow-sm`}>
        <div className={`flex items-center gap-4 ${toneStyles.bg} px-6 py-5`}>
          <Icon className={`h-9 w-9 ${toneStyles.color}`} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Assessment complete</h2>
              <VerdictBadge verdict={result?.verdict} />
            </div>
            <p className="text-sm text-slate-500">{config.name}</p>
          </div>
          {typeof result?.score === "number" && (
            <div className="text-right">
              <div className="text-3xl font-semibold tracking-tight text-slate-900">
                {result.score}
              </div>
              <div className="text-xs text-slate-400">score / 100</div>
            </div>
          )}
        </div>

        <CardContent className="space-y-5 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Reviewer summary
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {result?.reason || "The evidence was reviewed against the audit requirements."}
            </p>
          </div>

          {failed && result?.fixSuggestion && (
            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Recommended corrective action
                </p>
                <p className="mt-0.5 text-sm text-amber-800">{result.fixSuggestion}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {result?.severity && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Severity</span>
                <SeverityBadge severity={result.severity} />
              </div>
            )}
            {typeof result?.confidence === "number" && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Confidence</span>
                <span className="font-medium text-slate-700">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            )}
            {result?.requiresHumanReview && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                Flagged for human review
              </span>
            )}
          </div>

          {submission.files.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Evidence on file
              </p>
              <ul className="mt-2 space-y-1.5">
                {submission.files.map((f, i) => (
                  <li key={i} className="text-sm text-slate-600">
                    <a
                      href={f.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {f.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {failed && (
            <div className="rounded-md bg-slate-50 px-4 py-3 text-xs text-slate-500">
              A corrective action has been opened and assigned automatically. Track it under
              Corrective Actions until it is resolved.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4" /> New inspection
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
