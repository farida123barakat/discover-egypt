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
  slugs: z.array(z.enum(slugs)).length(4, "Choose exactly four destinations").refine((a) => new Set(a).size === 4, "Choose four different destinations"),
});

export type Itinerary = z.infer<typeof itinerarySchema>;

export function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
