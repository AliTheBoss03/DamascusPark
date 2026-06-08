"use client";

import { useState } from "react";
import {
  TrendingUp,
  Car,
  ShieldAlert,
  Building2,
  Cpu,
  Zap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ZoneBadge } from "@/components/ui/ZoneBadge";
import {
  calcHourlyRate,
  splitRevenue,
  formatCredits,
} from "@/lib/pricing";
import {
  MOCK_ZONES,
  MOCK_SESSIONS,
  MOCK_FINES,
  MOCK_SETTINGS,
} from "@/lib/mock-data";

function getTotalRevenue(gasPriceSyp: number) {
  const sessionRevenue = MOCK_SESSIONS.filter(
    (s) => s.status === "completed" && s.total_cost_credits
  ).reduce((sum, s) => sum + (s.total_cost_credits ?? 0), 0);

  const fineRevenue = MOCK_FINES.filter((f) => f.status === "paid").reduce(
    (sum, f) => sum + f.amount_credits,
    0
  );

  return sessionRevenue + fineRevenue;
}

export function AdminView() {
  const defaultGasPrice = parseInt(
    MOCK_SETTINGS.find((s) => s.key === "gas_price_per_liter_syp")?.value ??
      "5000"
  );
  const [gasPriceSyp, setGasPriceSyp] = useState(defaultGasPrice);
  const [gasInput, setGasInput] = useState(String(defaultGasPrice));
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle"
  );

  const activeSessions = MOCK_SESSIONS.filter((s) => s.status === "active");
  const totalRevenue = getTotalRevenue(gasPriceSyp);
  const { government: govShare, platform: platShare } =
    splitRevenue(totalRevenue);
  const unpaidFines = MOCK_FINES.filter((f) => f.status === "unpaid").length;

  const handleSaveGasPrice = () => {
    const value = parseInt(gasInput.replace(/[^0-9]/g, ""));
    if (isNaN(value) || value < 100 || value > 100_000) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }
    setSaving(true);
    // Simulate API save
    setTimeout(() => {
      setGasPriceSyp(value);
      setSaving(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }, 700);
  };

  const zoneStats = MOCK_ZONES.map((zone) => {
    const zoneSessions = MOCK_SESSIONS.filter((s) => s.zone_id === zone.id);
    const zoneActive = zoneSessions.filter((s) => s.status === "active").length;
    const zoneRevenue = zoneSessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + (s.total_cost_credits ?? 0), 0);
    const rate = calcHourlyRate(zone, gasPriceSyp);
    return { zone, active: zoneActive, revenue: zoneRevenue, rate };
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            Total Revenue
          </p>
          <p className="text-2xl font-bold tabular-nums text-amber-400">
            {formatCredits(totalRevenue)}
            <span className="text-sm font-normal text-amber-500/70 ml-1">
              cr
            </span>
          </p>
          <p className="text-xs text-slate-600">
            ≈ {(totalRevenue * 1000).toLocaleString()} SYP
          </p>
        </div>

        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            Active Sessions
          </p>
          <p className="text-2xl font-bold tabular-nums text-green-400">
            {activeSessions.length}
            <span className="text-sm font-normal text-green-500/70 ml-1">
              cars
            </span>
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-600">live</span>
          </div>
        </div>

        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            Government (60%)
          </p>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-xl font-bold tabular-nums text-blue-400">
              {formatCredits(govShare)} cr
            </p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: "60%" }}
            />
          </div>
        </div>

        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            Platform (40%)
          </p>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
            <p className="text-xl font-bold tabular-nums text-purple-400">
              {formatCredits(platShare)} cr
            </p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: "40%" }}
            />
          </div>
        </div>
      </div>

      {/* Fines alert */}
      {unpaidFines > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">
            <span className="font-bold">{unpaidFines}</span> unpaid fine
            {unpaidFines > 1 ? "s" : ""} outstanding
          </p>
        </div>
      )}

      {/* Zone Breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" />
          Revenue by Zone
        </h3>

        <div className="space-y-3">
          {zoneStats.map(({ zone, active, revenue, rate }) => (
            <div
              key={zone.id}
              className="flex items-center gap-3 py-3 border-b border-slate-700/50 last:border-0"
            >
              <ZoneBadge
                color={zone.zone_color}
                name={zone.name}
                nameAr={zone.name_ar}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">
                    {active} active · {formatCredits(rate)} cr/hr
                  </span>
                  <span className="text-sm font-bold text-slate-200 tabular-nums">
                    {formatCredits(revenue)} cr
                  </span>
                </div>
                {/* Revenue bar relative to highest-earning zone */}
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      zone.zone_color === "red"
                        ? "bg-red-500"
                        : zone.zone_color === "yellow"
                        ? "bg-amber-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width:
                        Math.max(
                          5,
                          (revenue /
                            Math.max(...zoneStats.map((z) => z.revenue), 1)) *
                            100
                        ) + "%",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active sessions list */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-3">
          <Car className="w-4 h-4" />
          Live Parked Vehicles
        </h3>
        {activeSessions.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">
            No active sessions
          </p>
        ) : (
          <div className="space-y-2">
            {activeSessions.map((s) => {
              const zone = MOCK_ZONES.find((z) => z.id === s.zone_id);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-mono text-slate-200">
                      {s.license_plate}
                    </span>
                    {zone && (
                      <ZoneBadge
                        color={zone.zone_color}
                        name={zone.name}
                        size="sm"
                      />
                    )}
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {new Date(s.started_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inflation Control Panel */}
      <div className="card p-5 border-amber-500/15">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Inflation Control
            </h3>
            <p className="text-xs text-slate-500">
              Adjust Gas Price Index — all zone rates update instantly
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 mb-4 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Effective Hourly Rates at{" "}
            <span className="text-amber-400 font-bold">
              {gasPriceSyp.toLocaleString()} SYP/L
            </span>
          </p>
          {MOCK_ZONES.map((zone) => (
            <div key={zone.id} className="flex items-center justify-between">
              <ZoneBadge
                color={zone.zone_color}
                name={zone.name}
                nameAr={zone.name_ar}
                size="sm"
              />
              <span className="text-sm font-bold tabular-nums text-slate-200">
                {formatCredits(calcHourlyRate(zone, gasPriceSyp))} cr/hr
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-2 font-medium">
              New Gas Price (SYP per litre)
            </label>
            <input
              type="number"
              value={gasInput}
              onChange={(e) => {
                setGasInput(e.target.value);
                setSaveStatus("idle");
              }}
              min={100}
              max={100000}
              step={500}
              className="input-field tabular-nums"
              placeholder="5000"
            />
          </div>

          {/* Preview new rates */}
          {parseInt(gasInput) !== gasPriceSyp && !isNaN(parseInt(gasInput)) && (
            <div className="text-xs text-slate-500 bg-slate-800/60 rounded-xl p-3 space-y-1">
              <p className="font-medium text-slate-400 mb-2">
                Preview at {parseInt(gasInput).toLocaleString()} SYP/L:
              </p>
              {MOCK_ZONES.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-slate-500">{zone.name}</span>
                  <span className="font-semibold text-amber-400">
                    {formatCredits(
                      calcHourlyRate(zone, parseInt(gasInput) || 0)
                    )}{" "}
                    cr/hr
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSaveGasPrice}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin" />
            ) : saveStatus === "saved" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : saveStatus === "error" ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {saving
              ? "Saving…"
              : saveStatus === "saved"
              ? "Rates Updated!"
              : saveStatus === "error"
              ? "Invalid value"
              : "Update Gas Price Index"}
          </button>
        </div>
      </div>
    </div>
  );
}
