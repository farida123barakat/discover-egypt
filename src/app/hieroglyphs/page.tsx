import type { Metadata } from "next";
import "@fontsource/noto-sans-egyptian-hieroglyphs/egyptian-hieroglyphs-400.css";
import { ArrowDown, BookOpen, Brush, Feather, ScanSearch } from "lucide-react";
import { GROUPS, signs, SIGN_SOURCES } from "@/content/hieroglyphs";
import { SectionHeader } from "@/components/design";
import { Photo, Reveal } from "@/components/ui";
import { Glyph } from "@/components/hieroglyphs/SignDetail";
import { Scanner } from "@/components/hieroglyphs/Scanner";
import { SignLibrary } from "@/components/hieroglyphs/SignLibrary";
import { DrawChallenge, NameCartouche, Quiz } from "@/components/hieroglyphs/Practice";

export const metadata: Metadata = {
  title: "Decode Ancient Egypt — Hieroglyphics Explorer",
  description: "Photograph a hieroglyph and see which sign it might be, learn the sound signs, take a quiz and write your name in a cartouche.",
};

const JUMP = [
  { href: "#scan", label: "Scan a sign", icon: ScanSearch },
  { href: "#learn", label: "Learn the signs", icon: BookOpen },
  { href: "#practice", label: "Practise", icon: Brush },
  { href: "#name", label: "Your name", icon: Feather },
];

export default function HieroglyphsPage() {
  return (
    <>
      <section className="on-dark relative isolate overflow-hidden bg-night pb-20 pt-40 text-ivory md:pb-28" aria-labelledby="hiero-h">
        <div className="golden-grade absolute inset-0 -z-10">
          <Photo k="luxor" priority className="absolute inset-0 h-full w-full" sizes="100vw" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 top-24 hidden select-none font-hiero text-[11rem] leading-none text-gold-300/15 lg:block">
          {["S34", "F35", "N5"].map((c) => (
            <Glyph key={c} code={c} className="block" />
          ))}
        </div>
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <p className="eyebrow !text-gold-300">Hieroglyphics explorer</p>
          <h1 id="hiero-h" className="display-hero mt-5 max-w-4xl !text-ivory">
            Decode ancient Egypt.
          </h1>
          <p className="display-italic mt-6 max-w-2xl text-ivory/90">Photograph a sign on a temple wall, learn the sounds behind the pictures, and write your name the way a scribe might have.</p>
          <nav aria-label="On this page" className="mt-10 flex flex-wrap gap-3">
            {JUMP.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className="btn btn-outline-light btn-sm">
                <Icon aria-hidden="true" size={16} /> {label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section id="scan" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-8 md:py-28" aria-labelledby="scan-h">
        <SectionHeader id="scan-h" eyebrow="Experimental · runs on your device" title="What sign am I looking at?" intro="Use your camera or upload a photo of a single hieroglyph. We’ll compare its shape with our library and tell you honestly how sure we are." />
        <div className="mt-12">
          <Scanner />
        </div>
      </section>

      <section id="learn" className="scroll-mt-24 bg-limestone py-20 md:py-28" aria-labelledby="learn-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader id="learn-h" eyebrow="Beginner lessons" title="Pictures that are sounds." intro="Hieroglyphs mix three kinds of signs. Once you see the difference, inscriptions start to make sense." />
          <ol className="mt-12 grid gap-6 md:grid-cols-2">
            {GROUPS.map((g, i) => {
              const sample = signs.filter((s) => s.group === g.id).slice(0, 5);
              return (
                <li key={g.id}>
                  <Reveal delay={i * 0.06} className="card h-full p-7">
                    <p className="eyebrow">Lesson {i + 1}</p>
                    <h3 className="mt-2 text-2xl">{g.title}</h3>
                    <p className="mt-2 text-muted">{g.intro}</p>
                    <ul className="mt-5 flex flex-wrap gap-3">
                      {sample.map((s) => (
                        <li key={s.gardiner} className="flex min-w-16 flex-col items-center rounded-xl bg-limestone px-3 py-2">
                          <Glyph code={s.gardiner} className="text-4xl text-midnight" />
                          <span className="mt-1 text-xs font-semibold">{s.value ? <em>{s.value}</em> : s.gardiner}</span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </li>
              );
            })}
          </ol>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-[1.25rem] bg-midnight p-7 text-ivory on-dark">
              <p className="eyebrow">Lesson 5 · Which way to read</p>
              <p className="mt-3 text-lg">
                Hieroglyphs can run left to right, right to left, or top to bottom. <strong className="text-gold-200">Look at the faces:</strong> people and animals face the start of the line, so you read towards them.
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-white p-7 shadow-[var(--shadow-soft)]">
              <p className="eyebrow">Lesson 6 · Putting it together</p>
              <p className="mt-3 flex flex-wrap items-center gap-3 text-lg text-midnight">
                <span className="flex gap-1 text-5xl">
                  <Glyph code="M17" />
                  <Glyph code="Y5" />
                  <Glyph code="N35" />
                </span>
                = <em>j + mn + n</em> → <strong>jmn</strong>, the god Amun.
              </p>
              <p className="mt-2 text-sm text-muted">Here the game board (mn) is followed by water (n) to confirm the n sound — scribes often doubled up like this.</p>
            </div>
          </div>
          <div className="mt-16">
            <h3 className="text-3xl">The sign library</h3>
            <p className="mt-2 max-w-2xl text-muted">57 common signs, each with its Gardiner number — the reference code Egyptologists use. Tap a sign to learn more.</p>
            <div className="mt-8">
              <SignLibrary />
            </div>
          </div>
        </div>
      </section>

      <section id="practice" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-8 md:py-28" aria-labelledby="practice-h">
        <SectionHeader id="practice-h" eyebrow="Practise" title="Test yourself." intro="A quick quiz, then a challenge: draw a sign and let the recogniser judge it." />
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Quiz />
          <DrawChallenge />
        </div>
      </section>

      <section id="name" className="scroll-mt-24 bg-limestone py-20 md:py-28" aria-labelledby="name-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 id="name-h" className="sr-only">
            Your name in a cartouche
          </h2>
          <NameCartouche />
        </div>
      </section>

      <section id="about" className="mx-auto max-w-4xl scroll-mt-24 px-5 py-20 md:px-8" aria-labelledby="about-h">
        <h2 id="about-h" className="text-3xl">
          How the recogniser works — and what it can&rsquo;t do
        </h2>
        <div className="prose-edit mt-6 space-y-4 text-muted">
          <p>
            Your photo is turned into a simple black-and-white outline and compared, shape by shape, with reference drawings of 57 signs. It runs entirely in your browser, uses no paid service, and nothing is uploaded or stored.
          </p>
          <p>
            In our tests with distorted, noisy and unevenly lit images it identifies the right sign about 97% of the time, and when it says “most likely” it is right about 99% of the time. Real inscriptions are harder: carving styles, wear and paint vary, so expect more “not sure” answers. It suggests <strong>single signs</strong>; it does not translate texts.
          </p>
          <p>Sign meanings are an editorial draft based on standard references and are awaiting review by an Egyptologist.</p>
        </div>
        <h3 className="mt-10 text-xl">Sources</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {SIGN_SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-nile underline">
                {s.name}
              </a>
            </li>
          ))}
        </ul>
        <a href="#scan" className="btn btn-primary mt-10">
          <ArrowDown aria-hidden="true" size={16} className="rotate-180" /> Back to the scanner
        </a>
      </section>
    </>
  );
}
