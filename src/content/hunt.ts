/**
 * Egypt Memory Hunt — challenges that turn sightseeing into memories.
 *
 * Challenges are things to notice, taste or photograph. Completing one means saving a memory
 * (a photo and/or a few words) against it; it is self-reported, never verified by location.
 * Tips stick to practical, uncontroversial advice — no invented history.
 */
import type { PhotoKey } from "./images";

export const HUNT_CATEGORIES = ["landmark", "hieroglyphs", "food", "market", "sunset", "hidden-detail"] as const;
export type HuntCategory = (typeof HUNT_CATEGORIES)[number];
export const HUNT_CATEGORY_LABEL: Record<HuntCategory, string> = {
  landmark: "Landmarks",
  hieroglyphs: "Hieroglyphs",
  food: "Food",
  market: "Markets",
  sunset: "Sunsets & sunrises",
  "hidden-detail": "Hidden details",
};

export const AUDIENCES = ["families", "couples", "solo"] as const;
export type Audience = (typeof AUDIENCES)[number];
export const AUDIENCE_LABEL: Record<Audience, string> = { families: "Families", couples: "Couples", solo: "Solo travellers" };

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTY_POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 30 };

export type Challenge = {
  id: string;
  title: string;
  /** what to find, taste or capture */
  prompt: string;
  destination: string;
  category: HuntCategory;
  difficulty: Difficulty;
  minutes: number;
  audiences: Audience[];
  tip: string;
  photo: PhotoKey;
  link?: { href: string; label: string };
};

const ALL: Audience[] = ["families", "couples", "solo"];

