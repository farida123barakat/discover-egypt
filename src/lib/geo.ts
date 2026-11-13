import { destinations } from "@/content/destinations";
import { regionOfDestination } from "@/content/food";

/** Great-circle distance in km. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371,
    rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad,
    dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Nearest destination and its food region for a position. Coordinates are rounded to ~10 km before use
 * and never leave the device. Returns null if the visitor is far from every destination (e.g. outside Egypt).
 */
export function nearestRegion(lat: number, lng: number, maxKm = 250) {
  const p = { lat: Math.round(lat * 10) / 10, lng: Math.round(lng * 10) / 10 };
  let best: { slug: string; km: number } | null = null;
  for (const d of destinations) {
    const km = haversineKm(p, d);
    if (!best || km < best.km) best = { slug: d.slug, km };
  }
  if (!best || best.km > maxKm) return null;
  const region = regionOfDestination(best.slug);
  return region ? { region: region.id, destination: best.slug, km: Math.round(best.km) } : null;
}
