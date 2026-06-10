import { useCallback, useEffect, useRef, useState } from "react";
import type { ParkingZone } from "@/types";

/** Geographic center of Damascus — the graceful fallback when GPS is denied. */
export const DAMASCUS_CENTER = { lat: 33.5138, lng: 36.2765 } as const;

export type GeoStatus = "idle" | "locating" | "granted" | "denied" | "unavailable";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LiveLocation {
  position: LatLng;
  accuracy: number | null;
  status: GeoStatus;
  error: string | null;
  /** true while we're showing the Damascus fallback instead of a real fix. */
  isDefault: boolean;
  /** the parking zone the current position falls inside, or null. */
  currentZone: ParkingZone | null;
  refresh: () => void;
}

/**
 * Ray-casting point-in-polygon test. `ring` is a GeoJSON linear ring of
 * [lng, lat] pairs (as stored in parking_zones.coordinates).
 */
function pointInRing(lng: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Returns the first zone whose outer ring contains the point, or null. */
export function zoneForPoint(
  lat: number,
  lng: number,
  zones: ParkingZone[]
): ParkingZone | null {
  for (const zone of zones) {
    const ring = zone.coordinates?.coordinates?.[0] as [number, number][] | undefined;
    if (ring && pointInRing(lng, lat, ring)) return zone;
  }
  return null;
}

/**
 * Watches the user's real-world position via the native Geolocation API.
 * On permission-denied / unavailable / timeout it falls back to the Damascus
 * center so the UI always has a coherent point. Recomputes which geo-fenced
 * zone the position falls inside whenever the position or zones change.
 */
export function useLiveLocation(zones: ParkingZone[]): LiveLocation {
  const [position, setPosition] = useState<LatLng>({ ...DAMASCUS_CENTER });
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(true);
  const watchId = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (
      watchId.current !== null &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      setError("Geolocation is not supported by this browser.");
      setIsDefault(true);
      return;
    }
    setStatus("locating");
    clear();
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setIsDefault(false);
        setStatus("granted");
        setError(null);
      },
      (err) => {
        // Keep the Damascus fallback; surface a friendly status.
        setPosition({ ...DAMASCUS_CENTER });
        setAccuracy(null);
        setIsDefault(true);
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 12000 }
    );
  }, [clear]);

  useEffect(() => {
    start();
    return clear;
  }, [start, clear]);

  const currentZone = zoneForPoint(position.lat, position.lng, zones);

  return { position, accuracy, status, error, isDefault, currentZone, refresh: start };
}
