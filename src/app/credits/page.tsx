import type { Metadata } from "next";
import { photos } from "@/content/images";

export const metadata: Metadata = { title: "Photo credits & sources" };

const SOURCES = [
  ["GOV.UK Foreign travel advice — Egypt (emergency numbers)", "https://www.gov.uk/foreign-travel-advice/egypt/getting-help"],
  ["Cairo Governorate — metro fares from 27 March 2026", "https://cairo.gov.eg/en/news/news-eng/2026/374fc0a6e09f4eecb850e5aa7b859abe"],
  ["Ministry of Tourism and Antiquities — tickets", "https://egymonuments.gov.eg/"],
  ["Egyptian Tourism Authority", "https://egypt.travel/"],
  ["ExchangeRate-API (live exchange rates)", "https://www.exchangerate-api.com"],
  ["OpenStreetMap contributors (map data)", "https://www.openstreetmap.org/copyright"],
];

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-36 md:px-8">
      <p className="eyebrow">Credits</p>
      <h1 className="mt-4 text-5xl">Photo credits & sources</h1>
      <h2 className="mt-12 text-3xl">Information sources</h2>
      <ul className="mt-4 space-y-2">
        {SOURCES.map(([n, u]) => (
          <li key={u}>
            <a className="text-nile underline" href={u} target="_blank" rel="noopener noreferrer">
              {n}
            </a>
          </li>
        ))}
      </ul>
      <h2 className="mt-12 text-3xl">Photographs</h2>
      <p className="mt-2 text-muted">All photographs come from Wikimedia Commons under the licences listed. Select a photo to see the original file and full licence.</p>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th scope="col" className="pb-2">Photo</th>
            <th scope="col" className="pb-2">Author</th>
            <th scope="col" className="pb-2">Licence</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(photos).map(([k, p]) => (
            <tr key={k} className="border-t border-sand">
              <td className="py-2 pr-4">
                <a className="text-nile underline" href={p.sourcePage} target="_blank" rel="noopener noreferrer">
                  {p.alt}
                </a>
              </td>
              <td className="py-2 pr-4">{p.author}</td>
              <td className="py-2">{p.license}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
