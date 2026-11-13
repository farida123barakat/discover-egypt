/**
 * Hieroglyph sign knowledge base.
 *
 * - Glyphs are the standard Unicode Egyptian Hieroglyphs (code points looked up from the Unicode
 *   Character Database by their official names, "EGYPTIAN HIEROGLYPH G001" etc.) and drawn with
 *   Google's Noto Sans Egyptian Hieroglyphs font (SIL Open Font License).
 * - Classification follows Sir Alan Gardiner's sign list (Egyptian Grammar, 3rd ed., 1957).
 *   Values and example words follow standard Middle Egyptian references (Gardiner 1957; J. P. Allen,
 *   Middle Egyptian, 3rd ed., 2014). Where Egyptologists are unsure what a sign depicts, we say so.
 * - Transliteration uses the conventional Egyptological alphabet (ꜣ j y ꜥ w b p f m n r h ḥ ḫ ẖ s š q k g t ṯ d ḏ).
 *   Pronunciation hints follow the modern teaching convention; ancient vowels were not written.
 */
export type SignKind = "uniliteral" | "biliteral" | "triliteral" | "logogram" | "determinative";

export type Sign = {
  gardiner: string;
  /** Unicode code point (hex) */
  cp: string;
  depicts: string;
  kind: SignKind;
  /** Phonetic value(s) in Egyptological transliteration, if the sign is used for sound */
  value?: string;
  /** How students usually say it */
  say?: string;
  /** Meaning when used as a word (logogram) */
  meaning?: string;
  usage: string;
  example?: { word: string; translit: string; gloss: string; signs: string[] };
  /** Lesson group */
  group: "alphabet" | "words" | "royal" | "determinatives";
  review: { status: "editorial-draft" | "specialist-reviewed"; lastReviewed: string };
};

export const SIGN_SOURCES = [
  { name: "A. H. Gardiner, Egyptian Grammar (3rd ed., 1957) — Sign List", url: "https://archive.org/details/egyptiangrammar0000gard" },
  { name: "J. P. Allen, Middle Egyptian: An Introduction to the Language and Culture of Hieroglyphs (3rd ed., 2014)", url: "https://doi.org/10.1017/CBO9781139524919" },
  { name: "Unicode Standard — Egyptian Hieroglyphs block (U+13000–U+1342F)", url: "https://www.unicode.org/charts/PDF/U13000.pdf" },
  { name: "Noto Sans Egyptian Hieroglyphs (SIL Open Font License)", url: "https://fonts.google.com/noto/specimen/Noto+Sans+Egyptian+Hieroglyphs" },
];

const R = { status: "editorial-draft", lastReviewed: "2026-11-13" } as const;

