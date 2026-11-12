import { destinations, type Destination, type Environment, type Interest } from "@/content/destinations";

export type Preferences = {
  interests: Interest[];
  environment: Environment | "any";
  budgetLevel: 1 | 2 | 3 | 4;
  days: number;
  month: number | null; // 1-12
  pace: "slow" | "balanced" | "packed";
};

export type Recommendation = { destination: Destination; score: number; reasons: string[] };

const INTEREST_LABEL: Record<Interest, string> = {
  history: "ancient history",
  beaches: "beaches",
  diving: "diving and snorkelling",
  adventure: "adventure",
  food: "food",
  culture: "local culture",
  family: "family activities",
  relaxation: "relaxation",
  photography: "photography",
  architecture: "architecture",
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Pure scoring function: deterministic, unit-tested. */
export function recommend(prefs: Preferences, pool: Destination[] = destinations, limit = 4): Recommendation[] {
  const scored = pool.map((d) => {
    let score = 0;
    const reasons: string[] = [];
    const strong: string[] = [];

    for (const i of prefs.interests) {
      const w = d.interests[i] ?? 0;
      score += w * 10;
      if (w >= 2) strong.push(INTEREST_LABEL[i]);
    }
    if (strong.length) {
      reasons.push(`Strong match for ${joinList(strong)}`);
      // Depth: places with enough to fill several days rank above one-stop sights on equal interest.
      score += Math.min(d.idealDays[1], Math.max(1, prefs.days), 4);
    }

    if (prefs.environment !== "any") {
      if (d.environment === prefs.environment) {
        score += 12;
        reasons.push(`The ${prefs.environment} setting you asked for`);
      } else score -= 4;
    }

    if (d.minBudgetLevel > prefs.budgetLevel) {
      score -= 10 * (d.minBudgetLevel - prefs.budgetLevel);
    } else if (prefs.budgetLevel <= 2 && d.minBudgetLevel === 1) {
      reasons.push("Works well on a tight budget");
      score += 3;
    }

    if (prefs.month) {
      if (d.bestMonths.includes(prefs.month)) {
        score += 8;
        reasons.push(`${MONTHS[prefs.month - 1]} is a great time to go`);
      } else score -= 6;
    }

    const [minDays] = d.idealDays;
    if (minDays > prefs.days) score -= 8;
    if (prefs.pace === "slow" && d.interests.relaxation) score += 4;
    if (d.hiddenGem && prefs.interests.length) {
      score += 2;
      reasons.push("A lesser-known gem with fewer crowds");
    }

    return { destination: d, score, reasons };
  });

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.destination.name.localeCompare(b.destination.name))
    .slice(0, limit);
}

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
