import type { Metadata } from "next";
import { backendMode } from "@/lib/env";
import { getVisibleRecipes } from "@/lib/store";
import { foodSafety } from "@/content/culture";
import { Photo } from "@/components/ui";
import { TasteExplorer } from "@/components/taste/TasteExplorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Taste Egypt — what to eat where you are",
  description: "Regional Egyptian dishes and home recipes: pick a region or share your location (optional) to see what to try nearby.",
};

export default async function TastePage() {
  const recipes = await getVisibleRecipes();
  return (
    <>
      <section className="on-dark relative isolate overflow-hidden bg-night pb-20 pt-40 text-ivory md:pb-24" aria-labelledby="taste-h">
        <div className="golden-grade absolute inset-0 -z-10">
          <Photo k="koshari" priority className="absolute inset-0 h-full w-full" sizes="100vw" />
        </div>
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="eyebrow !text-gold-300">Taste Egypt</p>
          <h1 id="taste-h" className="display-hero mt-5 max-w-4xl !text-ivory">
            What should I eat where I am?
          </h1>
          <p className="display-italic mt-6 max-w-2xl text-ivory/90">From Alexandria&rsquo;s fish rice to Bedouin bread baked in the embers — find the dishes of each region, then cook them at home.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <TasteExplorer recipes={recipes} demoDrafts={backendMode() === "local"} />

        <section aria-labelledby="safe-h" className="mt-20 grid gap-8 rounded-[1.5rem] bg-midnight p-8 text-ivory on-dark md:grid-cols-[1fr_1.4fr] md:p-12">
          <div>
            <p className="eyebrow">Eat well, stay well</p>
            <h2 id="safe-h" className="mt-2 text-3xl !text-ivory">
              Food safety on the road
            </h2>
          </div>
          <ul className="space-y-2 text-ivory/85">
            {foodSafety.map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-300" />
                {t}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
