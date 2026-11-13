/**
 * Egypt bucket list — official, admin-curated activities (seed data).
 * Administrators can create, edit, publish/unpublish and feature activities in the dashboard.
 * Visitors' personal progress is stored separately (on the device, or in their account).
 *
 * Seasonal notes are editorial unless `season.verified` is true with a source.
 */
import type { PhotoKey } from "./images";

export const BUCKET_CATEGORIES = ["history", "adventure", "food", "culture", "nature", "photography", "relaxation", "family", "hidden-gems"] as const;
export type BucketCategory = (typeof BUCKET_CATEGORIES)[number];
export const CATEGORY_LABEL: Record<BucketCategory, string> = {
  history: "History",
  adventure: "Adventure",
  food: "Food",
  culture: "Culture",
  nature: "Nature",
  photography: "Photography",
  relaxation: "Relaxation",
  family: "Family",
  "hidden-gems": "Hidden gems",
};

export type BucketActivity = {
  id: string;
  title: string;
  description: string;
  /** destination slug, or null with a free-text place */
  destination: string | null;
  place?: string;
  categories: BucketCategory[];
  effort: "easy" | "moderate" | "challenging";
  duration: string;
  /** months (1-12) when it is at its best, editorial unless verified */
  bestMonths: number[];
  season?: { note: string; verified: boolean; source?: { name: string; url: string } };
  tips: string[];
  photo: PhotoKey | null;
  /** uploaded photo path in Supabase Storage (overrides `photo` when set) */
  photoPath?: string | null;
  link?: { href: string; label: string };
  published: boolean;
  featured: boolean;
  createdAt: string;
  lastReviewed: string;
};

const D = "2026-11-13";
const base = { published: true, featured: false, createdAt: D, lastReviewed: D };
const COOL = [10, 11, 12, 1, 2, 3, 4];

