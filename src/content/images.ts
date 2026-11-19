/**
 * Photo library. Every image is from Wikimedia Commons with its licence and author,
 * looked up through the Commons API on 2026-11-12. Credits are shown in /credits.
 * A key mapped to `null` means no suitable licensed photo was found; the UI shows
 * a designed placeholder instead of a random stock image.
 */
export type Photo = {
  src: string;
  /** Responsive Commons thumbnails (500/960/1920 w). Absent for files served unscaled. */
  srcSet?: string;
  alt: string;
  author: string;
  license: string;
  sourcePage: string;
};

const T = "https://thumb.wikimedia.org/wikipedia/commons/thumb";
const U = "https://upload.wikimedia.org/wikipedia/commons";

/**
 * `thumb`: true for Commons-made thumbnails at 500/960/1920px, false for the original file only, or the
 * original's width when it is 1920px or narrower (Commons can't make a thumbnail as wide as the original).
 */
function commons(path: string, file: string, alt: string, author: string, license: string, thumb: boolean | number = true): Photo {
  const at = (w: number) => `${T}/${path}/${file}/${w}px-${file}`;
  const original = `${U}/${path}/${file}`;
  if (typeof thumb === "number") {
    const sizes = [500, 960].filter((w) => w < thumb);
    return {
      src: original,
      srcSet: [...sizes.map((w) => `${at(w)} ${w}w`), `${original} ${thumb}w`].join(", "),
      alt,
      author,
      license,
      sourcePage: `https://commons.wikimedia.org/wiki/File:${file}`,
    };
  }
  const src = thumb ? at(1920) : original;
  return {
    src,
    srcSet: thumb ? [500, 960, 1920].map((w) => `${at(w)} ${w}w`).join(", ") : undefined,
    alt,
    author,
    license,
    sourcePage: `https://commons.wikimedia.org/wiki/File:${file}`,
  };
}

