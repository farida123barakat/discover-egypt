"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, Heart, Leaf, Loader2, LocateFixed, MapPin, ShieldCheck, Sprout, Users } from "lucide-react";
import { regionalDishes, regions, type Recipe, type RegionalDish, type RegionId } from "@/content/food";
import { getDestination } from "@/content/destinations";
import { nearestRegion } from "@/lib/geo";
import { setFoodRegion, toggleRecipe, useMyEgypt } from "@/lib/client-store";
import { Photo } from "../ui";

type Locate = { state: "idle" | "locating" } | { state: "found"; destination: string; km: number } | { state: "error"; message: string };

export function TasteExplorer({ recipes, demoDrafts }: { recipes: Recipe[]; demoDrafts: boolean }) {
  const me = useMyEgypt();
  const [picked, setPicked] = useState<RegionId | null>(null);
  const region = regions.find((r) => r.id === (picked ?? me.foodRegion)) ?? regions[0];
  const [locate, setLocate] = useState<Locate>({ state: "idle" });
  const [diet, setDiet] = useState<"all" | "vegetarian" | "vegan">("all");
  const [quick, setQuick] = useState(false);
  const [favOnly, setFavOnly] = useState(false);

  function choose(id: RegionId) {
    setPicked(id);
    setFoodRegion(id); // only the region is remembered, never coordinates
  }

  function useLocation() {
    if (!("geolocation" in navigator)) return setLocate({ state: "error", message: "Your browser can't share location. Pick a region instead." });
    setLocate({ state: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const near = nearestRegion(pos.coords.latitude, pos.coords.longitude);
        if (!near) return setLocate({ state: "error", message: "You seem to be outside Egypt, or far from our destinations. Pick a region to explore." });
        choose(near.region as RegionId);
        setLocate({ state: "found", destination: near.destination, km: near.km });
      },
      (err) =>
        setLocate({
          state: "error",
          message: err.code === err.PERMISSION_DENIED ? "No problem — location stays off. Pick a region instead." : "We couldn't get your location. Pick a region instead.",
        }),
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 10_000 },
    );
  }

  const dishes = regionalDishes.filter((d) => d.regions.includes(region.id));
  const filtered = useMemo(
    () =>
      recipes.filter(
        (r) =>
          (diet === "all" || (diet === "vegan" ? r.diet === "vegan" : r.diet === "vegan" || r.diet === "vegetarian")) &&
          (!quick || r.prepMin + r.cookMin <= 30) &&
          (!favOnly || me.recipes.includes(r.slug)),
      ),
    [recipes, diet, quick, favOnly, me.recipes],
  );
  const regionRecipes = filtered.filter((r) => r.regions.includes(region.id));
  const others = filtered.filter((r) => !r.regions.includes(region.id));

  return (
    <div>
      {/* Region picker */}
      <div className="card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Where are you eating?</p>
            <p className="mt-1 text-muted">Pick a region — or let us find the nearest one. Location is optional.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={useLocation} disabled={locate.state === "locating"} aria-busy={locate.state === "locating"}>
            {locate.state === "locating" ? <Loader2 aria-hidden="true" size={16} className="animate-spin" /> : <LocateFixed aria-hidden="true" size={16} />}
            Use my location
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Food region">
          {regions.map((r) => (
            <button key={r.id} type="button" role="radio" aria-checked={region.id === r.id} onClick={() => choose(r.id)} className="chip">
              {r.name}
            </button>
          ))}
        </div>
        <div aria-live="polite" className="mt-4 min-h-6 text-sm">
          {locate.state === "found" && (
            <p className="flex items-center gap-2 text-ok">
              <MapPin aria-hidden="true" size={15} /> Nearest destination: {getDestination(locate.destination)?.name} (about {locate.km} km). Showing {region.name}.
            </p>
          )}
          {locate.state === "error" && <p className="text-gold-ink">{locate.message}</p>}
        </div>
        <p className="mt-2 flex items-start gap-2 text-xs text-muted">
          <ShieldCheck aria-hidden="true" size={14} className="mt-0.5 shrink-0" /> Your location is used once, on this device, rounded to about 10 km, and never stored or sent to us. We only remember the region you chose.
        </p>
      </div>

      {/* Region story + dishes */}
      <section aria-labelledby="region-h" className="mt-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-end">
          <div>
            <p lang="ar" dir="rtl" className="arabic text-left text-2xl text-gold-ink">
              {region.arabic}
            </p>
            <h2 id="region-h" className="mt-1 text-4xl md:text-5xl">
              {region.name}
            </h2>
            <p className="mt-4 text-lg text-muted">{region.intro}</p>
          </div>
          <div className="relative hidden aspect-[16/7] overflow-hidden rounded-[1.5rem] lg:block">
            <Photo k={region.photo} className="absolute inset-0 h-full w-full" sizes="(min-width:1024px) 55vw, 100vw" />
          </div>
        </div>

        <h3 className="mt-12 text-2xl">What to try here</h3>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((d) => (
            <li key={d.slug}>
              <DishCard d={d} hasRecipe={!!d.recipe && recipes.some((r) => r.slug === d.recipe)} />
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-2xl bg-limestone p-4 text-sm text-muted">
          <strong className="text-midnight">Regional association, not a restaurant list.</strong> These are dishes linked to the region by the sources shown. We don&rsquo;t list restaurants yet, because we only publish places we have verified.
        </p>
      </section>

      {/* Recipes */}
      <section aria-labelledby="recipes-h" className="mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Cook it at home</p>
            <h2 id="recipes-h" className="mt-2 text-4xl">
              Recipes
            </h2>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter recipes">
            {(
              [
                ["all", "All"],
                ["vegetarian", "Vegetarian"],
                ["vegan", "Vegan"],
              ] as const
            ).map(([v, l]) => (
              <button key={v} type="button" aria-pressed={diet === v} onClick={() => setDiet(v)} className="chip">
                {l}
              </button>
            ))}
            <button type="button" aria-pressed={quick} onClick={() => setQuick((x) => !x)} className="chip">
              <Clock aria-hidden="true" size={14} /> 30 min or less
            </button>
            <button type="button" aria-pressed={favOnly} onClick={() => setFavOnly((x) => !x)} className="chip">
              <Heart aria-hidden="true" size={14} /> Saved
            </button>
          </div>
        </div>
        {demoDrafts && recipes.some((r) => r.review.status === "draft") && (
          <p className="mt-5 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold-ink">
            <strong>Demo mode:</strong> recipes marked “Draft” are AI-assisted editorial drafts awaiting review. On the live site they stay hidden until an editor approves them.
          </p>
        )}
        {recipes.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-limestone p-8 text-center text-muted">Our kitchen editors are reviewing recipes. Check back soon.</p>
        ) : (
          <>
            {regionRecipes.length > 0 && (
              <>
                <h3 className="mt-8 text-xl">From {region.name}</h3>
                <RecipeGrid list={regionRecipes} saved={me.recipes} />
              </>
            )}
            {others.length > 0 && (
              <>
                <h3 className="mt-10 text-xl">{regionRecipes.length ? "More from across Egypt" : "From across Egypt"}</h3>
                <RecipeGrid list={others} saved={me.recipes} />
              </>
            )}
            {filtered.length === 0 && <p className="mt-8 rounded-2xl bg-limestone p-8 text-center text-muted">No recipes match these filters.</p>}
          </>
        )}
      </section>
    </div>
  );
}

