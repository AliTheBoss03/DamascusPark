"use client";
import type { ZoneColor } from "@/types";

interface ZoneBadgeProps {
  color: ZoneColor;
  name: string;
  nameAr?: string;
  showDot?: boolean;
  size?: "sm" | "md";
}

export function ZoneBadge({
  color,
  name,
  nameAr,
  showDot = true,
  size = "md",
}: ZoneBadgeProps) {
  const classes: Record<ZoneColor, string> = {
    red: "zone-badge-red",
    yellow: "zone-badge-yellow",
    green: "zone-badge-green",
  };

  const dotColors: Record<ZoneColor, string> = {
    red: "bg-red-400",
    yellow: "bg-amber-400",
    green: "bg-green-400",
  };

  const label = size === "sm" ? name.split("/")[0].trim() : name;

  return (
    <span className={classes[color]}>
      {showDot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${dotColors[color]}`}
        />
      )}
      {label}
      {nameAr && size === "md" && (
        <span className="opacity-70 font-normal"> · {nameAr}</span>
      )}
    </span>
  );
}
