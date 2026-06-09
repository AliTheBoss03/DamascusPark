import type { ParkingZone } from "@/types";

/**
 * Dynamic pricing pegged to the Gasoline Price Index.
 * Formula: hourly_rate_credits = (gas_price_syp / 1000) * zone.hourly_rate_peg_ratio
 *
 * This insulates the system from SYP inflation — when gas prices rise,
 * parking rates rise proportionally without any manual intervention.
 */
export function calcHourlyRate(
  zone: ParkingZone,
  gasPriceSyp: number
): number {
  return (gasPriceSyp / 1000) * zone.hourly_rate_peg_ratio;
}

/**
 * Calculate the cost of a session in progress.
 * Returns credits (can be fractional during live session).
 */
export function calcSessionCost(
  zone: ParkingZone,
  gasPriceSyp: number,
  startedAt: string,
  endedAt?: string | null
): number {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const hours = (end - start) / (1000 * 60 * 60);
  const rate = calcHourlyRate(zone, gasPriceSyp);
  return Math.round(hours * rate * 100) / 100;
}

/**
 * Split collected credits between government (60%) and platform (40%).
 */
export function splitRevenue(totalCredits: number, govPct = 60) {
  const govShare = Math.floor((totalCredits * govPct) / 100);
  return {
    government: govShare,
    platform: totalCredits - govShare,
  };
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

/** Convert credits to SYP for display. Fixed peg: 1 credit = 1000 SYP. */
export function creditsToSyp(credits: number): number {
  return credits * 1000;
}

export function getZoneColorClass(color: string): string {
  switch (color) {
    case "red":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "yellow":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "green":
      return "text-green-400 bg-green-500/10 border-green-500/30";
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  }
}

export function getZoneDotColor(color: string): string {
  switch (color) {
    case "red":
      return "bg-red-500";
    case "yellow":
      return "bg-amber-500";
    case "green":
      return "bg-green-500";
    default:
      return "bg-slate-500";
  }
}
