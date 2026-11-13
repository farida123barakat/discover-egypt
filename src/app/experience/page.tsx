import Link from "next/link";
import type { Metadata } from "next";
import { etiquette, foodSafety } from "@/content/culture";
import { ArabicTrainer, FoodGuide, Soundscapes } from "@/components/experience";
import { Photo, Reveal, SectionHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Experience Egypt", description: "Egyptian food, people, language and etiquette." };

const PEOPLE = [
  {
    role: "Craft",
    title: "The potters of Tunis village",
    body: "In Fayoum, a pottery school founded in the 1980s turned a farming village into a centre of ceramic art. Many workshops welcome visitors to watch and buy directly from the makers.",
    photo: "fayoum" as const,
  },
  {
    role: "Community",
    title: "Nubian hosts of Aswan",
    body: "Families on the west bank open their painted homes as guesthouses and kitchens. Booking directly with community hosts keeps more of your money in the village.",
    photo: "nubian" as const,
  },
  {
    role: "Market",
    title: "The traders of Khan el-Khalili",
    body: "Brass makers, spice sellers and lantern craftsmen keep trades alive that have been passed down for generations in the heart of historic Cairo.",
    photo: "khan" as const,
  },
];

export default function ExperiencePage() {
  return (
    <>
      <section className="on-dark relative overflow-hidden bg-midnight pb-20 pt-40 text-ivory">
        <Photo k="khan" priority className="absolute inset-0 h-full w-full opacity-50" />
        <div className="photo-scrim absolute inset-0 bg-gradient-to-t from-midnight to-midnight/30" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <p className="eyebrow">Experience Egypt</p>
          <h1 className="mt-4 max-w-4xl text-5xl !text-ivory md:text-7xl">A living country, not a museum.</h1>
          <p className="mt-5 max-w-2xl text-lg text-ivory/85">Eat what Egyptians eat, meet the people behind the crafts, say your first words in Egyptian Arabic.</p>
        </div>
      </section>

      <section id="taste" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8" aria-labelledby="taste-h">
        <SectionHeading id="taste-h" eyebrow="Taste Egypt" title="A food guide for curious eaters." />
        <Link href="/taste" className="btn btn-primary mt-6">
          What to eat in each region — and recipes
        </Link>
        <div className="mt-10">
          <FoodGuide />
        </div>
        <div className="mt-12 rounded-2xl bg-nile/10 p-8">
          <h3 className="text-2xl">Eat well, stay well</h3>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {foodSafety.map((f) => (
              <li key={f} className="flex gap-3">
                <span aria-hidden="true" className="text-nile">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-limestone py-24" aria-labelledby="people-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading id="people-h" eyebrow="Meet the people of Egypt" title="The hands that keep traditions alive." intro="Portraits of communities you can meet. Individual interviews will be added once contributors have given consent." />
          <ul className="mt-12 grid gap-8 md:grid-cols-3">
            {PEOPLE.map((p, i) => (
              <li key={p.title}>
                <Reveal delay={i * 0.08}>
                  <div className="photo-zoom relative aspect-[4/5] overflow-hidden rounded-[1.25rem]">
                    <Photo k={p.photo} className="absolute inset-0 h-full w-full" />
                  </div>
                  <p className="eyebrow mt-5">{p.role}</p>
                  <h3 className="mt-2 text-2xl">{p.title}</h3>
                  <p className="mt-2 text-muted">{p.body}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="decode" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8" aria-labelledby="decode-h">
        <SectionHeading id="decode-h" eyebrow="Decode Egypt" title="Speak a little Egyptian." intro="Egyptian Arabic is warm, quick and full of humour. A few words go a long way." />
        <div className="mt-10">
          <ArabicTrainer />
        </div>
      </section>

      <section id="etiquette" className="scroll-mt-24 bg-ivory py-24" aria-labelledby="eti-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading id="eti-h" eyebrow="Culture & etiquette" title="Travel respectfully." />
          <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {etiquette.map((e) => (
              <div key={e.topic} className="border-t-2 border-gold pt-4">
                <dt className="font-display text-2xl text-midnight">{e.topic}</dt>
                <dd className="mt-2 text-muted">{e.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="senses" className="on-dark scroll-mt-24 bg-midnight py-24 text-ivory" aria-labelledby="senses-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="eyebrow">Egypt through the senses</p>
          <h2 id="senses-h" className="mt-3 max-w-3xl text-4xl !text-ivory md:text-5xl">
            Close your eyes. Press play.
          </h2>
          <div className="mt-10 [&_.text-muted]:text-ivory/70">
            <Soundscapes />
          </div>
        </div>
      </section>
    </>
  );
}
