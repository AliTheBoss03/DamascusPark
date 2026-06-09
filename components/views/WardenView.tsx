"use client";

import { useState } from "react";
import {
  Search, ShieldAlert, CheckCircle2, AlertTriangle,
  Clock, XCircle, Car, FileWarning, Loader2,
} from "lucide-react";
import { ZoneBadge } from "@/components/ui/ZoneBadge";
import { SessionTimer } from "@/components/ui/SessionTimer";
import { formatCredits, calcHourlyRate } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n/context";
import type { Fine, ParkingZone, ParkingSession, PlateCheckResult } from "@/types";
import type { VehicleRecord } from "@/lib/services/syrian-transport-api";

interface WardenViewProps {
  wardenId: string;
  wardenName: string;
  zones: ParkingZone[];
  gasPriceSyp: number;
  initialFines: Fine[];
}

type MoTStatus = "idle" | "loading" | "found" | "not_found" | "error";

interface MoTResult {
  status: MoTStatus;
  record?: VehicleRecord;
  isRegistrationValid?: boolean;
  reason?: string;
}

const STATUS_COLORS: Record<string, string> = {
  valid:    "text-green-400 bg-green-500/10 border-green-500/25",
  expired:  "text-red-400 bg-red-500/10 border-red-500/25",
  suspended:"text-amber-400 bg-amber-500/10 border-amber-500/25",
  stolen:   "text-red-400 bg-red-500/10 border-red-500/25 animate-pulse",
};

const normalizePlate = (p: string) => p.replace(/\s/g, "").toUpperCase();

