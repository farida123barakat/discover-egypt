import type { Metadata } from "next";
import { ContactForm } from "@/components/forms";
import { Credit } from "@/components/design";
import { Photo } from "@/components/ui";
import { backendMode, contactEmail } from "@/lib/env";

export const metadata: Metadata = { title: "Contact", description: "Contact the Discover Egypt team." };

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-16 px-5 pb-24 pt-36 md:px-8 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Contact & enquiries</p>
        <h1 className="mt-4 text-5xl md:text-6xl">How can we help?</h1>
        <p className="mt-5 text-lg text-muted">Questions about planning, accessibility, partnerships or this website. For emergencies in Egypt call the Tourist Police on 126.</p>
        <figure className="relative mt-10 aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-sand">
          <Photo k="alexFishingBoats" sizes="(min-width: 1024px) 45vw, 100vw" className="absolute inset-0 h-full w-full" />
          <div className="photo-scrim absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-midnight/70 to-transparent" />
          <Credit k="alexFishingBoats" className="absolute bottom-2 right-3" />
        </figure>
      </div>
      <div className="card p-7 md:p-10">
        <ContactForm offline={backendMode() === "none"} to={contactEmail()} />
      </div>
    </div>
  );
}
