/**
 * Original animated explainers — the single source for each film's scenes, captions,
 * transcript and chapters. `scripts/render-explainers.ts` turns these into MP4 + WebVTT
 * files in public/media; the site reads the same data for the transcript and chapter list,
 * so the captions, the transcript and the picture can never drift apart.
 *
 * Every caption line must be supported by one of the explainer's sources. Things that are
 * debated are said to be debated. These films are AI-assisted drafts until an editor signs
 * them off in the admin dashboard (see docs/DATASETS.md).
 */

export type SceneKind = "title" | "timeline" | "stats" | "papyrus" | "river" | "people" | "ramps" | "compass" | "valley" | "wheel" | "gauge" | "sky" | "dam" | "temple" | "blocks" | "lift" | "sun" | "outro";

export type ExplainerChapter = {
  title: string;
  scene: SceneKind;
  /** on-screen headline (short) */
  headline: string;
  /** optional scene data: labels, numbers, timeline points */
  data?: Record<string, unknown>;
  /** caption lines, shown one after another */
  lines: string[];
};

export type Source = { name: string; url: string };

export type Explainer = {
  id: string;
  title: string;
  summary: string;
  destinations: string[];
  period: string;
  chapters: ExplainerChapter[];
  sources: Source[];
};

export type Cue = { start: number; end: number; text: string };
export type TimedChapter = { start: number; end: number; title: string; index: number };

/** Reading pace for silent, captioned video: ~2.6 words a second, never shorter than 3.4 s. */
export function cueDuration(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(3.4, words / 2.6 + 0.9);
}
const CHAPTER_LEAD = 1.6; // seconds of picture before the first caption of a chapter
const CHAPTER_TAIL = 0.8;

/** Lay the captions out on a timeline. Pure and deterministic, so tests can check it. */
export function timeline(e: Explainer): { cues: Cue[]; chapters: TimedChapter[]; duration: number } {
  const cues: Cue[] = [];
  const chapters: TimedChapter[] = [];
  let t = 0;
  e.chapters.forEach((c, index) => {
    const start = t;
    t += CHAPTER_LEAD;
    for (const text of c.lines) {
      const d = cueDuration(text);
      cues.push({ start: round(t), end: round(t + d - 0.15), text });
      t += d;
    }
    t += CHAPTER_TAIL;
    chapters.push({ start: round(start), end: round(t), title: c.title, index });
  });
  return { cues, chapters, duration: round(t) };
}
const round = (n: number) => Math.round(n * 1000) / 1000;

function stamp(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${sec.toFixed(3).padStart(6, "0")}`;
}

/** WebVTT captions. */
export function toVtt(cues: Cue[]) {
  return ["WEBVTT", "", ...cues.map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text.replace(/-->/g, "→")}\n`)].join("\n");
}

/** WebVTT chapter track (kind="chapters"). */
export function toChapterVtt(chapters: TimedChapter[]) {
  return ["WEBVTT", "", ...chapters.map((c) => `chapter-${c.index + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.title}\n`)].join("\n");
}

