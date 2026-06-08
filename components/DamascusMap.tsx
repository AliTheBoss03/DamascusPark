"use client";

import type { ZoneColor, ParkingZone } from "@/types";

interface DamascusMapProps {
  activeZone?: ParkingZone | null;
  showDriverPin?: boolean;
}

// SVG viewport: 400 × 300, roughly covers Damascus city center
// Real coordinates mapped linearly to SVG space:
//   lng 36.255 → x=0,   lng 36.320 → x=400
//   lat 33.515 → y=0,   lat 33.485 → y=300
function lngLatToXY(lng: number, lat: number): [number, number] {
  const x = ((lng - 36.255) / (36.320 - 36.255)) * 400;
  const y = ((33.515 - lat) / (33.515 - 33.485)) * 300;
  return [Math.round(x), Math.round(y)];
}

const ZONE_POLYGONS: {
  id: string;
  color: ZoneColor;
  label: string;
  labelAr: string;
  points: string;
  labelPos: [number, number];
}[] = [
  {
    id: "zone-red-shaalan",
    color: "red",
    label: "Shaalan / Malki",
    labelAr: "شعلان · المالكي",
    points: (() => {
      const coords = [
        [36.278, 33.512],
        [36.292, 33.512],
        [36.292, 33.504],
        [36.278, 33.504],
      ] as [number, number][];
      return coords.map(([lng, lat]) => lngLatToXY(lng, lat).join(",")).join(" ");
    })(),
    labelPos: lngLatToXY(36.285, 33.508),
  },
  {
    id: "zone-yellow-mezzeh",
    color: "yellow",
    label: "Mezzeh / Abu Roumaneh",
    labelAr: "المزة · أبو رمانة",
    points: (() => {
      const coords = [
        [36.258, 33.505],
        [36.275, 33.505],
        [36.275, 33.494],
        [36.258, 33.494],
      ] as [number, number][];
      return coords.map(([lng, lat]) => lngLatToXY(lng, lat).join(",")).join(" ");
    })(),
    labelPos: lngLatToXY(36.266, 33.499),
  },
  {
    id: "zone-green-kafarsouseh",
    color: "green",
    label: "Kafarsouseh / Qassaa",
    labelAr: "كفرسوسة · القصاع",
    points: (() => {
      const coords = [
        [36.295, 33.500],
        [36.312, 33.500],
        [36.312, 33.490],
        [36.295, 33.490],
      ] as [number, number][];
      return coords.map(([lng, lat]) => lngLatToXY(lng, lat).join(",")).join(" ");
    })(),
    labelPos: lngLatToXY(36.303, 33.495),
  },
];

const FILLS: Record<ZoneColor, string> = {
  red: "rgba(239,68,68,0.18)",
  yellow: "rgba(245,158,11,0.18)",
  green: "rgba(34,197,94,0.18)",
};
const STROKES: Record<ZoneColor, string> = {
  red: "rgba(239,68,68,0.70)",
  yellow: "rgba(245,158,11,0.70)",
  green: "rgba(34,197,94,0.70)",
};
const ACTIVE_FILLS: Record<ZoneColor, string> = {
  red: "rgba(239,68,68,0.32)",
  yellow: "rgba(245,158,11,0.32)",
  green: "rgba(34,197,94,0.32)",
};

// Driver pin position — inside Shaalan zone for the demo
const DRIVER_PIN = lngLatToXY(36.283, 33.508);

