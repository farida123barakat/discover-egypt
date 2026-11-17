import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <article className="prose-edit mx-auto max-w-3xl px-5 pb-24 pt-36 md:px-8">
      <p className="eyebrow">Privacy policy</p>
      <h1 className="mt-4 text-5xl">Your privacy</h1>
      <p className="mt-2 text-sm text-muted">Draft for legal review · Last updated 17 November 2026</p>
      <h2 className="mt-10 text-2xl">What we collect</h2>
      <p>We only collect what a feature needs:</p>
      <ul className="list-disc pl-6">
        <li>Ask a Local and traveller stories: your name, email, and what you write. Only your first name and your text are ever published, after moderation.</li>
        <li>Contact form: your name, email and message.</li>
        <li>Newsletter: your email address.</li>
        <li>Accounts (if enabled): your email address and the itineraries you choose to save.</li>
        <li>Memory Hunt backup and printing: only if you choose them. See below.</li>
      </ul>
      <h2 className="mt-10 text-2xl">What stays on your device</h2>
      <p>Saved destinations, passport stamps, your packing list, your draft itinerary and display settings are stored in your browser&apos;s local storage. They are not sent to us. You can clear them from My Egypt at any time.</p>
      <h2 id="memories" className="mt-10 scroll-mt-28 text-2xl">
        Egypt Memory Hunt: memories, backups and printing
      </h2>
      <h3 className="mt-6 text-xl">On your device</h3>
      <p>
        Memories (photos, captions, stories, the date and destination you choose) are saved in your browser&apos;s storage (IndexedDB) and are not sent to us. Photos are resized and re-saved on your device before they are stored, which removes hidden information such as the camera&apos;s GPS position. If you tap &ldquo;Use my location&rdquo;, your position is rounded and used once, on your device, to suggest the nearest destination; it is not saved or sent. Postcards and the album PDF are made on your device too. Anyone who uses this browser can see your album, so delete it on shared computers.
      </p>
      <h3 className="mt-6 text-xl">Cloud backup (optional, needs an account)</h3>
      <p>
        If you sign in and press &ldquo;Back up now&rdquo;, your memories and their photos are copied to your account. Only you can read them: the database and file storage refuse access to anyone else, including our administrators. You can delete one memory or your whole backup from your album at any time. If you ask us to delete your account, we delete your backup with it.
      </p>
      <h3 className="mt-6 text-xl">Printing at a partner (optional)</h3>
      <p>
        Printing is only offered at partners we have verified. When you ask for a print, we send the partner <strong>only the front of the postcard</strong>: the image with your caption, place and date as you see it in the preview. Your story, name, email and location are not sent. Staff at the partner you choose can see the image in order to print it. If you are signed in, the request is linked to your account; otherwise it is not linked to you at all.
      </p>
      <p>
        You get a random collection code (and a QR code holding only a link to its status page). Anyone who has the code can see the request&apos;s status and the partner&apos;s address, but nothing about you, so treat it like a ticket. Your browser also keeps the code and a private cancel key so you can check or cancel the request from your album.
      </p>
      <p>
        The postcard image is deleted as soon as the print is collected or cancelled, or 30 days after you asked if it is never collected. The request record itself (code, partner, status and dates, with no image) is kept for our records and can be deleted on request.
      </p>
      <h3 className="mt-6 text-xl">Sharing</h3>
      <p>If you use &ldquo;Share&rdquo;, the postcard image goes to the app you choose through your device&apos;s own share menu. We are not involved and don&apos;t receive a copy.</p>

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
