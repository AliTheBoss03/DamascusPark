export type UserRole = "driver" | "warden" | "admin";
export type ZoneColor = "red" | "yellow" | "green";
export type SessionStatus = "active" | "completed" | "expired";
export type FineStatus = "unpaid" | "paid";

export interface User {
  id: string;
  role: UserRole;
  phone_number: string;
  name: string;
  wallet_balance: number; // in credits (1 credit = 1000 SYP)
  created_at: string;
}

export interface ParkingZone {
  id: string;
  name: string;
  name_ar: string;
  zone_color: ZoneColor;
  description: string;
  hourly_rate_peg_ratio: number;
  coordinates: GeoJSONPolygon;
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface ParkingSession {
  id: string;
  user_id: string;
  zone_id: string;
  zone?: ParkingZone;
  license_plate: string;
  started_at: string;
  ended_at: string | null;
  total_cost_credits: number | null;
  status: SessionStatus;
}

export interface Fine {
  id: string;
  session_id: string | null;
  plate_number: string;
  warden_id: string;
  warden?: User;
  zone_id: string;
  zone?: ParkingZone;
  amount_credits: number;
  status: FineStatus;
  issued_at: string;
  notes?: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface PlateCheckResult {
  plate: string;
  hasActiveSession: boolean;
  session?: ParkingSession;
  zone?: ParkingZone;
  driverName?: string;
}

export interface RevenueStats {
  totalCreditsCollected: number;
  activeSessions: number;
  totalFinesIssued: number;
  governmentShare: number; // 60%
  platformShare: number;   // 40%
  byZone: {
    zone: ParkingZone;
    credits: number;
    sessions: number;
  }[];
}

export interface ScratchCard {
  id: string;
  pin: string;
  credit_value: number;
  is_used: boolean;
}
