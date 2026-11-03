export type IntegrationCategory = "CRM" | "Helpdesk" | "E-commerce" | "Productivity" | "Automation";

export type Integration = {
  name: string;
  category: IntegrationCategory;
  description: string;
  /** Key into brandIcons when a mark is available; otherwise a monogram tile is shown. */
  icon?: string;
  color: string;
  popular?: boolean;
};

export const integrationCategories: IntegrationCategory[] = ["CRM", "Helpdesk", "E-commerce", "Productivity", "Automation"];

export const integrations: Integration[] = [
  { name: "HubSpot", category: "CRM", icon: "hubspot", color: "#ff7a59", description: "Click-to-call, automatic call logging and contact sync.", popular: true },
  { name: "Salesforce", category: "CRM", color: "#00a1e0", description: "Log calls as tasks and pop records on inbound calls.", popular: true },
  { name: "Pipedrive", category: "CRM", color: "#1a1a1a", description: "Dial from deals and sync outcomes to activities.", popular: true },
  { name: "Zoho CRM", category: "CRM", icon: "zoho", color: "#e42527", description: "Two-way contact sync and call history on records." },
  { name: "Microsoft Dynamics", category: "CRM", color: "#0b53ce", description: "Screen pops and activity logging for Dynamics 365." },
  { name: "Odoo", category: "CRM", icon: "odoo", color: "#714b67", description: "Calls and recordings on Odoo contacts and leads." },
  { name: "Airtable", category: "CRM", icon: "airtable", color: "#18bfff", description: "Use an Airtable base as a lightweight CRM for dialing." },
  { name: "Zendesk", category: "Helpdesk", icon: "zendesk", color: "#03363d", description: "Create tickets from calls with recordings attached.", popular: true },
  { name: "Freshdesk", category: "Helpdesk", color: "#25c16f", description: "Auto-create tickets for missed calls and voicemails." },
  { name: "Intercom", category: "Helpdesk", icon: "intercom", color: "#1f8ded", description: "Call customers straight from an Intercom conversation.", popular: true },
  { name: "Help Scout", category: "Helpdesk", icon: "helpscout", color: "#1292ee", description: "Log calls to the customer timeline automatically." },
  { name: "Gorgias", category: "Helpdesk", color: "#161616", description: "Voice tickets for e-commerce support teams." },
  { name: "Jira Service", category: "Helpdesk", icon: "jira", color: "#0052cc", description: "Open and update service requests from a call." },
  { name: "Shopify", category: "E-commerce", icon: "shopify", color: "#95bf47", description: "See orders and lifetime value when a customer calls.", popular: true },
  { name: "WooCommerce", category: "E-commerce", icon: "woocommerce", color: "#7f54b3", description: "Order lookups and caller identification for WooCommerce." },
  { name: "BigCommerce", category: "E-commerce", icon: "bigcommerce", color: "#121118", description: "Order context for every inbound support call." },
  { name: "Stripe", category: "E-commerce", icon: "stripe", color: "#635bff", description: "Show plan, MRR and payment status on the caller card." },
  { name: "Slack", category: "Productivity", color: "#4a154b", description: "Missed call and voicemail alerts in your channels.", popular: true },
  { name: "Microsoft Teams", category: "Productivity", color: "#5059c9", description: "Notifications and presence sync with Teams." },
  { name: "Google Calendar", category: "Productivity", icon: "googlecalendar", color: "#4285f4", description: "Let the AI Voice Agent book meetings into calendars." },
  { name: "Google Sheets", category: "Productivity", icon: "googlesheets", color: "#34a853", description: "Export call logs and campaign results to a sheet." },
  { name: "Gmail", category: "Productivity", icon: "gmail", color: "#ea4335", description: "Send follow-up emails with call summaries in one click." },
  { name: "Notion", category: "Productivity", icon: "notion", color: "#000000", description: "Push call notes and summaries into Notion pages." },
  { name: "Asana", category: "Productivity", icon: "asana", color: "#f06a6a", description: "Turn next steps from a call into Asana tasks." },
  { name: "Linear", category: "Productivity", icon: "linear", color: "#5e6ad2", description: "File bugs reported on support calls straight to Linear." },
  { name: "WhatsApp", category: "Productivity", icon: "whatsapp", color: "#25d366", description: "Message customers on WhatsApp from the same inbox." },
  { name: "Zapier", category: "Automation", icon: "zapier", color: "#ff4f00", description: "Connect DevyTalk events to 6,000+ apps without code.", popular: true },
  { name: "Make", category: "Automation", icon: "make", color: "#6d00cc", description: "Build visual automations triggered by calls and texts." },
  { name: "n8n", category: "Automation", icon: "n8n", color: "#ea4b71", description: "Self-hosted workflows on top of DevyTalk webhooks." },
  { name: "Mailchimp", category: "Automation", icon: "mailchimp", color: "#ffe01b", description: "Sync call outcomes to audiences and segments." },
  { name: "Google Analytics", category: "Automation", icon: "googleanalytics", color: "#e37400", description: "Track calls from your website as conversions." },
  { name: "Webhooks", category: "Automation", color: "#078a6c", description: "Receive real-time call events at your own endpoint." },
  { name: "REST API", category: "Automation", color: "#0a1628", description: "Full programmatic access to calls, users and numbers." },
];