export const photos = {
  // Hero slideshow — verified via the Commons API on 2026-11-13
  heroGiza: commons("7/73", "After_A_Day_Of_Work_%28182691085%29.jpeg", "Camel riders crossing the Giza plateau at sunset, with the Great Pyramid on the right", "Simon Matzinger", "CC BY 3.0"),
  heroAswan: commons("a/af", "El_Nilo_a_su_paso_por_Asu%C3%A1n%2C_Egipto%2C_2022-04-01%2C_DD_175-177_HDR.jpg", "Feluccas sailing on a golden Nile at Aswan in the evening light", "Diego Delso", "CC BY-SA 4.0"),
  heroWhiteDesert: commons("b/bf", "White_desert_sunset_time.jpg", "Chalk rock formations of the White Desert glowing at sunset", "Ahmed Yousry Mahfouz", "CC BY-SA 4.0"),
  luxorBalloons: commons("7/75", "Balloons_over_Luxor_at_Sunrise_%2853285143823%29.jpg", "Hot-air balloons rising over Luxor at sunrise", "Mustang Joe", "CC0"),
  cairo: commons("5/54", "Cairo_skyline%2C_Nile_River%2C_Egypt.jpg", "Cairo skyline rising above the Nile at dusk", "Vyacheslav Argenberg", "CC BY 4.0"),
  giza: commons("a/af", "All_Gizah_Pyramids.jpg", "The three Giza pyramids standing in the desert", "Ricardo Liberato", "CC BY-SA 2.0"),
  gem: commons("0/04", "Grand_Egyptian_Museum_2025.jpg", "The Grand Egyptian Museum facade near the Giza plateau", "Amr F. Nagy", "Public domain"),
  luxor: commons("4/43", "Templo_de_Karnak%2C_Luxor%2C_Egipto%2C_2022-04-03%2C_DD_144.jpg", "Columns of Karnak Temple in Luxor", "Diego Delso", "CC BY-SA 4.0"),
  valleyKings: commons("5/5d", "Thebes%2C_Luxor%2C_Egypt%2C_Valley_of_the_Kings_from_above.jpg", "The Valley of the Kings seen from above", "Vyacheslav Argenberg", "CC BY 4.0"),
  aswan: commons("a/a8", "Aswan_Nile_R23.jpg", "Feluccas on the Nile at Aswan", "Marc Ryckaert", "CC BY 3.0"),
  philae: commons("8/8d", "Philae_Temple_R05.jpg", "Philae Temple on its island near Aswan", "Marc Ryckaert", "CC BY 3.0"),
  edfu: commons("1/15", "Edfu_Temple_R04.jpg", "The great pylon of Edfu Temple", "Marc Ryckaert", "CC BY-SA 4.0"),
  abuSimbel: commons("0/02", "Templo_de_Rams%C3%A9s_II%2C_Abu_Simbel%2C_Egipto%2C_2022-04-02%2C_DD_26-28_HDR.jpg", "The four seated statues in the inner sanctuary of Ramesses II's Great Temple at Abu Simbel", "Diego Delso", "CC BY-SA 4.0"),
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

  // Added 2026-11-19 — every file, licence and author checked through the Commons API
  taameya: commons("5/55", "Tameya_Karoleen_Lindberg.jpg", "A plate of green-centred taameya, Egypt's fava-bean falafel", "Losttraveller", "CC BY-SA 3.0"),
  mahshi: commons("7/75", "Dolma_felfel_ou_karaa.JPG", "Peppers and courgettes stuffed with spiced rice", "Auzius", "CC BY-SA 4.0"),
  hawawshi: commons("8/88", "Egyptian_meatloaf_1.jpg", "Hawawshi: spiced minced meat baked inside crisp bread", "Mkevy", "CC BY-SA 4.0", 1600),
  sayadeya: commons("8/86", "Fish_Sayadieh.jpg", "Fish served over golden-brown sayadeya rice", "young shanahan", "CC BY 2.0"),
  kebda: commons("1/17", "Alexandria_delight_Liver_sandwiches.jpg", "A tray of Alexandrian liver sandwiches", "Bastique", "CC BY-SA 3.0"),
  siwaPalms: commons("e/e8", "A_palm_forest_-_panoramio.jpg", "Sunlight through a dense grove of date palms", "Vojife", "CC BY 3.0"),
  bedouinBread: commons("f/fd", "Bedouins_making_bread.jpg", "Two Bedouin men baking flatbread in the sand during a Sinai trek", "Florian Prischl", "CC BY-SA 3.0"),
  streetCart: commons("a/af", "Food_carts_in_the_streets_of_Egypt.jpg", "A food cart in a street hung with festive decorations", "Foua42000", "CC BY-SA 4.0"),
  narmer: commons("b/be", "Narmer_Palette.jpg", "Both sides of the Narmer Palette, carved around 3100 BCE", "Unknown photographer", "Public domain"),
  rosetta: commons("7/7d", "Rosetta_Stone%2C_British_Museum_-_rear_view.jpg", "The Rosetta Stone on display at the British Museum", "APK", "CC BY 4.0"),
  templeRelief: commons("5/52", "Thebes%2C_Medinet_Habu%2C_Egypt%2C_Temple_of_Ramesses_III%2C_Reliefs.jpg", "Carved hieroglyphs and a king's figure on the Temple of Ramesses III at Medinet Habu", "Vyacheslav Argenberg", "CC BY 4.0"),
  cartouche: commons("2/2d", "Karnak_temple%2C_Gro%C3%9Fer_S%C3%A4ulensaal_9496.JPG", "A painted royal cartouche on the ceiling of Karnak's Great Hypostyle Hall", "Hedwig Storch", "CC BY-SA 3.0"),
  ankh: commons("1/12", "26863-_Ankh_Sniff.jpg", "A god offering the ankh, the sign of life, in a painted relief at Abydos", "Panegyrics of Granovetter", "CC BY-SA 2.0"),
  komOmbo: commons("7/71", "02010_05843_Double_entrance_of_Kom_Ombo_Temple.jpg", "The double entrance of the Ptolemaic temple of Kom Ombo", "Silar", "CC BY-SA 4.0"),
  copticMuseum: commons("0/02", "Grounds_of_the_Coptic_Museum_in_Old_Cairo_%286%29_%2852086139022%29.jpg", "The garden and carved wooden balconies of the Coptic Museum in Old Cairo", "Richard Mortel", "CC BY 2.0"),
  cairoTower: commons("7/73", "The_Nile_river_and_Zamalek_island_and_Cairo_Tower_behind_%2814797781314%29.jpg", "Nile boats moored at Zamalek with Cairo Tower behind", "Jorge Láscar", "CC BY 2.0"),
  egyptianMuseum: commons("9/95", "Facade_of_the_Egyptian_Museum%2C_Tahrir_Square%2C_Cairo%2C_Egypt2.jpg", "The red facade of the Egyptian Museum on Tahrir Square", "Diego Delso", "CC BY-SA 3.0"),
  nilometer: commons("b/bd", "Assuan_Elephantine_Nilometer_17.JPG", "Stone steps of the ancient nilometer on Elephantine Island, Aswan", "Olaf Tausch", "CC BY 3.0"),
  spiceMarket: commons("6/61", "%2BDer_Gew%C3%BCrzmarkt_in_Assuan._01.jpg", "Baskets of spices and dried hibiscus in Aswan's market", "Holger Uwe Schmitt", "CC BY-SA 4.0"),
  nubianDoor: commons("0/0f", "Nubian_House%2C_Nagaa_Suhayl_Gharb%2C_AG%2C_EGY_%2848026553433%29.jpg", "A white Nubian house with a blue arched door", "Warren LeMay", "CC0"),
  mashrabiya: commons("3/3e", "Islamic_Spiritual_Place_%28_House_of_Suhaymi%2C_Darb_al-Asfar%2C_Al-Gamaliyya%2C_Cairo%2CEgypt%29.jpg", "Carved mashrabiya screens filtering light inside Bayt al-Suhaymi, Cairo", "Mohamed Nofalovich", "CC BY-SA 3.0"),
  lanterns: commons("c/c2", "Ramdan.jpg", "A family choosing Ramadan lanterns at a lantern stall", "ALaa O Radwan", "CC BY-SA 4.0"),
  nileCruise: commons("c/c4", "Medea_Nile_cruise_ship_R02.jpg", "A river cruise ship on the Nile near Luxor", "Marc Ryckaert", "CC BY-SA 4.0"),
  train: commons("e/e2", "Egyptian_Railways_%28ENR%29_1.jpg", "Egyptian National Railways carriages at a station", "Abdelrhman 1990", "CC BY-SA 4.0"),
  metro: commons("f/fc", "Cairo_metro_station_of_Third_line.jpg", "Passengers boarding a train at a Cairo Metro station", "Eurovaran", "CC BY-SA 4.0", 1920),
  poundNote: commons("6/66", "1_Egyptian_Pound_Backside.jpg", "The back of an Egyptian one-pound note, showing Abu Simbel", "AmrAmin", "CC BY-SA 4.0"),
  felucca: commons("7/77", "Boats_in_River_Nile_Aswan_%2C_Egypt.JPG", "A felucca sailing past granite boulders at Aswan", "Belmahdy", "CC BY-SA 4.0"),
  desertStars: commons("b/b9", "White_desert_in_night.jpg", "Chalk formations of the White Desert under a starry sky", "Ahmed Yousry Mahfouz", "CC BY-SA 4.0"),
  redSeaBeach: commons("b/b0", "Nuweiba%2C_Beach%2C_Red_Sea%2C_Sinai%2C_Egypt.jpg", "Turquoise water on the beach at Nuweiba, Sinai", "Vyacheslav Argenberg", "CC BY 4.0"),
  abuSimbelSanctuary: commons("0/0f", "Templo_de_Rams%C3%A9s_II%2C_Abu_Simbel%2C_Egipto%2C_2022-04-02%2C_DD_29-31_HDR.jpg", "The lit sanctuary at the end of the Great Temple of Abu Simbel", "Diego Delso", "CC BY-SA 4.0"),
  moulid: commons("a/ab", "%D8%A7%D9%84%D8%B4%D9%8A%D8%AE_%D9%8A%D9%88%D8%B3%D9%81_%D9%81%D8%A4%D8%A7%D8%AF-%D9%85%D9%88%D9%84%D8%AF_%D8%A7%D9%84%D8%AF%D8%B3%D9%88%D9%82%D9%8A.jpg", "A singer performing at a moulid celebration at night", "Faris El-Gwely", "CC BY-SA 4.0"),
  sinaiCamel: commons("1/14", "Sinai-Trekking-550-weisses_Kamel-2009-gje.jpg", "A trekker leading a camel through the Sinai mountains", "Gerd Eichmann", "CC BY-SA 4.0"),
  greatSandSea: commons("f/f0", "Great_Sand_Sea7.jpg", "Rolling dunes of the Great Sand Sea near Siwa", "ولاء", "Public domain"),
  reef: commons("4/41", "%D0%9A%D0%BE%D1%80%D0%B0%D0%BB%D0%BB%D0%BE%D0%B2%D1%8B%D0%B5_%D1%80%D0%B8%D1%84%D1%8B_%D0%B1%D1%83%D1%85%D1%82%D1%8B_%D0%9A%D0%BE%D1%80%D0%B0%D0%BB_%D0%91%D0%B5%D0%B9.jpg", "Coral and reef fish at Coral Bay, Sharm El Sheikh", "74papa", "CC BY 4.0"),
  seatedScribe: commons("0/0d", "Statue_of_a_scribe_from_Saqqara%2C_early_5th_Dynasty%2C_middle_of_the_25th_century_BCE%3B_Egyptian_Museum%2C_Cairo.jpg", "A painted limestone statue of a seated scribe from Saqqara", "Richard Mortel", "CC BY 2.0"),
  bookOfTheDead: commons("6/61", "Book_of_the_Dead_of_Kha%2C_papyrus_-_Museo_Egizio%2C_Turin_S_8316-03_S8438_p01.jpg", "A painted scene from the Book of the Dead of Kha on papyrus", "Unknown photographer", "CC0"),
  luxorTempleNight: commons("6/68", "Luxor_Temple_at_night%2C_Luxor%2C_Egypt.jpg", "Luxor Temple's colossal statues and obelisk lit up at night", "Vyacheslav Argenberg", "CC BY 4.0"),
  denderaCeiling: commons("7/73", "26905-_Dendera_ceiling_reliefs%2C_freshly_cleaned.jpg", "Freshly cleaned blue ceiling reliefs at Dendera Temple", "Panegyrics of Granovetter", "CC BY-SA 2.0"),
  hatshepsut: commons("4/47", "Templo_funerario_de_Hatshepsut%2C_Valle_de_las_Reyes%2C_Luxor%2C_Egipto%2C_2022-04-03%2C_DD_118.jpg", "The terraced mortuary temple of Hatshepsut beneath the Theban cliffs", "Diego Delso", "CC BY-SA 4.0"),
  alexFishingBoats: commons("2/2c", "Eastern_Port%2C_Alexandria_-_%D8%A7%D9%84%D9%85%D9%8A%D9%86%D8%A7%D8%A1_%D8%A7%D9%84%D8%B4%D8%B1%D9%82%D9%8A%D9%87_%D9%84%D9%85%D8%AF%D9%8A%D9%86%D9%87_%D8%A7%D9%84%D8%A3%D8%B3%D9%83%D9%86%D8%AF%D8%B1%D9%8A%D9%87.jpg", "Fishing boats in Alexandria's Eastern Harbour", "HadilAshour", "CC BY-SA 4.0"),
  breadCarrier: commons("f/f0", "Bread_man.JPG", "A man carrying a tray of fresh bread on his head through a city street", "Mohanad5ayman", "CC BY-SA 4.0"),
  aishBaladi: commons("a/ad", "Bread_mohanad.JPG", "A heap of freshly baked aish baladi, Egyptian flatbread", "Mohanad5ayman", "CC BY-SA 4.0"),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;

export function photo(key: PhotoKey | null | undefined): Photo | null {
  return key ? photos[key] : null;
}
