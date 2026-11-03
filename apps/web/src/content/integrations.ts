export type IntegrationCategory = "CRM" | "Helpdesk" | "E-commerce" | "Productivity" | "Automation";

export type Integration = {
  name: string;
  category: IntegrationCategory;
  description: string;
  color: string;
  popular?: boolean;
};

export const integrationCategories: IntegrationCategory[] = ["CRM", "Helpdesk", "E-commerce", "Productivity", "Automation"];

export const integrations: Integration[] = [
  { name: "HubSpot", category: "CRM", description: "Click-to-call, automatic call logging and contact sync.", color: "#ff7a59", popular: true },
  { name: "Salesforce", category: "CRM", description: "Log calls as tasks, pop records on inbound calls.", color: "#00a1e0", popular: true },
  { name: "Pipedrive", category: "CRM", description: "Dial from deals and sync outcomes to activities.", color: "#1a1a1a", popular: true },
  { name: "Zoho CRM", category: "CRM", description: "Two-way contact sync and call history on records.", color: "#e42527" },
  { name: "Microsoft Dynamics", category: "CRM", description: "Screen pops and activity logging for Dynamics 365.", color: "#0b53ce" },
  { name: "Close", category: "CRM", description: "Bring Power Dialer campaigns to Close smart views.", color: "#2f6ff5" },
  { name: "Zendesk", category: "Helpdesk", description: "Create tickets from calls with recordings attached.", color: "#03363d", popular: true },
  { name: "Freshdesk", category: "Helpdesk", description: "Auto-create tickets for missed calls and voicemails.", color: "#25c16f" },
  { name: "Intercom", category: "Helpdesk", description: "Call customers straight from an Intercom conversation.", color: "#1f8ded" },
  { name: "Help Scout", category: "Helpdesk", description: "Log calls to the customer timeline automatically.", color: "#1292ee" },
  { name: "Gorgias", category: "Helpdesk", description: "Voice tickets for e-commerce support teams.", color: "#161616" },
  { name: "Shopify", category: "E-commerce", description: "See orders and lifetime value when a customer calls.", color: "#95bf47", popular: true },
  { name: "WooCommerce", category: "E-commerce", description: "Order lookups and caller identification for WooCommerce.", color: "#7f54b3" },
  { name: "BigCommerce", category: "E-commerce", description: "Order context for every inbound support call.", color: "#121118" },
  { name: "Slack", category: "Productivity", description: "Missed call and voicemail alerts in your channels.", color: "#4a154b", popular: true },
  { name: "Microsoft Teams", category: "Productivity", description: "Notifications and presence sync with Teams.", color: "#5059c9" },
  { name: "Google Calendar", category: "Productivity", description: "Let the AI Voice Agent book meetings into calendars.", color: "#4285f4" },
  { name: "Google Sheets", category: "Productivity", description: "Export call logs and campaign results to a sheet.", color: "#0f9d58" },
  { name: "Zapier", category: "Automation", description: "Connect DevyTalk events to 6,000+ apps without code.", color: "#ff4f00", popular: true },
  { name: "Make", category: "Automation", description: "Build visual automations triggered by calls and texts.", color: "#6d00cc" },
  { name: "Webhooks", category: "Automation", description: "Receive real-time call events at your own endpoint.", color: "#0a7363" },
  { name: "REST API", category: "Automation", description: "Full programmatic access to calls, users and numbers.", color: "#0b1324" },
];
