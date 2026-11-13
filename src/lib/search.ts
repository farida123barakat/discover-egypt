import { destinations } from "@/content/destinations";
import { dishes } from "@/content/culture";
import { NAV } from "@/content/navigation";

export type SearchItem = { title: string; href: string; kind: "Destination" | "Dish" | "Page"; text: string };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");

export function buildIndex(): SearchItem[] {
  return [
    ...destinations.map((d) => ({ title: d.name, href: `/discover/${d.slug}`, kind: "Destination" as const, text: `${d.region} ${d.tagline} ${d.category} ${d.attractions.map((a) => a.name).join(" ")}` })),
    ...dishes.map((d) => ({ title: d.name, href: `/experience#taste`, kind: "Dish" as const, text: `${d.arabic} ${d.description} ${d.ingredients.join(" ")}` })),
    ...NAV.flatMap((g) => [
      { title: `${g.label}`, href: g.href, kind: "Page" as const, text: g.links.map((l) => l.label).join(" ") },
      ...g.links.map((l) => ({ title: l.label, href: l.href, kind: "Page" as const, text: `${g.label} ${l.hint ?? ""}` })),
    ]),
    { title: "My Egypt", href: "/my-egypt", kind: "Page", text: "saved favourites passport stamps itinerary pdf packing" },
    { title: "Privacy policy", href: "/privacy", kind: "Page", text: "data cookies" },
  ];
}

/** Every query word must match; title matches and word starts rank higher. */
export function search(index: SearchItem[], query: string, limit = 8): SearchItem[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return index
    .map((item) => {
      const title = norm(item.title);
      const body = norm(item.text);
      let score = 0;
      for (const w of words) {
        if (new RegExp(`\\b${w}`).test(title)) score += title.startsWith(w) ? 12 : 8;
        else if (title.includes(w)) score += 5;
        else if (new RegExp(`\\b${w}`).test(body)) score += 2;
        else if (body.includes(w)) score += 1;
        else return null;
      }
      if (item.kind === "Destination") score += 1;
      return { item, score };
    })
    .filter((x): x is { item: SearchItem; score: number } => x !== null)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map((x) => x.item);
}
