/**
 * Time-sensitive information. Every entry carries a status:
 *  - "verified": checked against the named source on `lastVerified`
 *  - "estimate": editorial estimate, shown with a clear label
 *  - "awaiting": not yet verified; the UI shows "Awaiting verification"
 */
export type Status = "verified" | "estimate" | "awaiting";
export type Sourced = { status: Status; lastVerified: string | null; source?: { name: string; url: string } };

const GOVUK = { name: "GOV.UK Foreign travel advice — Egypt", url: "https://www.gov.uk/foreign-travel-advice/egypt/getting-help" };
const CAIRO_GOV = {
  name: "Cairo Governorate — metro fare announcement (Mar 2026)",
  url: "https://cairo.gov.eg/en/news/news-eng/2026/374fc0a6e09f4eecb850e5aa7b859abe",
};

export const emergencyNumbers: ({ service: string; number: string; note: string } & Sourced)[] = [
  { service: "Tourist Police", number: "126", note: "English-speaking help for scams, harassment or lost documents", status: "verified", lastVerified: "2026-11-12", source: GOVUK },
  { service: "Police", number: "122", note: "Crime or immediate danger", status: "verified", lastVerified: "2026-11-12", source: GOVUK },
  { service: "Ambulance", number: "123", note: "Medical emergencies", status: "verified", lastVerified: "2026-11-12", source: GOVUK },
  { service: "Fire", number: "180", note: "Fire and rescue", status: "verified", lastVerified: "2026-11-12", source: GOVUK },
];

export const embassies = [
  { country: "United Kingdom", url: "https://www.gov.uk/world/organisations/british-embassy-cairo" },
  { country: "United States", url: "https://eg.usembassy.gov/" },
  { country: "Germany", url: "https://kairo.diplo.de/" },
  { country: "France", url: "https://eg.ambafrance.org/" },
  { country: "Other countries", url: "https://www.mfa.gov.eg/" },
].map((e) => ({ ...e, status: "awaiting" as Status, note: "Official embassy website — contact details are kept on the embassy's own page." }));

export type Price = {
  id: string;
  item: string;
  egp: [number, number];
  kind: "official" | "estimate";
} & Sourced;

export const prices: Price[] = [
  { id: "metro-9", item: "Cairo Metro ticket, up to 9 stations", egp: [10, 10], kind: "official", status: "verified", lastVerified: "2026-11-12", source: CAIRO_GOV },
  { id: "metro-16", item: "Cairo Metro ticket, up to 16 stations", egp: [12, 12], kind: "official", status: "verified", lastVerified: "2026-11-12", source: CAIRO_GOV },
  { id: "metro-23", item: "Cairo Metro ticket, up to 23 stations", egp: [15, 15], kind: "official", status: "verified", lastVerified: "2026-11-12", source: CAIRO_GOV },
  { id: "metro-39", item: "Cairo Metro ticket, more than 23 stations", egp: [20, 20], kind: "official", status: "verified", lastVerified: "2026-11-12", source: CAIRO_GOV },
  { id: "water", item: "Bottled water, 1.5 L (shop)", egp: [10, 20], kind: "estimate", status: "estimate", lastVerified: "2026-11-12" },
  { id: "koshari", item: "Koshari, medium bowl", egp: [40, 120], kind: "estimate", status: "estimate", lastVerified: "2026-11-12" },
  { id: "taxi-short", item: "Short ride-hailing trip in central Cairo", egp: [60, 150], kind: "estimate", status: "estimate", lastVerified: "2026-11-12" },
  { id: "sim", item: "Tourist SIM card with data", egp: [300, 800], kind: "estimate", status: "estimate", lastVerified: "2026-11-12" },
  { id: "tea", item: "Tea at a local ahwa (café)", egp: [15, 40], kind: "estimate", status: "estimate", lastVerified: "2026-11-12" },
];

export const monumentTickets = {
  note: "Monument and museum ticket prices change regularly. We link to the official Ministry of Tourism and Antiquities ticketing site rather than copy prices that may be out of date.",
  url: "https://egymonuments.gov.eg/",
  status: "awaiting" as Status,
};

/** Typical daytime highs (°C) — approximate climate normals, awaiting verification against the Egyptian Meteorological Authority. */
export const climate = {
  status: "awaiting" as Status,
  note: "Approximate typical daytime highs. Awaiting verification against the Egyptian Meteorological Authority.",
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  cairo: [19, 21, 24, 28, 32, 34, 35, 35, 33, 30, 25, 21],
  luxor: [23, 25, 29, 34, 39, 41, 41, 41, 39, 35, 29, 24],
  hurghada: [22, 23, 25, 28, 31, 33, 34, 34, 32, 30, 27, 23],
  /** 1 = quiet … 3 = busy. Editorial guide based on typical tourism seasons. */
  crowds: [3, 3, 3, 3, 2, 1, 2, 2, 1, 2, 3, 3],
};

export type EventItem = {
  id: string;
  name: string;
  where: string;
  when: string;
  dateISO: string | null;
  description: string;
} & Sourced;

