import type { PhotoKey } from "./images";

/* ---------------- Food ---------------- */
export type Dish = {
  slug: string;
  name: string;
  arabic: string;
  kind: "main" | "street" | "dessert" | "drink";
  photo: PhotoKey | null;
  description: string;
  ingredients: string[];
  /** Editorial estimate in EGP for a street/casual portion */
  priceRange: [number, number] | null;
  vegetarian: "yes" | "no" | "often";
  background: string;
};

export const dishes: Dish[] = [
  {
    slug: "koshari",
    name: "Koshari",
    arabic: "كشري",
    kind: "street",
    photo: "koshari",
    description: "Egypt's national comfort food: layers of rice, lentils and pasta topped with spiced tomato sauce, chickpeas and crispy onions.",
    ingredients: ["Rice", "Brown lentils", "Macaroni", "Chickpeas", "Tomato sauce", "Fried onions", "Garlic vinegar (dakka)"],
    priceRange: [40, 120],
    vegetarian: "yes",
    background: "A 19th-century mix of Indian, Italian and Middle Eastern ingredients that became Cairo's favourite cheap, filling meal.",
  },
  {
    slug: "ful-medames",
    name: "Ful medames",
    arabic: "فول مدمس",
    kind: "street",
    photo: "ful",
    description: "Slow-cooked fava beans mashed with olive oil, cumin and lemon, eaten with baladi bread for breakfast.",
    ingredients: ["Fava beans", "Olive oil", "Cumin", "Lemon", "Garlic", "Baladi bread"],
    priceRange: [15, 60],
    vegetarian: "yes",
    background: "Fava beans have been eaten in Egypt since antiquity; street carts still cook them overnight in large pots called idra.",
  },
  {
    slug: "taameya",
    name: "Taameya",
    arabic: "طعمية",
    kind: "street",
    photo: "taameya",
    description: "Egyptian falafel, made with fava beans instead of chickpeas, so it is green and fluffy inside.",
    ingredients: ["Fava beans", "Parsley", "Dill", "Coriander", "Onion", "Sesame"],
    priceRange: [10, 40],
    vegetarian: "yes",
    background: "Coptic Christians traditionally ate taameya during fasting periods when animal products are avoided.",
  },
  {
    slug: "molokhia",
    name: "Molokhia",
    arabic: "ملوخية",
    kind: "main",
    photo: "molokhia",
    description: "A silky green soup of finely chopped jute leaves with a garlic and coriander finish, served with rice or bread.",
    ingredients: ["Jute mallow leaves", "Stock", "Garlic", "Ground coriander", "Ghee"],
    priceRange: [60, 200],
    vegetarian: "often",
    background: "The final 'tasha' — sizzling garlic poured in — is so important that families say the cook should gasp as it hits the pot.",
  },
  {
    slug: "mahshi",
    name: "Mahshi",
    arabic: "محشي",
    kind: "main",
    photo: "mahshi",
    description: "Vegetables and vine leaves stuffed with herbed rice and simmered in tomato broth.",
    ingredients: ["Vine leaves", "Courgette", "Peppers", "Aubergine", "Rice", "Dill", "Tomato"],
    priceRange: [80, 250],
    vegetarian: "often",
    background: "A family dish; aunts and grandmothers often roll mahshi together before holidays.",
  },
  {
    slug: "feteer",
    name: "Feteer meshaltet",
    arabic: "فطير مشلتت",
    kind: "main",
    photo: "feteer",
    description: "A buttery, flaky layered pastry eaten sweet with honey and cream, or savoury with cheese and meat.",
    ingredients: ["Flour", "Ghee", "Honey or molasses", "Cheese"],
    priceRange: [80, 300],
    vegetarian: "often",
    background: "A countryside speciality, traditionally offered to guests and brought back from village visits.",
  },
  {
    slug: "hawawshi",
    name: "Hawawshi",
    arabic: "حواوشي",
    kind: "street",
    photo: "hawawshi",
    description: "Baladi bread stuffed with spiced minced meat, onions and peppers, then baked until crisp.",
    ingredients: ["Minced beef", "Onion", "Chilli", "Baladi bread"],
    priceRange: [50, 150],
    vegetarian: "no",
    background: "Popularly said to be named after the Cairo butcher who first sold it; today it is a favourite late-night street snack.",
  },
  {
    slug: "basbousa",
    name: "Basbousa & desserts",
    arabic: "بسبوسة",
    kind: "dessert",
    photo: "basbousa",
    description: "Syrup-soaked semolina cake. Also try om ali (bread pudding), konafa and roz bel laban (rice pudding).",
    ingredients: ["Semolina", "Yogurt", "Sugar syrup", "Coconut", "Almonds"],
    priceRange: [30, 120],
    vegetarian: "yes",
    background: "Ramadan evenings bring out trays of konafa and qatayef across the country.",
  },
  {
    slug: "karkade",
    name: "Karkade & drinks",
    arabic: "كركديه",
    kind: "drink",
    photo: "karkade",
    description: "Deep red hibiscus tea, served hot in winter and iced in summer. Also try sugarcane juice (asab) and mint tea.",
    ingredients: ["Dried hibiscus", "Sugar", "Water"],
    priceRange: [15, 60],
    vegetarian: "yes",
    background: "Aswan is famous for its hibiscus; it is also the traditional welcome drink at Nubian weddings.",
  },
];

