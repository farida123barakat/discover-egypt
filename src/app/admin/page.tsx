import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { destinations } from "@/content/destinations";
import { getAdmin } from "@/lib/auth";
import { backendMode } from "@/lib/env";
import { adminListSubmissions, adminStats, getEvents, getFeatured, getPrices, getRecipes, getBucketAll, getMediaAll } from "@/lib/store";
import { MediaManager } from "@/components/admin-media";
import { explainers } from "@/content/explainers";
import { EventManager, FeaturedPicker, LogoutButton, ModerationQueue, PhotoUpload, PriceEditor, RecipeReview, BucketManager } from "@/components/admin";
import { photos } from "@/content/images";
import { PrintPartnerManager, PrintRequestQueue, type AdminPrintRequest } from "@/components/admin-print";
import { adminListPartners, adminListPrintRequests, sweepPrintJobs } from "@/lib/print-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  await sweepPrintJobs().catch(() => {}); // delete images of expired print jobs before listing them
  const [stats, pending, prices, events, featured, recipes, bucket, media, partners, printRequests] = await Promise.all([
    adminStats(),
    adminListSubmissions("pending"),
    getPrices(),
    getEvents(),
    getFeatured(),
    getRecipes(),
    getBucketAll(),
    getMediaAll(),
    adminListPartners(),
    adminListPrintRequests(),
  ]);
  // Only what the queue needs: never send cancel-token hashes or storage paths to the browser.
  const queue: AdminPrintRequest[] = printRequests.map((r) => ({
    id: r.id,
    code: r.code,
    partnerName: partners.find((p) => p.id === r.partnerId)?.name ?? "Unknown partner",
    status: r.status,
    hasImage: !!r.imagePath,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
  }));

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

      <section aria-labelledby="md-h" className="mt-14">
        <h2 id="md-h" className="text-3xl">Watch &amp; discover</h2>
        <p className="mt-1 text-sm text-muted">Drafts are hidden on the live site. A video can be published once it has a length, at least one source and a destination — and, for embeds, a note on captions.</p>
        <MediaManager items={media} destinations={destinations.map((d) => ({ slug: d.slug, name: d.name }))} explainers={explainers.map((e) => ({ id: e.id, title: e.title }))} />
      </section>

      <section aria-labelledby="rec-h" className="mt-14">
        <h2 id="rec-h" className="text-3xl">Recipe review</h2>
        <p className="mt-1 text-sm text-muted">AI-assisted drafts stay hidden on the live site until approved here. Check quantities, method, allergens and wording before publishing.</p>
        <RecipeReview items={recipes.map((r) => ({ slug: r.slug, name: r.name, status: r.review.status, lastReviewed: r.review.lastReviewed, reviewer: r.review.reviewer }))} />
      </section>

      <section aria-labelledby="prq-h" className="mt-14">
        <h2 id="prq-h" className="text-3xl">Postcard print requests</h2>
        <p className="mt-1 text-sm text-muted">Move each job along as the partner works on it: requested → printing → ready → collected. Collected, cancelled and expired jobs have their postcard image deleted automatically.</p>
        <PrintRequestQueue requests={queue} />
      </section>

      <section aria-labelledby="pp-h" className="mt-14">
        <h2 id="pp-h" className="text-3xl">Printing partners</h2>
        <p className="mt-1 text-sm text-muted">Hotels, museums, tourism offices or cafés that print Memory Hunt postcards for visitors. Only verify a partner after confirming the arrangement with them directly, and note how you did it.</p>
        <PrintPartnerManager partners={partners} destinations={destinations.map((d) => ({ slug: d.slug, name: d.name }))} />
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