export const challenges: Challenge[] = [
  { id: "giza-panorama", title: "All nine pyramids in one frame", prompt: "Find a spot on the Giza plateau where you can fit the pyramids into a single photo.", destination: "giza", category: "landmark", difficulty: "medium", minutes: 60, audiences: ALL, tip: "The panorama viewpoint south-west of the pyramids is the classic spot. Go early for softer light.", photo: "giza" },
  { id: "giza-scale", title: "Feel the scale", prompt: "Stand beside one block at the base of the Great Pyramid and capture how big it is next to you.", destination: "giza", category: "landmark", difficulty: "easy", minutes: 20, audiences: ALL, tip: "Climbing the pyramids is not allowed — the base is close enough.", photo: "heroGiza", link: { href: "/watch/great-pyramid-how", label: "How it was built" } },
  { id: "karnak-cartouche", title: "Spot a royal cartouche", prompt: "Find an oval ring around hieroglyphs — a cartouche holding a king's name — on a temple wall or column.", destination: "luxor", category: "hieroglyphs", difficulty: "medium", minutes: 45, audiences: ALL, tip: "Learn to read a few signs first, then try to make out a letter or two.", photo: "cartouche", link: { href: "/hieroglyphs#learn", label: "Hieroglyph explorer" } },
  { id: "luxor-ankh", title: "Find an ankh", prompt: "Find the ankh sign — the looped cross meaning “life” — carved in a temple.", destination: "luxor", category: "hieroglyphs", difficulty: "easy", minutes: 30, audiences: ["families", "solo", "couples"], tip: "Gods are often shown holding it. Look at their hands.", photo: "ankh", link: { href: "/hieroglyphs#learn", label: "Meet the signs" } },
  { id: "luxor-balloon", title: "Dawn over the West Bank", prompt: "Watch the sunrise over Luxor's West Bank — from a balloon, a rooftop or the riverbank.", destination: "luxor", category: "sunset", difficulty: "hard", minutes: 180, audiences: ["couples", "solo"], tip: "Balloon flights start before dawn and depend on the weather — book with a licensed operator.", photo: "luxorBalloons" },
  { id: "aswan-felucca", title: "A felucca at sunset", prompt: "Sail the Nile on a felucca as the sun goes down behind the West Bank hills.", destination: "aswan", category: "sunset", difficulty: "easy", minutes: 90, audiences: ALL, tip: "Agree the price and duration with the captain before you set off.", photo: "felucca" },
  { id: "aswan-nilometer", title: "Read the river", prompt: "Find the nilometer on Elephantine Island and photograph the measuring marks on its walls.", destination: "aswan", category: "hidden-detail", difficulty: "medium", minutes: 60, audiences: ALL, tip: "Watch our short film on the Nile's seasons first — it explains why the marks mattered.", photo: "nilometer", link: { href: "/watch/nile-three-seasons", label: "Three seasons of the Nile" } },
  { id: "aswan-karkade", title: "Taste karkade", prompt: "Try a glass of karkade, the deep-red hibiscus drink — hot or iced.", destination: "aswan", category: "food", difficulty: "easy", minutes: 15, audiences: ALL, tip: "It is naturally tart; ask for less sugar if you prefer.", photo: "karkade", link: { href: "/taste/karkade", label: "Karkade recipe" } },
  { id: "aswan-souk", title: "Spice-market colours", prompt: "Capture the colours of a spice stall in Aswan's market.", destination: "aswan", category: "market", difficulty: "easy", minutes: 45, audiences: ALL, tip: "Ask before photographing people and their stalls.", photo: "spiceMarket" },
  { id: "nubian-door", title: "A painted Nubian door", prompt: "Find a brightly painted door or wall in a Nubian village.", destination: "nubia", category: "hidden-detail", difficulty: "easy", minutes: 30, audiences: ALL, tip: "These are people's homes — ask before you photograph.", photo: "nubianDoor" },
  { id: "abu-simbel-colossi", title: "Four seated kings", prompt: "Photograph the four seated colossi of Ramesses II at the Great Temple.", destination: "abu-simbel", category: "landmark", difficulty: "hard", minutes: 180, audiences: ALL, tip: "It is a long day trip from Aswan. Bring water and a hat.", photo: "abuSimbel", link: { href: "/watch/moving-abu-simbel", label: "How the temples were moved" } },
  { id: "cairo-koshari", title: "Koshari like a Cairene", prompt: "Eat a bowl of koshari at a busy koshari shop.", destination: "cairo", category: "food", difficulty: "easy", minutes: 30, audiences: ALL, tip: "Ask for the spicy sauce and garlic vinegar on the side the first time.", photo: "koshari", link: { href: "/taste/koshari", label: "Koshari recipe" } },
  { id: "cairo-ful", title: "A ful breakfast", prompt: "Start the day like many Egyptians: ful medames with bread.", destination: "cairo", category: "food", difficulty: "easy", minutes: 30, audiences: ALL, tip: "Street carts serve it early in the morning.", photo: "ful", link: { href: "/taste/ful-medames", label: "Ful recipe" } },
  { id: "khan-lantern", title: "Lantern light", prompt: "Find a shop of glowing lanterns in Khan el-Khalili.", destination: "islamic-coptic-cairo", category: "market", difficulty: "easy", minutes: 60, audiences: ALL, tip: "Bargaining is expected — stay friendly and check our fair price guide.", photo: "lanterns", link: { href: "/travel-smart#prices", label: "Fair price guide" } },
  { id: "cairo-mashrabiya", title: "Through the mashrabiya", prompt: "Find a mashrabiya — a carved wooden window screen — in historic Cairo.", destination: "islamic-coptic-cairo", category: "hidden-detail", difficulty: "medium", minutes: 60, audiences: ["couples", "solo"], tip: "Look up as you walk along al-Muizz Street.", photo: "mashrabiya" },
  { id: "alex-qaitbay", title: "Sea wind at Qaitbay", prompt: "Photograph the Citadel of Qaitbay from the Corniche.", destination: "alexandria", category: "landmark", difficulty: "easy", minutes: 45, audiences: ALL, tip: "The walk along the Corniche is best in the late afternoon.", photo: "qaitbay" },
  { id: "alex-sayadeya", title: "Fisherman's rice", prompt: "Try sayadeya, Alexandria's spiced fish and rice.", destination: "alexandria", category: "food", difficulty: "easy", minutes: 60, audiences: ALL, tip: "Many seafood places let you choose your fish by weight.", photo: "sayadeya", link: { href: "/taste/sayadeya", label: "Sayadeya recipe" } },
  { id: "siwa-salt-sunset", title: "Salt-lake sunset", prompt: "Watch the sun set over Siwa's salt lakes.", destination: "siwa", category: "sunset", difficulty: "medium", minutes: 90, audiences: ["couples", "solo"], tip: "Siwa is conservative — dress modestly.", photo: "siwa" },
  { id: "dahab-sunrise", title: "Sunrise over the Gulf", prompt: "Watch the sun rise over the Gulf of Aqaba from Dahab's shore.", destination: "dahab", category: "sunset", difficulty: "easy", minutes: 45, audiences: ALL, tip: "Dahab faces east, so mornings are the time for this one.", photo: "dahab" },
  { id: "saqqara-steps", title: "The first pyramid", prompt: "Photograph Djoser's Step Pyramid at Saqqara.", destination: "saqqara", category: "landmark", difficulty: "medium", minutes: 120, audiences: ALL, tip: "Combine it with Dahshur's Red Pyramid on the same day.", photo: "saqqara" },
];

