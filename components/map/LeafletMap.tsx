"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/lib/i18n/context";
import { DAMASCUS_CENTER } from "@/lib/hooks/useLiveLocation";
import type { ParkingZone } from "@/types";
import type { LatLng } from "@/lib/hooks/useLiveLocation";

const ZONE_HEX: Record<string, string> = {
  red: "#ef4444",
  yellow: "#f59e0b",
  green: "#22c55e",
};

/** Frame all parking zones once on mount so Damascus is visible immediately. */
function FitZones({ zones }: { zones: ParkingZone[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const pts: [number, number][] = [];
    for (const z of zones) {
      const ring = (z.coordinates?.coordinates?.[0] ?? []) as [number, number][];
      for (const [lng, lat] of ring) pts.push([lat, lng]);
    }
    if (pts.length >= 2) {
      map.fitBounds(L.latLngBounds(pts), { padding: [24, 24] });
      done.current = true;
    }
  }, [map, zones]);
  return null;
}

/**
 * One-shot "recenter on my location" control. The map no longer follows the
 * GPS automatically — the user pans freely and taps this to jump back.
 */
function LocateButton({ position }: { position: LatLng }) {
  const map = useMap();
  const { t } = useI18n();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Keep clicks/scroll on the button from dragging/zooming the map.
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() =>
        map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15), { animate: true })
      }
      aria-label={t("myLocation")}
      title={t("myLocation")}
      className="absolute top-3 right-3 z-[1000] p-2 rounded-lg bg-slate-800/90 border border-slate-700 text-amber-500 dark:text-amber-400 shadow-lg hover:bg-slate-700 transition-colors"
    >
      <LocateFixed className="w-4 h-4" />
    </button>
  );
}

export interface LeafletMapProps {
  center: LatLng;
  zones: ParkingZone[];
  activeZoneId?: string | null;
  isDefault?: boolean;
}

export default function LeafletMap({ center, zones, activeZoneId, isDefault }: LeafletMapProps) {
  return (
    <MapContainer
      // Open on Damascus (the zones) regardless of where the user is; the live
      // marker + locate button handle "where am I".
      center={[DAMASCUS_CENTER.lat, DAMASCUS_CENTER.lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="z-0 h-full w-full"
    >
      {/* Free OpenStreetMap tiles — attribution is required by the OSM tile policy. */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {/* Supabase parking zones as colored polygons (GeoJSON [lng,lat] -> Leaflet [lat,lng]). */}
      {zones.map((zone) => {
        const ring = (zone.coordinates?.coordinates?.[0] ?? []) as [number, number][];
        if (ring.length < 3) return null;
        const positions = ring.map(([lng, lat]) => [lat, lng] as [number, number]);
        const hex = ZONE_HEX[zone.zone_color] ?? "#64748b";
        const active = zone.id === activeZoneId;
        return (
          <Polygon
            key={zone.id}
            positions={positions}
            pathOptions={{
              color: hex,
              weight: active ? 3 : 2,
              fillColor: hex,
              fillOpacity: active ? 0.35 : 0.15,
              dashArray: active ? undefined : "5,4",
            }}
          >
            <Tooltip sticky>{zone.name_ar}</Tooltip>
          </Polygon>
        );
      })}

      {/* Live position — vector marker (no image asset, so it survives bundling). */}
      <CircleMarker
        center={[center.lat, center.lng]}
        radius={8}
        pathOptions={{
          color: "#ffffff",
          weight: 2,
          fillColor: isDefault ? "#64748b" : "#f59e0b",
          fillOpacity: 1,
        }}
      >
        <Tooltip direction="top">{isDefault ? "Damascus" : "You"}</Tooltip>
      </CircleMarker>

      <FitZones zones={zones} />
      <LocateButton position={center} />
    </MapContainer>
  );
}
