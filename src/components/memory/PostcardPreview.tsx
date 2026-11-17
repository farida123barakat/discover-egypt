"use client";
import { useEffect, useRef, useState } from "react";
import type { Memory } from "@/lib/memories";
import { placeName, renderFront } from "@/lib/postcard-export";

/**
 * Live postcard preview. Draws the real print canvas, so what you see is exactly what you download.
 * `label` describes the card for screen readers (a canvas has no text of its own).
 */
export function PostcardPreview({ memory, className = "", eager = true }: { memory: Memory; className?: string; eager?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (visible || !box.current) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setVisible(true), { rootMargin: "300px" });
    io.observe(box.current);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !ref.current) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled || !ref.current) return;
      await renderFront(memory, ref.current);
      if (!cancelled) setReady(true);
    }, 120); // debounce while typing
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [memory, visible]);

  const label = `Postcard preview: ${placeName(memory)}${memory.caption ? `, “${memory.caption}”` : ""}`;
  return (
    <div ref={box} className={`relative aspect-[154/111] overflow-hidden rounded-xl bg-limestone shadow-[var(--shadow-lift)] ${className}`}>
      <canvas ref={ref} role="img" aria-label={label} className={`h-full w-full transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`} data-testid="postcard-canvas" data-ready={ready} />
      {!ready && <span className="absolute inset-0 flex items-center justify-center text-sm text-muted">Drawing your postcard…</span>}
    </div>
  );
}
