import { z } from "zod";
import { destinations } from "@/content/destinations";

const slugs = destinations.map((d) => d.slug) as [string, ...string[]];

/** Collapse whitespace and strip control characters. React escapes output, so no HTML is ever rendered from user input. */
export function clean(s: string) {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const text = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} is required` })
    .transform(clean)
    .pipe(z.string().min(min, `${label} must be at least ${min} characters`).max(max, `${label} must be ${max} characters or fewer`));

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

/** Honeypot: real people never see or fill this field. */
const honeypot = z.string().max(0, "Spam detected").optional();

export const questionSchema = z.object({
  name: text(2, 60, "Name"),
  email,
  destination: z.enum(slugs).or(z.literal("general")),
  question: text(10, 1000, "Question"),
  consent: z.literal(true, { error: "Please agree to the privacy policy" }),
  website: honeypot,
});

export const storySchema = z.object({
  name: text(2, 60, "Name"),
  email,
  country: text(2, 60, "Country"),
  title: text(5, 120, "Title"),
  story: text(50, 3000, "Story"),
  destination: z.enum(slugs),
  consent: z.literal(true, { error: "Please agree to the privacy policy" }),
  website: honeypot,
});

export const contactSchema = z.object({
  name: text(2, 60, "Name"),
  email,
  topic: z.enum(["planning", "accessibility", "press", "feedback", "other"]),
  message: text(10, 2000, "Message"),
  consent: z.literal(true, { error: "Please agree to the privacy policy" }),
  website: honeypot,
});

export const newsletterSchema = z.object({
  email,
  consent: z.literal(true, { error: "Please agree to receive emails" }),
  website: honeypot,
});

export const activitySchema = z.object({
  id: z.string().max(64),
  title: text(1, 120, "Activity"),
  destination: z.enum(slugs).nullable(),
  time: z.enum(["morning", "afternoon", "evening"]),
});

export const itinerarySchema = z.object({
  title: text(2, 80, "Trip name"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date").nullable(),
  style: z.enum(["backpacker", "budget", "comfortable", "luxury"]),
  travellers: z.number().int().min(1).max(20),
  interests: z.array(z.string().max(30)).max(10),
  days: z
    .array(z.object({ destination: z.enum(slugs).nullable(), activities: z.array(activitySchema).max(12) }))
    .min(1, "Add at least one day")
    .max(30, "Trips can be up to 30 days"),
});

export const moderationSchema = z.object({
  kind: z.enum(["question", "story"]),
  id: z.string().uuid().or(z.string().regex(/^[a-z0-9-]{8,64}$/)),
  action: z.enum(["approve", "reject"]),
  answer: z.string().transform(clean).pipe(z.string().max(2000)).optional(),
});

export const priceUpdateSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,40}$/),
  min: z.number().nonnegative().max(1_000_000),
  max: z.number().nonnegative().max(1_000_000),
}).refine((v) => v.max >= v.min, { message: "Maximum must be at least the minimum", path: ["max"] });

export const eventSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,60}$/, "Use lowercase letters, numbers and hyphens"),
  name: text(2, 100, "Name"),
  where: text(2, 100, "Location"),
  when: text(2, 100, "When"),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").nullable(),
  description: text(10, 500, "Description"),
  status: z.enum(["verified", "estimate", "awaiting"]),
  sourceName: z.string().transform(clean).pipe(z.string().max(120)).optional(),
  sourceUrl: z.union([z.literal(""), z.string().url("Enter a full https:// link").startsWith("https://", "Links must use https")]).optional(),
});

export const eventDeleteSchema = z.object({ id: z.string().regex(/^[a-z0-9-]{2,60}$/) });

export const featuredSchema = z.object({
  slugs: z.array(z.enum(slugs)).length(5, "Choose exactly five destinations").refine((a) => new Set(a).size === 5, "Choose five different destinations"),
});

const optionalText = (max: number) => z.string().transform(clean).pipe(z.string().max(max));
const httpsUrl = z.string().url("Enter a full https:// link").startsWith("https://", "Links must use https");

export const bucketSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{3,60}$/, "Use lowercase letters, numbers and hyphens"),
  title: text(5, 90, "Title"),
  description: text(10, 400, "Description"),
  destination: z.enum(slugs).nullable(),
  place: optionalText(80).optional(),
  categories: z.array(z.enum(["history", "adventure", "food", "culture", "nature", "photography", "relaxation", "family", "hidden-gems"])).min(1, "Choose at least one category").max(5),
  effort: z.enum(["easy", "moderate", "challenging"]),
  duration: text(2, 80, "Duration"),
  bestMonths: z.array(z.number().int().min(1).max(12)).max(12),
  season: z.object({ note: text(5, 200, "Season note"), verified: z.boolean(), source: z.object({ name: text(2, 120, "Source name"), url: httpsUrl }).optional() }).optional(),
  tips: z.array(text(3, 160, "Tip")).max(5),
  photo: z.string().regex(/^[A-Za-z0-9]{2,40}$/).nullable(),
  photoPath: z.string().regex(/^[a-f0-9-]{36}\.(jpg|png|webp)$/).nullable().optional(),
  link: z.object({ href: z.string().regex(/^\/[\w\-/#]*$/, "Use a link inside this site"), label: text(2, 40, "Link label") }).optional(),
  published: z.boolean(),
  featured: z.boolean(),
}).refine((a) => a.destination !== null || (a.place && a.place.length >= 3), { message: "Choose a destination or describe the place", path: ["place"] })
  .refine((a) => !a.season?.verified || !!a.season.source, { message: "A verified season needs a source", path: ["season"] });

export const bucketProgressSchema = z.record(
  z.string().regex(/^[a-z0-9-]{3,60}$/),
  z.object({ added: z.boolean(), done: z.boolean(), fav: z.boolean(), doneAt: z.string().datetime().optional() }),
).refine((r) => Object.keys(r).length <= 200, "Too many entries");

const seconds = z.number().int().min(0).max(4 * 3600);
export const mediaSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{3,60}$/, "Use lowercase letters, numbers and hyphens"),
    title: text(5, 140, "Title"),
    summary: text(10, 600, "Summary"),
    kind: z.enum(["original", "youtube"]),
    destinations: z.array(z.enum(slugs)).min(1, "Choose at least one destination").max(6),
    period: text(2, 80, "Period"),
    durationSec: z.number().int().min(30, "At least 30 seconds").max(4 * 3600).nullable(),
    explainerId: z.string().regex(/^[a-z0-9-]{3,60}$/).optional(),
    youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, "A YouTube id has 11 letters, digits, - or _").optional(),
    channel: optionalText(80).optional(),
    captionsNote: optionalText(160).optional(),
    credit: text(2, 120, "Credit"),
    license: text(2, 200, "Licence"),
    chapters: z.array(z.object({ start: seconds, title: text(1, 80, "Chapter title") })).max(40),
    transcript: z.array(z.object({ start: seconds, text: text(1, 500, "Transcript line") })).max(2000),
    sources: z.array(z.object({ name: text(2, 140, "Source name"), url: httpsUrl })).max(20),
    status: z.enum(["draft", "published"]),
    featured: z.boolean(),
  })
  .refine((m) => m.kind !== "youtube" || !!m.youtubeId, { message: "Add the YouTube video id", path: ["youtubeId"] })
  .refine((m) => m.chapters.every((c, i, a) => i === 0 || c.start > a[i - 1].start), { message: "Chapters must be in time order", path: ["chapters"] })
  .refine((m) => !m.durationSec || m.chapters.every((c) => c.start < m.durationSec!), { message: "A chapter starts after the end of the video", path: ["chapters"] });

/** Parse "0:00 Title" lines (one per line) into chapters or transcript lines. */
export function parseTimedLines(raw: string): { start: number; text: string }[] | { error: string } {
  const out: { start: number; text: string }[] = [];
  for (const [i, line] of raw.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const m = line.trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+(.+)$/);
    if (!m) return { error: `Line ${i + 1}: start with a time like 1:05 or 1:02:30` };
    const [, h, mm, ss, rest] = m;
    if (Number(ss) > 59 || (h && Number(mm) > 59)) return { error: `Line ${i + 1}: that time is not valid` };
    out.push({ start: Number(h ?? 0) * 3600 + Number(mm) * 60 + Number(ss), text: rest.trim() });
  }
  return out;
}

export type Itinerary = z.infer<typeof itinerarySchema>;

export function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