export function DamascusMap({ activeZone, showDriverPin = true }: DamascusMapProps) {
  return (
    <div className="card overflow-hidden relative">
      {/* Map header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Damascus City Map
        </p>
        <p className="text-xs text-slate-600 font-mono">GPS · Live</p>
      </div>

      <svg
        viewBox="0 0 400 300"
        className="w-full"
        style={{ aspectRatio: "400/300", background: "#111827" }}
        aria-label="Damascus parking zones map"
      >
        {/* Base road network (simplified) */}
        <g stroke="#1f2937" strokeWidth="8" fill="none" opacity="0.8">
          {/* Horizontal main roads */}
          <line x1="0" y1="90" x2="400" y2="90" />
          <line x1="0" y1="150" x2="400" y2="150" />
          <line x1="0" y1="210" x2="400" y2="210" />
          {/* Vertical main roads */}
          <line x1="100" y1="0" x2="100" y2="300" />
          <line x1="200" y1="0" x2="200" y2="300" />
          <line x1="300" y1="0" x2="300" y2="300" />
        </g>
        {/* Secondary roads */}
        <g stroke="#1d2739" strokeWidth="4" fill="none" opacity="0.5">
          <line x1="50" y1="0" x2="50" y2="300" />
          <line x1="150" y1="0" x2="150" y2="300" />
          <line x1="250" y1="0" x2="250" y2="300" />
          <line x1="350" y1="0" x2="350" y2="300" />
          <line x1="0" y1="60" x2="400" y2="60" />
          <line x1="0" y1="120" x2="400" y2="120" />
          <line x1="0" y1="180" x2="400" y2="180" />
          <line x1="0" y1="240" x2="400" y2="240" />
        </g>

        {/* Zone polygons */}
        {ZONE_POLYGONS.map((zone) => {
          const isActive = activeZone?.id === zone.id;
          return (
            <g key={zone.id}>
              <polygon
                points={zone.points}
                fill={isActive ? ACTIVE_FILLS[zone.color] : FILLS[zone.color]}
                stroke={STROKES[zone.color]}
                strokeWidth={isActive ? "2" : "1.5"}
                strokeDasharray={isActive ? "0" : "4 2"}
              />
              {/* Zone label */}
              <text
                x={zone.labelPos[0]}
                y={zone.labelPos[1] - 4}
                textAnchor="middle"
                className="select-none"
                fill={STROKES[zone.color]}
                fontSize="6"
                fontWeight="600"
                fontFamily="Inter, system-ui"
              >
                {zone.label}
              </text>
              <text
                x={zone.labelPos[0]}
                y={zone.labelPos[1] + 7}
                textAnchor="middle"
                className="select-none"
                fill={STROKES[zone.color]}
                fontSize="5"
                fontFamily="system-ui"
                opacity="0.7"
              >
                {zone.labelAr}
              </text>
            </g>
          );
        })}

        {/* Driver location pin */}
        {showDriverPin && (
          <g>
            {/* Pulsing ring */}
            <circle
              cx={DRIVER_PIN[0]}
              cy={DRIVER_PIN[1]}
              r="12"
              fill="rgba(245,158,11,0.08)"
              stroke="rgba(245,158,11,0.3)"
              strokeWidth="1"
            >
              <animate
                attributeName="r"
                values="8;16;8"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0.1;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Dot */}
            <circle
              cx={DRIVER_PIN[0]}
              cy={DRIVER_PIN[1]}
              r="5"
              fill="#f59e0b"
              stroke="white"
              strokeWidth="1.5"
            />
            <text
              x={DRIVER_PIN[0] + 9}
              y={DRIVER_PIN[1] - 6}
              fill="white"
              fontSize="6"
              fontFamily="Inter, system-ui"
              fontWeight="600"
            >
              You
            </text>
          </g>
        )}

        {/* Compass */}
        <g transform="translate(375, 20)">
          <circle cx="0" cy="0" r="10" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700">
            N
          </text>
        </g>

        {/* Scale bar */}
        <g transform="translate(10, 285)">
          <line x1="0" y1="0" x2="40" y2="0" stroke="#475569" strokeWidth="1.5" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#475569" strokeWidth="1.5" />
          <line x1="40" y1="-3" x2="40" y2="3" stroke="#475569" strokeWidth="1.5" />
          <text x="20" y="-4" textAnchor="middle" fill="#475569" fontSize="5">
            ~500m
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="px-4 pb-4 pt-2 flex items-center gap-4 flex-wrap">
        {(["red", "yellow", "green"] as ZoneColor[]).map((c) => (
          <div key={c} className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-sm`}
              style={{ background: STROKES[c] }}
            />
            <span className="text-xs text-slate-500 capitalize">
              {c === "red" ? "Premium" : c === "yellow" ? "Standard" : "Economy"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
