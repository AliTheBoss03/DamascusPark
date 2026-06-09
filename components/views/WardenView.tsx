"use client";

import { useState } from "react";
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, Clock, XCircle } from "lucide-react";
import { ZoneBadge } from "@/components/ui/ZoneBadge";
import { SessionTimer } from "@/components/ui/SessionTimer";
import { formatCredits, calcHourlyRate } from "@/lib/pricing";
import { MOCK_SESSIONS, MOCK_FINES, MOCK_USERS, MOCK_ZONES } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/context";
import type { Fine, PlateCheckResult } from "@/types";

const WARDEN = MOCK_USERS[2];
const GAS_PRICE = 5000;

function checkPlate(plate: string): PlateCheckResult {
  const normalized = plate.trim().toUpperCase();
  const session = MOCK_SESSIONS.find(
    (s) => s.status === "active" && s.license_plate.toUpperCase().replace(/\s/g, "") === normalized.replace(/\s/g, "")
  );
  if (session) {
    const zone = MOCK_ZONES.find((z) => z.id === session.zone_id);
    const driver = MOCK_USERS.find((u) => u.id === session.user_id);
    return { plate: plate.trim(), hasActiveSession: true, session, zone, driverName: driver?.name };
  }
  return { plate: plate.trim(), hasActiveSession: false };
}

export function WardenView() {
  const { t } = useI18n();
  const [plateInput, setPlateInput] = useState("");
  const [checkResult, setCheckResult] = useState<PlateCheckResult | null>(null);
  const [finesIssued, setFinesIssued] = useState<Fine[]>(MOCK_FINES);
  const [isChecking, setIsChecking] = useState(false);
  const [issuingFine, setIssuingFine] = useState(false);
  const [currentZone] = useState(MOCK_ZONES[0]);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCheck = () => {
    if (!plateInput.trim()) return;
    setIsChecking(true);
    setTimeout(() => {
      setCheckResult(checkPlate(plateInput));
      setIsChecking(false);
    }, 600);
  };

  const handleIssueFine = () => {
    if (!checkResult) return;
    setIssuingFine(true);
    setTimeout(() => {
      const hourlyRate = calcHourlyRate(currentZone, GAS_PRICE);
      const fineAmount = Math.round(hourlyRate * 5);
      const fine: Fine = {
        id: `fine-new-${Date.now()}`,
        session_id: null,
        plate_number: checkResult.plate,
        warden_id: WARDEN.id,
        zone_id: currentZone.id,
        zone: currentZone,
        amount_credits: fineAmount,
        status: "unpaid",
        issued_at: new Date().toISOString(),
        notes: "لا توجد جلسة وقوف نشطة — صادرة من الحارس",
      };
      setFinesIssued((prev) => [fine, ...prev]);
      setCheckResult(null);
      setPlateInput("");
      setIssuingFine(false);
      showNotif(`${formatCredits(fineAmount)} ${t("credits")} ${t("fineIssued")} ${checkResult.plate}`);
    }, 800);
  };

  const todayFines = finesIssued.filter((f) => f.warden_id === WARDEN.id || f.id.startsWith("fine-new"));

  return (
    <div className="space-y-4 animate-fade-in">
      {notification && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium animate-fade-in bg-amber-500/15 text-amber-400 border border-amber-500/25">
          {notification}
        </div>
      )}

      {/* Warden identity card */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200">{WARDEN.name}</p>
            <p className="text-xs text-slate-500">{WARDEN.phone_number}</p>
          </div>
        </div>
        <ZoneBadge color={currentZone.zone_color} name={currentZone.name_ar} size="sm" />
      </div>

      {/* Plate scanner */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-400" />
          {t("plateLookup")}
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={plateInput}
            onChange={(e) => { setPlateInput(e.target.value); setCheckResult(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder={t("enterPlate")}
            className="input-field font-mono text-center tracking-widest text-base flex-1"
            autoComplete="off"
            dir="ltr"
          />
          <button onClick={handleCheck} disabled={!plateInput.trim() || isChecking} className="btn-primary px-5">
            {isChecking
              ? <span className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin inline-block" />
              : <Search className="w-4 h-4" />
            }
          </button>
        </div>

        <div>
          <p className="text-xs text-slate-600 mb-2">{t("demoPlates")}</p>
          <div className="flex flex-wrap gap-2">
            {["د م 1234", "ر س 9900", "ح ل 4455", "ط ب 0000"].map((p) => (
              <button
                key={p}
                onClick={() => { setPlateInput(p); setCheckResult(null); }}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono
                           text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
                dir="ltr"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Check result */}
      {checkResult && (
        <div className={`card p-5 animate-fade-in ${
          checkResult.hasActiveSession ? "border-green-500/25 bg-green-950/10" : "border-red-500/25 bg-red-950/10"
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {checkResult.hasActiveSession
                ? <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                : <XCircle className="w-6 h-6 text-red-400 shrink-0" />
              }
              <div>
                <p className={`font-bold text-base ${checkResult.hasActiveSession ? "text-green-400" : "text-red-400"}`}>
                  {checkResult.hasActiveSession ? t("validSessionLabel") : t("invalidSessionLabel")}
                </p>
                <p className="text-xs text-slate-500 font-mono" dir="ltr">{checkResult.plate}</p>
              </div>
            </div>
            {checkResult.zone && (
              <ZoneBadge color={checkResult.zone.zone_color} name={checkResult.zone.name_ar} size="sm" />
            )}
          </div>

          {checkResult.hasActiveSession && checkResult.session ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="card-elevated p-3">
                <p className="text-xs text-slate-500 mb-1">{t("driverLabel")}</p>
                <p className="text-sm text-slate-200 font-medium">{checkResult.driverName ?? "—"}</p>
              </div>
              <div className="card-elevated p-3">
                <p className="text-xs text-slate-500 mb-1">{t("parkedFor")}</p>
                <SessionTimer startedAt={checkResult.session.started_at} className="text-sm text-slate-200 font-semibold" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-slate-400">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                {t("noCompliance")}
              </div>
              <button onClick={handleIssueFine} disabled={issuingFine} className="btn-danger w-full flex items-center justify-center gap-2">
                {issuingFine
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <ShieldAlert className="w-4 h-4" />
                }
                {issuingFine ? t("issuingFine") : t("issueFine")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Today's fines */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t("finesIssuedToday")}
          </h3>
          <span className="text-xs font-bold text-slate-300 bg-slate-700 px-2 py-0.5 rounded-full">
            {todayFines.length}
          </span>
        </div>

        {todayFines.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">{t("noFinesYet")}</p>
        ) : (
          <div className="space-y-2">
            {todayFines.slice(0, 6).map((fine) => (
              <div key={fine.id} className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  {fine.zone && <ZoneBadge color={fine.zone.zone_color} name={fine.zone.name_ar ?? fine.zone.name} size="sm" />}
                  <span className="text-sm font-mono text-slate-300" dir="ltr">{fine.plate_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-400">
                    {formatCredits(fine.amount_credits)} {t("credits_abbr")}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    fine.status === "paid" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                  }`}>
                    {fine.status === "paid" ? t("paid") : t("unpaid")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
