/**
 * Daily budget estimates in USD per person. These are editorial estimates,
 * not official prices. Shown with BUDGET_META in the UI.
 */
export const BUDGET_META = { label: "Estimate only", lastChecked: "2026-11-12", status: "estimate" as const };

export const STYLES = ["backpacker", "budget", "comfortable", "luxury"] as const;
export type Style = (typeof STYLES)[number];

export const CATEGORIES = ["accommodation", "food", "transport", "activities", "shopping"] as const;
export type BudgetCategory = (typeof CATEGORIES)[number];

export type DailyBudget = Record<BudgetCategory, number>;

export const PRESETS: Record<Style, DailyBudget> = {
  backpacker: { accommodation: 15, food: 10, transport: 5, activities: 15, shopping: 3 },
  budget: { accommodation: 35, food: 20, transport: 10, activities: 25, shopping: 8 },
  comfortable: { accommodation: 90, food: 40, transport: 25, activities: 45, shopping: 20 },
  luxury: { accommodation: 300, food: 100, transport: 70, activities: 100, shopping: 60 },
};

export function dailyTotal(b: DailyBudget): number {
  return CATEGORIES.reduce((s, c) => s + Math.max(0, Number(b[c]) || 0), 0);
}

export function tripTotal(b: DailyBudget, days: number, travellers = 1): number {
  const d = Math.max(1, Math.floor(days));
  const t = Math.max(1, Math.floor(travellers));
  return dailyTotal(b) * d * t;
}

export function convert(amountUsd: number, rate: number | null): number | null {
  if (rate === null || !Number.isFinite(rate) || rate <= 0) return null;
  return Math.round(amountUsd * rate);
}

export function styleLevel(style: Style): 1 | 2 | 3 | 4 {
  return (STYLES.indexOf(style) + 1) as 1 | 2 | 3 | 4;
}
