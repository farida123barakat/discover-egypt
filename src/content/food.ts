/**
 * Taste Egypt — regions, regional dishes and recipes.
 *
 * Provenance rules (see docs/DATASETS.md):
 * - A regional association is "sourced" only when a published source links the dish to the place; the source is
 *   stored with it. Otherwise it is "editorial" (widely eaten across Egypt, stated without a regional claim).
 * - Regional association is NOT restaurant availability. No restaurant is listed until it has been verified.
 * - Recipes are AI-assisted editorial drafts of common home methods. They are not presented as historical or
 *   "authentic" recipes. Drafts are hidden on the live site until an editor approves them (they are shown,
 *   clearly labelled, in local demo mode so the feature can be reviewed).
 */
import type { PhotoKey } from "./images";

export type Source = { name: string; url: string };
export type RegionId = "cairo" | "alexandria" | "upper-egypt" | "nubia" | "sinai-red-sea" | "western-desert";

export type Region = {
  id: RegionId;
  name: string;
  arabic: string;
  intro: string;
  destinations: string[];
  photo: PhotoKey;
};

export type RegionalDish = {
  slug: string;
  name: string;
  arabic: string;
  regions: RegionId[];
  what: string;
  association: { status: "sourced" | "editorial"; note: string; sources: Source[] };
  recipe?: string;
  photo?: PhotoKey;
  vegetarian: "yes" | "no" | "often";
};

export type Allergen = "gluten" | "milk" | "egg" | "fish" | "sesame" | "nuts" | "celery";
export type Ingredient = { qty: number | null; unit?: string; item: string; note?: string };
export type Recipe = {
  slug: string;
  name: string;
  arabic: string;
  regions: RegionId[];
  photo?: PhotoKey;
  summary: string;
  background: string;
  serves: number;
  servesLabel?: string;
  prepMin: number;
  cookMin: number;
  /** extra hands-off time such as soaking or resting, in minutes */
  waitMin?: number;
  difficulty: "easy" | "medium" | "involved";
  diet: "vegan" | "vegetarian" | "meat" | "fish";
  allergens: Allergen[];
  ingredients: { group?: string; items: Ingredient[] }[];
  steps: string[];
  tips: string[];
  provenance: { kind: "ai-assisted-draft"; note: string; compare: Source[] };
  review: { status: "draft" | "approved"; lastReviewed: string; reviewer?: string };
};

const DRAFT = { status: "draft", lastReviewed: "2026-11-13" } as const;
const AI = (compare: Source[] = []) =>
  ({ kind: "ai-assisted-draft", note: "Editorial draft written with AI assistance from common home-cooking methods. Not taken from a single published recipe, and not presented as a historical recipe.", compare }) as const;

const S = {
  sandy: { name: "Sandy Times — street food guide to Alexandria", url: "https://sandytimes.ae/articles/3071/city-of-kings-street-food-guide-to-alexandria" },
  scoop: { name: "Scoop Empire — Alexandrian dishes", url: "https://scoopempire.com/100-alexandrian-the-dishes-that-set-this-coastal-city-apart" },
  sunheron: { name: "Sunheron — What to eat in Alexandria", url: "https://sunheron.com/blog/cuisine/what-to-eat-in-alexandria/" },
  tableyaKabed: { name: "Tableya — The breads of Egypt: Kabed", url: "https://tableya.net/recipes/kabed-flatbread-recipe" },
  babmsr: { name: "Bab Masr — Nubian dishes with the taste of heritage", url: "https://babmsr.com/en/?p=5415" },
  travelweekly: { name: "Travel Weekly — A taste of Nubian home cooking (Aswan)", url: "https://www.travelweekly.com/Blogs/Dispatch/A-taste-of-Nubian-home-cooking" },
  hidmcSinai: { name: "Hi DMC — Bedouin food culture in Sinai", url: "https://www.hidmc.com/blog-posts/bedouin-food-culture-in-sinai" },
  lightfoot: { name: "Lightfoot Travel — Baking with Bedouins in the Sinai", url: "https://www.lightfoottravel.com/uk/travelbylightfoot/baking-bedouins-sinai-desert" },
  worldfoodist: { name: "World Foodist — Bedouin fish (Sinai)", url: "https://www.worldfoodist.com/2012/07/07/bedouin-fish/" },
  egypttoday: { name: "Egypt Today — The Oases", url: "https://www.egypttoday.com/Article/6/1155/The-Oases" },
  fodorsSiwa: { name: "Fodor's — Siwa restaurants", url: "https://www.fodors.com/world/africa-and-middle-east/egypt/western-desert-oases/restaurants/siwa" },
  atlas: { name: "Atlas Obscura — Siwa Oasis dates", url: "https://www.atlasobscura.com/foods/siwa-oasis-dates" },
  rawi: { name: "Rawi Magazine — Egypt's endangered foods (Slow Food Ark of Taste)", url: "https://rawi-publishing.com/articles/going,-going,-gone" },
  secretSharm: { name: "Secret Flying — Sharm El Sheikh food guide", url: "https://www.secretflying.com/?p=694689" },
};