export const signs: Sign[] = [
  // ---- The "alphabet": uniliteral signs ----
  { gardiner: "G1", cp: "1313F", depicts: "Egyptian vulture", kind: "uniliteral", value: "ꜣ", say: "a (a glottal stop)", usage: "One of the most common sound signs.", group: "alphabet", review: R },
  { gardiner: "M17", cp: "131CB", depicts: "Flowering reed", kind: "uniliteral", value: "j", say: "i", usage: "Very common; begins the name of the god Amun.", example: { word: "Amun", translit: "jmn", gloss: "Amun, “the hidden one”", signs: ["M17", "Y5", "N35"] }, group: "alphabet", review: R },
  { gardiner: "Z4", cp: "133ED", depicts: "Two diagonal strokes", kind: "uniliteral", value: "y", say: "y", usage: "Often written at the end of words.", group: "alphabet", review: R },
  { gardiner: "D36", cp: "1309D", depicts: "Forearm", kind: "uniliteral", value: "ꜥ", say: "a (a deep sound from the throat)", usage: "A consonant that English does not have; also part of ꜥnḫ, “life”.", group: "alphabet", review: R },
  { gardiner: "G43", cp: "13171", depicts: "Quail chick", kind: "uniliteral", value: "w", say: "w or u", usage: "Also used as a plural ending.", group: "alphabet", review: R },
  { gardiner: "D58", cp: "130C0", depicts: "Lower leg and foot", kind: "uniliteral", value: "b", say: "b", usage: "A common sound sign.", group: "alphabet", review: R },
  { gardiner: "Q3", cp: "132AA", depicts: "Stool or mat", kind: "uniliteral", value: "p", say: "p", usage: "Begins pt, “sky”, and pr, “house”.", group: "alphabet", review: R },
  { gardiner: "I9", cp: "13191", depicts: "Horned viper", kind: "uniliteral", value: "f", say: "f", usage: "Also the word for “he / his”.", group: "alphabet", review: R },
  { gardiner: "G17", cp: "13153", depicts: "Owl", kind: "uniliteral", value: "m", say: "m", usage: "Also the preposition “in, with”.", group: "alphabet", review: R },
  { gardiner: "N35", cp: "13216", depicts: "Ripple of water", kind: "uniliteral", value: "n", say: "n", usage: "Also the preposition “to, for”.", group: "alphabet", review: R },
  { gardiner: "D21", cp: "1308B", depicts: "Mouth", kind: "uniliteral", value: "r", say: "r", meaning: "mouth; to, towards", usage: "As a word, r means “mouth” and is also a preposition.", group: "alphabet", review: R },
  { gardiner: "O4", cp: "13254", depicts: "Reed shelter", kind: "uniliteral", value: "h", say: "h", usage: "A light h, as in English “house”.", group: "alphabet", review: R },
  { gardiner: "V28", cp: "1339B", depicts: "Twisted wick of flax", kind: "uniliteral", value: "ḥ", say: "h (a stronger h)", usage: "Begins ḥtp, “offering, peace”.", group: "alphabet", review: R },
  { gardiner: "Aa1", cp: "1340D", depicts: "Uncertain — possibly a placenta or a sieve", kind: "uniliteral", value: "ḫ", say: "kh (as in Scottish “loch”)", usage: "What the sign depicts is not certain; its sound value is.", group: "alphabet", review: R },
  { gardiner: "F32", cp: "13121", depicts: "Animal's belly with teats", kind: "uniliteral", value: "ẖ", say: "kh (softer)", usage: "Less common than ḫ.", group: "alphabet", review: R },
  { gardiner: "O34", cp: "13283", depicts: "Door bolt", kind: "uniliteral", value: "s (z)", say: "s", usage: "Originally a z sound; later the same as s.", group: "alphabet", review: R },
  { gardiner: "S29", cp: "132F4", depicts: "Folded cloth", kind: "uniliteral", value: "s", say: "s", usage: "The usual sign for s.", group: "alphabet", review: R },
  { gardiner: "N37", cp: "13219", depicts: "Pool of water", kind: "uniliteral", value: "š", say: "sh", usage: "Begins šnw, “ring”, the word behind the cartouche.", group: "alphabet", review: R },
  { gardiner: "N29", cp: "1320E", depicts: "Sandy hill slope", kind: "uniliteral", value: "q", say: "q (a k from further back)", usage: "A common sound sign.", group: "alphabet", review: R },
  { gardiner: "V31", cp: "133A1", depicts: "Basket with handle", kind: "uniliteral", value: "k", say: "k", usage: "Also the word for “you / your” (said to a man).", group: "alphabet", review: R },
  { gardiner: "W11", cp: "133BC", depicts: "Jar stand", kind: "uniliteral", value: "g", say: "g (hard, as in “go”)", usage: "A common sound sign.", group: "alphabet", review: R },
  { gardiner: "X1", cp: "133CF", depicts: "Loaf of bread", kind: "uniliteral", value: "t", say: "t", usage: "Marks feminine words, as -t at the end.", group: "alphabet", review: R },
  { gardiner: "V13", cp: "1337F", depicts: "Tethering rope", kind: "uniliteral", value: "ṯ", say: "tj (as in “church”)", usage: "A common sound sign.", group: "alphabet", review: R },
  { gardiner: "D46", cp: "130A7", depicts: "Hand", kind: "uniliteral", value: "d", say: "d", usage: "A common sound sign.", group: "alphabet", review: R },
  { gardiner: "I10", cp: "13193", depicts: "Cobra", kind: "uniliteral", value: "ḏ", say: "dj (as in “jungle”)", usage: "A common sound sign.", group: "alphabet", review: R },

  // ---- Words (logograms and multi-consonant signs) ----
  { gardiner: "S34", cp: "132F9", depicts: "Ankh — probably a sandal strap", kind: "triliteral", value: "ꜥnḫ", say: "ankh", meaning: "life; to live", usage: "One of the best-known signs, carried by gods and offered to kings.", example: { word: "Tutankhamun", translit: "twt-ꜥnḫ-jmn", gloss: "“Living image of Amun”", signs: ["M17", "Y5", "N35", "S34"] }, group: "words", review: R },
  { gardiner: "F35", cp: "13124", depicts: "Heart and windpipe", kind: "triliteral", value: "nfr", say: "nefer", meaning: "good, beautiful, perfect", usage: "Common in names and blessings.", example: { word: "Nefertiti", translit: "nfrt-jj.tj", gloss: "“The beautiful one has come”", signs: ["F35"] }, group: "words", review: R },
  { gardiner: "N5", cp: "131F3", depicts: "Sun disc", kind: "logogram", value: "rꜥ", say: "ra", meaning: "sun; day; the sun god Ra", usage: "Also a determinative for words about time.", example: { word: "Ramesses", translit: "rꜥ-ms-sw", gloss: "“Ra is the one who bore him”", signs: ["N5"] }, group: "words", review: R },
  { gardiner: "R4", cp: "132B5", depicts: "Loaf on a reed mat", kind: "triliteral", value: "ḥtp", say: "hetep", meaning: "offering; to be content, at peace", usage: "Found on offering tables and in names.", example: { word: "Amenhotep", translit: "jmn-ḥtp", gloss: "“Amun is content”", signs: ["M17", "Y5", "N35", "R4"] }, group: "words", review: R },
  { gardiner: "O1", cp: "13250", depicts: "Plan of a house", kind: "biliteral", value: "pr", say: "per", meaning: "house", usage: "Also a determinative for buildings.", example: { word: "Pharaoh", translit: "pr-ꜥꜣ", gloss: "“Great house” — the palace, later the king himself", signs: ["O1"] }, group: "words", review: R },
  { gardiner: "D4", cp: "13079", depicts: "Eye", kind: "biliteral", value: "jr", say: "ir", meaning: "eye; to make, to do", usage: "One of the most frequent verbs.", group: "words", review: R },
  { gardiner: "N1", cp: "131EF", depicts: "Sky", kind: "logogram", value: "pt", say: "pet", meaning: "sky", usage: "Also a determinative for things above.", group: "words", review: R },
  { gardiner: "N16", cp: "131FE", depicts: "Strip of land with grains of sand", kind: "biliteral", value: "tꜣ", say: "ta", meaning: "land, earth", usage: "tꜣwj, “the Two Lands”, is a name for Egypt.", group: "words", review: R },
  { gardiner: "F34", cp: "13123", depicts: "Heart", kind: "logogram", value: "jb", say: "ib", meaning: "heart, mind", usage: "The heart was seen as the seat of thought and feeling.", group: "words", review: R },
  { gardiner: "G39", cp: "1316D", depicts: "Pintail duck", kind: "biliteral", value: "sꜣ", say: "sa", meaning: "son", usage: "In the royal title “son of Ra”.", group: "words", review: R },
  { gardiner: "N14", cp: "131FC", depicts: "Star", kind: "logogram", value: "sbꜣ", say: "seba", meaning: "star", usage: "Also used in words for “morning” and “to praise”.", group: "words", review: R },
  { gardiner: "M4", cp: "131B3", depicts: "Palm branch, stripped", kind: "logogram", value: "rnpt", say: "renpet", meaning: "year", usage: "Used when writing dates.", group: "words", review: R },
  { gardiner: "Y5", cp: "133E0", depicts: "Senet game board", kind: "biliteral", value: "mn", say: "men", usage: "Spells mn, as in Amun (jmn) and Memphis (mn-nfr).", group: "words", review: R },
  { gardiner: "N36", cp: "13218", depicts: "Canal", kind: "biliteral", value: "mr", say: "mer", usage: "Spells mrj, “beloved”, as in “beloved of Amun”.", group: "words", review: R },
  { gardiner: "G25", cp: "1315C", depicts: "Northern bald ibis", kind: "biliteral", value: "ꜣḫ", say: "akh", meaning: "spirit; effective, glorious", usage: "In the name Akhenaten (ꜣḫ-n-jtn).", group: "words", review: R },

  // ---- Royal and divine ----
  { gardiner: "V10", cp: "13377", depicts: "Cartouche — a loop of rope", kind: "logogram", meaning: "ring (šnw); encloses a royal name", usage: "Kings' names are written inside it.", group: "royal", review: R },
  { gardiner: "M23", cp: "131D3", depicts: "Sedge plant", kind: "logogram", value: "sw", say: "su", meaning: "king of Upper Egypt (nswt)", usage: "Paired with the bee in the title “King of Upper and Lower Egypt”.", group: "royal", review: R },
  { gardiner: "L2", cp: "131A4", depicts: "Bee", kind: "logogram", value: "bjt", say: "bit", meaning: "bee; king of Lower Egypt (bjtj)", usage: "Paired with the sedge plant in the royal title.", group: "royal", review: R },
  { gardiner: "G5", cp: "13143", depicts: "Falcon", kind: "logogram", value: "Ḥr", say: "Hor", meaning: "the god Horus", usage: "The king was seen as the living Horus.", group: "royal", review: R },
  { gardiner: "R8", cp: "132B9", depicts: "Cloth wound on a pole (a shrine flag)", kind: "logogram", value: "nṯr", say: "netjer", meaning: "god", usage: "ḥm-nṯr, “servant of the god”, means a priest.", group: "royal", review: R },
  { gardiner: "V30", cp: "1339F", depicts: "Wicker basket", kind: "biliteral", value: "nb", say: "neb", meaning: "lord; all, every", usage: "In nb tꜣwj, “Lord of the Two Lands”.", group: "royal", review: R },
  { gardiner: "S38", cp: "132FE", depicts: "Crook", kind: "logogram", value: "ḥqꜣ", say: "heqa", meaning: "ruler; to rule", usage: "The shepherd's crook is a symbol of kingship.", group: "royal", review: R },
  { gardiner: "R11", cp: "132BD", depicts: "Djed pillar", kind: "logogram", value: "ḏd", say: "djed", meaning: "stability, endurance", usage: "Often appears with ankh and was: “life, stability, dominion”.", group: "royal", review: R },
  { gardiner: "S40", cp: "13300", depicts: "Was sceptre", kind: "logogram", value: "wꜣs", say: "was", meaning: "dominion, power", usage: "Carried by gods.", group: "royal", review: R },

  // ---- Determinatives: silent signs that show what kind of word it is ----
  { gardiner: "A1", cp: "13000", depicts: "Seated man", kind: "determinative", meaning: "man, person; also “I”", usage: "Placed after words for men and people.", group: "determinatives", review: R },
  { gardiner: "B1", cp: "13050", depicts: "Seated woman", kind: "determinative", meaning: "woman", usage: "Placed after words for women and goddesses' names.", group: "determinatives", review: R },
  { gardiner: "A2", cp: "13001", depicts: "Man with hand to mouth", kind: "determinative", usage: "Shows the word is about eating, speaking or thinking.", group: "determinatives", review: R },
  { gardiner: "N25", cp: "13209", depicts: "Three hills", kind: "determinative", meaning: "foreign land, desert (ḫꜣst)", usage: "Placed after names of foreign countries.", group: "determinatives", review: R },
  { gardiner: "O49", cp: "13296", depicts: "Crossroads within a circle (a village plan)", kind: "determinative", meaning: "town, city (nwt)", usage: "Placed after names of towns.", group: "determinatives", review: R },
  { gardiner: "Z1", cp: "133E4", depicts: "Single stroke", kind: "determinative", meaning: "“this sign means the thing itself”; the number one", usage: "Shows the sign before it is a picture-word.", group: "determinatives", review: R },
  { gardiner: "D2", cp: "13077", depicts: "Face", kind: "logogram", value: "ḥr", say: "her", meaning: "face; upon", usage: "Also a common preposition.", group: "determinatives", review: R },
  { gardiner: "E1", cp: "130D2", depicts: "Bull", kind: "determinative", meaning: "bull, cattle (kꜣ)", usage: "Placed after words for cattle.", group: "determinatives", review: R },
];

