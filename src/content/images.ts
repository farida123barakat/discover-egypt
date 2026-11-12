/**
 * Photo library. Every image is from Wikimedia Commons with its licence and author,
 * looked up through the Commons API on 2026-11-12. Credits are shown in /credits.
 * A key mapped to `null` means no suitable licensed photo was found; the UI shows
 * a designed placeholder instead of a random stock image.
 */
export type Photo = {
  src: string;
  alt: string;
  author: string;
  license: string;
  sourcePage: string;
};

const T = "https://thumb.wikimedia.org/wikipedia/commons/thumb";
const U = "https://upload.wikimedia.org/wikipedia/commons";

function commons(path: string, file: string, alt: string, author: string, license: string, thumb = true): Photo {
  const src = thumb ? `${T}/${path}/${file}/1920px-${file}` : `${U}/${path}/${file}`;
  return {
    src,
    alt,
    author,
    license,
    sourcePage: `https://commons.wikimedia.org/wiki/File:${file}`,
  };
}

export const photos = {
  cairo: commons("5/54", "Cairo_skyline%2C_Nile_River%2C_Egypt.jpg", "Cairo skyline rising above the Nile at dusk", "Vyacheslav Argenberg", "CC BY 4.0"),
  giza: commons("a/af", "All_Gizah_Pyramids.jpg", "The three Giza pyramids standing in the desert", "Ricardo Liberato", "CC BY-SA 2.0"),
  gem: commons("0/04", "Grand_Egyptian_Museum_2025.jpg", "The Grand Egyptian Museum facade near the Giza plateau", "Amr F. Nagy", "Public domain"),
  luxor: commons("4/43", "Templo_de_Karnak%2C_Luxor%2C_Egipto%2C_2022-04-03%2C_DD_144.jpg", "Columns of Karnak Temple in Luxor", "Diego Delso", "CC BY-SA 4.0"),
  valleyKings: commons("5/5d", "Thebes%2C_Luxor%2C_Egypt%2C_Valley_of_the_Kings_from_above.jpg", "The Valley of the Kings seen from above", "Vyacheslav Argenberg", "CC BY 4.0"),
  aswan: commons("a/a8", "Aswan_Nile_R23.jpg", "Feluccas on the Nile at Aswan", "Marc Ryckaert", "CC BY 3.0"),
  philae: commons("8/8d", "Philae_Temple_R05.jpg", "Philae Temple on its island near Aswan", "Marc Ryckaert", "CC BY 3.0"),
  edfu: commons("1/15", "Edfu_Temple_R04.jpg", "The great pylon of Edfu Temple", "Marc Ryckaert", "CC BY-SA 4.0"),
  abuSimbel: commons("0/02", "Templo_de_Rams%C3%A9s_II%2C_Abu_Simbel%2C_Egipto%2C_2022-04-02%2C_DD_26-28_HDR.jpg", "Colossal statues of Ramesses II at Abu Simbel", "Diego Delso", "CC BY-SA 4.0"),
  saqqara: commons("2/2e", "Saqqara_pyramid_ver_2.jpg", "The Step Pyramid of Djoser at Saqqara", "Charles J. Sharp", "CC BY-SA 3.0"),
  alexandria: commons("8/84", "Egypt%2C_Alexandria%2C_The_Corniche_of_Alexandria%2C_Mediterranean_Sea.jpg", "Alexandria's Corniche curving along the Mediterranean", "Vyacheslav Argenberg", "CC BY 4.0"),
  bibAlex: commons("4/45", "Egypt%2C_Alexandria%2C_Bibliotheca_Alexandrina_2.jpg", "The tilted disc roof of the Bibliotheca Alexandrina", "Vyacheslav Argenberg", "CC BY 4.0"),
  qaitbay: commons("0/0d", "Citadel_of_Qaitbay_014.JPG", "The Citadel of Qaitbay on Alexandria's harbour", "لا روسا", "CC BY-SA 3.0"),
  siwa: commons("c/c4", "Siwa_Oasis%2C_Cleopatra%27s_Bath%2C_Egypt.jpg", "Palm-fringed Cleopatra's Spring in Siwa Oasis", "Vyacheslav Argenberg", "CC BY 4.0"),
  fayoum: commons("a/a0", "Waterfalls_of_Wadi_El_Rayan%2C_Fayoum%2C_Egypt.jpg", "The waterfalls of Wadi El Rayan in Fayoum", "Ibrahim El-Mezayen", "CC BY-SA 4.0"),
  wadiHitan: commons("4/4a", "Dorudon_atrox_fossil_at_Wadi_El-Hitan%2C_Egypt%2C_March_2008.jpg", "A fossil whale skeleton in the sand at Wadi Al-Hitan", "Christoph Rohner", "CC BY-SA 3.0"),
  whiteDesert: commons("1/16", "White_Desert%2C_Rock_formations_in_desert_landscape%2C_Egypt.jpg", "Chalk rock formations in the White Desert", "Vyacheslav Argenberg", "CC BY 4.0"),
  hurghada: commons("6/66", "Hurghada_beach_01.JPG", "A sandy beach and turquoise water in Hurghada", "Ad Meskens", "CC BY-SA 3.0"),
  elGouna: commons("8/8e", "El_Gouna_R13.jpg", "Lagoons and low buildings in El Gouna", "Marc Ryckaert", "CC BY 3.0"),
  marsaAlam: commons("9/9f", "Marsa_Alam_R05.jpg", "The Red Sea coast at Marsa Alam", "Marc Ryckaert", "CC BY 3.0"),
  sharm: commons("f/f5", "Ras_mohammed_coral_reef_landscape.jpg", "Coral reef in Ras Mohammed National Park", "Sovernigo", "CC BY-SA 4.0"),
  dahab: commons("d/d8", "Dahab_-_The_blue_hole_-_panoramio.jpg", "The Blue Hole dive site near Dahab", "Francesco Lo Bello", "CC BY 3.0"),
  sinai: commons("6/6a", "Sunrise_from_the_summit_of_Mount_Sinai_or_Gabal_Musa.jpg", "Sunrise over the mountains from the summit of Mount Sinai", "Sara Nabih", "CC BY-SA 4.0"),
  stCatherine: commons("6/6b", "Katharinenkloster_Sinai_BW_2.jpg", "Saint Catherine's Monastery at the foot of Mount Sinai", "Berthold Werner", "CC BY-SA 3.0"),
  islamicCairo: commons("d/d0", "Egypt%2C_Cairo%2C_Muizz_Market_Street%2C_Islamic_Cairo.jpg", "Al-Muizz Street in Historic Cairo", "Vyacheslav Argenberg", "CC BY 4.0"),
  citadel: commons("b/b4", "Muhammad_Ali_Mosque%2C_Citadel%2C_Cairo%2C_Egypt3.jpg", "The Mosque of Muhammad Ali on the Cairo Citadel", "Diego Delso", "CC BY-SA 3.0"),
  coptic: commons("3/3c", "Hanging_Church%2C_Old_Cairo%2C_Egypt3.jpg", "The Hanging Church in Coptic Cairo", "Diego Delso", "CC BY-SA 3.0"),
  khan: commons("d/dc", "The_Khan_el-Khalili_market_in_Cairo%2C_Egypt_%282743501345%29.jpg", "Lanterns and stalls in Khan el-Khalili market", "V Manninen", "CC BY 2.0"),
  azhar: commons("3/36", "Al-Azhar_Sunset.jpg", "Sunset over minarets from Al-Azhar Park", "Waynemowery", "CC BY-SA 4.0"),
  nubian: commons("5/5d", "Nubian_Village_at_Aswan_-_panoramio.jpg", "Colourful houses in a Nubian village near Aswan", "David Broad", "CC BY 3.0"),
  koshari: commons("e/e9", "Egyptian_food_Koshary.jpg", "A bowl of koshari with lentils, rice, pasta and crispy onions", "Dina Said", "CC BY-SA 4.0"),
  ful: commons("b/b7", "Ful_Medames.JPG", "A plate of ful medames with olive oil", "Miansari66", "CC0"),
  molokhia: commons("9/96", "Molokheya_hi_res.JPG", "A bowl of green molokhia soup", "Yosi I", "CC BY 2.5", false),
  feteer: commons("f/fc", "Fatir_002%2C_Lion_Village.JPG", "Flaky layered feteer pastry", "لا روسا", "CC BY-SA 4.0"),
  basbousa: commons("8/82", "Basboosa.jpg", "Squares of basbousa semolina cake", "stu_spivack", "CC BY-SA 2.0"),
  karkade: commons("3/36", "A_glass_of_hibiscus_tea_02.jpg", "A glass of deep red hibiscus tea", "claralieu", "CC BY 2.0"),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;

export function photo(key: PhotoKey | null | undefined): Photo | null {
  return key ? photos[key] : null;
}
