/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  tagline?: string;
  loginHeadline?: string;
  loginSubtext?: string;
  supportEmail?: string;
  brandColor: TBrandColor;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "Audra",
  logoUrl: "FILL_LOGO_URL_HERE",
  tagline: "Internal audit & compliance, closed to resolution.",
  loginHeadline: "Run defensible audits.",
  loginSubtext:
    "Conduct inspections, capture evidence, and track every finding to closure — on one trusted system of record.",
  supportEmail: "compliance@audra.app",
  brandColor: {
    primary: "#1e3a5f",
    secondary: "#0d9488",
    accent: "#d4a017",
  },
  // ─────────────────────────────────────────────────────────────────────
  // Add new field defaults here. See RULES.md §5 for per-type shape.
  // Required branding fields → use the FILL_X_HERE placeholder pattern.
  // Optional/typed defaults → real value with a "// fill it here" comment:
  //
  //   maxItemsPerPage: 12,                     // fill it here
  //   enableNotifications: true,               // fill it here
  //   featuredCategories: [],                  // fill it here
  //   defaultLanguage: "en",                   // must match enum options
  //   launchDate: "2025-01-01T00:00:00.000Z",  // ISO-8601
  //   heroImage: "",                           // resolved URL after upload
  //   galleryImages: [],                       // array of resolved URLs
  // ─────────────────────────────────────────────────────────────────────
};
