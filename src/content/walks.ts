import type { PhotoKey } from "./images";
import type { Status } from "./practical";

export type Stop = { name: string; lat: number; lng: number; minutes: number; story: string };
export type Walk = {
  slug: string;
  title: string;
  duration: string;
  distanceKm: number;
  photo: PhotoKey;
  intro: string;
  tips: string[];
  stops: Stop[];
  status: Status;
};

export const walks: Walk[] = [
  {
    slug: "islamic-cairo-3-hours",
    title: "Islamic Cairo in three hours",
    duration: "About 3 hours",
    distanceKm: 1.8,
    photo: "islamicCairo",
    intro: "Walk south along Al-Muizz Street, the main street of Fatimid Cairo, from the northern gates to Bab Zuweila.",
    tips: [
      "Start in the morning before the heat and the market crowds.",
      "Carry a scarf for mosque visits and small notes for entrance fees and tips.",
      "Friday midday prayers close some mosques to visitors.",
    ],
    status: "awaiting",
    stops: [
      { name: "Bab al-Futuh", lat: 30.0549, lng: 31.2636, minutes: 15, story: "One of the stone gates built in the 11th century to protect Fatimid Cairo." },
      { name: "Mosque of al-Hakim", lat: 30.0545, lng: 31.2634, minutes: 20, story: "A huge Fatimid mosque with an open courtyard and distinctive minarets." },
      { name: "Bayt al-Suhaymi", lat: 30.0522, lng: 31.2621, minutes: 30, story: "An Ottoman-era merchant's house with wooden mashrabiya screens and a garden courtyard." },
      { name: "Qalawun Complex", lat: 30.0497, lng: 31.2611, minutes: 25, story: "A 13th-century Mamluk hospital, school and mausoleum." },
      { name: "Khan el-Khalili", lat: 30.0477, lng: 31.2623, minutes: 40, story: "Cairo's historic bazaar. Stop for mint tea at a traditional café." },
      { name: "Al-Azhar Mosque", lat: 30.0457, lng: 31.2627, minutes: 25, story: "Founded in 970 CE, the heart of one of the world's oldest universities." },
      { name: "Al-Ghuri Complex", lat: 30.0453, lng: 31.2588, minutes: 15, story: "Late Mamluk mosque and mausoleum; Sufi Tanoura performances are held nearby on some evenings." },
      { name: "Bab Zuweila", lat: 30.0428, lng: 31.2577, minutes: 20, story: "The southern gate. Climb the minarets for one of the best views over old Cairo." },
    ],
  },
  {
    slug: "coptic-cairo-90-minutes",
    title: "Coptic Cairo in 90 minutes",
    duration: "About 1.5 hours",
    distanceKm: 1.2,
    photo: "coptic",
    intro: "A compact walk inside the walls of the old Roman fortress of Babylon, starting at Mar Girgis metro station.",
    tips: ["Take Metro Line 1 to Mar Girgis.", "Dress modestly; some churches hold services.", "Photography rules differ inside churches — check signs."],
    status: "awaiting",
    stops: [
      { name: "Mar Girgis metro", lat: 30.006, lng: 31.2297, minutes: 5, story: "Exit straight into the Roman towers of the Babylon fortress." },
      { name: "Hanging Church", lat: 30.0053, lng: 31.2301, minutes: 20, story: "Named because it was built over a gatehouse of the fortress." },
      { name: "Coptic Museum", lat: 30.006, lng: 31.2302, minutes: 30, story: "The world's largest collection of Coptic Christian art." },
      { name: "Church of St Sergius and Bacchus", lat: 30.0058, lng: 31.2308, minutes: 15, story: "Tradition says the Holy Family sheltered here." },
      { name: "Ben Ezra Synagogue", lat: 30.0049, lng: 31.2313, minutes: 10, story: "Where the Cairo Geniza, a huge medieval document archive, was found." },
      { name: "Mosque of Amr ibn al-As", lat: 30.0103, lng: 31.2335, minutes: 15, story: "Site of the first mosque built in Egypt, in 642 CE." },
    ],
  },
];