export const PRICE_NOTE = {
  kind: "estimate" as const,
  label: "Editorial estimate — awaiting field verification",
  lastChecked: "2026-11-12",
};

export const foodSafety = [
  "Drink bottled or filtered water, and check the seal is unbroken.",
  "Choose busy stalls where food is cooked fresh in front of you.",
  "Peel fruit yourself; be careful with raw salads in the first days.",
  "Carry oral rehydration salts and hand sanitiser.",
  "Tell staff clearly about allergies — sesame (tahini) and nuts are common.",
];

/* ---------------- Walk Through Time ---------------- */
export type Era = {
  id: string;
  name: string;
  dates: string;
  summary: string;
  childVersion: string;
  places: string[]; // destination slugs
  /** a photo from the period itself; falls back to the first place's photo */
  photo?: PhotoKey;
};

export const eras: Era[] = [
  {
    id: "predynastic",
    photo: "narmer",
    name: "Before the pharaohs",
    dates: "c. 6000–3100 BCE",
    summary: "Farming villages grew along the Nile. Kingdoms in the north and south formed and were finally united.",
    childVersion: "People learned to grow food beside the river. Little villages became two big kingdoms that later joined together.",
    places: ["fayoum"],
  },
  {
    id: "old-kingdom",
    name: "Old Kingdom",
    dates: "c. 2686–2181 BCE",
    summary: "The age of the pyramids, from Djoser's Step Pyramid at Saqqara to the Great Pyramid at Giza.",
    childVersion: "Kings built giant pyramids as tombs. Thousands of skilled workers moved huge stone blocks to build them.",
    places: ["saqqara", "giza"],
  },
  {
    id: "middle-new-kingdom",
    photo: "hatshepsut",
    name: "Middle & New Kingdoms",
    dates: "c. 2055–1069 BCE",
    summary: "Thebes (Luxor) became the religious capital. Hatshepsut, Tutankhamun and Ramesses II ruled in this period.",
    childVersion: "Pharaohs were buried in secret tombs in a valley, and built enormous temples with giant statues.",
    places: ["luxor", "abu-simbel", "aswan"],
  },
  {
    id: "greco-roman",
    photo: "komOmbo",
    name: "Greek & Roman Egypt",
    dates: "332 BCE–641 CE",
    summary: "Alexander the Great founded Alexandria. The Ptolemies, including Cleopatra VII, ruled, followed by Rome.",
    childVersion: "A Greek king built a new city by the sea with a famous library and a lighthouse that was a wonder of the world.",
    places: ["alexandria", "siwa", "aswan"],
  },
  {
    id: "coptic",
    photo: "copticMuseum",
    name: "Coptic Christian Egypt",
    dates: "1st–7th century CE",
    summary: "Christianity spread early in Egypt. The monastic tradition began in its deserts.",
    childVersion: "Some people went to live quietly in the desert to pray. They started the very first monasteries.",
    places: ["islamic-coptic-cairo", "dahab"],
  },
  {
    id: "islamic",
    photo: "mashrabiya",
    name: "Islamic Cairo",
    dates: "641–1517 CE",
    summary: "Fustat and then Cairo grew under the Fatimids, Ayyubids and Mamluks, who built Al-Azhar and the Citadel.",
    childVersion: "Cairo filled with beautiful mosques, markets and gates. Some of its streets are almost 1,000 years old.",
    places: ["islamic-coptic-cairo", "cairo"],
  },
  {
    id: "modern",
    photo: "cairoTower",
    name: "Modern Egypt",
    dates: "1805–today",
    summary: "From Muhammad Ali's reforms and the Suez Canal to today's Grand Egyptian Museum and new cities.",
    childVersion: "Egypt built railways, a canal joining two seas, and a brand-new museum for Tutankhamun's treasures.",
    places: ["cairo", "giza", "alexandria"],
  },
];

