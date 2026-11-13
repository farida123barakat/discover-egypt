import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChefHat, Clock, Hourglass } from "lucide-react";
import { regionById, type Recipe } from "@/content/food";
import { getVisibleRecipes } from "@/lib/store";
import { DishVisual } from "@/components/taste/TasteExplorer";
import { RecipeView } from "@/components/taste/RecipeView";

export const dynamic = "force-dynamic";

async function find(slug: string) {
  const list = await getVisibleRecipes();
  return { r: list.find((x) => x.slug === slug), list };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { r } = await find((await params).slug);
  return r ? { title: `${r.name} recipe`, description: r.summary } : { title: "Recipe not found" };
}

const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`);

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { r, list } = await find((await params).slug);
  if (!r) notFound();
  const more = list.filter((x) => x.slug !== r.slug && x.regions.some((g) => r.regions.includes(g))).slice(0, 3);

  return (
    <article className="pb-24 pt-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Link href="/taste" className="no-print inline-flex items-center gap-2 text-sm font-semibold text-nile">
          <ArrowLeft aria-hidden="true" size={15} /> Taste Egypt
        </Link>
        <header className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow">{r.regions.map((g) => regionById(g)?.name).join(" · ")}</p>
            <h1 className="mt-3 text-5xl md:text-6xl">{r.name}</h1>
            <p lang="ar" dir="rtl" className="arabic mt-2 text-left text-3xl text-gold-ink">
              {r.arabic}
            </p>
            <p className="mt-5 text-lg text-muted">{r.background}</p>
            <dl className="mt-6 flex flex-wrap gap-6 text-sm">
              <Meta icon={Clock} term="Prep + cook" value={fmt(r.prepMin + r.cookMin)} />
              {r.waitMin ? <Meta icon={Hourglass} term="Plus waiting" value={fmt(r.waitMin)} /> : null}
              <Meta icon={ChefHat} term="Difficulty" value={r.difficulty[0].toUpperCase() + r.difficulty.slice(1)} />
            </dl>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] shadow-[var(--shadow-lift)]">
            <DishVisual photo={r.photo} name={r.name} arabic={r.arabic} className="aspect-[4/3]" />
          </div>
        </header>

        <Provenance r={r} />

        <div className="mt-12">
          <RecipeView r={r} />
        </div>

        {more.length > 0 && (
          <nav aria-label="More from this region" className="no-print mt-20">
            <h2 className="text-3xl">More from {regionById(r.regions[0])?.name}</h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-3">
              {more.map((m) => (
                <li key={m.slug}>
                  <Link href={`/taste/${m.slug}`} className="card block overflow-hidden hover:ring-1 hover:ring-gold">
                    <DishVisual photo={m.photo} name={m.name} arabic={m.arabic} className="aspect-[16/10]" />
                    <span className="block p-4 font-display text-xl text-midnight">{m.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </article>
  );
}

function Meta({ icon: Icon, term, value }: { icon: typeof Clock; term: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
      <dt className="contents text-xs text-muted">
        <Icon aria-hidden="true" size={18} className="row-span-2 text-gold-ink" />
        <span className="text-xs text-muted">{term}</span>
      </dt>
      <dd className="col-start-2 font-semibold text-midnight">{value}</dd>
    </div>
  );
}

function Provenance({ r }: { r: Recipe }) {
  const draft = r.review.status === "draft";
  return (
    <aside aria-label="About this recipe" className={`mt-10 rounded-2xl border p-5 text-sm ${draft ? "border-gold/50 bg-gold/10" : "border-ok/30 bg-ok/5"}`}>
      <p className="font-semibold text-midnight">{draft ? "Draft recipe — not yet reviewed" : `Reviewed by our editors on ${r.review.lastReviewed}`}</p>
      <p className="mt-1 text-muted">
        {r.provenance.note} {draft ? "It is shown here in demo mode for review and is hidden on the live site until approved." : ""}
      </p>
      {r.provenance.compare.length > 0 && (
        <p className="mt-2 text-muted">
          Compare with:{" "}
          {r.provenance.compare.map((s, i) => (
            <span key={s.url}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-nile underline">
                {s.name}
              </a>
            </span>
          ))}
        </p>
      )}
    </aside>
  );
}
