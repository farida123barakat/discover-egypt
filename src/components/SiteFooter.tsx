import Link from "next/link";
import { AccessibilityControls } from "./SiteHeader";
import { NewsletterForm } from "./forms";

const cols = [
  {
    title: "Explore",
    links: [
      ["/discover", "Destinations"],
      ["/discover#find", "Find your Egypt"],
      ["/discover#timeline", "Walk through time"],
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

export function SiteFooter() {
  return (
    <footer className="on-dark bg-midnight text-ivory/85">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-12 md:px-8">
        <div className="md:col-span-5">
          <p className="font-display text-3xl text-ivory">Discover Egypt</p>
          <p className="mt-2 text-ivory/70">A thousand stories. One destination.</p>
          <div className="mt-8 max-w-md">
            <NewsletterForm />
          </div>
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
