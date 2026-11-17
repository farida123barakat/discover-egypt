import type { Metadata } from "next";
import Link from "next/link";
import { backendMode } from "@/lib/env";
import { AccountPanel } from "@/components/AccountPanel";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

type Search = { error?: string; welcome?: string; "signed-out"?: string; password?: string };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Search> }) {
  const q = await searchParams;
  const { error } = q;
  const accounts = backendMode() === "supabase";
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-36 md:px-8">
      <p className="eyebrow">My Egypt</p>
      <h1 className="mt-3 text-5xl">Your account</h1>
      <p className="mt-4 text-lg text-muted">
        You never need an account. Favourites, stamps, packing lists and your trip are saved in this browser. Sign in only if you want to keep trips on more than one device.
      </p>
      {error === "link" && (
        <p role="alert" className="mt-6 rounded-xl bg-alert/10 p-4 font-medium text-alert">
          That link has expired, was already used, or was opened in a different browser from the one you asked in. Request a new one below.
        </p>
      )}
      {error === "reset" && (
        <p role="alert" className="mt-6 rounded-xl bg-alert/10 p-4 font-medium text-alert">
          That password-reset link has expired or was already used. Choose &ldquo;Forgot your password?&rdquo; below to get a new one.
        </p>
      )}
      {q.welcome && (
        <p role="status" className="mt-6 rounded-xl bg-ok/10 p-4 font-medium text-ok">
          You&rsquo;re signed in.
        </p>
      )}
      {q["signed-out"] && (
        <p role="status" className="mt-6 rounded-xl bg-ok/10 p-4 font-medium text-ok">
          You&rsquo;ve signed out on this device.
        </p>
      )}
      {q.password === "changed" && (
        <p role="status" className="mt-6 rounded-xl bg-ok/10 p-4 font-medium text-ok">
          Your password has been changed.
        </p>
      )}
      {accounts ? (
        <AccountPanel />
      ) : (
        <div className="card mt-10 p-7">
          <h2 className="text-2xl">Accounts are switched off on this server</h2>
          <p className="mt-2 text-muted">Cloud accounts need a Supabase project. Everything else works, and your plans stay on this device.</p>
          <Link href="/my-egypt" className="btn btn-primary mt-6">Open My Egypt</Link>
        </div>
      )}
    </div>
  );
}
