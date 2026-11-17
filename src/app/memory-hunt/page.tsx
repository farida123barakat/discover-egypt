import type { Metadata } from "next";
import Link from "next/link";
import { BookImage, Camera, ShieldCheck, Sparkles } from "lucide-react";
import { challenges } from "@/content/hunt";
import { getVisibleMedia, getVisibleRecipes } from "@/lib/store";
import { SectionHeader } from "@/components/design";
import { Photo } from "@/components/ui";
import { Achievements, ChallengeBrowser, HuntProgress } from "@/components/memory/Hunt";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Egypt Memory Hunt",
  description: "Challenges that turn sightseeing into memories: spot a cartouche, taste karkade, catch a felucca sunset — then turn each memory into a postcard.",
};

/**
 * Challenge cards can link to a recipe or a film. Those pages only exist once the item is published,
 * so the link is hidden rather than leading to a 404.
 */
async function linkAvailability() {
  const [recipes, media] = await Promise.all([getVisibleRecipes(), getVisibleMedia()]);
  const ok: Record<string, boolean> = {};
  for (const c of challenges) {
    if (!c.link) continue;
    const href = c.link.href;
    if (href.startsWith("/taste/")) ok[href] = recipes.some((r) => `/taste/${r.slug}` === href);
    else if (href.startsWith("/watch/")) ok[href] = media.some((m) => `/watch/${m.id}` === href);
    else ok[href] = true;
  }
  return ok;
}

const STEPS = [
  { icon: Sparkles, title: "Pick a challenge", body: "Find a cartouche, taste karkade, watch the sun set from a felucca. Filter by place or by who you're travelling with." },
  { icon: Camera, title: "Capture the memory", body: "Add a photo, a caption and a few lines about the moment. It is saved privately on this device." },
  { icon: BookImage, title: "Keep it as a postcard", body: "Every memory becomes a print-ready postcard. Download it, add it to your album PDF, or collect a print where a partner offers it." },
];

export default async function MemoryHuntPage() {
  const links = await linkAvailability();
  return (
    <>
      <section className="on-dark relative isolate overflow-hidden bg-night pb-16 pt-40 text-ivory md:pb-20" aria-labelledby="hunt-h">
        <div className="golden-grade absolute inset-0 -z-10">
          <Photo k="heroAswan" priority className="absolute inset-0 h-full w-full" sizes="100vw" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="eyebrow !text-gold-300">Egypt Memory Hunt</p>
            <h1 id="hunt-h" className="display-hero mt-5 !text-ivory">
              Collect moments, not souvenirs.
            </h1>
            <p className="display-italic mt-6 max-w-xl text-ivory/90">{challenges.length} small challenges across Egypt. Each one you complete becomes a postcard in your album.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#challenges" className="btn btn-primary">
                Browse challenges
              </a>
              <Link href="/memory-hunt/new" className="btn btn-outline-light">
                <Camera aria-hidden="true" size={16} /> Save a memory
              </Link>
            </div>
          </div>
          <HuntProgress />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8" aria-labelledby="how-h">
        <h2 id="how-h" className="sr-only">
          How it works
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="card h-full p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-gold-ink">
                <Icon aria-hidden="true" size={18} /> Step {i + 1}
              </p>
              <h3 className="mt-2 text-2xl">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl bg-limestone p-4 text-sm text-muted">
          <ShieldCheck aria-hidden="true" size={16} className="text-ok" />
          Your memories stay on this device. Nothing is uploaded unless you choose to back up, share or print one.
          <Link href="/privacy#memories" className="font-semibold text-nile underline underline-offset-4">
            How we handle memories
          </Link>
        </p>
      </section>

      <section id="challenges" className="scroll-mt-24 bg-limestone py-16 md:py-20" aria-labelledby="ch-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader id="ch-h" eyebrow="Challenges" title="What will you find?" intro="Self-reported and just for fun: nothing checks where you are. Respect sites, people and their homes, and ask before photographing anyone." />
          <div className="mt-10">
            <ChallengeBrowser links={links} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20" aria-labelledby="ach-h">
        <SectionHeader id="ach-h" eyebrow="Achievements" title="Your progress." action={{ href: "/memory-hunt/album", label: "Open my album" }} />
        <div className="mt-10">
          <Achievements />
        </div>
      </section>
    </>
  );
}
