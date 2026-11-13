import type { Metadata } from "next";
import { getDestination } from "@/content/destinations";
import { listPublished } from "@/lib/store";
import { AskLocalForm, StoryForm } from "@/components/forms";
import { SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ask a Local", description: "Ask Egyptian locals your travel questions and share your own story." };

export default async function CommunityPage() {
  const [questions, stories] = await Promise.all([listPublished("question", 20), listPublished("story", 12)]);
  const answered = questions.filter((q) => q.answer);
  return (
    <>
      <section className="bg-limestone pb-16 pt-36">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="eyebrow">Ask a local</p>
          <h1 className="mt-4 max-w-4xl text-5xl md:text-7xl">Questions answered by people who live here.</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">Every question and story is reviewed by our team before it is published. We only ever show your first name.</p>
        </div>
      </section>

      <section id="ask" className="mx-auto grid max-w-7xl scroll-mt-24 gap-16 px-5 py-20 md:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionHeading eyebrow="Recently answered" title="From the community." />
          {answered.length ? (
            <ul className="mt-8 space-y-5">
              {answered.map((q) => (
                <li key={q.id} className="card p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-ink">{getDestination(q.destination)?.name ?? "General"}</p>
                  <p className="mt-2 font-semibold text-midnight">“{q.body}”</p>
                  <p className="text-sm text-muted">— {q.firstName}</p>
                  <p className="mt-4 border-l-4 border-gold pl-4">{q.answer}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grain mt-8 rounded-2xl bg-limestone p-8">
              <p className="font-display text-2xl text-midnight">No answers published yet.</p>
              <p className="mt-2 text-muted">Ask the first question — approved answers will appear here.</p>
            </div>
          )}
        </div>
        <div className="card p-7 md:p-10">
          <h2 className="text-3xl">Ask your question</h2>
          <p className="mt-2 mb-6 text-muted">From where to find the best ful to whether a dress code applies — no question is too small.</p>
          <AskLocalForm />
        </div>
      </section>

      <section id="story" className="scroll-mt-24 bg-sand/40 py-20" aria-labelledby="story-h">
        <div className="mx-auto grid max-w-7xl gap-16 px-5 md:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading id="story-h" eyebrow="Traveller stories" title="Share your Egypt." />
            {stories.length ? (
              <ul className="mt-8 space-y-5">
                {stories.map((s) => (
                  <li key={s.id} className="card p-6">
                    <p className="eyebrow">{getDestination(s.destination)?.name}</p>
                    <h3 className="mt-2 text-2xl">{s.title}</h3>
                    <p className="mt-2 whitespace-pre-line text-muted">{s.body}</p>
                    <p className="mt-3 text-sm font-semibold">
                      {s.firstName}
                      {s.country ? `, ${s.country}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-muted">No stories published yet. Yours could be the first.</p>
            )}
          </div>
          <div className="card p-7 md:p-10">
            <h2 className="text-3xl">Tell us your story</h2>
            <p className="mt-2 mb-6 text-muted">Stories are moderated before publishing.</p>
            <StoryForm />
          </div>
        </div>
      </section>
    </>
  );
}
