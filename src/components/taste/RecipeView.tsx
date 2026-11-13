"use client";
import { useState } from "react";
import { AlertTriangle, Check, Heart, Minus, Plus, Printer } from "lucide-react";
import { ALLERGEN_LABEL, scaleQty, type Recipe } from "@/content/food";
import { toggleRecipe, useMyEgypt } from "@/lib/client-store";

export function RecipeView({ r }: { r: Recipe }) {
  const me = useMyEgypt();
  const [serves, setServes] = useState(r.serves);
  const [done, setDone] = useState<number[]>([]);
  const [have, setHave] = useState<string[]>([]);
  const factor = serves / r.serves;
  const fav = me.recipes.includes(r.slug);
  const unitLabel = r.servesLabel ? r.servesLabel.replace(/^(about )?\d+\s*/, "") : "servings";

  return (
    <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
        <div className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <span id="serves-label" className="font-semibold text-midnight">
              {r.servesLabel ? "Makes" : "Serves"}
            </span>
            <div className="flex items-center gap-2" role="group" aria-labelledby="serves-label">
              <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sand-deep hover:bg-limestone disabled:opacity-40" onClick={() => setServes((s) => Math.max(1, s - 1))} disabled={serves <= 1}>
                <Minus aria-hidden="true" size={16} />
                <span className="sr-only">Fewer</span>
              </button>
              <output aria-live="polite" className="w-20 text-center font-display text-2xl text-midnight">
                {serves}
                <span className="block text-[11px] font-sans text-muted">{unitLabel}</span>
              </output>
              <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sand-deep hover:bg-limestone disabled:opacity-40" onClick={() => setServes((s) => Math.min(48, s + 1))} disabled={serves >= 48}>
                <Plus aria-hidden="true" size={16} />
                <span className="sr-only">More</span>
              </button>
            </div>
          </div>
          {factor !== 1 && (
            <button type="button" onClick={() => setServes(r.serves)} className="mt-2 text-xs text-nile underline">
              Reset to the original amount
            </button>
          )}
          <div className="mt-6 flex flex-wrap gap-2 no-print">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => toggleRecipe(r.slug)} aria-pressed={fav}>
              <Heart aria-hidden="true" size={15} fill={fav ? "currentColor" : "none"} /> {fav ? "Saved" : "Save recipe"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>
              <Printer aria-hidden="true" size={15} /> Print
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl">Ingredients</h2>
          {r.ingredients.map((g, gi) => (
            <div key={gi} className="mt-4">
              {g.group && <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">{g.group}</h3>}
              <ul className="mt-2 space-y-1.5">
                {g.items.map((it) => {
                  const key = `${gi}:${it.item}`;
                  const got = have.includes(key);
                  return (
                    <li key={key}>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={got} onChange={() => setHave((h) => (got ? h.filter((x) => x !== key) : [...h, key]))} className="mt-1 h-4 w-4 accent-[var(--color-nile)]" />
                        <span className={got ? "text-muted line-through" : ""}>
                          {it.qty !== null && (
                            <strong className="tabular-nums text-midnight">
                              {scaleQty(it.qty, factor, it.unit)}
                              {it.unit ? ` ${it.unit}` : ""}{" "}
                            </strong>
                          )}
                          {it.item}
                          {it.note && <span className="text-muted">, {it.note}</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {factor !== 1 && <p className="mt-4 text-xs text-muted">Quantities scaled ×{factor.toFixed(2).replace(/\.?0+$/, "")}. Cooking times may change for much bigger batches.</p>}
        </div>

        <div className="card p-6">
          <h2 className="text-xl">Dietary information</h2>
          <p className="mt-2 text-sm">{{ vegan: "Vegan", vegetarian: "Vegetarian", meat: "Contains meat", fish: "Pescatarian (fish, no meat)" }[r.diet]}</p>
          {r.allergens.length > 0 ? (
            <p className="mt-2 text-sm">
              <strong>Contains:</strong> {r.allergens.map((a) => ALLERGEN_LABEL[a]).join(", ")}
            </p>
          ) : (
            <p className="mt-2 text-sm">No common allergens in the listed ingredients.</p>
          )}
          <p className="mt-3 flex gap-2 text-xs text-muted">
            <AlertTriangle aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
            Based on the ingredients listed — not a verified allergen statement. Always check product labels.
          </p>
        </div>
      </aside>

      <div>
        <h2 className="text-3xl">Method</h2>
        <ol className="mt-6 space-y-4">
          {r.steps.map((step, i) => {
            const isDone = done.includes(i);
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-pressed={isDone}
                  onClick={() => setDone((d) => (isDone ? d.filter((x) => x !== i) : [...d, i]))}
                  className={`flex w-full items-start gap-4 rounded-2xl p-5 text-left transition ${isDone ? "bg-ok/10" : "bg-white shadow-[var(--shadow-soft)] hover:ring-1 hover:ring-gold"}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-lg ${isDone ? "bg-ok text-ivory" : "bg-midnight text-ivory"}`}>
                    {isDone ? <Check aria-hidden="true" size={18} /> : i + 1}
                  </span>
                  <span className={`pt-1 text-lg leading-relaxed ${isDone ? "text-muted" : "text-ink"}`}>
                    <span className="sr-only">Step {i + 1}{isDone ? " (done)" : ""}: </span>
                    {step}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {r.tips.length > 0 && (
          <div className="mt-8 rounded-2xl bg-limestone p-6">
            <h3 className="text-xl">Tips</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
              {r.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