export const regions: Region[] = [
  { id: "cairo", name: "Cairo, Giza & Fayoum", arabic: "القاهرة والجيزة والفيوم", intro: "The capital eats on the move: breakfast carts, koshari halls and late-night bakeries. Most national classics are easiest to find here.", destinations: ["cairo", "giza", "saqqara", "islamic-coptic-cairo", "fayoum"], photo: "khan" },
  { id: "alexandria", name: "Alexandria & the Mediterranean", arabic: "الإسكندرية", intro: "A port city with a fisherman's appetite. Seafood, spiced rice and a liver sandwich that carries the city's name.", destinations: ["alexandria"], photo: "alexandria" },
  { id: "upper-egypt", name: "Luxor & Upper Egypt", arabic: "الأقصر والصعيد", intro: "Farm country along the Nile, where bread rises in the sun and meals are shared from one big tray.", destinations: ["luxor"], photo: "luxor" },
  { id: "nubia", name: "Aswan & Nubia", arabic: "أسوان والنوبة", intro: "Nubian kitchens bake thin breads on a steel plate and cook stews to share. Many dishes are only made at home — a family meal is the best way to taste them.", destinations: ["aswan", "nubia", "abu-simbel"], photo: "nubian" },
  { id: "sinai-red-sea", name: "Sinai & the Red Sea", arabic: "سيناء والبحر الأحمر", intro: "Bedouin cooking is built on bread, fire and hospitality — plus fresh fish from the reef coast.", destinations: ["dahab", "sharm-el-sheikh", "hurghada", "marsa-alam"], photo: "sinai" },
  { id: "western-desert", name: "Siwa & the Western Desert", arabic: "سيوة والصحراء الغربية", intro: "Oasis food leans on dates, olives and preserving — what grows in the gardens, and what keeps in the heat.", destinations: ["siwa", "white-desert"], photo: "siwa" },
];

const NATION = (note = "Eaten across Egypt; easiest to find in cities.") => ({ status: "editorial" as const, note, sources: [] });

