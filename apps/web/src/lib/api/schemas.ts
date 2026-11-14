/**
 * The shape of every response the dashboard reads from the calling engine.
 * Responses are checked against these before a page uses them, so a change on the
 * engine shows up as a clear error instead of a half-rendered screen.
 */
import { z } from "zod";

const rate = z.number().nullable();

export const campaignSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string(),
  languages: z.array(z.string()).default([]),
  inbound_number: z.string().nullable().default(null),
  stop_reason: z.string().nullable().default(null),
  spend_usd: z.number().default(0),
  budget_usd: z.number().nullable().default(null),
  readiness_score: z.number(),
  stats: z.record(z.string(), z.number()),
  running: z.boolean(),
});
export const campaignListSchema = z.array(campaignSchema);
export type Campaign = z.infer<typeof campaignSchema>;

const groupSchema = z.object({
  calls: z.number(),
  answered: z.number(),
  conversions: z.number(),
  conversion_rate: rate,
  average_quality: z.number().nullable(),
  enough_data: z.boolean(),
});

export const reportSchema = z.object({
  campaign: z.string(),
  calls: z.object({
    total: z.number(),
    answered: z.number(),
    reviewed: z.number(),
    conversions: z.number(),
    conversion_rate: rate,
    dispositions: z.record(z.string(), z.number()),
  }),
  cost: z.object({ spend_usd: z.number(), cost_per_answered_call: z.number().nullable(), cost_per_conversion: z.number().nullable() }),
  objections: z.array(
    z.object({
      category: z.string(),
      raised: z.number(),
      handled: z.number(),
      handled_rate: rate,
      calls: z.number(),
      conversion_rate_when_raised: rate,
      examples: z.array(z.string()),
    }),
  ),
  lost_reasons: z.record(z.string(), z.number()),
  competitors: z.record(z.string(), z.number()),
  sentiment: z.record(z.string(), z.number()),
  missed_opportunities: z.array(z.object({ text: z.string(), calls: z.number() })),
  unsupported_statements: z.array(z.object({ call_run_id: z.number(), statement: z.string() })),
  by_playbook_version: z.record(z.string(), groupSchema),
  best_version: z.string().nullable(),
  by_language: z.record(z.string(), groupSchema),
  /** Calls the agent placed and calls it answered. Absent on engines older than this console. */
  by_direction: z.record(z.string(), groupSchema).default({}),
  leads: z.object({ total: z.number(), hot: z.number(), warm: z.number(), cold: z.number(), unscored: z.number() }),
});
export type Report = z.infer<typeof reportSchema>;

export const rulesSchema = z.object({
  rules: z.object({
    calling_days: z.array(z.string()),
    window_start: z.string(),
    window_end: z.string(),
    max_attempts: z.number(),
    retry_delay_minutes: z.number(),
    max_calls_per_day: z.number().nullable(),
    max_calls_per_month: z.number().nullable(),
    budget_usd: z.number().nullable(),
    starts_at: z.string().nullable(),
    ends_at: z.string().nullable(),
    stop_after_meetings: z.number().nullable(),
    max_opt_out_rate: z.number().nullable(),
  }),
  /** What this campaign overrides, exactly as stored. Anything not listed follows the engine's defaults. */
  stored: z.record(z.string(), z.unknown()).default({}),
  spend_usd: z.number(),
  stop_reason: z.string().nullable(),
});
export type Rules = z.infer<typeof rulesSchema>;

const answer = z.enum(["yes", "no", "unknown"]);
const evidenceSchema = z
  .object({
    fits_target_customer: answer.optional(),
    has_need: answer.optional(),
    decision_maker: answer.optional(),
    timeline: z.enum(["now", "this_quarter", "later", "none", "unknown"]).optional(),
    budget_fit: answer.optional(),
    expressed_interest: answer.optional(),
    quotes: z.array(z.string()).optional(),
  })
  .default({});

const leadObjection = z.object({ category: z.string(), raised: z.number(), handled: z.number(), quotes: z.array(z.string()) });