export const glyph = (s: Pick<Sign, "cp">) => String.fromCodePoint(parseInt(s.cp, 16));
export const signByCode = (code: string) => signs.find((s) => s.gardiner === code);

export const GROUPS: { id: Sign["group"]; title: string; intro: string }[] = [
  { id: "alphabet", title: "Signs that are sounds", intro: "About 25 signs each stand for one consonant. Egyptologists call them uniliteral signs — the closest thing to an alphabet. Vowels were not written." },
  { id: "words", title: "Signs that are words", intro: "Many signs stand for a whole word or for two or three consonants at once. A stroke under a sign often means “read me as the thing I show”." },
  { id: "royal", title: "Kings and gods", intro: "Royal names sit inside a cartouche. Titles like “King of Upper and Lower Egypt” use the sedge plant and the bee." },
  { id: "determinatives", title: "Silent helpers", intro: "Determinatives are not read aloud. They come at the end of a word and show what kind of thing it is — a person, a town, a foreign land." },
];

/** Modern, for-fun mapping of Latin letters to uniliteral signs. NOT an ancient spelling system. */
export const NAME_MAP: Record<string, string[]> = {
  a: ["G1"], b: ["D58"], c: ["V31"], d: ["D46"], e: ["M17"], f: ["I9"], g: ["W11"], h: ["O4"], i: ["M17"], j: ["I10"], k: ["V31"], l: ["D21"], m: ["G17"],
  n: ["N35"], o: ["G43"], p: ["Q3"], q: ["N29"], r: ["D21"], s: ["S29"], t: ["X1"], u: ["G43"], v: ["I9"], w: ["G43"], x: ["V31", "S29"], y: ["Z4"], z: ["O34"],
};

export function nameToSigns(name: string): Sign[] {
  const lower = name.toLowerCase();
  const out: Sign[] = [];
  for (let i = 0; i < lower.length; i++) {
    const two = lower.slice(i, i + 2);
    if (two === "sh") { out.push(signByCode("N37")!); i++; continue; }
    if (two === "kh") { out.push(signByCode("Aa1")!); i++; continue; }
    if (two === "ch") { out.push(signByCode("V13")!); i++; continue; }
    const codes = NAME_MAP[lower[i]];
    if (codes) for (const c of codes) out.push(signByCode(c)!);
  }
  return out;
}