export function WardenView({ wardenId, wardenName, zones, gasPriceSyp, initialFines }: WardenViewProps) {
  const { t } = useI18n();
  const [plateInput, setPlateInput] = useState("");
  const [checkResult, setCheckResult] = useState<PlateCheckResult | null>(null);
  const [mot, setMot] = useState<MoTResult>({ status: "idle" });
  const [finesIssued, setFinesIssued] = useState<Fine[]>(initialFines);
  const [isChecking, setIsChecking] = useState(false);
  const [issuingFine, setIssuingFine] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Patrol zone = the highest-rate (red) zone by default.
  const currentZone = zones[0] ?? null;

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCheck = async () => {
    if (!plateInput.trim()) return;
    const plate = plateInput.trim();
    setIsChecking(true);
    setMot({ status: "loading" });

    // Live parking-session lookup + Ministry of Transport registry, in parallel.
    const [sessionRes, motResponse] = await Promise.all([
      fetch(`/api/sessions?plate=${encodeURIComponent(plate)}`)
        .then((r) => (r.ok ? r.json() : { sessions: [] }))
        .catch(() => ({ sessions: [] })),
      fetch(`/api/vehicle-lookup?plate=${encodeURIComponent(plate)}&mode=verify`)
        .then((r) => r.json())
        .catch(() => null),
    ]);

    const sessions = (sessionRes.sessions ?? []) as ParkingSession[];
    const active = sessions.find(
      (s) => s.status === "active" && normalizePlate(s.license_plate) === normalizePlate(plate)
    );
    setCheckResult(
      active
        ? { plate, hasActiveSession: true, session: active, zone: active.zone }
        : { plate, hasActiveSession: false }
    );
    setIsChecking(false);

    if (!motResponse) {
      setMot({ status: "error", reason: "تعذّر الاتصال بسجل وزارة النقل" });
    } else if (motResponse.record) {
      setMot({
        status: "found",
        record: motResponse.record,
        isRegistrationValid: motResponse.isValid,
        reason: motResponse.reason,
      });
    } else {
      setMot({ status: "not_found", reason: motResponse.reason });
    }
  };

  const handleIssueFine = async () => {
    if (!checkResult || !currentZone || issuingFine) return;
    setIssuingFine(true);
    try {
      const fineAmount = Math.round(calcHourlyRate(currentZone, gasPriceSyp) * 5);
      const res = await fetch("/api/fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate_number: checkResult.plate,
          zone_id: currentZone.id,
          amount_credits: fineAmount,
          notes: "لا توجد جلسة وقوف نشطة — صادرة من الحارس",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotif(data.error ?? t("somethingWrong"));
        return;
      }
      const fine: Fine = { ...data.fine, zone: currentZone };
      setFinesIssued((prev) => [fine, ...prev]);
      const plate = checkResult.plate;
      setCheckResult(null);
      setMot({ status: "idle" });
      setPlateInput("");
      showNotif(`${formatCredits(fineAmount)} ${t("credits")} ${t("fineIssued")} ${plate}`);
    } catch {
      showNotif(t("somethingWrong"));
    } finally {
      setIssuingFine(false);
    }
  };

  const todayFines = finesIssued.filter((f) => f.warden_id === wardenId);

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
            <p className="text-sm font-bold text-slate-200">{wardenName}</p>
            <p className="text-xs text-slate-500">{t("warden")}</p>
          </div>
        </div>
        {currentZone && <ZoneBadge color={currentZone.zone_color} name={currentZone.name_ar} size="sm" />}
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
            onChange={(e) => { setPlateInput(e.target.value); setCheckResult(null); setMot({ status: "idle" }); }}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder={t("enterPlate")}
            className="input-field font-mono text-center tracking-widest text-base flex-1"
            autoComplete="off"
            dir="ltr"
          />
          <button onClick={handleCheck} disabled={!plateInput.trim() || isChecking} className="btn-primary px-5">
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        <div>
          <p className="text-xs text-slate-600 mb-2">{t("demoPlates")}</p>
          <div className="flex flex-wrap gap-2">
            {["د م 1234", "ر س 9900", "ح ل 4455", "ط ب 0000"].map((p) => (
              <button
                key={p}
                onClick={() => { setPlateInput(p); setCheckResult(null); setMot({ status: "idle" }); }}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
                dir="ltr"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MoT Vehicle Registry Card */}
      {mot.status !== "idle" && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Car className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                وزارة النقل — سجل المركبات
              </p>
              <p className="text-xs text-slate-600">Syrian Ministry of Transport Registry v2</p>
            </div>
            {mot.status === "loading" && (
              <Loader2 className="w-4 h-4 text-slate-500 animate-spin ms-auto" />
            )}
          </div>

          {mot.status === "loading" && (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              جارٍ الاستعلام من قاعدة بيانات الوزارة…
            </div>
          )}

          {mot.status === "error" && (
            <p className="text-sm text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {mot.reason}
            </p>
          )}

          {mot.status === "not_found" && (
            <p className="text-sm text-red-400 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              {mot.reason}
            </p>
          )}

          {mot.status === "found" && mot.record && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "المالك", value: mot.record.ownerName },
                  { label: "المركبة", value: `${mot.record.vehicleMake} ${mot.record.vehicleModel} ${mot.record.vehicleYear}` },
                  { label: "اللون", value: mot.record.vehicleColor },
                  { label: "التأمين", value: mot.record.insuranceStatus === "active" ? "ساري" : "منتهي" },
                ].map(({ label, value }) => (
                  <div key={label} className="card-elevated p-2.5">
                    <p className="text-xs text-slate-600 mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-slate-200">{value}</p>
                  </div>
                ))}
              </div>

              {/* Registration status */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold ${
                STATUS_COLORS[mot.record.registrationStatus] ?? "text-slate-400"
              }`}>
                <span>تسجيل المركبة</span>
                <span>
                  {mot.record.registrationStatus === "valid" ? "✓ صالح حتى " + mot.record.registrationExpiry
                    : mot.record.registrationStatus === "expired" ? "✗ منتهي منذ " + mot.record.registrationExpiry
                    : mot.record.registrationStatus === "stolen" ? "⚠ مسروقة — أبلغ الشرطة فوراً"
                    : "موقوف"}
                </span>
              </div>

              {mot.record.outstandingFines > 0 && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                  <FileWarning className="w-3.5 h-3.5 shrink-0" />
                  {mot.record.outstandingFines} نقطة مخالفة معلّقة على هذه المركبة
                </div>
              )}

              {mot.reason && !mot.isRegistrationValid && (
                <p className="text-xs text-amber-400">{mot.reason}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Parking session result */}
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
              <button onClick={handleIssueFine} disabled={issuingFine || !currentZone} className="btn-danger w-full flex items-center justify-center gap-2">
                {issuingFine
                  ? <Loader2 className="w-4 h-4 animate-spin" />
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
                  <span className="text-sm font-bold text-red-400">{formatCredits(fine.amount_credits)} {t("credits_abbr")}</span>
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
