import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/env";
import { supabaseForUser } from "@/lib/supabase/server";
import { NewPasswordForm } from "@/components/NewPasswordForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

/** Reached from the reset email (via /auth/callback, which creates the session). Signed-in only. */
export default async function NewPasswordPage() {
  if (!supabaseConfigured()) redirect("/account");
  const { data } = await (await supabaseForUser()).auth.getUser();
  if (!data.user) redirect("/account?error=reset");
  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-36 md:px-8">
      <p className="eyebrow">Your account</p>
      <h1 className="mt-3 text-5xl">Choose a new password</h1>
      <p className="mt-4 text-muted">
        For <strong>{data.user.email}</strong>. You&rsquo;ll stay signed in on this device. <Link href="/account" className="font-semibold text-nile underline underline-offset-4">Cancel</Link>
      </p>
      <NewPasswordForm email={data.user.email ?? ""} />
    </div>
  );
}
