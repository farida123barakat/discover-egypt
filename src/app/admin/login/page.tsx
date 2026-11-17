import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { backendMode } from "@/lib/env";
import { AdminLogin } from "@/components/admin";
import { supabaseForUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  const mode = backendMode();
  // Signed in to Supabase, but not as an administrator: say so instead of showing the form again silently.
  let notAdmin: string | null = null;
  if (mode === "supabase") {
    const { data } = await (await supabaseForUser()).auth.getUser();
    notAdmin = data.user?.email ?? null;
  }
  return (
    <div className="mx-auto max-w-md px-5 pb-24 pt-40">
      <h1 className="text-4xl">Administrator sign in</h1>
      {notAdmin && (
        <p role="alert" className="mt-6 rounded-xl bg-alert/10 p-4 text-alert" data-testid="not-admin">
          You&rsquo;re signed in as <strong>{notAdmin}</strong>, which isn&rsquo;t an administrator account. Sign in with an administrator account below.
        </p>
      )}
      {mode === "none" ? (
        <p className="mt-6 rounded-xl bg-alert/10 p-4 text-alert">Administration is unavailable until Supabase is configured. See DEPLOYMENT.md.</p>
      ) : (
        <AdminLogin mode={mode} />
      )}
    </div>
  );
}
