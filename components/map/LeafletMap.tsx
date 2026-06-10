"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ParkingZone } from "@/types";
import type { LatLng } from "@/lib/hooks/useLiveLocation";

const ZONE_HEX: Record<string, string> = {
  red: "#ef4444",
  yellow: "#f59e0b",
  green: "#22c55e",
};

/** Keeps the map centered on the live position as it updates. */
function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
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
      center={[center.lat, center.lng]}
      zoom={14}
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

      <Recenter center={center} />
    </MapContainer>
  );
}