export const regionalDishes: RegionalDish[] = [
  // ---- National classics (shown everywhere, strongest in Cairo) ----
  { slug: "koshari", name: "Koshari", arabic: "كشري", regions: ["cairo"], what: "Rice, lentils and pasta under tomato sauce, garlic vinegar and crispy onions.", association: NATION("A national street food, served in dedicated koshari restaurants across Egypt."), recipe: "koshari", photo: "koshari", vegetarian: "yes" },
  { slug: "ful-medames", name: "Ful medames", arabic: "فول مدمس", regions: ["cairo"], what: "Slow-cooked fava beans with oil, cumin and lemon — the national breakfast.", association: NATION(), recipe: "ful-medames", photo: "ful", vegetarian: "yes" },
  { slug: "taameya", photo: "taameya", name: "Taameya", arabic: "طعمية", regions: ["cairo"], what: "Egypt's falafel, made from fava beans and plenty of green herbs.", association: NATION(), recipe: "taameya", vegetarian: "yes" },
  { slug: "hawawshi", photo: "hawawshi", name: "Hawawshi", arabic: "حواوشي", regions: ["cairo"], what: "Spiced minced meat baked inside bread until crisp.", association: NATION("A street food found in cities across Egypt."), recipe: "hawawshi", vegetarian: "no" },
  { slug: "molokhia", name: "Molokhia", arabic: "ملوخية", regions: ["cairo", "upper-egypt"], what: "A silky green soup of jute leaves with garlic and coriander.", association: NATION("Cooked in homes across Egypt."), recipe: "molokhia", photo: "molokhia", vegetarian: "often" },
  { slug: "basbousa", name: "Basbousa", arabic: "بسبوسة", regions: ["cairo"], what: "Semolina cake soaked in syrup.", association: NATION("Sold in sweet shops across Egypt."), recipe: "basbousa", photo: "basbousa", vegetarian: "yes" },
  { slug: "karkade", name: "Karkade", arabic: "كركديه", regions: ["cairo", "nubia", "upper-egypt"], what: "Deep-red hibiscus tea, iced in summer and hot in winter.", association: NATION("Drunk across Egypt; hibiscus is widely sold in Aswan's markets."), recipe: "karkade", photo: "karkade", vegetarian: "yes" },

  // ---- Alexandria ----
  { slug: "sayadeya", photo: "sayadeya", name: "Sayadeya", arabic: "صيادية", regions: ["alexandria", "sinai-red-sea"], what: "White fish over rice browned with deeply caramelised onions.", association: { status: "sourced", note: "Described as a signature Alexandrian dish; also served along the Red Sea coast.", sources: [S.sandy, S.sunheron, S.secretSharm] }, recipe: "sayadeya", vegetarian: "no" },
  { slug: "kebda-eskandarani", photo: "kebda", name: "Kebda eskandarani", arabic: "كبدة إسكندراني", regions: ["alexandria"], what: "Thin-sliced liver flash-fried with garlic, cumin and green chilli — the name means “Alexandrian liver”.", association: { status: "sourced", note: "A street food so tied to Alexandria that it carries the city's name.", sources: [S.sandy, S.scoop] }, recipe: "kebda-eskandarani", vegetarian: "no" },

  // ---- Upper Egypt ----
  { slug: "eish-shamsi", name: "Eish shamsi (sun bread)", arabic: "عيش شمسي", regions: ["upper-egypt", "nubia"], what: "A sourdough bread left to rise in the sun.", association: { status: "sourced", note: "Described as a bread popular in Upper Egypt, served at a Nubian home dinner in Aswan.", sources: [S.travelweekly] }, vegetarian: "yes" },

  // ---- Nubia ----
  { slug: "kabed", name: "Kabed (doka bread)", arabic: "كابد", regions: ["nubia"], what: "A thin Nubian bread cooked quickly on a steel plate called a doka.", association: { status: "sourced", note: "Documented as a common Nubian bread, so linked to the doka plate that some call it “doka bread”.", sources: [S.tableyaKabed] }, vegetarian: "yes" },
  { slug: "jakoud", name: "Jakoud", arabic: "جاكود", regions: ["nubia"], what: "Nubian molokhia poured over torn bread and eaten by hand.", association: { status: "sourced", note: "Described in a feature on Nubian Ramadan dishes.", sources: [S.babmsr] }, vegetarian: "often" },

  // ---- Sinai & Red Sea ----
  { slug: "zarb", name: "Zarb", arabic: "زرب", regions: ["sinai-red-sea"], what: "Meat and vegetables slow-cooked for hours in a sealed pot buried in hot coals and sand.", association: { status: "sourced", note: "A signature Bedouin dish of Sinai, often served at desert dinners.", sources: [S.hidmcSinai, S.secretSharm] }, vegetarian: "no" },
  { slug: "bedouin-bread", photo: "bedouinBread", name: "Bedouin flatbread", arabic: "عيش بدوي", regions: ["sinai-red-sea"], what: "Flour, water and salt, cooked on a domed plate or under the embers of a fire.", association: { status: "sourced", note: "Bread baked over fire is central to Bedouin meals in Sinai.", sources: [S.hidmcSinai, S.lightfoot, S.worldfoodist] }, recipe: "bedouin-flatbread", vegetarian: "yes" },

  // ---- Siwa & Western Desert ----
  { slug: "siwa-dates", name: "Siwan dates & olive oil", arabic: "تمر وزيت زيتون سيوة", regions: ["western-desert"], what: "Many varieties of dates and rich local olive oil from the oasis gardens.", association: { status: "sourced", note: "Dates are a staple of traditional Siwan food; Siwa's olive oil is widely praised.", sources: [S.egypttoday, S.fodorsSiwa, S.atlas] }, photo: "siwaPalms", vegetarian: "yes" },
  { slug: "aqrit", name: "Aqrit", arabic: "عقريت", regions: ["western-desert"], what: "Salted, dried cubes of meat — a way to keep meat in the desert heat.", association: { status: "sourced", note: "Listed as typical of Siwa in Slow Food's Ark of Taste, as reported by Rawi.", sources: [S.rawi] }, vegetarian: "no" },
];

