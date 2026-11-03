/**
 * Sample proof content for the marketing site.
 * Companies and people below are fictional placeholders; replace them with
 * real, approved customer quotes before launch.
 */
export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  metrics: { value: string; label: string }[];
};

export const testimonials: Testimonial[] = [
  {
    quote: "Last year we hired four people to call new leads. This year the AI Voice Agent does the first call and our reps only talk to people who are ready to buy.",
    name: "Amira Qureshi",
    role: "Head of Sales",
    company: "Brightlane",
    metrics: [
      { value: "4 → 0", label: "extra SDR hires needed" },
      { value: "3x", label: "qualified conversations" },
    ],
  },
  {
    quote: "Queue wallboards changed how our support floor works. Everyone can see when we need hands on the phones, and nobody waits on hold during the holiday peak.",
    name: "Jonas Richter",
    role: "Support Operations Lead",
    company: "Kettle & Co",
    metrics: [
      { value: "-40%", label: "average wait time" },
      { value: "+12%", label: "repeat purchases" },
    ],
  },
  {
    quote: "We set up numbers in four countries in an afternoon. Customers call a local number and reach the same team, wherever they are.",
    name: "Sofia Lindqvist",
    role: "COO",
    company: "Orbitly",
    metrics: [
      { value: "4", label: "markets launched in a day" },
      { value: "-50%", label: "telecom spend" },
    ],
  },
  {
    quote: "Patients used to hear a busy tone every morning. Now the AI agent books appointments overnight and our front desk starts the day with a clear calendar.",
    name: "Dr. Hannah Okafor",
    role: "Operations Director",
    company: "Lumen Health",
    metrics: [
      { value: "-60%", label: "abandoned calls" },
      { value: "1,900", label: "after-hours bookings / month" },
    ],
  },
  {
    quote: "The Parallel Dialer doubled our connect rate in the first week. Reps stopped dreading call blocks because they actually talk to people now.",
    name: "Marcus Bell",
    role: "VP Revenue",
    company: "Northwind",
    metrics: [
      { value: "2.1x", label: "connect rate" },
      { value: "+27%", label: "meetings booked" },
    ],
  },
];

export type CaseStudy = { company: string; industry: string; summary: string; results: { value: string; label: string }[] };

export const caseStudies: CaseStudy[] = [
  {
    company: "Brightlane",
    industry: "B2B SaaS",
    summary: "A 40-person SDR team moved from manual dialing to the Parallel Dialer and synced every call into their CRM.",
    results: [
      { value: "3x", label: "daily conversations" },
      { value: "+27%", label: "meetings booked" },
    ],
  },
  {
    company: "Kettle & Co",
    industry: "E-commerce",
    summary: "A homeware brand handled its holiday peak with smart routing, Shopify order pop-ups and missed-call text-back.",
    results: [
      { value: "-40%", label: "average wait" },
      { value: "+12%", label: "repeat purchases" },
    ],
  },
  {
    company: "Lumen Health",
    industry: "Healthcare",
    summary: "A network of 12 clinics added an AI Voice Agent to book appointments outside opening hours.",
    results: [
      { value: "-60%", label: "abandoned calls" },
      { value: "1,900", label: "after-hours bookings / month" },
    ],
  },
  {
    company: "Orbitly",
    industry: "Logistics",
    summary: "A cross-border logistics startup launched local numbers in four countries with one shared support team.",
    results: [
      { value: "4", label: "countries in one day" },
      { value: "-50%", label: "telecom spend" },
    ],
  },
];