export const bucketSeed: BucketActivity[] = [
  { ...base, featured: true, id: "luxor-balloon-sunrise", title: "Watch the sun rise over Luxor from a balloon", description: "Drift above the temples, fields and the Nile as the light comes up over the West Bank.", destination: "luxor", categories: ["adventure", "photography"], effort: "easy", duration: "Early start; about 3–4 hours with transfers", bestMonths: COOL, season: { note: "Flights run most of the year but are cancelled in strong wind.", verified: false }, tips: ["Book a licensed operator and ask about their safety record.", "Bring a warm layer — dawn is chilly in winter."], photo: "luxorBalloons" },
  { ...base, featured: true, id: "felucca-aswan", title: "Sail the Nile on a felucca at sunset", description: "No engine, just wind: glide past Elephantine Island and the granite boulders of Aswan.", destination: "aswan", categories: ["relaxation", "culture", "photography"], effort: "easy", duration: "1–2 hours", bestMonths: COOL, tips: ["Agree the price and duration before you set off."], photo: "heroAswan" },
  { ...base, featured: true, id: "red-sea-reef", title: "Dive or snorkel a Red Sea reef", description: "Coral gardens and bright fish a few fins from the shore — no experience needed to snorkel.", destination: "dahab", categories: ["adventure", "nature"], effort: "moderate", duration: "Half day to a full day", bestMonths: [4, 5, 6, 9, 10, 11], tips: ["Dive with a certified centre.", "Use reef-safe sunscreen and never touch the coral."], photo: "sharm" },
  { ...base, featured: true, id: "white-desert-night", title: "Sleep under the stars in the White Desert", description: "Camp among chalk formations that glow at sunset and turn silver under the moon.", destination: "white-desert", categories: ["adventure", "nature", "photography"], effort: "moderate", duration: "1–2 nights, usually from Bahariya Oasis", bestMonths: [10, 11, 12, 1, 2, 3], season: { note: "Desert nights are cold in winter; summer days are very hot.", verified: false }, tips: ["Go with a licensed desert operator.", "Pack warm clothes for the night."], photo: "heroWhiteDesert" },
  { ...base, id: "muizz-street-walk", title: "Walk al-Muizz Street in Historic Cairo", description: "A thousand years of mosques, madrasas and markets along one of Cairo's oldest streets.", destination: "islamic-coptic-cairo", categories: ["history", "culture", "photography"], effort: "easy", duration: "About 3 hours", bestMonths: COOL, tips: ["Dress modestly to enter mosques.", "Follow our 3-hour walking route."], photo: "islamicCairo", link: { href: "/travel-smart#walks", label: "Walking route" } },
  { ...base, id: "abu-simbel", title: "Stand before the temples of Abu Simbel", description: "Ramesses II's great temples, moved stone by stone in the 1960s to escape the rising lake.", destination: "abu-simbel", categories: ["history"], effort: "moderate", duration: "Day trip from Aswan", bestMonths: COOL, tips: ["Most trips leave Aswan before dawn."], photo: "abuSimbel" },
  { ...base, id: "abu-simbel-sun-festival", title: "See the Abu Simbel Sun Festival", description: "Twice a year, sunrise light reaches the statues deep inside the Great Temple.", destination: "abu-simbel", categories: ["history", "culture"], effort: "moderate", duration: "Overnight trip; very early start", bestMonths: [2, 10], season: { note: "Around 22 February and 22 October — exact dates awaiting official confirmation.", verified: false }, tips: ["Expect crowds; arrive early."], photo: "abuSimbel", link: { href: "/discover#calendar", label: "Events calendar" } },
  { ...base, featured: true, id: "eat-koshari", title: "Eat koshari where Cairenes eat it", description: "A busy koshari hall, a steaming bowl, and as much garlic vinegar as you dare.", destination: "cairo", categories: ["food", "culture"], effort: "easy", duration: "30 minutes", bestMonths: [], tips: ["Ask for the sauce and daqqa on the side the first time."], photo: "koshari", link: { href: "/taste/koshari", label: "Koshari recipe" } },
  { ...base, id: "nubian-village", title: "Spend an afternoon in a Nubian village", description: "Colourful houses, Nubian hospitality and a slower pace on the west bank of Aswan.", destination: "nubia", categories: ["culture", "family"], effort: "easy", duration: "Half day", bestMonths: COOL, tips: ["Ask before photographing people and homes."], photo: "nubian" },
  { ...base, id: "siwa-sunset", title: "Watch the sun set over Siwa's salt lakes", description: "Palm groves, still water and a sky that turns every colour at dusk.", destination: "siwa", categories: ["relaxation", "photography", "hidden-gems"], effort: "easy", duration: "An evening", bestMonths: [10, 11, 12, 1, 2, 3], tips: ["Siwa is conservative — dress modestly."], photo: "siwa" },
  { ...base, id: "khan-el-khalili", title: "Lose yourself in Khan el-Khalili", description: "Lanterns, spices, silver and tea — the great market of medieval Cairo.", destination: "islamic-coptic-cairo", categories: ["culture", "food", "photography"], effort: "easy", duration: "2–3 hours", bestMonths: [], tips: ["Bargaining is expected — stay friendly."], photo: "khan", link: { href: "/travel-smart#prices", label: "Fair price guide" } },
  { ...base, id: "cook-egyptian", title: "Learn to cook an Egyptian dish", description: "Make molokhia, koshari or basbousa yourself — at home, or with a local cooking host.", destination: null, place: "Anywhere in Egypt — or at home", categories: ["food", "family"], effort: "easy", duration: "1–3 hours", bestMonths: [], tips: ["Start with ful medames — it takes 25 minutes."], photo: "molokhia", link: { href: "/taste", label: "Recipes" } },
  { ...base, featured: true, id: "giza-golden-hour", title: "See the Pyramids of Giza at golden hour", description: "The last wonder of the ancient world, glowing in the late-afternoon light.", destination: "giza", categories: ["history", "photography"], effort: "easy", duration: "Half day", bestMonths: COOL, tips: ["Check closing time — golden hour can be after last entry in winter."], photo: "heroGiza", link: { href: "/discover#photo", label: "Golden hour finder" } },
  { ...base, id: "mount-sinai-sunrise", title: "Climb Mount Sinai for sunrise", description: "A night walk up the mountain, then dawn over a sea of granite peaks.", destination: null, place: "Mount Sinai, South Sinai", categories: ["adventure", "nature"], effort: "challenging", duration: "Overnight; about 3 hours up", bestMonths: [3, 4, 5, 9, 10, 11], season: { note: "The summit is near freezing on winter nights.", verified: false }, tips: ["Walk with a local Bedouin guide.", "Bring a torch and warm layers."], photo: "sinai" },
  { ...base, id: "wadi-al-hitan", title: "Walk among fossil whales at Wadi Al-Hitan", description: "Skeletons of ancient whales lie in the desert sand of a UNESCO World Heritage Site.", destination: "fayoum", categories: ["nature", "family", "hidden-gems"], effort: "easy", duration: "Full day from Cairo", bestMonths: [10, 11, 12, 1, 2, 3, 4], tips: ["Take plenty of water — there is little shade."], photo: "wadiHitan" },
  { ...base, id: "bibliotheca-alexandrina", title: "Visit the Bibliotheca Alexandrina", description: "A modern library and cultural centre inspired by the ancient Library of Alexandria.", destination: "alexandria", categories: ["culture", "family"], effort: "easy", duration: "2–3 hours", bestMonths: [], tips: ["Check opening times before you go."], photo: "bibAlex" },
  { ...base, id: "karnak-hypostyle", title: "Walk through Karnak's Great Hypostyle Hall", description: "A forest of giant carved columns at the heart of the temple complex.", destination: "luxor", categories: ["history", "photography"], effort: "easy", duration: "2–3 hours", bestMonths: COOL, tips: ["Go early or late to avoid the midday heat."], photo: "luxor" },
  { ...base, id: "ahwa-mint-tea", title: "Drink mint tea at a traditional ahwa", description: "Sit back with tea, backgammon and the sounds of the street — Cairo's living room.", destination: "cairo", categories: ["culture", "relaxation"], effort: "easy", duration: "As long as you like", bestMonths: [], tips: ["Order “shai bi-na'na'” — tea with mint."], photo: "azhar" },
];

