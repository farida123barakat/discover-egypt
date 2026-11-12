import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <article className="prose-edit mx-auto max-w-3xl px-5 pb-24 pt-36 md:px-8">
      <p className="eyebrow">Privacy policy</p>
      <h1 className="mt-4 text-5xl">Your privacy</h1>
      <p className="mt-2 text-sm text-muted">Draft for legal review · Last updated 12 November 2026</p>
      <h2 className="mt-10 text-2xl">What we collect</h2>
      <p>We only collect what a feature needs:</p>
      <ul className="list-disc pl-6">
        <li>Ask a Local and traveller stories: your name, email, and what you write. Only your first name and your text are ever published, after moderation.</li>
        <li>Contact form: your name, email and message.</li>
        <li>Newsletter: your email address.</li>
        <li>Accounts (if enabled): your email address and the itineraries you choose to save.</li>
      </ul>
      <h2 className="mt-10 text-2xl">What stays on your device</h2>
      <p>Saved destinations, passport stamps, your packing list, your draft itinerary and display settings are stored in your browser&apos;s local storage. They are not sent to us. You can clear them from My Egypt at any time.</p>
      <h2 className="mt-10 text-2xl">Tracking</h2>
      <p>We do not use advertising trackers or third-party analytics cookies. Maps load tiles from OpenStreetMap and photos load from Wikimedia Commons; those services can see your IP address when your browser requests them.</p>
      <h2 className="mt-10 text-2xl">Cookies</h2>
      <p>We only set strictly necessary cookies for signing in (accounts and administrators). No consent banner is needed for these.</p>
      <h2 className="mt-10 text-2xl">How long we keep data</h2>
      <p>Rejected submissions and contact messages should be deleted after 12 months. Newsletter subscribers can unsubscribe at any time. Retention periods must be confirmed by the data controller before launch.</p>
      <h2 className="mt-10 text-2xl">Your rights</h2>
      <p>You can ask to see, correct or delete your data through the contact form.</p>
    </article>
  );
}