export function challengeById(id: string | null | undefined) {
  return id ? challenges.find((c) => c.id === id) : undefined;
}

export type Achievement = { id: string; title: string; detail: string; earned: boolean; progress: [number, number] };

/**
 * Points and achievements from the set of completed challenge ids and the number of memories saved.
 * Pure: the same result on the device, in tests and in the PDF album.
 */
export function huntStats(completedIds: string[], memoryCount: number, list: Challenge[] = challenges) {
  const done = list.filter((c) => completedIds.includes(c.id));
  const points = done.reduce((n, c) => n + DIFFICULTY_POINTS[c.difficulty], 0);
  const places = new Set(done.map((c) => c.destination)).size;
  const cats = new Set(done.map((c) => c.category));
  const inCat = (cat: HuntCategory) => [done.filter((c) => c.category === cat).length, list.filter((c) => c.category === cat).length] as [number, number];
  const cap = (n: number, of: number): [number, number] => [Math.min(n, of), of];
  const achievements: Achievement[] = [
    { id: "first-memory", title: "First memory", detail: "Save your first memory", earned: memoryCount >= 1, progress: cap(memoryCount, 1) },
    { id: "five-challenges", title: "Treasure hunter", detail: "Complete five challenges", earned: done.length >= 5, progress: cap(done.length, 5) },
    { id: "three-places", title: "On the road", detail: "Complete challenges in three destinations", earned: places >= 3, progress: cap(places, 3) },
    { id: "all-kinds", title: "Curious mind", detail: "Complete one challenge of every kind", earned: cats.size === HUNT_CATEGORIES.length, progress: [cats.size, HUNT_CATEGORIES.length] },
    { id: "food", title: "Taste of Egypt", detail: "Complete every food challenge", earned: inCat("food")[0] === inCat("food")[1], progress: inCat("food") },
    { id: "scribe", title: "Young scribe", detail: "Complete every hieroglyph challenge", earned: inCat("hieroglyphs")[0] === inCat("hieroglyphs")[1], progress: inCat("hieroglyphs") },
    { id: "golden-hour", title: "Golden hour", detail: "Complete every sunset and sunrise challenge", earned: inCat("sunset")[0] === inCat("sunset")[1], progress: inCat("sunset") },
    { id: "all", title: "Keeper of memories", detail: "Complete every challenge", earned: done.length === list.length, progress: [done.length, list.length] },
  ];
  return { points, completed: done.length, total: list.length, places, achievements, maxPoints: list.reduce((n, c) => n + DIFFICULTY_POINTS[c.difficulty], 0) };
}
