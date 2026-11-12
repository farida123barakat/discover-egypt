import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { backendMode } from "@/lib/env";
import { AdminLogin } from "@/components/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  const mode = backendMode();
  return (
    <div className="mx-auto max-w-md px-5 pb-24 pt-40">
      <h1 className="text-4xl">Administrator sign in</h1>
      {mode === "none" ? (
        <p className="mt-6 rounded-xl bg-alert/10 p-4 text-alert">Administration is unavailable until Supabase is configured. See DEPLOYMENT.md.</p>
      ) : (
        <AdminLogin mode={mode} />
      )}
    </div>
  );
}
