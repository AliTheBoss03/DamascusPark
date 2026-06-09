/**
 * Syrian Ministry of Transport – Vehicle Registry API Client (Mock)
 *
 * Simulates secure HTTPS calls to the MoT digital vehicle registry
 * launched as part of Syria's 2025 "Digital Syria" initiative.
 * In production this module is swapped for the real MoT REST client
 * with mTLS certificates issued by the Ministry PKI.
 */

export type PlateFormat = "syrian_standard" | "diplomatic" | "military" | "unknown";

export interface VehicleRecord {
  plate: string;
  plateFormat: PlateFormat;
  ownerName: string;
  ownerNationalId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  registrationStatus: "valid" | "expired" | "suspended" | "stolen";
  registrationExpiry: string;
  insuranceStatus: "active" | "expired" | "none";
  outstandingFines: number;
  lastUpdated: string;
}

export interface MoTApiResponse<T> {
  success: boolean;
  requestId: string;
  timestamp: string;
  source: "mot_damascus_registry_v2";
  data?: T;
  error?: { code: string; message: string };
}

// Simulated registry entries keyed by normalised plate
const MOCK_REGISTRY: Record<string, Omit<VehicleRecord, "plate">> = {
  "دم1234": {
    plateFormat: "syrian_standard",
    ownerName: "أحمد المصري",
    ownerNationalId: "01-***-****-7",
    vehicleMake: "كيا",
    vehicleModel: "سيراتو",
    vehicleYear: 2019,
    vehicleColor: "فضي",
    registrationStatus: "valid",
    registrationExpiry: "2026-09-30",
    insuranceStatus: "active",
    outstandingFines: 0,
    lastUpdated: new Date().toISOString(),
  },
  "رس9900": {
    plateFormat: "syrian_standard",
    ownerName: "ليلى حسن",
    ownerNationalId: "01-***-****-3",
    vehicleMake: "هيونداي",
    vehicleModel: "توسان",
    vehicleYear: 2021,
    vehicleColor: "أبيض",
    registrationStatus: "valid",
    registrationExpiry: "2026-12-15",
    insuranceStatus: "active",
    outstandingFines: 0,
    lastUpdated: new Date().toISOString(),
  },
  "حل4455": {
    plateFormat: "syrian_standard",
    ownerName: "محمد الزعيم",
    ownerNationalId: "01-***-****-9",
    vehicleMake: "شيفروليه",
    vehicleModel: "أوبتيرا",
    vehicleYear: 2015,
    vehicleColor: "أسود",
    registrationStatus: "expired",
    registrationExpiry: "2024-06-30",
    insuranceStatus: "expired",
    outstandingFines: 50,
    lastUpdated: new Date().toISOString(),
  },
};

/** Normalise Syrian plate for registry lookup (strip spaces, collapse) */
function normalisePlate(plate: string): string {
  return plate.replace(/\s+/g, "").replace(/[a-zA-Z]/g, "").trim();
}

/** Artificial network latency: 300–900 ms simulating MoT API round-trip */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomLatency(): number {
  return 300 + Math.random() * 600;
}

function generateRequestId(): string {
  return `MOT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * Look up a vehicle by plate number against the Syrian MoT registry.
 * Simulates mTLS-authenticated call with realistic latency.
 */
export async function lookupVehicle(
  plate: string
): Promise<MoTApiResponse<VehicleRecord>> {
  await delay(randomLatency());

  const normalised = normalisePlate(plate);
  const record = MOCK_REGISTRY[normalised];

  if (!record) {
    // ~10% chance of a transient MoT server error for realism
    if (Math.random() < 0.1) {
      return {
        success: false,
        requestId: generateRequestId(),
        timestamp: new Date().toISOString(),
        source: "mot_damascus_registry_v2",
        error: { code: "MOT_503", message: "سجل الوزارة مؤقتاً غير متاح. حاول مرة أخرى." },
      };
    }

    return {
      success: false,
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      source: "mot_damascus_registry_v2",
      error: { code: "MOT_404", message: "اللوحة غير مسجلة في قاعدة بيانات وزارة النقل." },
    };
  }

  return {
    success: true,
    requestId: generateRequestId(),
    timestamp: new Date().toISOString(),
    source: "mot_damascus_registry_v2",
    data: { plate, ...record },
  };
}

/**
 * Verify that a vehicle's registration is currently valid.
 * Used by wardens before issuing a fine.
 */
export async function verifyRegistration(
  plate: string
): Promise<{ isValid: boolean; reason?: string; record?: VehicleRecord }> {
  const response = await lookupVehicle(plate);

  if (!response.success || !response.data) {
    return { isValid: false, reason: response.error?.message ?? "تعذّر التحقق من التسجيل" };
  }

  const { data } = response;

  if (data.registrationStatus === "stolen") {
    return { isValid: false, reason: "تحذير: المركبة مبلّغ عن سرقتها", record: data };
  }
  if (data.registrationStatus === "suspended") {
    return { isValid: false, reason: "التسجيل موقوف", record: data };
  }
  if (data.registrationStatus === "expired") {
    return { isValid: false, reason: `التسجيل منتهي منذ ${data.registrationExpiry}`, record: data };
  }

  return { isValid: true, record: data };
}
