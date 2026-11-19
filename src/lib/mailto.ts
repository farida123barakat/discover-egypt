/**
 * Front-end-only forms: with no database, a form can't store anything, so it prepares an email
 * in the visitor's own mail app instead. Nothing leaves the browser until they press send there.
 */

const EMAIL = /^[^\s@<>,;"?&]+@[^\s@<>,;"?&]+\.[^\s@<>,;"?&]+$/;

export function isEmail(v: unknown): v is string {
  return typeof v === "string" && EMAIL.test(v.trim());
}

/** Builds a mailto: link. Empty fields are left out; the address itself is never URL-encoded. */
export function mailtoHref(to: string, subject: string, fields: [label: string, value: unknown][]): string {
  if (!isEmail(to)) throw new Error("mailtoHref needs a valid address");
  const body = fields
    .map(([label, value]) => [label, value == null ? "" : String(value).trim()] as const)
    .filter(([, value]) => value !== "")
    .map(([label, value]) => (value.includes("\n") ? `${label}:\n${value}` : `${label}: ${value}`))
    .join("\n\n");
  return `mailto:${to.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
