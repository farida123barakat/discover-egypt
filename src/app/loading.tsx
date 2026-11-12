export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center pt-24" role="status">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-sand border-t-midnight" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
