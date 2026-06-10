"use client";

import { useEffect, useState } from "react";
import { MapPin, Play, Square, RefreshCw, Car, Wifi, Loader2 } from "lucide-react";
import { WalletCard } from "@/components/ui/WalletCard";
import { ZoneBadge } from "@/components/ui/ZoneBadge";
import { SessionTimer } from "@/components/ui/SessionTimer";
import { ScratchCardModal } from "@/components/ui/ScratchCardModal";
import { LiveMap } from "@/components/map/LiveMap";
import { calcHourlyRate, calcSessionCost, formatCredits, getZoneDotColor } from "@/lib/pricing";
import { useLiveLocation } from "@/lib/hooks/useLiveLocation";
import { useI18n } from "@/lib/i18n/context";
import type { ParkingSession, ParkingZone } from "@/types";

interface DriverViewProps {
  userName: string;
  initialBalance: number;
  zones: ParkingZone[];
  initialActiveSession: ParkingSession | null;
  recentSessions: ParkingSession[];
  gasPriceSyp: number;
}

export function DriverView({
  userName,
  initialBalance,
  zones,
  initialActiveSession,
  recentSessions,
  gasPriceSyp,
}: DriverViewProps) {
  const { t } = useI18n();
  const live = useLiveLocation(zones);
  const [balance, setBalance] = useState(initialBalance);
  const [activeSession, setActiveSession] = useState<ParkingSession | null>(initialActiveSession);
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(
    initialActiveSession?.zone ?? zones[0] ?? null
  );
  const [licensePlate, setLicensePlate] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [history, setHistory] = useState<ParkingSession[]>(recentSessions);
  const [busy, setBusy] = useState(false);
  const [isOnline] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  const showNotif = (type: "success" | "error" | "info", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // The zone shown for the live session is the one it was started in.
  const activeZone = activeSession?.zone ?? selectedZone;
  // Bill the active session against ITS snapshot, matching the server's charge.
  const activeGas = activeSession?.gas_price_snapshot ?? gasPriceSyp;

  // Geofence suggestion: when GPS places the driver inside a zone, pre-select
  // it. Keyed on the zone id (not the position) so it only fires on entering a
  // new zone and never overrides a manual pick tick-by-tick. Skipped mid-session.
  const detectedZoneId = live.currentZone?.id ?? null;
  useEffect(() => {
    if (!activeSession && live.currentZone) setSelectedZone(live.currentZone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedZoneId, activeSession]);

  const handleStartSession = async () => {
    if (!selectedZone || !licensePlate.trim() || busy) return;
    const hourlyRate = calcHourlyRate(selectedZone, gasPriceSyp);
    if (balance < hourlyRate) {
      showNotif("error", t("insufficientBalance"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone_id: selectedZone.id, license_plate: licensePlate.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotif("error", data.error ?? t("somethingWrong"));
        return;
      }
      setActiveSession({ ...data.session, zone: selectedZone });
      showNotif("success", `${t("sessionStarted")} ${selectedZone.name_ar}`);
    } catch {
      showNotif("error", t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeSession.id }),
      });
      const data = await res.json();
      if (res.status === 402) {
        showNotif("error", t("insufficientBalance"));
        return;
      }
      if (!res.ok) {
        showNotif("error", data.error ?? t("somethingWrong"));
        return;
      }
      const charged = data.charged_credits ?? 0;
      setBalance((b) => Math.max(0, b - charged));
      const ended: ParkingSession = { ...activeSession, ...data.session, zone: activeZone ?? undefined };
      setHistory((h) => [ended, ...h].slice(0, 5));
      setActiveSession(null);
      showNotif("info", `${t("sessionEnded")} ${formatCredits(charged)} ${t("credits")}.`);
    } catch {
      showNotif("error", t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  };

  const handleRedeem = async (pin: string): Promise<{ credits: number } | { error: string }> => {
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? t("somethingWrong") };
      setBalance((b) => b + data.credits);
      return { credits: data.credits };
    } catch {
      return { error: t("somethingWrong") };
    }
  };

  const currentCost =
    activeSession && activeZone ? calcSessionCost(activeZone, activeGas, activeSession.started_at) : 0;

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
        <div className="flex items-center gap-1.5 text-xs font-medium text-green-400">
          <Wifi className="w-3.5 h-3.5" />
          {t("onlineStatus")}
        </div>
      </div>

      {/* Wallet */}
      <WalletCard balance={balance} gasPriceSyp={gasPriceSyp} userName={userName} onTopUp={() => setShowTopUp(true)} />

      {/* Active session or start form */}
      {activeSession && activeZone ? (
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
                <h3 className="text-lg font-bold text-slate-100 font-mono" dir="ltr">{activeSession.license_plate}</h3>
              </div>
              <ZoneBadge color={activeZone.zone_color} name={activeZone.name} nameAr={activeZone.name_ar} size="sm" />
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
                  {formatCredits(calcHourlyRate(activeZone, activeGas))} {t("credits_abbr")}
                </p>
              </div>
            </div>

            <button onClick={handleEndSession} disabled={busy} className="btn-danger w-full flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
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
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">{t("selectZone")}</label>
            <div className="grid grid-cols-3 gap-2">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`relative p-3 rounded-xl border text-start transition-all duration-150
                    ${selectedZone?.id === zone.id
                      ? zone.zone_color === "red" ? "border-red-500/60 bg-red-500/10"
                        : zone.zone_color === "yellow" ? "border-amber-500/60 bg-amber-500/10"
                        : "border-green-500/60 bg-green-500/10"
                      : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                    }`}
                >
                  {detectedZoneId === zone.id && (
                    <span className="absolute top-1.5 end-1.5 text-[9px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded-full px-1.5 py-0.5">
                      {t("suggested")}
                    </span>
                  )}
                  <span className={`w-2.5 h-2.5 rounded-full block mb-2 ${getZoneDotColor(zone.zone_color)}`} />
                  <p className="text-xs font-semibold text-slate-200 leading-tight">{zone.name_ar}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatCredits(calcHourlyRate(zone, gasPriceSyp))}/{t("credits_abbr")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-800/50 rounded-xl p-3">
            <MapPin className={`w-3.5 h-3.5 shrink-0 ${
              live.status === "granted"
                ? "text-green-500 dark:text-green-400"
                : live.status === "locating"
                ? "text-amber-500 dark:text-amber-400 animate-pulse"
                : "text-slate-500"
            }`} />
            <span className="text-slate-500">
              {live.status === "locating" ? (
                t("locating")
              ) : live.isDefault ? (
                t("locationOff")
              ) : live.currentZone ? (
                <>
                  {t("gpsSuggestZone")}{" "}
                  <span className="text-amber-500 dark:text-amber-400 font-semibold">{live.currentZone.name_ar}</span>
                </>
              ) : (
                <>{t("gpsLive")} · {t("outsideZones")}</>
              )}
            </span>
          </div>

          <button onClick={handleStartSession} disabled={!licensePlate.trim() || !selectedZone || busy} className="btn-primary w-full flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {t("startParking")}
          </button>
        </div>
      )}

      {/* Map */}
      <LiveMap
        center={live.position}
        zones={zones}
        activeZoneId={(activeSession ? activeZone?.id : live.currentZone?.id) ?? null}
        isDefault={live.isDefault}
      />

      {/* Recent sessions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {t("recentSessions")}
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-3">{t("noActiveSession")}</p>
        ) : (
          <div className="space-y-2">
            {history.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  {s.zone && <ZoneBadge color={s.zone.zone_color} name={s.zone.name_ar ?? s.zone.name} size="sm" />}
                  <span className="text-sm font-mono text-slate-300" dir="ltr">{s.license_plate}</span>
                </div>
                <span className="text-sm font-semibold text-amber-400">-{s.total_cost_credits} {t("credits_abbr")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTopUp && <ScratchCardModal onClose={() => setShowTopUp(false)} onRedeem={handleRedeem} />}
    </div>
  );
}
