import type { Metadata } from "next";
import { ContactForm } from "@/components/forms";

export const metadata: Metadata = { title: "Contact", description: "Contact the Discover Egypt team." };

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-16 px-5 pb-24 pt-36 md:px-8 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Contact & enquiries</p>
        <h1 className="mt-4 text-5xl md:text-6xl">How can we help?</h1>
        <p className="mt-5 text-lg text-muted">Questions about planning, accessibility, partnerships or this website. For emergencies in Egypt call the Tourist Police on 126.</p>
      </div>
      <div className="card p-7 md:p-10">
        <ContactForm />
      </div>
    </div>
  );
}
