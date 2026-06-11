import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { verdictLabel, verdictTone, type Verdict, type Severity } from "~/lib/judgment.client";

export function VerdictBadge({ verdict }: { verdict?: Verdict }) {
  const tone = verdictTone(verdict);
  return <Badge variant={tone}>{verdictLabel(verdict)}</Badge>;
}

const SEVERITY_STYLES: Record<Severity, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  critical: "border-red-200 bg-red-50 text-red-700",
};

export function SeverityBadge({ severity }: { severity?: string }) {
  const key = (severity as Severity) in SEVERITY_STYLES ? (severity as Severity) : "medium";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        SEVERITY_STYLES[key],
      )}
    >
      {severity ?? "medium"}
    </span>
  );
}

export function StatusDot({ status }: { status: "open" | "resolved" | "completed" | "PENDING" | "DONE" | "ERROR" }) {
  const map: Record<string, string> = {
    open: "bg-amber-500",
    PENDING: "bg-amber-500",
    resolved: "bg-emerald-500",
    completed: "bg-emerald-500",
    DONE: "bg-emerald-500",
    ERROR: "bg-red-500",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full", map[status] ?? "bg-slate-400")} />;
}
