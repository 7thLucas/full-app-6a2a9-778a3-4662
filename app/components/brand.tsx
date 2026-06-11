import { ShieldCheck } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";

export function useBrand() {
  const { config, loading } = useConfigurables();
  return {
    loading,
    appName: config?.appName || "Audra",
    tagline: config?.tagline || "Internal audit & compliance",
    logoUrl: config?.logoUrl && !String(config.logoUrl).startsWith("FILL_") ? config.logoUrl : "",
    loginHeadline: config?.loginHeadline || "Run defensible audits.",
    loginSubtext:
      config?.loginSubtext ||
      "Conduct inspections, capture evidence, and track every finding to closure.",
    supportEmail: config?.supportEmail || "",
  };
}

export function BrandMark({ size = 36 }: { size?: number }) {
  const { logoUrl, appName } = useBrand();
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={appName}
        style={{ width: size, height: size }}
        className="rounded-md object-contain"
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-md bg-primary text-primary-foreground"
      style={{ width: size, height: size }}
    >
      <ShieldCheck style={{ width: size * 0.6, height: size * 0.6 }} />
    </div>
  );
}

export function BrandLockup() {
  const { appName, tagline } = useBrand();
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight text-slate-900">{appName}</div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {tagline}
        </div>
      </div>
    </div>
  );
}
