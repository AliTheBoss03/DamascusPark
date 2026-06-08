import type {
  User,
  ParkingZone,
  ParkingSession,
  Fine,
  SystemSetting,
  ScratchCard,
} from "@/types";

export const MOCK_SETTINGS: SystemSetting[] = [
  {
    key: "gas_price_per_liter_syp",
    value: "5000",
    updated_at: new Date().toISOString(),
  },
  {
    key: "revenue_split_government_pct",
    value: "60",
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_ZONES: ParkingZone[] = [
  {
    id: "zone-red-shaalan",
    name: "Shaalan / Malki",
    name_ar: "شعلان / المالكي",
    zone_color: "red",
    description: "Premium central district – high footfall commercial area",
    hourly_rate_peg_ratio: 3.0,
    coordinates: {
      type: "Polygon",
      coordinates: [
        [
          [36.278, 33.512],
          [36.292, 33.512],
          [36.292, 33.504],
          [36.278, 33.504],
          [36.278, 33.512],
        ],
      ],
    },
  },
  {
    id: "zone-yellow-mezzeh",
    name: "Mezzeh / Abu Roumaneh",
    name_ar: "المزة / أبو رمانة",
    zone_color: "yellow",
    description: "Standard zone – diplomatic quarter & residential mix",
    hourly_rate_peg_ratio: 2.0,
    coordinates: {
      type: "Polygon",
      coordinates: [
        [
          [36.258, 33.505],
          [36.275, 33.505],
          [36.275, 33.494],
          [36.258, 33.494],
          [36.258, 33.505],
        ],
      ],
    },
  },
  {
    id: "zone-green-kafarsouseh",
    name: "Kafarsouseh / Qassaa",
    name_ar: "كفرسوسة / القصاع",
    zone_color: "green",
    description: "Economy zone – outer districts with lower demand",
    hourly_rate_peg_ratio: 1.0,
    coordinates: {
      type: "Polygon",
      coordinates: [
        [
          [36.295, 33.500],
          [36.310, 33.500],
          [36.310, 33.490],
          [36.295, 33.490],
          [36.295, 33.500],
        ],
      ],
    },
  },
];

export const MOCK_USERS: User[] = [
  {
    id: "user-driver-1",
    role: "driver",
    name: "Ahmad Al-Masri",
    phone_number: "+963-912-345-678",
    wallet_balance: 120,
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    id: "user-driver-2",
    role: "driver",
    name: "Layla Hassan",
    phone_number: "+963-933-112-233",
    wallet_balance: 45,
    created_at: "2024-02-15T09:30:00Z",
  },
  {
    id: "user-warden-1",
    role: "warden",
    name: "Khaled Barakat",
    phone_number: "+963-944-567-890",
    wallet_balance: 0,
    created_at: "2024-01-05T07:00:00Z",
  },
  {
    id: "user-warden-2",
    role: "warden",
    name: "Nour Al-Din",
    phone_number: "+963-955-678-901",
    wallet_balance: 0,
    created_at: "2024-01-05T07:00:00Z",
  },
  {
    id: "user-admin-1",
    role: "admin",
    name: "Damascus Municipality",
    phone_number: "+963-11-3330-000",
    wallet_balance: 0,
    created_at: "2024-01-01T00:00:00Z",
  },
];

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 65 * 60 * 1000);
const twoHoursAgo = new Date(now.getTime() - 130 * 60 * 1000);

export const MOCK_SESSIONS: ParkingSession[] = [
  {
    id: "session-1",
    user_id: "user-driver-1",
    zone_id: "zone-red-shaalan",
    zone: MOCK_ZONES[0],
    license_plate: "د م 1234",
    started_at: oneHourAgo.toISOString(),
    ended_at: null,
    total_cost_credits: null,
    status: "active",
  },
  {
    id: "session-2",
    user_id: "user-driver-2",
    zone_id: "zone-yellow-mezzeh",
    zone: MOCK_ZONES[1],
    license_plate: "د م 5678",
    started_at: twoHoursAgo.toISOString(),
    ended_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    total_cost_credits: 20,
    status: "completed",
  },
  {
    id: "session-3",
    user_id: "user-driver-1",
    zone_id: "zone-green-kafarsouseh",
    zone: MOCK_ZONES[2],
    license_plate: "ر س 9900",
    started_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    ended_at: null,
    total_cost_credits: null,
    status: "active",
  },
];

export const MOCK_FINES: Fine[] = [
  {
    id: "fine-1",
    session_id: null,
    plate_number: "ح ل 4455",
    warden_id: "user-warden-1",
    zone_id: "zone-red-shaalan",
    zone: MOCK_ZONES[0],
    amount_credits: 50,
    status: "unpaid",
    issued_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    notes: "No active session found",
  },
  {
    id: "fine-2",
    session_id: null,
    plate_number: "ط ب 7722",
    warden_id: "user-warden-2",
    zone_id: "zone-yellow-mezzeh",
    zone: MOCK_ZONES[1],
    amount_credits: 30,
    status: "paid",
    issued_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    notes: "Session expired, overstay",
  },
];

// Pre-loaded scratch card PINs for the demo
export const MOCK_SCRATCH_CARDS: ScratchCard[] = [
  { id: "sc-1", pin: "1234-5678-ABCD", credit_value: 100, is_used: false },
  { id: "sc-2", pin: "9876-EFGH-2222", credit_value: 50, is_used: false },
  { id: "sc-3", pin: "MAWQ-IFSY-2025", credit_value: 200, is_used: false },
  { id: "sc-4", pin: "DEMO-FREE-PARK", credit_value: 75, is_used: false },
];
