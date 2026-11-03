/**
 * Sample proof content for the marketing site.
 * Companies and people below are fictional placeholders; replace them with
 * real, approved customer quotes before launch.
 */
export const customerLogos = ["Northwind", "Brightlane", "Kettle&Co", "Orbitly", "Paperhaus", "Lumen Health", "Vantage", "Quillstack"];

export type Testimonial = { quote: string; name: string; role: string; company: string; metric: string };

export const testimonials: Testimonial[] = [
  {
    quote: "We replaced three tools with DevyTalk. Our reps now spend their mornings talking to prospects instead of copy-pasting numbers.",
    name: "Amira Q.",
    role: "Head of Sales",
    company: "Brightlane",
    metric: "+3x conversations",
  },
  {
    quote: "Queue wallboards changed how our support floor works. Everyone can see when we need hands on the phones.",
    name: "Jonas R.",
    role: "Support Operations Lead",
    company: "Kettle&Co",
    metric: "-40% wait time",
  },
  {
    quote: "We set up numbers in four countries in an afternoon. Customers now call a local number and reach the same team.",
    name: "Sofia L.",
    role: "COO",
    company: "Orbitly",
    metric: "4 markets in 1 day",
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
    company: "Kettle&Co",
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