export const leadSchema = z.object({
  id: z.number(),
  name: z.string(),
  company: z.string(),
  phone: z.string(),
  email: z.string().default(""),
  status: z.string(),
  priority: z.number(),
  attempts: z.number(),
  last_disposition: z.string().nullable(),
  score: z.number().nullable(),
  category: z.enum(["hot", "warm", "cold", "unscored"]),
  evidence: evidenceSchema,
  points: z.record(z.string(), z.number()).default({}),
  calls: z.number(),
  buying_intent_score: z.number().nullable(),
  buying_intent: z.enum(["high", "medium", "low"]).nullable(),
  next_action: z.string().nullable(),
  sentiment: z.string().nullable(),
  lost_reason: z.string().nullable(),
  objections: z.array(leadObjection),
  pain_points: z.array(z.string()),
});
export type Lead = z.infer<typeof leadSchema>;

export const leadListSchema = z.object({ total: z.number(), limit: z.number(), offset: z.number(), leads: z.array(leadSchema) });

export const leadDetailSchema = leadSchema.extend({
  notes: z.string().default(""),
  timezone: z.string().nullable(),
  call_history: z.array(
    z.object({
      call_run_id: z.number(),
      started_at: z.string().nullable(),
      direction: z.string(),
      language: z.string().nullable(),
      duration_seconds: z.number().nullable(),
      disposition: z.string().nullable(),
      playbook_version: z.number().nullable(),
      summary: z.string().nullable().optional(),
      next_action: z.string().nullable().optional(),
      missed_opportunities: z.array(z.string()),
      transcript: z.array(z.object({ role: z.string(), text: z.string() })),
    }),
  ),
});
export type LeadDetail = z.infer<typeof leadDetailSchema>;

const coachChange = z.object({ change: z.string(), evidence: z.string() });

export const versionSchema = z.object({
  version: z.number(),
  status: z.enum(["draft", "active", "archived", "rejected"]),
  source: z.string(),
  note: z.string(),
  changes: z.array(coachChange).default([]),
  created_by: z.string(),
  approved_by: z.string(),
  created_at: z.string().nullable(),
  activated_at: z.string().nullable(),
  readiness_score: z.number(),
  blocking_questions: z.array(z.string()),
  open_questions: z.number(),
});
export const versionListSchema = z.array(versionSchema);
export type Version = z.infer<typeof versionSchema>;

export const versionDiffSchema = z.object({
  version: z.number(),
  compared_with: z.number().nullable(),
  changes: z.array(z.object({ field: z.string(), label: z.string(), removed: z.array(z.string()), added: z.array(z.string()) })),
});
export type VersionDiff = z.infer<typeof versionDiffSchema>;

export const coachResultSchema = z.object({ version: z.number().nullable(), changes: z.array(coachChange), reviewed_calls: z.number() });
export type CoachResult = z.infer<typeof coachResultSchema>;

const armSchema = z.object({
  version: z.number(),
  leads_dialed: z.number(),
  leads_answered: z.number(),
  conversions: z.number(),
  conversion_rate: rate,
  calls: z.number(),
  average_quality: z.number().nullable(),
  answered_needed: z.number(),
});
export type Arm = z.infer<typeof armSchema>;

export const experimentSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum(["running", "stopped", "promoted"]),
  variant_share: z.number(),
  min_answered_per_arm: z.number(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  created_by: z.string(),
  control: armSchema,
  variant: armSchema,
  enough_data: z.boolean(),
  p_value: z.number().nullable(),
  verdict: z.enum(["collecting", "no_clear_difference", "variant_ahead", "control_ahead"]),
  leader: z.enum(["control", "variant"]).nullable(),
  summary: z.string(),
});
export const experimentListSchema = z.array(experimentSchema);
export type Experiment = z.infer<typeof experimentSchema>;

const jobSchema = z.object({
  id: z.number(),
  kind: z.string(),
  key: z.string(),
  status: z.enum(["queued", "running", "done", "dead"]),
  attempts: z.number(),
  max_attempts: z.number(),
  run_at: z.string().nullable(),
  last_error: z.string().nullable(),
  call_run_id: z.number().nullable(),
  created_at: z.string().nullable(),
  finished_at: z.string().nullable(),
});
export type Job = z.infer<typeof jobSchema>;

export const jobsSchema = z.object({
  stats: z.object({ queued: z.number(), running: z.number(), done: z.number(), dead: z.number(), oldest_due_seconds: z.number() }),
  jobs: z.array(jobSchema),
});
export type Jobs = z.infer<typeof jobsSchema>;

