import { backendMode } from "@/lib/env";

/**
 * Flags local demo mode (data in a file on this server, one shared admin password), which must never
 * be mistaken for the real thing. Nothing is shown on the normal front-end-only site, where the pages
 * that would need a database explain themselves, or when Supabase is connected.
 */
export function BackendNotice() {
  const mode = backendMode();
  if (mode !== "local") return null;
  const text = "Questions, admin changes and print requests are saved on this server only, and accounts are off.";
  return (
    <aside aria-label="Site status" className="pointer-events-none fixed bottom-3 left-3 z-40 max-w-[min(22rem,calc(100vw-1.5rem))] print:hidden" data-testid="backend-notice" data-mode={mode}>
      <p className="rounded-xl bg-midnight/95 px-3 py-2 text-xs leading-snug text-ivory shadow-lg">
        <strong className="text-gold-300">Demo mode</strong> · {text}
      </p>
    </aside>
  );
}
