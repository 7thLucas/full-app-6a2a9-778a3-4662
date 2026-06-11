import { ShieldCheck } from "lucide-react";
import { useBrand } from "~/components/brand";

/**
 * Compact brand header shown above the auth cards. The auth module cards own
 * their own centered full-screen layout, so this renders as a fixed lockup at
 * the top of that screen.
 */
export function AuthBrandHeader() {
  const { appName, tagline, logoUrl } = useBrand();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex justify-center pt-10">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt={appName} className="h-9 w-9 rounded-md object-contain" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
        )}
        <div className="leading-tight">
          <div className="text-base font-semibold tracking-tight text-slate-900">{appName}</div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {tagline}
          </div>
        </div>
      </div>
    </div>
  );
}
