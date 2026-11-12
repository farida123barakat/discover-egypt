"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-32 pt-44 text-center" role="alert">
      <h1 className="text-5xl">Something went wrong.</h1>
      <p className="mt-4 text-lg text-muted">Sorry — please try again. If it keeps happening, let us know through the contact page.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">Try again</button>
    </div>
  );
}
