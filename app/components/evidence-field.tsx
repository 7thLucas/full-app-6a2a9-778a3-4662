import { useRef } from "react";
import { X, FileText, ImageIcon, UploadCloud } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import type { SchemaProperty } from "~/lib/judgment.client";

export interface FieldState {
  values: Record<string, unknown>;
  files: Record<string, File[]>;
}

function isFileField(prop: SchemaProperty) {
  return prop?.["x-ui"]?.widget === "file";
}

function isMultiFile(prop: SchemaProperty) {
  return prop.type === "array";
}

export function EvidenceField({
  fieldKey,
  prop,
  required,
  state,
  onChange,
}: {
  fieldKey: string;
  prop: SchemaProperty;
  required: boolean;
  state: FieldState;
  onChange: (next: FieldState) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const label = prop.title || fieldKey;
  const value = state.values[fieldKey];
  const files = state.files[fieldKey] ?? [];

  function setValue(v: unknown) {
    onChange({ ...state, values: { ...state.values, [fieldKey]: v } });
  }

  function setFiles(list: File[]) {
    // Record filename(s) as the field value so the evaluator can match files.
    const fileValue = isMultiFile(prop) ? list.map((f) => f.name) : list[0]?.name ?? "";
    onChange({
      values: { ...state.values, [fieldKey]: fileValue },
      files: { ...state.files, [fieldKey]: list },
    });
  }

  // ── File upload field (documents / photos) ──────────────────────────────
  if (isFileField(prop)) {
    const multi = isMultiFile(prop);
    return (
      <div className="space-y-2">
        <FieldLabel label={label} required={required} description={prop.description} />
        <input
          ref={fileInputRef}
          type="file"
          multiple={multi}
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            if (!picked.length) return;
            setFiles(multi ? [...files, ...picked] : picked);
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-sm font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <UploadCloud className="h-4 w-4" />
          {multi ? "Upload documents or photos" : "Upload a document or photo"}
        </button>
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, i) => {
              const isImage = f.type.startsWith("image/");
              return (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {isImage ? (
                      <ImageIcon className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                    <span className="truncate text-sm text-slate-700">{f.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  // ── Boolean / acknowledgement ────────────────────────────────────────────
  if (prop.type === "boolean") {
    return (
      <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => setValue(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        <span>
          <span className="text-sm font-medium text-slate-800">{label}</span>
          {prop.description && (
            <span className="mt-0.5 block text-xs text-slate-500">{prop.description}</span>
          )}
        </span>
      </label>
    );
  }

  // ── Enum (select) ─────────────────────────────────────────────────────────
  if (Array.isArray(prop.enum) && prop.enum.length > 0) {
    return (
      <div className="space-y-2">
        <FieldLabel label={label} required={required} description={prop.description} />
        <select
          value={String(value ?? "")}
          onChange={(e) => setValue(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select…</option>
          {prop.enum.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // ── Long text (evidence / notes) vs short text ───────────────────────────
  const isLongText = /evidence|note|comment|detail|observation|description/i.test(fieldKey);
  return (
    <div className="space-y-2">
      <FieldLabel label={label} required={required} description={prop.description} />
      {isLongText ? (
        <Textarea
          value={String(value ?? "")}
          onChange={(e) => setValue(e.target.value)}
          placeholder={prop.description}
          rows={4}
        />
      ) : (
        <Input
          type={prop.type === "number" || prop.type === "integer" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={(e) =>
            setValue(
              prop.type === "number" || prop.type === "integer"
                ? e.target.value === ""
                  ? ""
                  : Number(e.target.value)
                : e.target.value,
            )
          }
          placeholder={prop.description}
        />
      )}
    </div>
  );
}

function FieldLabel({
  label,
  required,
  description,
}: {
  label: string;
  required: boolean;
  description?: string;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-slate-800">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
    </div>
  );
}
