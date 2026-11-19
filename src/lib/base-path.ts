/**
 * The address prefix the site lives under. Empty on Vercel or any normal host; "/discover-egypt" on
 * GitHub Pages, which serves a project at https://<user>.github.io/<repo>/.
 * next/link and the router add it by themselves; use withBase() for raw <a>, <video>, <img> and fetch.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** True in the plain-files build for GitHub Pages: no server, no API routes. */
export const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

export function withBase(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? `${BASE_PATH}${path}` : path;
}