/** Badges earned from completed activity ids. Pure, so the same logic works on the device and the server. */
export type Badge = { id: string; title: string; detail: string; earned: boolean; progress: [number, number] };

export function badgesFor(done: string[], activities: BucketActivity[]): Badge[] {
  const pub = activities.filter((a) => a.published);
  const doneSet = new Set(done.filter((id) => pub.some((a) => a.id === id)));
  const n = doneSet.size,
    total = pub.length;
  const milestones: Badge[] = [
    { id: "first", title: "First stamp", detail: "Complete your first experience", earned: n >= 1, progress: [Math.min(n, 1), 1] },
    { id: "five", title: "Five wonders", detail: "Complete five experiences", earned: n >= 5, progress: [Math.min(n, 5), 5] },
    { id: "half", title: "Halfway there", detail: "Complete half of the list", earned: total > 0 && n >= Math.ceil(total / 2), progress: [Math.min(n, Math.ceil(total / 2)), Math.ceil(total / 2)] },
    { id: "all", title: "The grand tour", detail: "Complete every experience", earned: total > 0 && n === total, progress: [n, total] },
  ];
  const cats: Badge[] = BUCKET_CATEGORIES.flatMap((c) => {
    const inCat = pub.filter((a) => a.categories.includes(c));
    if (inCat.length < 3) return [];
    const got = inCat.filter((a) => doneSet.has(a.id)).length;
    return [{ id: `cat-${c}`, title: `${CATEGORY_LABEL[c]} collector`, detail: `Complete all ${inCat.length} ${CATEGORY_LABEL[c].toLowerCase()} experiences`, earned: got === inCat.length, progress: [got, inCat.length] as [number, number] }];
  });
  return [...milestones, ...cats];
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Oct–Apr" or "Apr–Jun, Sep–Nov": contiguous runs, wrapping over the new year. */
export function monthRanges(months: number[]): string {
  const set = new Set(months.filter((m) => m >= 1 && m <= 12));
  if (set.size === 0) return "";
  if (set.size === 12) return "All year";
  // start each run at a month whose predecessor is not included
  const prev = (m: number) => (m === 1 ? 12 : m - 1);
  const next = (m: number) => (m === 12 ? 1 : m + 1);
  const runs: string[] = [];
  for (let m = 1; m <= 12; m++) {
    if (!set.has(m) || set.has(prev(m))) continue;
    let end = m;
    while (set.has(next(end)) && next(end) !== m) end = next(end);
    runs.push(end === m ? MON[m - 1] : `${MON[m - 1]}–${MON[end - 1]}`);
  }
  return runs.join(", ");
}
