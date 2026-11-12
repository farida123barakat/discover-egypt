/**
 * Sunrise / sunset using the NOAA solar position approximation (accurate to about a minute
 * at Egypt's latitudes). Returns UTC Date objects; format them in "Africa/Cairo" for display.
 */
const rad = Math.PI / 180;

export function sunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date; noon: Date } {
  const day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const jd = day / 86400000 + 2440587.5;
  // Integer day count: the sunrise equation needs whole days, otherwise noon lands half a day off.
  const n = Math.ceil(jd - 2451545.0 + 0.0008);
  const Jstar = n - lng / 360;
  const M = (357.5291 + 0.98560028 * Jstar) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const Jtransit = 2451545.0 + Jstar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const decl = Math.asin(Math.sin(lambda * rad) * Math.sin(23.4397 * rad));
  const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad;
  const toDate = (j: number) => new Date((j - 2440587.5) * 86400000);
  return { sunrise: toDate(Jtransit - H / 360), sunset: toDate(Jtransit + H / 360), noon: toDate(Jtransit) };
}

export function goldenHours(date: Date, lat: number, lng: number) {
  const { sunrise, sunset } = sunTimes(date, lat, lng);
  const hour = 60 * 60 * 1000;
  return {
    sunrise,
    sunset,
    morning: [sunrise, new Date(sunrise.getTime() + hour)] as const,
    evening: [new Date(sunset.getTime() - hour), sunset] as const,
    blueMorning: [new Date(sunrise.getTime() - 25 * 60000), sunrise] as const,
    blueEvening: [sunset, new Date(sunset.getTime() + 25 * 60000)] as const,
  };
}

export const cairoTime = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });
