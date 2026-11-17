import { backendMode } from "@/lib/env";

/**
 * Makes the back end obvious when it isn't the real one: local demo mode (data in a file on this
 * server, one shared admin password) or no back end at all. Nothing is shown when Supabase is connected.
 */
export function BackendNotice() {
  const mode = backendMode();
  if (mode === "supabase") return null;
  const text =
    mode === "local"
      ? "Demo mode: no database is connected. Questions, admin changes and print requests are saved on this server only, and accounts are off."
      : "No database is connected, so accounts, questions and admin are switched off. Everything you save stays in this browser.";
  return (
    <aside aria-label="Site status" className="pointer-events-none fixed bottom-3 left-3 z-40 max-w-[min(22rem,calc(100vw-1.5rem))] print:hidden" data-testid="backend-notice" data-mode={mode}>
      <p className="rounded-xl bg-midnight/95 px-3 py-2 text-xs leading-snug text-ivory shadow-lg">
        <strong className="text-gold-300">{mode === "local" ? "Demo mode" : "Offline back end"}</strong> · {text.replace(/^Demo mode: /, "")}
      </p>
    </aside>
  );
}