export const recipes: Recipe[] = [
  {
    slug: "koshari", name: "Koshari", arabic: "كشري", regions: ["cairo"], photo: "koshari",
    summary: "Rice, lentils and pasta with spiced tomato sauce, garlic vinegar and crispy onions.",
    background: "Koshari is one of Egypt's best-loved street foods, served in busy restaurants that make nothing else. Everyone has an opinion on how much sauce and how many onions.",
    serves: 4, prepMin: 20, cookMin: 50, difficulty: "medium", diet: "vegan", allergens: ["gluten"],
    ingredients: [
      { group: "Base", items: [{ qty: 200, unit: "g", item: "brown lentils", note: "rinsed" }, { qty: 200, unit: "g", item: "short-grain rice", note: "rinsed" }, { qty: 200, unit: "g", item: "small pasta", note: "e.g. elbow macaroni" }, { qty: 240, unit: "g", item: "cooked chickpeas", note: "1 tin, drained" }, { qty: 3, item: "onions", note: "very thinly sliced" }, { qty: 120, unit: "ml", item: "vegetable oil" }, { qty: null, item: "salt" }] },
      { group: "Tomato sauce", items: [{ qty: 4, item: "garlic cloves", note: "crushed" }, { qty: 500, unit: "g", item: "passata" }, { qty: 1, unit: "tsp", item: "ground cumin" }, { qty: 0.5, unit: "tsp", item: "chilli flakes", note: "to taste" }, { qty: 1, unit: "tbsp", item: "white vinegar" }] },
      { group: "Garlic vinegar (daqqa)", items: [{ qty: 4, item: "garlic cloves", note: "crushed" }, { qty: 80, unit: "ml", item: "white vinegar" }, { qty: 80, unit: "ml", item: "water" }, { qty: 0.5, unit: "tsp", item: "ground cumin" }] },
    ],
    steps: [
      "Fry the onions in the oil over medium heat, stirring often, until deep golden and crisp (15–20 min). Lift onto paper; keep the oil.",
      "Simmer the lentils in plenty of salted water for 12–15 minutes, until just tender. Drain.",
      "Toast the rice in 2 tbsp of the onion oil for a minute, add the lentils and 500 ml water with salt. Cover and cook on low for 18–20 minutes.",
      "Boil the pasta in salted water until tender; drain and toss with a little onion oil.",
      "For the sauce, fry the garlic in 1 tbsp onion oil for 30 seconds, add passata, cumin, chilli and salt. Simmer 15 minutes, then stir in the vinegar.",
      "Stir together the daqqa ingredients with a pinch of salt.",
      "Layer rice-and-lentils, pasta and chickpeas in bowls. Spoon over sauce and daqqa, and pile the crispy onions on top.",
    ],
    tips: ["Make the onions first — their oil flavours everything else.", "Serve sauce and daqqa on the side so everyone can choose."],
    provenance: AI(), review: DRAFT,
  },
  {
    slug: "ful-medames", name: "Ful medames", arabic: "فول مدمس", regions: ["cairo"], photo: "ful",
    summary: "Warm fava beans with olive oil, cumin, lemon and garlic.",
    background: "Ful is Egypt's everyday breakfast, sold from carts in the morning and eaten with bread, pickles and taameya.",
    serves: 4, prepMin: 10, cookMin: 15, difficulty: "easy", diet: "vegan", allergens: [],
    ingredients: [{ items: [{ qty: 800, unit: "g", item: "tinned fava beans (ful medames)", note: "2 tins, with their liquid" }, { qty: 2, item: "garlic cloves", note: "crushed" }, { qty: 1, unit: "tsp", item: "ground cumin" }, { qty: 1, item: "lemon", note: "juiced" }, { qty: 3, unit: "tbsp", item: "olive oil" }, { qty: null, item: "salt" }, { qty: 1, item: "tomato", note: "diced, to serve" }, { qty: null, item: "parsley and chilli", note: "to serve" }] }],
    steps: ["Warm the beans with their liquid in a pan for 10 minutes, adding a splash of water if dry.", "Mash about half the beans with the back of a spoon.", "Stir in garlic, cumin, lemon juice and salt.", "Spoon into bowls, pour over the olive oil and top with tomato, parsley and chilli. Serve with warm bread (contains gluten) or as it is."],
    tips: ["Try it with a spoon of tahini, or with chopped onion — every cart has its own style."],
    provenance: AI(), review: DRAFT,
  },
  {
    slug: "taameya", name: "Taameya", arabic: "طعمية", regions: ["cairo"], photo: "taameya",
    summary: "Green, herby fava-bean fritters with a sesame crust.",
    background: "Egypt's version of falafel is made with fava beans rather than chickpeas, and lots of fresh herbs that turn the inside bright green.",
    serves: 4, servesLabel: "about 20 fritters", prepMin: 25, cookMin: 15, waitMin: 720, difficulty: "medium", diet: "vegan", allergens: ["sesame"],
    ingredients: [{ items: [{ qty: 250, unit: "g", item: "dried split fava beans (skinless)", note: "soaked overnight — not cooked" }, { qty: 1, item: "small onion" }, { qty: 3, item: "garlic cloves" }, { qty: 1, item: "large bunch parsley" }, { qty: 1, item: "bunch dill" }, { qty: 1, item: "bunch coriander" }, { qty: 1, unit: "tsp", item: "ground cumin" }, { qty: 1, unit: "tsp", item: "ground coriander" }, { qty: 1, unit: "tsp", item: "salt" }, { qty: 0.5, unit: "tsp", item: "bicarbonate of soda" }, { qty: 3, unit: "tbsp", item: "sesame seeds" }, { qty: null, item: "oil for deep frying" }] }],
    steps: ["Drain the soaked beans very well.", "Blitz beans, onion, garlic and herbs in a food processor to a fine, slightly grainy green paste.", "Mix in cumin, coriander and salt. Rest the mixture for 30 minutes.", "Just before frying, stir in the bicarbonate of soda.", "Heat oil to about 175 °C. Shape walnut-sized patties, press one side into sesame seeds.", "Fry in batches for 3–4 minutes until deep brown outside and green inside. Drain on paper."],
    tips: ["Never cook the beans first — raw soaked beans hold together.", "Test one fritter: if it falls apart, blitz the mix a little finer."],
    provenance: AI(), review: DRAFT,
  },
  {
    slug: "molokhia", name: "Molokhia", arabic: "ملوخية", regions: ["cairo", "upper-egypt"], photo: "molokhia",
    summary: "Silky green jute-leaf soup finished with garlic fried in ghee.",
    background: "Molokhia is a family favourite. The finishing step — garlic and coriander sizzled in ghee and poured in — is so dramatic that some cooks gasp as they add it.",
    serves: 4, prepMin: 10, cookMin: 20, difficulty: "easy", diet: "vegetarian", allergens: ["milk"],
    ingredients: [{ items: [{ qty: 400, unit: "g", item: "frozen minced molokhia", note: "thawed" }, { qty: 1, unit: "l", item: "stock", note: "chicken, or vegetable for vegetarians" }, { qty: 8, item: "garlic cloves", note: "crushed" }, { qty: 1, unit: "tbsp", item: "ground coriander" }, { qty: 2, unit: "tbsp", item: "ghee or butter", note: "or oil for dairy-free" }, { qty: null, item: "salt and lemon", note: "to serve" }] }],
    steps: ["Bring the stock to a simmer and season with salt.", "Stir in the molokhia and heat until just simmering. Don't let it boil hard.", "In a small pan, fry the garlic in the ghee until golden, then add the coriander for 10 seconds.", "Pour the sizzling garlic into the soup and stir.", "Serve with rice or bread, and lemon on the side."],
    tips: ["Use oil instead of ghee and vegetable stock for a vegan version."],
    provenance: AI(), review: DRAFT,
  },
  {
    slug: "hawawshi", name: "Hawawshi", arabic: "حواوشي", regions: ["cairo"], photo: "hawawshi",
    summary: "Spiced minced meat baked inside bread until the edges crackle.",
    background: "Hawawshi is a popular street food: a thin layer of seasoned meat sealed inside bread and baked until crisp.",
    serves: 4, prepMin: 15, cookMin: 20, difficulty: "easy", diet: "meat", allergens: ["gluten"],
    ingredients: [{ items: [{ qty: 4, item: "round flatbreads (baladi or pita)" }, { qty: 500, unit: "g", item: "minced beef", note: "with some fat" }, { qty: 1, item: "onion", note: "grated and squeezed dry" }, { qty: 1, item: "green pepper", note: "finely chopped" }, { qty: 1, item: "hot green chilli", note: "finely chopped" }, { qty: 2, item: "garlic cloves", note: "crushed" }, { qty: 2, unit: "tbsp", item: "chopped parsley" }, { qty: 1, unit: "tsp", item: "ground cumin" }, { qty: 1, unit: "tsp", item: "paprika" }, { qty: 0.5, unit: "tsp", item: "black pepper" }, { qty: 1, unit: "tsp", item: "salt" }, { qty: 2, unit: "tbsp", item: "oil", note: "for brushing" }] }],
    steps: ["Heat the oven to 200 °C.", "Mix the meat with onion, pepper, chilli, garlic, parsley, spices and salt.", "Open each bread into a pocket and spread a thin, even layer of meat inside. Press closed.", "Brush the outside with oil and bake on a tray for 15–20 minutes, turning once, until crisp and the meat is cooked through.", "Cut into quarters and serve with pickles and tahini."],
    tips: ["Keep the meat layer thin so it cooks through before the bread burns."],
    provenance: AI(), review: DRAFT,
  },
  {
    slug: "basbousa", name: "Basbousa", arabic: "بسبوسة", regions: ["cairo"], photo: "basbousa",
    summary: "Golden semolina cake soaked in lemon syrup.",
    background: "Basbousa fills the trays of sweet shops across Egypt and is a favourite at home, especially in Ramadan.",
    serves: 12, servesLabel: "12 pieces", prepMin: 20, cookMin: 35, waitMin: 60, difficulty: "easy", diet: "vegetarian", allergens: ["gluten", "milk", "nuts"],
    ingredients: [
      { group: "Cake", items: [{ qty: 320, unit: "g", item: "coarse semolina" }, { qty: 100, unit: "g", item: "sugar" }, { qty: 40, unit: "g", item: "desiccated coconut" }, { qty: 240, unit: "g", item: "plain yoghurt" }, { qty: 115, unit: "g", item: "butter or ghee", note: "melted" }, { qty: 1, unit: "tsp", item: "baking powder" }, { qty: 12, item: "blanched almonds", note: "to decorate" }, { qty: 1, unit: "tbsp", item: "tahini or butter", note: "to grease the tin" }] },
      { group: "Syrup", items: [{ qty: 300, unit: "g", item: "sugar" }, { qty: 240, unit: "ml", item: "water" }, { qty: 1, unit: "tsp", item: "lemon juice" }] },
    ],
    steps: ["Make the syrup first: boil sugar and water for 8 minutes, add lemon juice and leave to cool completely.", "Heat the oven to 180 °C and grease a 23 × 33 cm tin.", "Mix semolina, sugar, coconut and baking powder. Stir in the yoghurt and butter to a thick batter.", "Spread evenly in the tin, score into 12 pieces and press an almond into each.", "Bake 30–35 minutes until deep golden.", "Pour the cool syrup over the hot cake. Leave at least an hour to soak before cutting."],
    tips: ["Cool syrup on hot cake (or the reverse) keeps it soft rather than soggy."],
    provenance: AI(), review: DRAFT,
  },
  {
    slug: "karkade", name: "Karkade", arabic: "كركديه", regions: ["cairo", "nubia"], photo: "karkade",
    summary: "Ruby-red hibiscus tea — iced or hot.",
    background: "Hibiscus tea is drunk across Egypt and is especially associated with the south, where dried flowers are sold by the sack.",
    serves: 4, servesLabel: "4 glasses", prepMin: 5, cookMin: 0, waitMin: 240, difficulty: "easy", diet: "vegan", allergens: [],
    ingredients: [{ items: [{ qty: 20, unit: "g", item: "dried hibiscus flowers" }, { qty: 1, unit: "l", item: "cold water" }, { qty: 4, unit: "tbsp", item: "sugar", note: "to taste" }] }],
    steps: ["Rinse the flowers and put them in a jug with the cold water.", "Leave in the fridge for at least 4 hours, or overnight.", "Strain, stir in sugar to taste and serve over ice.", "For a hot version, steep the flowers in just-boiled water for 10 minutes, then strain and sweeten."],
    tips: ["Cold steeping gives a softer, less sour taste."],
    provenance: AI(), review: DRAFT,
  },
  {
    slug: "sayadeya", name: "Sayadeya", arabic: "صيادية", regions: ["alexandria", "sinai-red-sea"], photo: "sayadeya",
    summary: "Fish over rice cooked brown with deeply caramelised onions.",
    background: "A signature dish of Alexandria's fish restaurants: the onions are cooked until very dark, which colours and flavours the rice.",
    serves: 4, prepMin: 20, cookMin: 60, difficulty: "involved", diet: "fish", allergens: ["fish"],
    ingredients: [
      { group: "Rice", items: [{ qty: 3, item: "onions", note: "thinly sliced" }, { qty: 80, unit: "ml", item: "vegetable oil" }, { qty: 300, unit: "g", item: "medium-grain rice", note: "rinsed" }, { qty: 1, unit: "tsp", item: "ground cumin" }, { qty: 0.5, unit: "tsp", item: "ground cinnamon" }, { qty: 0.5, unit: "tsp", item: "ground turmeric" }, { qty: 700, unit: "ml", item: "hot fish or vegetable stock" }, { qty: null, item: "salt" }] },
      { group: "Fish", items: [{ qty: 800, unit: "g", item: "white fish fillets", note: "e.g. sea bass or mullet" }, { qty: 3, item: "garlic cloves", note: "crushed" }, { qty: 1, unit: "tsp", item: "ground cumin" }, { qty: 1, item: "lemon", note: "juiced" }, { qty: 2, unit: "tbsp", item: "olive oil" }] },
    ],
    steps: ["Fry the onions in the oil over medium-low heat for 25–30 minutes, stirring, until very dark brown but not burnt. Set a spoonful aside to garnish.", "Add the rice and spices to the onions and stir for 2 minutes.", "Pour in the hot stock with salt, bring to a boil, cover and cook on the lowest heat for 20 minutes.", "Meanwhile, rub the fish with garlic, cumin, lemon, oil and salt.", "Heat the oven to 200 °C. Spread the rice in a baking dish, lay the fish on top and bake 12–15 minutes until the fish flakes easily.", "Scatter the reserved onions over and serve with tahini salad and lemon."],
    tips: ["The darker the onions (without burning), the deeper the colour of the rice."],
    provenance: AI([S.sunheron]), review: DRAFT,
  },
  {
    slug: "kebda-eskandarani", name: "Kebda eskandarani", arabic: "كبدة إسكندراني", regions: ["alexandria"], photo: "kebda",
    summary: "Fast-fried liver with garlic, cumin, green chilli and lemon.",
    background: "Alexandria's famous street sandwich, cooked in seconds in a very hot pan.",
    serves: 4, prepMin: 25, cookMin: 6, difficulty: "easy", diet: "meat", allergens: ["gluten"],
    ingredients: [{ items: [{ qty: 500, unit: "g", item: "beef liver", note: "cut into thin strips" }, { qty: 4, item: "garlic cloves", note: "crushed" }, { qty: 2, item: "hot green chillies", note: "sliced" }, { qty: 1, item: "green pepper", note: "sliced" }, { qty: 1, unit: "tsp", item: "ground cumin" }, { qty: 0.5, unit: "tsp", item: "ground coriander" }, { qty: 0.5, unit: "tsp", item: "black pepper" }, { qty: 2, unit: "tbsp", item: "lemon juice or vinegar" }, { qty: 3, unit: "tbsp", item: "oil" }, { qty: null, item: "salt" }, { qty: 4, item: "small bread rolls", note: "to serve" }] }],
    steps: ["Toss the liver with garlic, cumin, coriander and pepper. Leave 15 minutes. Don't add salt yet.", "Heat the oil in a wide pan until very hot. Add the liver in one layer and fry 2 minutes without moving.", "Add the chillies and pepper and stir-fry 2–3 minutes more, until the liver is cooked through with no pink in the middle.", "Off the heat, add lemon juice and salt.", "Pile into warm rolls with tahini and pickles."],
    tips: ["Salt at the end keeps the liver tender.", "Food safety: liver must be cooked right through."],
    provenance: AI([S.sunheron]), review: DRAFT,
  },
  {
    slug: "bedouin-flatbread", name: "Bedouin flatbread", arabic: "عيش بدوي", regions: ["sinai-red-sea"], photo: "bedouinBread",
    summary: "Three-ingredient bread cooked in seconds on a domed hot plate.",
    background: "In Sinai, bread is cooked over fire — stretched thin on a domed metal plate, or baked under the embers. An upturned wok works at home.",
    serves: 4, servesLabel: "4 large breads", prepMin: 15, cookMin: 10, waitMin: 15, difficulty: "medium", diet: "vegan", allergens: ["gluten"],
    ingredients: [{ items: [{ qty: 300, unit: "g", item: "plain flour" }, { qty: 180, unit: "ml", item: "water", note: "roughly" }, { qty: 0.5, unit: "tsp", item: "salt" }] }],
    steps: ["Mix flour and salt, add water gradually and knead to a soft, smooth dough (5 minutes).", "Cover and rest for 15 minutes.", "Heat an upturned wok or heavy pan until very hot.", "Divide into 4. Stretch each piece as thin as you can, flipping it between your hands.", "Lay it on the hot dome for 30–60 seconds, flip, and cook the other side until blistered.", "Stack in a cloth to keep soft. Eat warm with honey, cheese or olive oil."],
    tips: ["The thinner the dough, the quicker and lighter the bread."],
    provenance: AI([S.worldfoodist, S.hidmcSinai]), review: DRAFT,
  },
];

export const ALLERGEN_LABEL: Record<Allergen, string> = { gluten: "Gluten (wheat)", milk: "Milk", egg: "Egg", fish: "Fish", sesame: "Sesame", nuts: "Nuts", celery: "Celery" };

export const regionById = (id: string) => regions.find((r) => r.id === id);
export const regionOfDestination = (slug: string) => regions.find((r) => r.destinations.includes(slug));

/** Scale a quantity and format it nicely (¼, ½, ¾ for spoons; whole numbers for grams). */
export function scaleQty(qty: number | null, factor: number, unit?: string): string {
  if (qty === null) return "";
  const v = qty * factor;
  if (unit === "g" || unit === "ml") return String(v >= 100 ? Math.round(v / 5) * 5 : Math.round(v));
  if (unit === "l") return String(Math.round(v * 100) / 100);
  const whole = Math.floor(v + 1e-9);
  const frac = v - whole;
  const fr = [[0, ""], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"], [1, ""]] as const;
  let best = fr[0] as readonly [number, string];
  for (const f of fr) if (Math.abs(frac - f[0]) < Math.abs(frac - best[0])) best = f;
  const w = best[0] === 1 ? whole + 1 : whole;
  return `${w > 0 ? w : ""}${best[1]}` || "0";
}
