import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-32 pt-44 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-5xl">Lost in the desert.</h1>
      <p className="mt-4 text-lg text-muted">We couldn&apos;t find that page. It may have moved.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn btn-primary">Back home</Link>
        <Link href="/discover" className="btn btn-ghost">Explore destinations</Link>
      </div>
    </div>
  );
}
