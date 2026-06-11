import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  UploadCloud,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ListChecks,
} from "lucide-react";
import { requireUser } from "~/lib/require-user.server";
import { AppShell, PageHeader } from "~/components/app-shell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { SeverityBadge } from "~/components/status";
import { JudgmentApi, type AuditConfig } from "~/lib/judgment.client";

export async function loader({ request }: LoaderFunctionArgs) {
  requireUser(request);
  return null;
}

type Phase = "upload" | "extracting" | "review" | "saving";

export default function NewAuditRoute() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [fileName, setFileName] = useState("");
  const [drafts, setDrafts] = useState<AuditConfig[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    setPhase("extracting");
    try {
      const result = await JudgmentApi.parseFromFile(file);
      if (!result.length) {
        throw new Error("No requirements could be extracted from this document.");
      }
      setDrafts(result);
      setPhase("review");
    } catch (e: any) {
      setError(e.message || "Failed to extract requirements.");
      setPhase("upload");
    }
  }

  async function handleSave() {
    setPhase("saving");
    setError(null);
    try {
      const created: string[] = [];
      for (const draft of drafts) {
        const saved = await JudgmentApi.createConfigDirect(draft);
        created.push(saved.pluginId);
      }
      navigate(created.length === 1 ? `/audits/${created[0]}` : "/audits");
    } catch (e: any) {
      setError(e.message || "Failed to save audit program.");
      setPhase("review");
    }
  }

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
      <PageHeader
        title="New Audit Program"
        description="Upload an SOP, policy, or standard. Audra reads it and drafts a structured audit checklist for you to review."
      />

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {(phase === "upload" || phase === "extracting") && (
        <Card className="shadow-sm">
          <CardContent className="p-8">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (phase === "extracting") return;
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center"
            >
              {phase === "extracting" ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    Extracting requirements…
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Reading <span className="font-medium">{fileName}</span> and drafting your audit
                    checklist. This can take a moment.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <UploadCloud className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    Upload a source document
                  </h3>
                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    Drag and drop a PDF or document here, or browse. Audra extracts each requirement
                    into a checklist item with pass criteria.
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <Button className="mt-5" onClick={() => inputRef.current?.click()}>
                    <FileText className="h-4 w-4" /> Choose document
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(phase === "review" || phase === "saving") && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <Sparkles className="h-4 w-4" />
            Extracted {drafts.length} audit {drafts.length === 1 ? "program" : "programs"} from{" "}
            <span className="font-medium">{fileName}</span>. Review and save.
          </div>

          {drafts.map((draft, idx) => (
            <Card key={idx} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <ListChecks className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900">{draft.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{draft.rules}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Requirements ({draft.criteria?.length ?? 0})
                  </p>
                  <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                    {(draft.criteria ?? []).map((c) => (
                      <li key={c.id} className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{c.name}</span>
                            <span className="text-xs text-slate-400">{c.category}</span>
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500">{c.passCriteria}</p>
                        </div>
                        <SeverityBadge severity={c.severity} />
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setPhase("upload");
                setDrafts([]);
              }}
              disabled={phase === "saving"}
            >
              Start over
            </Button>
            <Button onClick={handleSave} disabled={phase === "saving"}>
              {phase === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Save audit program
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
