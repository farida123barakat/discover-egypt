"use client";
import { withBase } from "@/lib/base-path";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";

export type MapPoint = { id: string; lat: number; lng: number; label: string; sub?: string; href?: string; img?: string | null; number?: number };

function icon(active: boolean, n?: number) {
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;border:3px solid #faf6ee;box-shadow:0 6px 16px rgba(15,27,45,.35);background:${
      active ? "#b08d4a" : "#0f1b2d"
    };color:#faf6ee;font:600 13px Inter Variable,system-ui">${n ?? ""}</span>`,
  });
}

function FitTo({ points, focus }: { points: MapPoint[]; focus?: string | null }) {
  const map = useMap();
  useEffect(() => {
    const f = points.find((p) => p.id === focus);
    if (f) map.flyTo([f.lat, f.lng], 8, { duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.8 });
    else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 8);
    else if (points.length) map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 15 });
  }, [map, points, focus]);
  return null;
}

export default function EgyptMapInner({
  points,
  focus,
  onSelect,
  route = false,
  height = 560,
}: {
  points: MapPoint[];
  focus?: string | null;
  onSelect?: (id: string) => void;
  route?: boolean;
  height?: number;
}) {
  return (
    <MapContainer center={[26.8, 30.8]} zoom={6} scrollWheelZoom={false} style={{ height, width: "100%" }} aria-label="Interactive map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitTo points={points} focus={focus} />
      {route && <Polyline positions={points.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#2f6f6b", weight: 4, dashArray: "6 8" }} />}
      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icon(p.id === focus, p.number)}
          title={p.label}
          alt={p.label}
          keyboard
          eventHandlers={{ click: () => onSelect?.(p.id) }}
        >
          <Popup>
            <strong style={{ fontFamily: "Fraunces Variable, serif", fontSize: 16 }}>{p.label}</strong>
            {p.sub && <div style={{ marginTop: 4 }}>{p.sub}</div>}
            {p.href && (
              <a href={withBase(p.href)} style={{ display: "inline-block", marginTop: 6, color: "#2f6f6b", fontWeight: 600 }}>
                Explore →
              </a>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
