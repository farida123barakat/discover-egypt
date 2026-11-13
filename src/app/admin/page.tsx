import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { destinations } from "@/content/destinations";
import { getAdmin } from "@/lib/auth";
import { backendMode } from "@/lib/env";
import { adminListSubmissions, adminStats, getEvents, getFeatured, getPrices, getRecipes, getBucketAll } from "@/lib/store";
import { EventManager, FeaturedPicker, LogoutButton, ModerationQueue, PhotoUpload, PriceEditor, RecipeReview, BucketManager } from "@/components/admin";
import { photos } from "@/content/images";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  const [stats, pending, prices, events, featured, recipes, bucket] = await Promise.all([adminStats(), adminListSubmissions("pending"), getPrices(), getEvents(), getFeatured(), getRecipes(), getBucketAll()]);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-3 text-5xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in {admin.email ? `as ${admin.email}` : "with the local demo account"} · backend: {backendMode()}
          </p>
        </div>
        <LogoutButton mode={admin.mode} />
      </div>

      <section aria-labelledby="ov-h" className="mt-10">
        <h2 id="ov-h" className="sr-only">Overview</h2>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            ["Awaiting review", stats.pending],
            ["Published", stats.approved],
            ["Rejected", stats.rejected],
            ["Questions", stats.questions],
            ["Stories", stats.stories],
          ].map(([k, v]) => (
            <div key={k} className="card p-5">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="font-display text-4xl text-midnight">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="mod-h" className="mt-14">
        <h2 id="mod-h" className="text-3xl">Moderation queue</h2>
        <ModerationQueue initial={pending} />
      </section>

      <section aria-labelledby="price-h" className="mt-14">
        <h2 id="price-h" className="text-3xl">Travel prices</h2>
        <p className="mt-1 text-sm text-muted">Saving a price sets its &quot;last checked&quot; date to today.</p>
        <PriceEditor prices={prices} />
      </section>

      <section aria-labelledby="feat-h" className="mt-14">
        <h2 id="feat-h" className="text-3xl">Featured on the homepage</h2>
        <FeaturedPicker options={destinations.map((d) => ({ slug: d.slug, name: d.name }))} current={featured} />
      </section>

      <section aria-labelledby="bk-h" className="mt-14">
        <h2 id="bk-h" className="text-3xl">Bucket list</h2>
        <p className="mt-1 text-sm text-muted">Official activities. Visitors&rsquo; personal progress is stored separately and can&rsquo;t change these.</p>
        <BucketManager items={bucket} destinations={destinations.map((d) => ({ slug: d.slug, name: d.name }))} photoKeys={Object.entries(photos).map(([key, p]) => ({ key, alt: p.alt }))} />
      </section>

      <section aria-labelledby="rec-h" className="mt-14">
        <h2 id="rec-h" className="text-3xl">Recipe review</h2>
        <p className="mt-1 text-sm text-muted">AI-assisted drafts stay hidden on the live site until approved here. Check quantities, method, allergens and wording before publishing.</p>
        <RecipeReview items={recipes.map((r) => ({ slug: r.slug, name: r.name, status: r.review.status, lastReviewed: r.review.lastReviewed, reviewer: r.review.reviewer }))} />
      </section>

      <section aria-labelledby="ev-h" className="mt-14">
        <h2 id="ev-h" className="text-3xl">Events</h2>
        <p className="mt-1 text-sm text-muted">Only mark an event verified once you have an official source link.</p>
        <EventManager events={events} />
      </section>

      <section aria-labelledby="photo-h" className="mt-14 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 id="photo-h" className="text-3xl">Upload a photograph</h2>
          <PhotoUpload enabled={backendMode() === "supabase"} />
        </div>
        <div>
          <h2 className="text-3xl">Content</h2>
          <p className="mt-2 text-sm text-muted">
            {destinations.length} destinations are maintained as typed content files in <code>src/content</code> and seeded into the database. Editing destination text in the dashboard is not built yet (see FEATURES.md); featured slots and events are editable above.
          </p>
          <ul className="mt-4 max-h-72 divide-y divide-sand overflow-y-auto rounded-2xl bg-white px-5">
            {destinations.map((d) => (
              <li key={d.slug} className="flex justify-between py-2 text-sm">
                <span>{d.name}</span>
                <span className="text-muted">{d.category}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