function DishCard({ d, hasRecipe }: { d: RegionalDish; hasRecipe: boolean }) {
  return (
    <article className="card flex h-full flex-col overflow-hidden">
      <DishVisual photo={d.photo} name={d.name} arabic={d.arabic} />
      <div className="flex flex-1 flex-col p-5">
        <h4 className="font-display text-2xl text-midnight">{d.name}</h4>
        <p className="mt-1 text-muted">{d.what}</p>
        <p className="mt-3 text-xs text-muted">
          {d.association.status === "sourced" ? (
            <>
              <span className="font-semibold text-ok">Regional link · sourced.</span> {d.association.note}{" "}
              {d.association.sources.map((s, i) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-nile underline">
                  [{i + 1}]<span className="sr-only"> {s.name} (opens in a new tab)</span>
                </a>
              ))}
            </>
          ) : (
            <>{d.association.note}</>
          )}
        </p>
        <div className="mt-auto flex items-center gap-3 pt-4 text-sm">
          {d.vegetarian !== "no" && (
            <span className="inline-flex items-center gap-1 text-ok">
              <Leaf aria-hidden="true" size={14} /> {d.vegetarian === "yes" ? "Vegetarian" : "Often vegetarian"}
            </span>
          )}
          {hasRecipe && (
            <Link href={`/taste/${d.recipe}`} className="ml-auto font-semibold text-nile underline underline-offset-4">
              Recipe
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/** Licensed photo if we have one; otherwise a designed typographic card — never a stock stand-in. */
export function DishVisual({ photo, name, arabic, className = "aspect-[4/3]" }: { photo?: RegionalDish["photo"]; name: string; arabic: string; className?: string }) {
  if (photo)
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Photo k={photo} label={name} className="absolute inset-0 h-full w-full" sizes="(min-width:1024px) 30vw, 100vw" />
      </div>
    );
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#f6e8cd,#e3cfa8)] ${className}`} role="img" aria-label={`${name} — illustration of the Arabic name`}>
      <span aria-hidden="true" className="absolute inset-3 rounded-xl border border-gold/40" />
      <span lang="ar" dir="rtl" aria-hidden="true" className="arabic text-5xl text-gold-ink">
        {arabic}
      </span>
    </div>
  );
}

function RecipeGrid({ list, saved }: { list: Recipe[]; saved: string[] }) {
  return (
    <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((r) => {
        const fav = saved.includes(r.slug);
        return (
          <li key={r.slug}>
            <article className="card group relative flex h-full flex-col overflow-hidden">
              <div className="relative">
                <DishVisual photo={r.photo} name={r.name} arabic={r.arabic} className="aspect-[16/10]" />
                {r.review.status === "draft" && <span className="absolute left-3 top-3 rounded-full bg-ivory px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-ink shadow">Draft</span>}
                <button type="button" onClick={() => toggleRecipe(r.slug)} aria-pressed={fav} className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ivory/90 text-midnight hover:bg-ivory">
                  <Heart aria-hidden="true" size={18} fill={fav ? "currentColor" : "none"} />
                  <span className="sr-only">{fav ? `Remove ${r.name} from saved recipes` : `Save ${r.name}`}</span>
                </button>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h4 className="font-display text-2xl text-midnight">
                  <Link href={`/taste/${r.slug}`} className="after:absolute after:inset-0 after:content-['']">
                    {r.name}
                  </Link>
                </h4>
                <p className="mt-1 text-sm text-muted">{r.summary}</p>
                <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-xs font-medium text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden="true" size={13} /> {r.prepMin + r.cookMin} min{r.waitMin ? " + waiting" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users aria-hidden="true" size={13} /> {r.servesLabel ?? `Serves ${r.serves}`}
                  </span>
                  <span className="inline-flex items-center gap-1 capitalize">
                    <Sprout aria-hidden="true" size={13} /> {r.diet === "meat" || r.diet === "fish" ? r.diet : r.diet}
                  </span>
                </p>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
