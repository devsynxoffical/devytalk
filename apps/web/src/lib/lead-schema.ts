import { z } from "zod";

export const leadKinds = ["demo", "trial", "contact", "newsletter", "callback"] as const;
export const teamSizes = ["1-5", "6-20", "21-50", "51-200", "200+"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const leadSchema = z
  .object({
    kind: z.enum(leadKinds),
    email: z.string().trim().toLowerCase().email("Enter a valid work email").max(254),
    name: optionalText(120),
    company: optionalText(160),
    phone: z
      .string()
      .trim()
      .max(32)
      .regex(/^[+()\d\s-]*$/, "Use digits, spaces and + only")
      .optional()
      .transform((v) => (v ? v : undefined)),
    teamSize: z.enum(teamSizes).optional(),
    message: optionalText(2000),
    /** Honeypot: real users never see or fill this field. */
    website: z.string().max(0, "Spam detected").optional(),
  })
  .superRefine((lead, ctx) => {
    if (lead.kind === "callback" && (!lead.phone || lead.phone.replace(/\D/g, "").length < 6)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter the number we should call" });
    }
    if (lead.kind !== "newsletter" && lead.kind !== "callback" && !lead.name) {
      ctx.addIssue({ code: "custom", path: ["name"], message: "Please tell us your name" });
    }
    if ((lead.kind === "demo" || lead.kind === "trial") && !lead.company) {
      ctx.addIssue({ code: "custom", path: ["company"], message: "Company name is required" });
    }
  });

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;

export type LeadResponse = { ok: true; id: string } | { ok: false; error: string; fields?: Record<string, string> };

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