export const events: EventItem[] = [
  { id: "coptic-christmas", name: "Coptic Christmas", where: "Nationwide", when: "7 January (every year)", dateISO: "2027-01-07", description: "Midnight services in Coptic churches. A paid public holiday (the 2027 government decree is not published yet).", status: "verified", lastVerified: "2026-11-13", source: { name: "Africanews — Egypt declares 7 January a paid public holiday (Jan 2026)", url: "https://www.africanews.com/2026/01/06/egypt-declares-paid-public-holiday-for-christmas-on-january-7" } },
  { id: "sun-feb", name: "Abu Simbel Sun Festival", where: "Abu Simbel", when: "Around 22 February", dateISO: "2027-02-22", description: "At sunrise, light reaches the statues in the inner sanctuary of the Great Temple.", status: "awaiting", lastVerified: null },
  { id: "ramadan", name: "Ramadan", where: "Nationwide", when: "Expected to begin around 8 February 2027", dateISO: "2027-02-08", description: "The holy month of fasting. Exact dates depend on the moon sighting and are announced officially.", status: "awaiting", lastVerified: null },
  { id: "sham", name: "Sham el-Nessim", where: "Nationwide", when: "The Monday after Coptic Easter", dateISO: null, description: "An ancient spring festival: families picnic in parks and along the Nile.", status: "awaiting", lastVerified: null },
  { id: "sun-oct", name: "Abu Simbel Sun Festival", where: "Abu Simbel", when: "Around 22 October", dateISO: "2027-10-22", description: "The second yearly alignment of sunlight inside the temple.", status: "awaiting", lastVerified: null },
  { id: "ciff", name: "Cairo International Film Festival", where: "Cairo Opera House", when: "Usually November — dates awaiting announcement", dateISO: null, description: "One of the Arab world's oldest film festivals.", status: "awaiting", lastVerified: null },
];

export const ramadanGuide = [
  "Many restaurants close during the day and open at sunset (iftar). Hotels and tourist areas usually stay open.",
  "Opening hours of sites and offices are often shorter — check before you go.",
  "Traffic is heavy just before sunset as everyone heads home for iftar.",
  "Evenings are lively: try Ramadan tents, lanterns (fanous) and special sweets like konafa and qatayef.",
  "Greeting: 'Ramadan kareem' (Ramadan is generous). Reply: 'Allahu akram'.",
];

export const metroGuide = {
  ...({ status: "verified", lastVerified: "2026-11-12", source: CAIRO_GOV } satisfies Sourced),
  points: [
    "Three metro lines serve Greater Cairo. Fares depend on how many stations you travel.",
    "The middle carriages of each train are reserved for women (look for the signs on the platform). Women can also ride in any other carriage.",
    "Keep your ticket until you exit — you need it at the gate.",
    "Avoid rush hours (around 7–10am and 2–6pm) if you have luggage.",
  ],
};

export const accessibility = {
  status: "awaiting" as Status,
  intro:
    "We only describe a place as accessible when we have reliable, recent evidence. For most sites, access information is still awaiting verification with site management.",
  general: [
    "Many ancient sites have uneven ground, sand and steep steps. Contact sites before visiting to ask about ramps and paths.",
    "Newer museums tend to be designed with lifts and step-free routes — confirm with the museum before your visit.",
    "Strollers: a lightweight, foldable stroller or a baby carrier is easier on uneven pavements.",
    "Specialised accessible tour operators can arrange adapted transport and assistance.",
  ],
  sites: [
    { name: "Grand Egyptian Museum", detail: "Modern building — step-free access information awaiting verification with the museum." },
    { name: "Giza Plateau", detail: "Sandy, uneven terrain. Specific accessible routes awaiting verification." },
    { name: "Karnak Temple", detail: "Large, mostly flat site with some uneven paving. Awaiting verification." },
  ],
};

export const soloWomen = [
  "Dress modestly in cities to reduce unwanted attention.",
  "Use ride-hailing apps that share your trip and driver details.",
  "Women-only metro carriages are available on every Cairo Metro train.",
  "A firm 'la' shukran' (no thank you) and keep walking usually ends unwanted conversations.",
  "Save Tourist Police: 126. Report harassment to them or any police officer.",
];

export const packingDefaults = [
  "Passport (valid for 6+ months)",
  "Visa or e-visa confirmation",
  "Travel insurance documents",
  "Light long-sleeved clothing",
  "Scarf (for mosques and sun)",
  "Sun hat and sunglasses",
  "High-SPF sunscreen",
  "Comfortable walking shoes",
  "Reusable water bottle",
  "Small cash notes for tips",
  "Power adapter (Type C/F)",
  "Basic medicines & rehydration salts",
];

export const routes = [
  { from: "Cairo", to: "Luxor", options: "Flight about 1 hour; sleeper or day train roughly 9–10 hours.", status: "awaiting" as Status },
  { from: "Luxor", to: "Aswan", options: "Train about 3 hours; Nile cruise usually 3–4 nights.", status: "awaiting" as Status },
  { from: "Cairo", to: "Alexandria", options: "Train about 2.5–3 hours.", status: "awaiting" as Status },
  { from: "Cairo", to: "Hurghada", options: "Flight about 1 hour; bus roughly 6–7 hours.", status: "awaiting" as Status },
  { from: "Aswan", to: "Abu Simbel", options: "Road about 3.5 hours each way.", status: "awaiting" as Status },
  { from: "Cairo", to: "Siwa", options: "Long road trip, usually via Marsa Matrouh; roughly 9–10 hours.", status: "awaiting" as Status },
];
