"use client";

import { useState } from "react";
import { TrendingUp, Car, ShieldAlert, Building2, Cpu, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { ZoneBadge } from "@/components/ui/ZoneBadge";
import { calcHourlyRate, splitRevenue, formatCredits } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n/context";
import type { ParkingZone, ParkingSession, Fine } from "@/types";

interface AdminViewProps {
  zones: ParkingZone[];
  sessions: ParkingSession[];
  fines: Fine[];
  initialGasPrice: number;
  govPct: number;
}

export function AdminView({ zones, sessions, fines, initialGasPrice, govPct }: AdminViewProps) {
  const { t } = useI18n();
  const [gasPriceSyp, setGasPriceSyp] = useState(initialGasPrice);
  const [gasInput, setGasInput] = useState(String(initialGasPrice));
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const activeSessions = sessions.filter((s) => s.status === "active");
  const sessionRevenue = sessions
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + (s.total_cost_credits ?? 0), 0);
  const fineRevenue = fines
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + f.amount_credits, 0);
  const totalRevenue = sessionRevenue + fineRevenue;
  const { government: govShare, platform: platShare } = splitRevenue(totalRevenue, govPct);
  const unpaidFines = fines.filter((f) => f.status === "unpaid").length;

  const handleSaveGasPrice = async () => {
    const value = parseInt(gasInput.replace(/[^0-9]/g, ""));
    if (isNaN(value) || value < 100 || value > 100_000) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "gas_price_per_liter_syp", value: String(value) }),
      });
      if (!res.ok) {
        setSaveStatus("error");
        return;
      }
      setGasPriceSyp(value);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const zoneStats = zones.map((zone) => {
    const zoneSessions = sessions.filter((s) => s.zone_id === zone.id);
    const zoneActive = zoneSessions.filter((s) => s.status === "active").length;
    const zoneRevenue = zoneSessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + (s.total_cost_credits ?? 0), 0);
    const rate = calcHourlyRate(zone, gasPriceSyp);
    return { zone, active: zoneActive, revenue: zoneRevenue, rate };
  });

  const maxZoneRevenue = Math.max(...zoneStats.map((z) => z.revenue), 1);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">{t("totalRevenue")}</p>
          <p className="text-2xl font-bold tabular-nums text-amber-400">
            {formatCredits(totalRevenue)}
            <span className="text-sm font-normal text-amber-500/70 ms-1">{t("credits_abbr")}</span>
          </p>
          <p className="text-xs text-slate-600">≈ {(totalRevenue * 1000).toLocaleString()} ل.س</p>
        </div>

        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">{t("liveSessions")}</p>
          <p className="text-2xl font-bold tabular-nums text-green-400">
            {activeSessions.length}
            <span className="text-sm font-normal text-green-500/70 ms-1">{t("cars")}</span>
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-600">{t("activeLabel")}</span>
          </div>
        </div>

        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">{t("govShare")}</p>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-xl font-bold tabular-nums text-blue-400">{formatCredits(govShare)} {t("credits_abbr")}</p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${govPct}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">{t("platformShare")}</p>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
            <p className="text-xl font-bold tabular-nums text-purple-400">{formatCredits(platShare)} {t("credits_abbr")}</p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-purple-500" style={{ width: `${100 - govPct}%` }} />
          </div>
        </div>
      </div>

      {/* Unpaid fines alert */}
      {unpaidFines > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">
            <span className="font-bold">{unpaidFines}</span>{" "}
            {unpaidFines > 1 ? t("unpaidFinesPlural") : t("unpaidFines")}
          </p>
        </div>
      )}

      {/* Zone breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" />
          {t("revenueByZone")}
        </h3>
        <div className="space-y-3">
          {zoneStats.map(({ zone, active, revenue, rate }) => (
            <div key={zone.id} className="flex items-center gap-3 py-3 border-b border-slate-700/50 last:border-0">
              <ZoneBadge color={zone.zone_color} name={zone.name_ar} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">
                    {active} {t("activeLabel")} · {formatCredits(rate)} {t("credits_abbr")}/hr
                  </span>
                  <span className="text-sm font-bold text-slate-200 tabular-nums">
                    {formatCredits(revenue)} {t("credits_abbr")}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      zone.zone_color === "red" ? "bg-red-500" : zone.zone_color === "yellow" ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: Math.max(5, (revenue / maxZoneRevenue) * 100) + "%" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live sessions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-3">
          <Car className="w-4 h-4" />
          {t("liveParkedVehicles")}
        </h3>
        {activeSessions.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">{t("noActiveSessions")}</p>
        ) : (
          <div className="space-y-2">
            {activeSessions.map((s) => {
              const zone = s.zone ?? zones.find((z) => z.id === s.zone_id);
              return (
                <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-mono text-slate-200" dir="ltr">{s.license_plate}</span>
                    {zone && <ZoneBadge color={zone.zone_color} name={zone.name_ar} size="sm" />}
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {new Date(s.started_at).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inflation control panel */}
      <div className="card p-5 border-amber-500/15">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">{t("inflationControl")}</h3>
            <p className="text-xs text-slate-500">{t("inflationDesc")}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 mb-4 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            {t("effectiveRates")}{" "}
            <span className="text-amber-400 font-bold">{gasPriceSyp.toLocaleString("ar-SY")} ل.س/ل</span>
          </p>
          {zones.map((zone) => (
            <div key={zone.id} className="flex items-center justify-between">
              <ZoneBadge color={zone.zone_color} name={zone.name_ar} size="sm" />
              <span className="text-sm font-bold tabular-nums text-slate-200">
                {formatCredits(calcHourlyRate(zone, gasPriceSyp))} {t("credits_abbr")}/hr
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-2 font-medium">{t("newGasPrice")}</label>
            <input
              type="number"
              value={gasInput}
              onChange={(e) => { setGasInput(e.target.value); setSaveStatus("idle"); }}
              min={100}
              max={100000}
              step={500}
              className="input-field tabular-nums"
              placeholder="5000"
              dir="ltr"
            />
          </div>

          {parseInt(gasInput) !== gasPriceSyp && !isNaN(parseInt(gasInput)) && (
            <div className="text-xs text-slate-500 bg-slate-800/60 rounded-xl p-3 space-y-1">
              <p className="font-medium text-slate-400 mb-2">
                {t("previewAt")} {parseInt(gasInput).toLocaleString()} ل.س/ل:
              </p>
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between">
                  <span className="text-slate-500">{zone.name_ar}</span>
                  <span className="font-semibold text-amber-400">
                    {formatCredits(calcHourlyRate(zone, parseInt(gasInput) || 0))} {t("credits_abbr")}/hr
                  </span>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleSaveGasPrice} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin" />
              : saveStatus === "saved" ? <CheckCircle2 className="w-4 h-4" />
              : saveStatus === "error" ? <AlertCircle className="w-4 h-4" />
              : <Zap className="w-4 h-4" />
            }
            {saving ? t("savingRates")
              : saveStatus === "saved" ? t("ratesUpdated")
              : saveStatus === "error" ? t("invalidValue")
              : t("updateRates")}
          </button>
        </div>
      </div>
    </div>
  );
}
