import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "./design";
import { AccessibilityControls } from "./SiteHeader";
import { NewsletterForm } from "./forms";

const cols = [
  {
    title: "Explore",
    links: [
      ["/discover", "Destinations"],
      ["/discover#find", "Find your Egypt"],
      ["/discover#timeline", "Walk through time"],
      ["/memory-hunt", "Egypt Memory Hunt"],
      ["/experience", "Food & culture"],
    ],
  },
  {
    title: "Plan",
    links: [
      ["/plan", "Trip builder"],
      ["/plan#budget", "Budget calculator"],
      ["/travel-smart", "Travel Smart"],
      ["/travel-smart#safety", "Emergency numbers"],
    ],
  },
  {
    title: "About",
    links: [
      ["/community", "Ask a local"],
      ["/contact", "Contact"],
      ["/account", "Sync trips (optional account)"],
      ["/privacy", "Privacy policy"],
      ["/credits", "Photo credits & sources"],
    ],
  },
];

export function SiteFooter({ offline = false }: { offline?: boolean }) {
  return (
    <footer className="on-dark bg-midnight text-ivory/85">
      {/* The monthly email needs a mailing list, so it only appears when a database is connected. */}
      {!offline && (
      <section aria-labelledby="inspired-h" className="border-b border-ivory/10 bg-night">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[1fr_1.2fr] md:items-center md:px-8">
          <div className="flex items-start gap-4">
            <Mail aria-hidden="true" size={28} strokeWidth={1.25} className="mt-1 shrink-0 text-gold" />
            <div>
              <h2 id="inspired-h" className="text-3xl !text-ivory">
                Stay inspired
              </h2>
              <p className="mt-1 text-ivory/75">Seasonal travel ideas, festivals and new stories from Egypt — once a month, never more.</p>
            </div>
          </div>
          <NewsletterForm />
        </div>
      </section>
      )}
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-12 md:px-8">
        <div className="md:col-span-5">
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-ivory/70">A thousand stories. One destination. A concept platform for travellers planning a trip to Egypt.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title} className="md:col-span-2">
            <h2 className="eyebrow !text-sand">{c.title}</h2>
            <ul className="mt-4 space-y-3">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-ivory hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="md:col-span-1" />
      </div>
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 text-sm md:flex-row md:items-center md:justify-between md:px-8">
          <AccessibilityControls />
          <div className="space-y-1 text-ivory/65">
            <p>
              Official tourism information:{" "}
              <a className="underline hover:text-ivory" href="https://egypt.travel/" target="_blank" rel="noopener noreferrer">
                egypt.travel
              </a>{" "}
              · Tickets:{" "}
              <a className="underline hover:text-ivory" href="https://egymonuments.gov.eg/" target="_blank" rel="noopener noreferrer">
                egymonuments.gov.eg
              </a>
            </p>
            <p>Concept platform prototype. Not an official government service. Prices are estimates unless marked verified.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
