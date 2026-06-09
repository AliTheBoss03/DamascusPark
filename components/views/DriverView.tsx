"use client";

import { useState, useEffect } from "react";
import { MapPin, Play, Square, RefreshCw, Car, Wifi, WifiOff } from "lucide-react";
import { WalletCard } from "@/components/ui/WalletCard";
import { ZoneBadge } from "@/components/ui/ZoneBadge";
import { SessionTimer } from "@/components/ui/SessionTimer";
import { ScratchCardModal } from "@/components/ui/ScratchCardModal";
import { DamascusMap } from "@/components/DamascusMap";
import { calcHourlyRate, calcSessionCost, formatCredits, getZoneDotColor } from "@/lib/pricing";
import { MOCK_USERS, MOCK_ZONES, MOCK_SESSIONS, MOCK_SCRATCH_CARDS } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/context";
import type { ParkingSession, ScratchCard } from "@/types";

const DRIVER = MOCK_USERS[0];
const GAS_PRICE = 5000;

export function DriverView() {
  const { t } = useI18n();
  const [balance, setBalance] = useState(DRIVER.wallet_balance);
  const [activeSession, setActiveSession] = useState<ParkingSession | null>(MOCK_SESSIONS[0]);
  const [selectedZone, setSelectedZone] = useState(MOCK_ZONES[0]);
  const [licensePlate, setLicensePlate] = useState("د م 1234");
  const [showTopUp, setShowTopUp] = useState(false);
  const [isOnline] = useState(true);
  const [scratchCards, setScratchCards] = useState<ScratchCard[]>(MOCK_SCRATCH_CARDS);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  const showNotif = (type: "success" | "error" | "info", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleStartSession = () => {
    const hourlyRate = calcHourlyRate(selectedZone, GAS_PRICE);
    if (balance < hourlyRate) {
      showNotif("error", t("insufficientBalance"));
      return;
    }
    const session: ParkingSession = {
      id: `session-new-${Date.now()}`,
      user_id: DRIVER.id,
      zone_id: selectedZone.id,
      zone: selectedZone,
      license_plate: licensePlate,
      started_at: new Date().toISOString(),
      ended_at: null,
      total_cost_credits: null,
      status: "active",
    };
    setActiveSession(session);
    localStorage.setItem("mawqif_active_session", JSON.stringify(session));
    showNotif("success", `${t("sessionStarted")} ${selectedZone.name_ar}`);
  };

  const handleEndSession = () => {
    if (!activeSession) return;
    const cost = calcSessionCost(selectedZone, GAS_PRICE, activeSession.started_at);
    const charged = Math.ceil(cost);
    setBalance((b) => Math.max(0, b - charged));
    setActiveSession(null);
    localStorage.removeItem("mawqif_active_session");
    showNotif("info", `${t("sessionEnded")} ${formatCredits(charged)} ${t("credits")}.`);
  };

  const handleRedeem = async (pin: string): Promise<{ credits: number } | { error: string }> => {
    const card = scratchCards.find((c) => c.pin.toUpperCase() === pin && !c.is_used);
    if (!card) {
      const used = scratchCards.find((c) => c.pin.toUpperCase() === pin);
      return { error: used ? "هذه القسيمة مستخدمة بالفعل." : "رمز غير صحيح. يرجى المحاولة مجدداً." };
    }
    setScratchCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, is_used: true } : c)));
    setBalance((b) => b + card.credit_value);
    return { credits: card.credit_value };
  };

  const currentCost = activeSession ? calcSessionCost(selectedZone, GAS_PRICE, activeSession.started_at) : 0;
  const hourlyRate = calcHourlyRate(selectedZone, GAS_PRICE);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Notification */}
      {notification && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium animate-fade-in
          ${notification.type === "success" ? "bg-green-500/15 text-green-400 border border-green-500/25"
          : notification.type === "error" ? "bg-red-500/15 text-red-400 border border-red-500/25"
          : "bg-blue-500/15 text-blue-400 border border-blue-500/25"}`}>
          {notification.msg}
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-400">{t("myDashboard")}</h2>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${isOnline ? "text-green-400" : "text-amber-400"}`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isOnline ? t("onlineStatus") : t("offlineStatus")}
        </div>
      </div>

      {/* Wallet */}
      <WalletCard balance={balance} gasPriceSyp={GAS_PRICE} userName={DRIVER.name} onTopUp={() => setShowTopUp(true)} />

      {/* Active session or start form */}
      {activeSession ? (
        <div className="card p-5 border-amber-500/20 bg-amber-950/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                    {t("activeSession")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 font-mono">{activeSession.license_plate}</h3>
              </div>
              <ZoneBadge color={selectedZone.zone_color} name={selectedZone.name} nameAr={selectedZone.name_ar} size="sm" />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card-elevated p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{t("duration")}</p>
                <SessionTimer startedAt={activeSession.started_at} className="text-sm text-slate-200 font-semibold" />
              </div>
              <div className="card-elevated p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{t("currentCost")}</p>
                <p className="text-sm font-bold text-amber-400 tabular-nums">
                  {formatCredits(currentCost)} {t("credits_abbr")}
                </p>
              </div>
              <div className="card-elevated p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{t("ratePerHour")}</p>
                <p className="text-sm font-semibold text-slate-300 tabular-nums">
                  {formatCredits(hourlyRate)} {t("credits_abbr")}
                </p>
              </div>
            </div>

            <button onClick={handleEndSession} className="btn-danger w-full flex items-center justify-center gap-2">
              <Square className="w-4 h-4" />
              {t("endParking")}
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Car className="w-4 h-4 text-amber-400" />
            {t("startParking")}
          </h3>

          <div>
            <label className="block text-xs text-slate-400 mb-2">{t("licensePlate")}</label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="input-field font-mono text-center text-base tracking-widest"
              placeholder={t("platePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">{t("selectZone")}</label>
            <div className="grid grid-cols-3 gap-2">
              {MOCK_ZONES.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`p-3 rounded-xl border text-start transition-all duration-150
                    ${selectedZone.id === zone.id
                      ? zone.zone_color === "red" ? "border-red-500/60 bg-red-500/10"
                        : zone.zone_color === "yellow" ? "border-amber-500/60 bg-amber-500/10"
                        : "border-green-500/60 bg-green-500/10"
                      : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                    }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full block mb-2 ${getZoneDotColor(zone.zone_color)}`} />
                  <p className="text-xs font-semibold text-slate-200 leading-tight">{zone.name_ar}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatCredits(calcHourlyRate(zone, GAS_PRICE))}/{t("credits_abbr")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-xl p-3">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {t("gpsDetected")}{" "}
              <span className="text-slate-300">{selectedZone.name_ar}</span>
              {" · "}
              <span className="text-amber-400">{formatCredits(hourlyRate)} {t("credits")}/{t("credits_abbr")}</span>
            </span>
          </div>

          <button onClick={handleStartSession} disabled={!licensePlate.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            {t("startParking")}
          </button>
        </div>
      )}

      {/* Map */}
      <DamascusMap activeZone={activeSession ? selectedZone : null} showDriverPin />

      {/* Recent sessions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {t("recentSessions")}
        </h3>
        <div className="space-y-2">
          {MOCK_SESSIONS.filter((s) => s.status === "completed").map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
              <div className="flex items-center gap-2">
                {s.zone && <ZoneBadge color={s.zone.zone_color} name={s.zone.name_ar ?? s.zone.name} size="sm" />}
                <span className="text-sm font-mono text-slate-300">{s.license_plate}</span>
              </div>
              <span className="text-sm font-semibold text-amber-400">-{s.total_cost_credits} {t("credits_abbr")}</span>
            </div>
          ))}
        </div>
      </div>

      {showTopUp && <ScratchCardModal onClose={() => setShowTopUp(false)} onRedeem={handleRedeem} />}
    </div>
  );
}