/* ---------------- Decode Egypt ---------------- */
export type Phrase = { en: string; ar: string; say: string; group: "Greetings" | "Essentials" | "Shopping" | "Getting around" };

export const phrases: Phrase[] = [
  { en: "Hello (peace be upon you)", ar: "السلام عليكم", say: "as-salaamu 'alaykum", group: "Greetings" },
  { en: "Reply to hello", ar: "وعليكم السلام", say: "wa 'alaykum as-salaam", group: "Greetings" },
  { en: "Good morning", ar: "صباح الخير", say: "sabaah el-kheer", group: "Greetings" },
  { en: "Good evening", ar: "مساء الخير", say: "masaa' el-kheer", group: "Greetings" },
  { en: "Thank you", ar: "شكرا", say: "shukran", group: "Essentials" },
  { en: "Please (to a man / woman)", ar: "لو سمحت / لو سمحتي", say: "law samaht / law samahti", group: "Essentials" },
  { en: "Yes / No", ar: "أيوه / لأ", say: "aywa / la'", group: "Essentials" },
  { en: "God willing", ar: "إن شاء الله", say: "in shaa' allah", group: "Essentials" },
  { en: "How much is this?", ar: "بكام ده؟", say: "bikaam da?", group: "Shopping" },
  { en: "Too expensive", ar: "غالي قوي", say: "ghaali awi", group: "Shopping" },
  { en: "No thank you", ar: "لأ شكرا", say: "la' shukran", group: "Shopping" },
  { en: "Where is…?", ar: "فين…؟", say: "feen…?", group: "Getting around" },
  { en: "Stop here, please", ar: "على جنب لو سمحت", say: "'ala gamb law samaht", group: "Getting around" },
  { en: "The metro", ar: "المترو", say: "el-metro", group: "Getting around" },
];

export const numerals = [
  { n: 0, ar: "٠", say: "sifr" },
  { n: 1, ar: "١", say: "waahid" },
  { n: 2, ar: "٢", say: "itneen" },
  { n: 3, ar: "٣", say: "talaata" },
  { n: 4, ar: "٤", say: "arba'a" },
  { n: 5, ar: "٥", say: "khamsa" },
  { n: 6, ar: "٦", say: "sitta" },
  { n: 7, ar: "٧", say: "sab'a" },
  { n: 8, ar: "٨", say: "tamanya" },
  { n: 9, ar: "٩", say: "tis'a" },
  { n: 10, ar: "١٠", say: "'ashara" },
];

/* ---------------- Etiquette ---------------- */
export const etiquette = [
  { topic: "Greetings", body: "A handshake is common between men. With women, wait for her to offer a hand first. Ask about family — Egyptians value it." },
  { topic: "Mosques", body: "Remove shoes, cover shoulders and knees. Women cover hair; scarves are often lent at major mosques. Avoid prayer times." },
  { topic: "Churches", body: "Dress modestly and stay quiet during services. Photography rules differ — check signs or ask." },
  { topic: "Clothing", body: "In cities and towns, loose clothing covering shoulders and knees is respectful. Swimwear is fine at resorts and beaches." },
  { topic: "Photography", body: "Always ask before photographing people. Do not photograph military or police sites. Some sites need a photo ticket." },
  { topic: "Bargaining", body: "Expected in markets, not in supermarkets or restaurants. Start with a smile, decide your price, and walk away politely if needed." },
  { topic: "Tipping", body: "Tipping (baksheesh) is common for service. Keep small notes for restaurant staff, drivers, guides and bathroom attendants." },
  { topic: "Ramadan", body: "Avoid eating or drinking in public during daylight out of respect. Iftar at sunset is a wonderful time to experience local life." },
];

/* ---------------- Senses ---------------- */
export const soundscapes = [
  { id: "nile", title: "Sounds of the Nile", description: "Water against a felucca hull, wind in the sail.", mood: "river", photo: "felucca" },
  { id: "desert", title: "Desert night", description: "Wind across sand and a slow, low drone.", mood: "desert", photo: "desertStars" },
  { id: "market", title: "Traditional market", description: "A rhythmic tabla-style pulse under bustle.", mood: "market", photo: "spiceMarket" },
  { id: "coast", title: "Red Sea coast", description: "Waves rolling gently onto a reef beach.", mood: "coast", photo: "redSeaBeach" },
] as const;
