/**
 * Egyptian proverbs (amthāl). These are widely used, traditional sayings in Egyptian colloquial Arabic.
 * Transliteration follows a simple, readable scheme (ʾ = glottal stop, ʿ = ʿayn, kh, gh, sh; Cairene "g" for ج).
 * Translations and explanations are editorial. Review status is tracked per entry and shown in the admin dashboard.
 */
export type Proverb = {
  id: string;
  arabic: string;
  transliteration: string;
  literal: string;
  meaning: string;
  /** When an Egyptian might actually say it — the part that makes it memorable. */
  useIt: string;
  tone: "funny" | "wise" | "warm";
  provenance: "Traditional Egyptian proverb";
  review: { status: "editorial-draft" | "native-reviewed"; lastReviewed: string };
};

const draft = { status: "editorial-draft", lastReviewed: "2026-11-13" } as const;
const P = "Traditional Egyptian proverb" as const;

export const proverbs: Proverb[] = [
  { id: "mishmish", arabic: "بكرة في المشمش", transliteration: "bukra fil-mishmish", literal: "Tomorrow, in apricot season.", meaning: "It will never happen. Apricot season is famously short.", useIt: "When someone promises the bus will definitely leave on time.", tone: "funny", provenance: P, review: draft },
  { id: "atrash", arabic: "زي الأطرش في الزفة", transliteration: "zayy il-aṭrash fiz-zaffa", literal: "Like the deaf man at the wedding procession.", meaning: "Completely lost about what is going on around you.", useIt: "Your first ten minutes in Khan el-Khalili.", tone: "funny", provenance: P, review: draft },
  { id: "lihaf", arabic: "على قد لحافك مد رجليك", transliteration: "ʿala ʾadd liḥāfak midd riglēk", literal: "Stretch your legs only as far as your blanket reaches.", meaning: "Live within your means.", useIt: "Before you open the budget calculator.", tone: "wise", provenance: P, review: draft },
  { id: "mugarrab", arabic: "اسأل مجرب ولا تسألش حكيم", transliteration: "isʾal mugarrab wala tisʾalsh ḥakīm", literal: "Ask someone who has tried it, not a wise man.", meaning: "Experience beats theory.", useIt: "Exactly why we built Ask a Local.", tone: "wise", provenance: P, review: draft },
  { id: "ird", arabic: "القرد في عين أمه غزال", transliteration: "il-ʾird fi ʿēn ummu ghazāl", literal: "In his mother's eyes, the monkey is a gazelle.", meaning: "Love makes everyone beautiful.", useIt: "When a proud aunt shows you baby photos.", tone: "funny", provenance: P, review: draft },
  { id: "fula", arabic: "كل فولة وليها كيال", transliteration: "kull fūla w-līha kayyāl", literal: "Every bean has someone to measure it.", meaning: "Everyone finds their match.", useIt: "At a wedding — or a ful cart.", tone: "warm", provenance: P, review: draft },
  { id: "ads", arabic: "اللي ما يعرفش يقول عدس", transliteration: "illi ma-yiʿrafsh yiʾūl ʿads", literal: "Whoever doesn't know says it was lentils.", meaning: "People judge without knowing the full story.", useIt: "When rumours start before the facts.", tone: "funny", provenance: P, review: draft },
  { id: "bab", arabic: "الباب اللي يجيلك منه الريح سده واستريح", transliteration: "il-bāb illi yigīlak minnu ir-rīḥ, siddu w-istirīḥ", literal: "The door the wind blows in from — shut it and rest.", meaning: "Avoid the source of trouble instead of fighting it.", useIt: "When a shop owner won't stop insisting.", tone: "wise", provenance: P, review: draft },
  { id: "khabbaz", arabic: "إدي العيش لخبازه ولو ياكل نصه", transliteration: "iddi il-ʿēsh li-khabbāzu walaw yākul nuṣṣu", literal: "Give the bread to its baker, even if he eats half.", meaning: "Pay an expert — it is worth it.", useIt: "When choosing a licensed guide.", tone: "wise", provenance: P, review: draft },
  { id: "id", arabic: "إيد لوحدها ما تسقفش", transliteration: "īd liwaḥdaha ma-tsaʾʾafsh", literal: "One hand on its own can't clap.", meaning: "We need each other.", useIt: "When the felucca needs pushing off the bank.", tone: "warm", provenance: P, review: draft },
  { id: "gar", arabic: "الجار قبل الدار", transliteration: "ig-gār ʾabl id-dār", literal: "The neighbour before the house.", meaning: "Who you live beside matters more than where you live.", useIt: "When picking a guesthouse.", tone: "warm", provenance: P, review: draft },
  { id: "sabr", arabic: "الصبر مفتاح الفرج", transliteration: "iṣ-ṣabr muftāḥ il-farag", literal: "Patience is the key to relief.", meaning: "Good things come to those who wait.", useIt: "In Cairo traffic at 5 pm.", tone: "wise", provenance: P, review: draft },
  { id: "fat", arabic: "اللي فات مات", transliteration: "illi fāt māt", literal: "What has passed has died.", meaning: "Let bygones be bygones.", useIt: "After an argument over a taxi fare.", tone: "warm", provenance: P, review: draft },
  { id: "yeish", arabic: "اللي يعيش ياما يشوف", transliteration: "illi yiʿīsh yāma yshūf", literal: "Whoever lives long will see a lot.", meaning: "Life is full of surprises.", useIt: "When you see a donkey cart overtake a sports car.", tone: "funny", provenance: P, review: draft },
];

/** Same proverb for everyone on the same Cairo calendar day. */
export function proverbOfTheDay(now = new Date()): Proverb {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const day = Math.floor(Date.parse(ymd + "T00:00:00Z") / 86_400_000);
  return proverbs[((day % proverbs.length) + proverbs.length) % proverbs.length];
}
