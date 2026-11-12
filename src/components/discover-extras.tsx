"use client";
import { useMemo, useState } from "react";
import { destinations } from "@/content/destinations";
import { climate } from "@/content/practical";
import { cairoTime, goldenHours } from "@/lib/sun";
import { StatusBadge } from "./ui";

export function GoldenHourFinder() {
  const [slug, setSlug] = useState("giza");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const d = destinations.find((x) => x.slug === slug)!;
  const g = useMemo(() => goldenHours(new Date(date + "T12:00:00Z"), d.lat, d.lng), [date, d]);
  const range = (r: readonly [Date, Date]) => `${cairoTime(r[0])}–${cairoTime(r[1])}`;
  return (
    <div className="card grid gap-8 p-7 md:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <div className="field">
          <label htmlFor="gh-place">Place</label>
          <select id="gh-place" className="input" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {destinations.map((x) => (
              <option key={x.slug} value={x.slug}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="gh-date">Date</label>
          <input id="gh-date" type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
      </div>
      <div aria-live="polite">
        <p className="eyebrow">Best spot</p>
        <p className="font-display mt-1 text-2xl text-midnight">{d.photoTip.spot}</p>
        <p className="text-muted">{d.photoTip.light}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["Morning golden hour", range(g.morning), "bg-gold/15"],
            ["Evening golden hour", range(g.evening), "bg-gold/15"],
            ["Morning blue hour", range(g.blueMorning), "bg-sea/15"],
            ["Evening blue hour", range(g.blueEvening), "bg-sea/15"],
          ].map(([k, v, bg]) => (
            <div key={k} className={`rounded-xl p-4 ${bg}`}>
              <dt className="text-sm font-semibold text-midnight">{k}</dt>
              <dd className="font-display text-2xl text-midnight">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">Calculated from the sun&apos;s position, in Egypt local time. Approximate (±2 min). Hills and buildings change what you see.</p>
      </div>
    </div>
  );
}

export function ClimateChart() {
  const [place, setPlace] = useState<"cairo" | "luxor" | "hurghada">("cairo");
  const data = climate[place];
  const W = 720;
  const H = 260;
  const P = 36;
  const x = (i: number) => P + (i * (W - P * 2)) / 11;
  const y = (t: number) => H - P - ((t - 10) / 35) * (H - P * 2);
  const path = data.map((t, i) => `${i ? "L" : "M"}${x(i)},${y(t)}`).join(" ");
  return (
    <div className="card p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2" role="group" aria-label="Choose place">
          {(["cairo", "luxor", "hurghada"] as const).map((p) => (
            <button key={p} type="button" className="chip capitalize" aria-pressed={place === p} onClick={() => setPlace(p)}>
              {p}
            </button>
          ))}
        </div>
        <StatusBadge status={climate.status} />
      </div>
      <figure className="mt-6">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Typical daytime highs in ${place}, from ${Math.min(...data)}°C to ${Math.max(...data)}°C`}>
          {[15, 25, 35, 45].map((t) => (
            <g key={t}>
              <line x1={P} x2={W - P} y1={y(t)} y2={y(t)} stroke="#e3d2b4" strokeDasharray="3 5" />
              <text x={4} y={y(t) + 4} fontSize="11" fill="#5b5d63">
                {t}°
              </text>
            </g>
          ))}
          {climate.crowds.map((c, i) => (
            <rect key={i} x={x(i) - 12} y={H - P + 8} width={24} height={c * 5} rx={2} fill={c === 3 ? "#b08d4a" : c === 2 ? "#c9b08a" : "#e3d2b4"} />
          ))}
          <path d={path} fill="none" stroke="#2f6f6b" strokeWidth={3} strokeLinejoin="round" />
          {data.map((t, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(t)} r={4} fill="#0f1b2d" />
              <text x={x(i)} y={y(t) - 10} textAnchor="middle" fontSize="11" fill="#0f1b2d">
                {t}°
              </text>
              <text x={x(i)} y={H - 4} textAnchor="middle" fontSize="11" fill="#5b5d63">
                {climate.months[i]}
              </text>
            </g>
          ))}
        </svg>
        <figcaption className="mt-3 text-sm text-muted">Line: typical daytime high (°C). Bars: crowd level (taller = busier). {climate.note}</figcaption>
      </figure>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-nile">Show as a table</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">High °C</th>
              <th scope="col">Crowds</th>
            </tr>
          </thead>
          <tbody>
            {climate.months.map((m, i) => (
              <tr key={m} className="border-t border-sand">
                <th scope="row" className="py-1 font-normal">
                  {m}
                </th>
                <td>{data[i]}</td>
                <td>{["", "Quiet", "Moderate", "Busy"][climate.crowds[i]]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
