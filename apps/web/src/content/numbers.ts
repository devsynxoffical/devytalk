export type NumberType = "Local" | "Mobile" | "Toll-free";

export type CountryNumbers = {
  code: string;
  country: string;
  flag: string;
  region: "Europe" | "Americas" | "Asia-Pacific" | "Middle East & Africa";
  types: Partial<Record<NumberType, number>>;
};

/** Monthly price in USD per number type. */
export const countryNumbers: CountryNumbers[] = [
  { code: "US", country: "United States", flag: "🇺🇸", region: "Americas", types: { Local: 3, "Toll-free": 5 } },
  { code: "CA", country: "Canada", flag: "🇨🇦", region: "Americas", types: { Local: 3, "Toll-free": 5 } },
  { code: "MX", country: "Mexico", flag: "🇲🇽", region: "Americas", types: { Local: 8, "Toll-free": 25 } },
  { code: "BR", country: "Brazil", flag: "🇧🇷", region: "Americas", types: { Local: 10, "Toll-free": 30 } },
  { code: "GB", country: "United Kingdom", flag: "🇬🇧", region: "Europe", types: { Local: 3, Mobile: 6, "Toll-free": 10 } },
  { code: "DE", country: "Germany", flag: "🇩🇪", region: "Europe", types: { Local: 4, Mobile: 8, "Toll-free": 20 } },
  { code: "FR", country: "France", flag: "🇫🇷", region: "Europe", types: { Local: 4, Mobile: 8, "Toll-free": 20 } },
  { code: "ES", country: "Spain", flag: "🇪🇸", region: "Europe", types: { Local: 4, "Toll-free": 20 } },
  { code: "IT", country: "Italy", flag: "🇮🇹", region: "Europe", types: { Local: 5, "Toll-free": 25 } },
  { code: "NL", country: "Netherlands", flag: "🇳🇱", region: "Europe", types: { Local: 4, Mobile: 8, "Toll-free": 20 } },
  { code: "PL", country: "Poland", flag: "🇵🇱", region: "Europe", types: { Local: 4, Mobile: 7 } },
  { code: "SE", country: "Sweden", flag: "🇸🇪", region: "Europe", types: { Local: 4, Mobile: 8 } },
  { code: "CH", country: "Switzerland", flag: "🇨🇭", region: "Europe", types: { Local: 6, "Toll-free": 30 } },
  { code: "AE", country: "United Arab Emirates", flag: "🇦🇪", region: "Middle East & Africa", types: { "Toll-free": 45 } },
  { code: "ZA", country: "South Africa", flag: "🇿🇦", region: "Middle East & Africa", types: { Local: 6, "Toll-free": 25 } },
  { code: "PK", country: "Pakistan", flag: "🇵🇰", region: "Asia-Pacific", types: { Local: 12 } },
  { code: "IN", country: "India", flag: "🇮🇳", region: "Asia-Pacific", types: { "Toll-free": 35 } },
  { code: "SG", country: "Singapore", flag: "🇸🇬", region: "Asia-Pacific", types: { Local: 15, "Toll-free": 40 } },
  { code: "AU", country: "Australia", flag: "🇦🇺", region: "Asia-Pacific", types: { Local: 5, Mobile: 9, "Toll-free": 20 } },
  { code: "JP", country: "Japan", flag: "🇯🇵", region: "Asia-Pacific", types: { Local: 20, "Toll-free": 50 } },
];
