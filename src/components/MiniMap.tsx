"use client";
import dynamic from "next/dynamic";
import type { MapPoint } from "./EgyptMapInner";

const Inner = dynamic(() => import("./EgyptMapInner"), { ssr: false, loading: () => <div className="h-[260px] bg-limestone" role="status" aria-label="Loading map" /> });

export function MiniMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  return <Inner points={[{ id: label, lat, lng, label }]} height={260} />;
}

export function RouteMap({ points }: { points: MapPoint[] }) {
  return <Inner points={points} route height={460} />;
}
