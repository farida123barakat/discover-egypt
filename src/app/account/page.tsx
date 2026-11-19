import type { Metadata } from "next";
import Link from "next/link";
import { backendMode } from "@/lib/env";
import { AccountPanel } from "@/components/AccountPanel";
import { PhotoHero } from "@/components/design";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

type Search = { error?: string; welcome?: string; "signed-out"?: string; password?: string };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Search> }) {
  const q = await searchParams;
  const { error } = q;
  const accounts = backendMode() === "supabase";
  return (
    <>
    <PhotoHero
      k="redSeaBeach"
      eyebrow="My Egypt"
      title="Your account"
      intro={
        accounts
          ? "You never need an account. Favourites, stamps, packing lists and your trip are saved in this browser. Sign in only if you want to keep trips on more than one device."
          : "You never need an account. Favourites, stamps, packing lists and your trip are saved in this browser."
      }
    />
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-4 md:px-8">
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
          <h2 className="text-2xl">No sign-in needed</h2>
          <p className="mt-2 text-muted">
            This site runs in your browser, without accounts or a database. Your trips, bucket list and Memory Hunt album are saved on this device, and you can download your album as a backup file from the album page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/my-egypt" className="btn btn-primary">Open My Egypt</Link>
            <Link href="/memory-hunt/album" className="btn btn-outline">Back up my album</Link>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