export const okSchema = z.object({ ok: z.boolean() });

export const timelineSchema = z.object({
  timezone: z.string(),
  days: z.array(z.object({ date: z.string(), calls: z.number(), answered: z.number(), conversions: z.number() })),
});
export type Timeline = z.infer<typeof timelineSchema>;

export const callRowSchema = z.object({
  call_run_id: z.number(),
  lead: z.string(),
  phone: z.string(),
  status: z.string(),
  mode: z.string(),
  direction: z.string(),
  language: z.string().nullable(),
  answered_by: z.string().nullable(),
  disposition: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  cost_usd: z.number().nullable(),
  playbook_version: z.number().nullable(),
  summary: z.string().nullable().optional(),
  started_at: z.string().nullable(),
});
export const callListSchema = z.array(callRowSchema);
export type CallRow = z.infer<typeof callRowSchema>;

const reviewSchema = z
  .object({
    summary: z.string().optional(),
    next_action: z.string().optional(),
    interest_level: z.number().optional(),
    agent_quality_score: z.number().optional(),
    customer_sentiment: z.string().optional(),
    buying_intent_score: z.number().optional(),
    lost_reason: z.string().optional(),
    ai_disclosed: z.boolean().optional(),
    objection_events: z.array(z.object({ category: z.string(), quote: z.string(), handled: z.boolean() })).optional(),
    commitments_made_by_agent: z.array(z.string()).optional(),
    missed_opportunities: z.array(z.string()).optional(),
    incorrect_statements: z.array(z.string()).optional(),
    coaching_notes: z.array(z.string()).optional(),
    pain_points: z.array(z.string()).optional(),
  })
  .passthrough();

export const callDetailSchema = z.object({
  call_run_id: z.number(),
  status: z.string(),
  /** The call is ringing or in progress: the transcript is what has been said so far. */
  live: z.boolean().default(false),
  mode: z.string(),
  direction: z.string(),
  language: z.string().nullable(),
  answered_by: z.string().nullable(),
  disposition: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  transcript: z.array(z.object({ role: z.string(), text: z.string(), at: z.string().optional() })).default([]),
  tool_events: z.array(z.object({ at: z.string().optional(), tool: z.string(), arguments: z.record(z.string(), z.unknown()).default({}), result: z.record(z.string(), z.unknown()).default({}) })).default([]),
  summary: z
    .object({
      review: reviewSchema.optional(),
      agent_outcome: z.object({ summary: z.string().optional(), next_step: z.string().optional() }).passthrough().optional(),
      latency: z.record(z.string(), z.unknown()).optional(),
    })
    .passthrough()
    .default({}),
  recording_url: z.string().nullable(),
  error: z.string().nullable(),
});
export type CallDetail = z.infer<typeof callDetailSchema>;

export const dialResultSchema = z.object({ call_run_id: z.number() });

/* ---- knowledge and training ---- */

export const documentSchema = z.object({
  id: z.number(),
  kind: z.string(), // file | url
  name: z.string(),
  source_url: z.string().nullable(),
  file_type: z.string(),
  size_bytes: z.number(),
  version: z.number(),
  status: z.string(), // pending | processing | ready | failed | superseded
  error: z.string().nullable(),
  language: z.string().nullable(),
  passages: z.number(),
  characters: z.number(),
  uploaded_at: z.string().nullable(),
  processed_at: z.string().nullable(),
});
export const documentListSchema = z.array(documentSchema);
export type TrainingDocument = z.infer<typeof documentSchema>;

export const knowledgeSearchSchema = z.object({
  passages_indexed: z.number(),
  results: z.array(z.object({ source: z.string(), text: z.string(), score: z.number() })),
});
export type KnowledgeSearch = z.infer<typeof knowledgeSearchSchema>;

export const trainingRunSchema = z.object({
  id: z.number(),
  status: z.string(), // running | done | failed
  error: z.string().nullable(),
  draft_version: z.number().nullable(),
  started_at: z.string().nullable(),
  finished_at: z.string().nullable(),
});
export type TrainingRun = z.infer<typeof trainingRunSchema>;

