"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n/context";
import type { ParkingZone } from "@/types";
import type { LatLng } from "@/lib/hooks/useLiveLocation";

// Leaflet touches `window`, so the actual map renders client-only.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-800/40 text-xs text-slate-500">
      …
    </div>
  ),
});

interface LiveMapProps {
  center: LatLng;
  zones: ParkingZone[];
  activeZoneId?: string | null;
  isDefault?: boolean;
}

export function LiveMap({ center, zones, activeZoneId, isDefault }: LiveMapProps) {
  const { t } = useI18n();
  return (
    <div className="card overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("mapTitle")}</p>
        <p className="text-xs text-slate-600 font-mono">{t("mapLive")}</p>
      </div>

      <div className="h-64 w-full">
        <LeafletMap center={center} zones={zones} activeZoneId={activeZoneId} isDefault={isDefault} />
      </div>

      <div className="px-4 pb-4 pt-2 flex items-center gap-4 flex-wrap">
        {(["red", "yellow", "green"] as const).map((c) => (
          <div key={c} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: c === "red" ? "#ef4444" : c === "yellow" ? "#f59e0b" : "#22c55e" }}
            />
            <span className="text-xs text-slate-500">
              {c === "red" ? t("premium") : c === "yellow" ? t("standard") : t("economy")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