export const explainers: Explainer[] = [
  {
    id: "great-pyramid-how",
    title: "How the Great Pyramid was built — what we know, and what we don't",
    summary:
      "From the first step pyramid to Merer's 4,500-year-old logbook, the workers' town and the ramp debate: the evidence behind Khufu's pyramid, with the open questions kept open.",
    destinations: ["giza", "saqqara", "cairo"],
    period: "Old Kingdom, c. 2630–2560 BCE",
    chapters: [
      {
        title: "The Horizon of Khufu",
        scene: "title",
        headline: "The Horizon of Khufu",
        data: { kicker: "An original Discover Egypt explainer", sub: "Giza · Fourth Dynasty · c. 2560 BCE", motif: "pyramids" },
        lines: [
          "On the Giza plateau stands the Great Pyramid, built for King Khufu of the Fourth Dynasty and completed around 2560 BCE.",
          "A logbook from Khufu's own reign records its original name: Akhet-Khufu, the Horizon of Khufu.",
          "This film separates what the evidence shows from what is still debated.",
        ],
      },
      {
        title: "From steps to a true pyramid",
        scene: "timeline",
        headline: "Generations of experiments",
        data: {
          points: [
            { year: "c. 2630 BCE", label: "Djoser's Step Pyramid", place: "Saqqara" },
            { year: "c. 2600 BCE", label: "Sneferu's Red Pyramid", place: "Dahshur" },
            { year: "c. 2560 BCE", label: "Khufu's Great Pyramid", place: "Giza" },
          ],
        },
        lines: [
          "Pyramids did not appear from nowhere.",
          "Around 2630 BCE, King Djoser's Step Pyramid at Saqqara stacked stone platforms about 62 metres high.",
          "King Sneferu, the first king of the Fourth Dynasty, built the Red Pyramid at Dahshur — the first with smooth, straight sides.",
          "Khufu's builders inherited those experiments, and went bigger.",
        ],
      },
      {
        title: "A mountain of stone",
        scene: "stats",
        headline: "A mountain of stone",
        data: {
          build: true,
          stats: [
            { value: 146, unit: "m", label: "original height" },
            { value: 230, unit: "m", label: "each side of the base" },
            { value: 2.3, unit: "million", label: "blocks, by one common estimate" },
          ],
        },
        lines: [
          "When finished, it stood about 146 metres tall on a base roughly 230 metres a side.",
          "Erosion and the loss of its top stones have left about 138 metres today.",
          "A common estimate puts it at around 2.3 million blocks.",
          "Ancient writers counted it among the wonders of the world. It is the only one of the Seven Wonders still standing.",
        ],
      },
      {
        title: "Merer's logbook",
        scene: "papyrus",
        headline: "Merer's logbook",
        data: { place: "Wadi al-Jarf · Red Sea coast", found: "Found 2013" },
        lines: [
          "In 2013, a French-led team under Pierre Tallet found papyri at Wadi al-Jarf, an ancient harbour on the Red Sea coast.",
          "They are the oldest inscribed papyri yet found.",
          "The best preserved is the logbook of an inspector named Merer, who led a crew of about 200 men.",
          "His entries date to around the 27th year of Khufu's reign — near the end of the build.",
        ],
      },
      {
        title: "The river road",
        scene: "river",
        headline: "Tura to Giza by boat",
        data: { from: "Tura quarries", to: "Giza · She-Khufu harbour" },
        lines: [
          "Merer's crew hauled fine white limestone at the Tura quarries, across the river from Giza.",
          "They took it by boat along the Nile and its canals to a harbour basin called She-Khufu, the Pool of Khufu.",
          "A loaded trip took about two days. The empty return took one.",
          "The voyage depended on high water, when the flood made the river and the canals navigable.",
          "Pierre Tallet believes these blocks were for the pyramid's smooth outer casing.",
        ],
      },
      {
        title: "Who built it",
        scene: "people",
        headline: "Who built it?",
        data: { place: "Heit el-Ghurab · south of the Sphinx" },
        lines: [
          "The Greek historian Herodotus, writing some two thousand years later, told of 100,000 men labouring for twenty years.",
          "Archaeology tells a more grounded story.",
          "South of the Sphinx, excavations led by Mark Lehner uncovered Heit el-Ghurab, a town with bakeries and stores that housed and fed the workforce.",
          "On the hillside nearby, Zahi Hawass excavated a cemetery where builders and overseers were buried in their own tombs.",
          "The excavators describe an organised, rotating Egyptian workforce — not slaves in the modern sense of the word.",
        ],
      },
      {
        title: "Getting the stones up",
        scene: "ramps",
        headline: "The open question",
        data: { options: ["Straight ramp", "Ramp around the sides", "Ramp inside"] },
        lines: [
          "How the blocks were raised is still the biggest open question.",
          "Most Egyptologists think ramps were used, but not which kind: a straight ramp, one wrapping around the sides, or ramps inside the pyramid.",
          "In 2018, a mission at the Hatnub alabaster quarry found a steep ramp flanked by stairs cut with post holes, dating at least to Khufu's reign.",
          "Ropes around wooden posts may have helped teams haul sledges up slopes of 20 percent or more.",
          "Other experts caution that a quarry ramp does not prove how the pyramid itself was built.",
        ],
      },
      {
        title: "Pointing north",
        scene: "compass",
        headline: "Within one-fifteenth of a degree",
        lines: [
          "The pyramid's sides face north, south, east and west with an error of less than four minutes of arc — about one-fifteenth of a degree.",
          "Khafre's pyramid and Sneferu's Red Pyramid share the same slight counterclockwise twist.",
          "Engineer Glen Dash showed that tracking a shadow on the autumn equinox could produce exactly this kind of error.",
          "The builders left no record of their method, so it remains one possibility among several.",
        ],
      },
      {
        title: "When you visit",
        scene: "outro",
        headline: "When you visit Giza",
        data: { next: "Look for the Workers' Town south of the Sphinx." },
        lines: [
          "Most of the white casing is gone, stripped away and reused over the centuries.",
          "Merer's papyri have been displayed at the Egyptian Museum in Cairo.",
          "At Giza, the Workers' Town and Cemetery south of the Sphinx tell the builders' side of the story.",
          "Every claim in this film is listed with its source below the video.",
        ],
      },
    ],
    sources: [
      { name: "Diary of Merer — Wikipedia", url: "https://en.wikipedia.org/wiki/Diary_of_Merer" },
      { name: "National Geographic — The Red Sea Scrolls (2024)", url: "https://www.nationalgeographic.com/premium/article/red-sea-scrolls-pyramids-egypt" },
      { name: "World History Encyclopedia — Great Pyramid of Giza", url: "https://www.worldhistory.org/Great_Pyramid_of_Giza/" },
      { name: "History.com — Ancient ramp find deepens mystery (2018)", url: "https://www.history.com/news/ancient-egypt-pyramid-ramp-discovery" },
      { name: "Scientific American / Live Science — Hatnub ramp (2018)", url: "https://www.scientificamerican.com/article/a-ramp-contraption-may-have-been-used-to-build-egypts-great-pyramid/" },
      { name: "Ministry of Tourism and Antiquities — Workers' Town and Cemetery", url: "https://egymonuments.gov.eg/en/monuments/workers-town-and-cemetery/" },
      { name: "Smithsonian — The fall equinox and the pyramids' alignment", url: "https://www.smithsonianmag.com/smart-news/fall-equinox-secret-pyramids-near-perfect-alignment-180968223/" },
      { name: "Live Science — Great Pyramid's near-perfect alignment", url: "https://www.livescience.com/61799-great-pyramid-near-perfect-alignment.html" },
    ],
  },
  {
    id: "nile-three-seasons",
    title: "Three seasons of the Nile",
    summary:
      "Akhet, Peret and Shemu: how one river's flood shaped farming, taxes and the calendar of ancient Egypt — and why it stopped in the 1960s.",
    destinations: ["aswan", "luxor", "cairo"],
    period: "Ancient Egypt to the 1960s",
    chapters: [
      {
        title: "A gift of the river",
        scene: "title",
        headline: "A gift of the river",
        data: { kicker: "An original Discover Egypt explainer", sub: "The flood that made a civilisation", motif: "river" },
        lines: [
          "Ancient Egypt lived by one rhythm: the yearly flood of the Nile.",
          "With almost no rain, the river's rise and fall organised farming, taxes and even the calendar.",
        ],
      },
      {
        title: "Black land, red land",
        scene: "valley",
        headline: "Kemet and Deshret",
        data: { left: "Deshret · red land", center: "Kemet · black land", right: "Deshret · red land" },
        lines: [
          "Each flood left a layer of fertile black silt across the valley floor.",
          "Egyptians called their country Kemet, the black land.",
          "Beyond it lay Deshret, the red land of the eastern and western deserts.",
        ],
      },
      {
        title: "Akhet — inundation",
        scene: "wheel",
        headline: "Akhet · inundation",
        data: { active: 0 },
        lines: [
          "The year had three seasons of four months each.",
          "Akhet was the season of inundation, when the river spread over the fields.",
          "With the land under water, labour was free for other work, and historians link this season to the great state building projects.",
        ],
      },
      {
        title: "Peret — emergence",
        scene: "wheel",
        headline: "Peret · emergence",
        data: { active: 1 },
        lines: ["Peret was the season of emergence and growth.", "As the water drew back, the soaked black soil appeared and was ploughed and sown."],
      },
      {
        title: "Shemu — harvest",
        scene: "wheel",
        headline: "Shemu · harvest",
        data: { active: 2 },
        lines: ["Shemu was the harvest, when crops ripened and the river ran at its lowest.", "Then the flood returned, and the cycle began again."],
      },
      {
        title: "Reading the river",
        scene: "gauge",
        headline: "The nilometer",
        data: { place: "Elephantine Island · Aswan" },
        lines: [
          "To forecast the flood, Egyptians measured the river with nilometers marked in cubits.",
          "The nilometer on Elephantine Island at Aswan, near the southern border, was among the first to see the water rise.",
          "Readings passed downstream helped predict the harvest — and the taxes that would follow.",
        ],
      },
      {
        title: "A calendar from the sky",
        scene: "sky",
        headline: "365 days, and a star",
        lines: [
          "Egyptians noticed that the bright star Sirius, which they called Sopdet, reappeared at dawn before the flood.",
          "Their civil calendar had 365 days: twelve months of thirty days in three seasons, plus five extra days.",
          "With no leap years it slowly drifted, so the season names only sometimes matched the real flood.",
        ],
      },
      {
        title: "The flood that stopped",
        scene: "dam",
        headline: "The Aswan High Dam",
        lines: [
          "In the 1960s, the Aswan High Dam was built to control the river.",
          "Lake Nasser formed behind it, and the yearly flood that had shaped Egypt for thousands of years came to an end.",
          "The rising lake also threatened the temples of Nubia — the story of our Abu Simbel film.",
        ],
      },
      {
        title: "Where to see it",
        scene: "outro",
        headline: "Where to see it",
        data: { next: "Visit the nilometer on Elephantine Island, Aswan." },
        lines: [
          "In Aswan, you can still walk down the nilometer on Elephantine Island and see the marks on its walls.",
          "Every claim in this film is listed with its source below the video.",
        ],
      },
    ],
    sources: [
      { name: "Flooding of the Nile — Wikipedia", url: "https://en.wikipedia.org/wiki/Flooding_of_the_Nile" },
      { name: "Egyptian calendar — Wikipedia", url: "https://en.wikipedia.org/wiki/Egyptian_calendar" },
      { name: "Nile Scribes — The ancient Egyptian calendar", url: "https://nilescribes.org/2017/12/20/the-ancient-egyptian-calendar/" },
      { name: "History of Egypt — The flood and the nilometers", url: "https://historyofegypt.net/?p=520" },
    ],
  },
  {
    id: "moving-abu-simbel",
    title: "Moving Abu Simbel",
    summary:
      "How an international campaign cut two rock temples of Ramesses II into more than a thousand blocks and rebuilt them 65 metres higher, before Lake Nasser rose.",
    destinations: ["abu-simbel", "aswan", "nubia"],
    period: "13th century BCE · rescued 1964–1968",
    chapters: [
      {
        title: "Temples in a cliff",
        scene: "title",
        headline: "Moving Abu Simbel",
        data: { kicker: "An original Discover Egypt explainer", sub: "Nubia · Ramesses II · 1964–1968", motif: "temple" },
        lines: [
          "In the 13th century BCE, Ramesses II had two temples carved into a sandstone cliff above the Nile at Abu Simbel, in Nubia.",
          "The Great Temple took about twenty years and was completed around 1265 BCE.",
        ],
      },
      {
        title: "Two temples",
        scene: "temple",
        headline: "The Great Temple and the Small Temple",
        lines: [
          "The Great Temple was dedicated to Amun, Re-Horakhty and Ptah — and to Ramesses himself as a god.",
          "Four seated colossi of the king guard its entrance.",
          "The Small Temple honours the goddess Hathor and Queen Nefertari, with six standing statues: four of Ramesses and two of Nefertari, all the same size.",
        ],
      },
      {
        title: "Rising water",
        scene: "dam",
        headline: "Lake Nasser rises",
        lines: [
          "In the 1960s, the Aswan High Dam began to create Lake Nasser.",
          "Its waters would cover many of Nubia's ancient temples — Abu Simbel among them.",
        ],
      },
      {
        title: "Now or never",
        scene: "papyrus",
        headline: "Abu Simbel: Now or Never",
        data: { place: "UNESCO international appeal", found: "1960" },
        lines: [
          "In 1960, UNESCO launched an international appeal to save the monuments of Nubia.",
          "Its magazine, the UNESCO Courier, published a special report titled Abu Simbel: Now or Never.",
        ],
      },
      {
        title: "Cut into blocks",
        scene: "blocks",
        headline: "More than a thousand blocks",
        data: { count: "1,035–1,042", weight: "≈ 20 t average · up to 30 t" },
        lines: [
          "Work began in 1964, behind a temporary cofferdam that held back the rising water.",
          "Teams sawed both temples, and the rock around them, into more than a thousand blocks.",
          "Sources give between 1,035 and 1,042 blocks, averaging about 20 tonnes and weighing up to 30.",
        ],
      },
      {
        title: "65 metres up",
        scene: "lift",
        headline: "65 m higher · 200 m back",
        lines: [
          "Each block was numbered, lifted, and reassembled about 65 metres higher and around 200 metres back from the river.",
          "The temples kept their original orientation, rebuilt inside a concrete dome hidden beneath an artificial hill.",
        ],
      },
      {
        title: "Reopened",
        scene: "stats",
        headline: "Reopened 22 September 1968",
        data: {
          stats: [
            { value: 1968, unit: "", label: "temples reopened" },
            { value: 40, unit: "million $", label: "approximate cost" },
            { value: 1979, unit: "", label: "UNESCO World Heritage" },
          ],
        },
        lines: [
          "The relocated temples were officially inaugurated on 22 September 1968.",
          "The rescue cost around 40 million dollars, shared by many nations.",
          "In 1979, the Nubian Monuments from Abu Simbel to Philae became a UNESCO World Heritage Site.",
        ],
      },
      {
        title: "The sun returns",
        scene: "sun",
        headline: "22 February · 22 October",
        lines: [
          "Twice a year, on 22 February and 22 October, the rising sun reaches deep into the Great Temple's sanctuary.",
          "Since the move, the alignment falls one day later than it did before.",
          "Some say the dates mark Ramesses' birthday and coronation, but that is not confirmed.",
        ],
      },
      {
        title: "Philae, too",
        scene: "outro",
        headline: "Not the only rescue",
        data: { next: "Philae was rebuilt on Agilkia Island, near Aswan." },
        lines: [
          "Abu Simbel was not alone. Between 1977 and 1980, the temples of Philae were dismantled into about 40,000 blocks and rebuilt on nearby Agilkia Island.",
          "Every claim in this film is listed with its source below the video.",
        ],
      },
    ],
    sources: [
      { name: "UNESCO World Heritage Centre — Nubian Monuments from Abu Simbel to Philae", url: "https://whc.unesco.org/en/list/88/" },
      { name: "Historical Marker Database — The Salvage of Abu Simbel Temples", url: "https://www.hmdb.org/m.asp?m=289511" },
      { name: "International Campaign to Save the Monuments of Nubia — Wikipedia", url: "https://en.wikipedia.org/wiki/International_Campaign_to_Save_the_Monuments_of_Nubia" },
      { name: "Abu Simbel — Wikipedia", url: "https://en.wikipedia.org/wiki/Abu_Simbel" },
      { name: "Voyaged — How ancient temples were dismantled and rebuilt", url: "https://www.voyagedmagazine.com/?p=19095" },
      { name: "Ahram Online — Sun alignment at Abu Simbel (2026)", url: "https://english.ahram.org.eg/News/580591.aspx" },
      { name: "Original Travel — The Abu Simbel Sun Festival", url: "https://www.originaltravel.co.uk/travel-blog/the-abu-simbel-sun-festival" },
    ],
  },
];