export const leadImportSchema = z.object({
  imported: z.number(),
  invalid_phone: z.number(),
  duplicates: z.number(),
  dnc: z.number(),
  column_map: z.record(z.string(), z.string()),
  samples_invalid: z.array(z.string()),
});
export type LeadImport = z.infer<typeof leadImportSchema>;

/* ---- accounts ---- */

export const roleSchema = z.enum(["viewer", "operator", "admin"]);
export type Role = z.infer<typeof roleSchema>;

export const meSchema = z.object({
  kind: z.enum(["token", "user", "key"]),
  id: z.number().nullable(),
  email: z.string(),
  name: z.string(),
  role: roleSchema,
  /** The only organization whose data this person can see or change. */
  organization: z.object({ id: z.number(), name: z.string() }).default({ id: 0, name: "" }),
  /** The operator of the deployment, who creates organizations. */
  platform: z.boolean().default(false),
});
export type Me = z.infer<typeof meSchema>;

export const organizationSchema = z.object({ id: z.number(), name: z.string(), created_at: z.string().nullable(), users: z.number(), active_users: z.number(), from_numbers: z.array(z.string()).default([]) });
export const organizationListSchema = z.array(organizationSchema);
export type Organization = z.infer<typeof organizationSchema>;

export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  role: roleSchema,
  active: z.boolean(),
  created_at: z.string().nullable(),
  last_login_at: z.string().nullable(),
});
export const userListSchema = z.array(userSchema);
export type User = z.infer<typeof userSchema>;

/* ---- website requests ---- */

export const websiteRequestSchema = z.object({
  id: z.number(),
  kind: z.string(), // demo | trial | contact | newsletter | callback
  email: z.string().nullable(),
  name: z.string().nullable(),
  company: z.string().nullable(),
  phone: z.string().nullable(),
  team_size: z.string().nullable(),
  message: z.string().nullable(),
  status: z.enum(["new", "handled"]),
  handled_by: z.string().nullable(),
  handled_at: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type WebsiteRequest = z.infer<typeof websiteRequestSchema>;
export const websiteRequestListSchema = z.object({ total: z.number(), new: z.number(), requests: z.array(websiteRequestSchema) });

/* ---- setup ---- */

export const statusSchema = z.object({
  ready_for_calls: z.boolean(),
  checks: z.array(z.object({ key: z.string(), label: z.string(), purpose: z.string(), ok: z.boolean(), missing: z.array(z.string()) })),
  from_number: z.string().nullable(),
  inbound_webhook: z.string().nullable(),
  languages: z.array(z.object({ code: z.string(), name: z.string() })),
  website_intake: z.boolean(),
  /** Whether the database itself keeps organizations apart. */
  row_level_security: z.enum(["enforced", "bypassed", "missing", "unavailable"]).default("unavailable"),
  default_timezone: z.string(),
});
export type EngineStatus = z.infer<typeof statusSchema>;

export const languagesSchema = z.object({
  languages: z.array(z.string()),
  localized: z.array(z.string()),
  supported: z.array(z.object({ code: z.string(), name: z.string() })),
  provider_gaps: z.array(z.string()),
  can_localize: z.boolean(),
});
export type CampaignLanguages = z.infer<typeof languagesSchema>;

/** What is one organization's own. The booking webhook's secret is never sent to the console. */
export const organizationSettingsSchema = z.object({
  from_numbers: z.array(z.string()).default([]),
  human_transfer_number: z.string().nullable().default(null),
  booking_webhook_url: z.string().nullable().default(null),
  booking_webhook_signed: z.boolean().default(false),
  cost_per_connected_minute_usd: z.number().default(0),
  cost_per_call_attempt_usd: z.number().default(0),
  can_place_calls: z.boolean().default(false),
});
export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;

export const apiKeySchema = z.object({
  id: z.number(),
  name: z.string(),
  role: roleSchema,
  starts_with: z.string(),
  created_by: z.string().default(""),
  created_at: z.string().nullable(),
  last_used_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
});
export const apiKeyListSchema = z.array(apiKeySchema);
/** Only the answer to creating a key holds the key itself. */
export const newApiKeySchema = apiKeySchema.extend({ key: z.string() });
export type ApiKey = z.infer<typeof apiKeySchema>;

