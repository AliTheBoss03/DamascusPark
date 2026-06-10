"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Car, Plus, X, Save, Check, Loader2, Palette, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { Locale } from "@/lib/i18n/translations";

interface SettingsFormProps {
  email: string;
  initialName: string;
  initialLanguage: Locale;
  initialVehicles: string[];
}

const norm = (p: string) => p.replace(/\s/g, "").toUpperCase();

export function SettingsForm({
  email,
  initialName,
  initialLanguage,
  initialVehicles,
}: SettingsFormProps) {
  const { t, setLocale } = useI18n();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [language, setLanguage] = useState<Locale>(initialLanguage);
  const [vehicles, setVehicles] = useState<string[]>(initialVehicles);
  const [newVehicle, setNewVehicle] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const addVehicle = () => {
    const v = newVehicle.trim();
    if (!v) return;
    if (vehicles.some((x) => norm(x) === norm(v))) {
      setNewVehicle("");
      return;
    }
    setVehicles((prev) => [...prev, v]);
    setNewVehicle("");
  };

  const removeVehicle = (v: string) => setVehicles((prev) => prev.filter((x) => x !== v));

  const handleLanguageChange = (lang: Locale) => {
    setLanguage(lang);
    setLocale(lang); // instant UI flip + persist cookie + flip dir
  };

  const handleSave = async () => {
    setStatus("saving");
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      setError(t("somethingWrong"));
      return;
    }
    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        preferred_language: language,
        saved_vehicles: vehicles,
      })
      .eq("id", user.id);

    if (updErr) {
      setStatus("error");
      setError(updErr.message);
      return;
    }
    setStatus("saved");
    router.refresh();
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100">{t("settings")}</h2>
        <p className="text-sm text-slate-500">{t("settingsSubtitle")}</p>
      </div>

      {/* Profile */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400" />
          {t("profileSection")}
        </h3>

        <div>
          <label className="block text-xs text-slate-400 mb-2">{t("emailLabel")}</label>
          <div className="input-field flex items-center gap-2 text-slate-500 cursor-not-allowed">
            <Mail className="w-4 h-4 shrink-0" />
            <span dir="ltr" className="truncate">{email}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-2">{t("displayName")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder={t("displayName")}
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-amber-400" />
          {t("appearance")}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{t("themeLabel")}</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Language */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-amber-400" />
          {t("languageLabel")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(["ar", "en"] as Locale[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              aria-pressed={language === lang}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                language === lang
                  ? "border-amber-500/60 bg-amber-500/10 text-amber-500 dark:text-amber-400"
                  : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
              }`}
            >
              {lang === "ar" ? t("arabic") : t("english")}
            </button>
          ))}
        </div>
      </div>

      {/* Saved vehicles */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Car className="w-4 h-4 text-amber-400" />
          {t("savedVehiclesLabel")}
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={newVehicle}
            onChange={(e) => setNewVehicle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVehicle())}
            placeholder={t("addVehiclePlaceholder")}
            className="input-field font-mono text-center tracking-widest flex-1"
            dir="ltr"
          />
          <button onClick={addVehicle} disabled={!newVehicle.trim()} className="btn-primary px-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("addLabel")}</span>
          </button>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-2">{t("noVehicles")}</p>
        ) : (
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v} className="flex items-center justify-between card-elevated px-3 py-2.5">
                <span className="text-sm font-mono text-slate-200" dir="ltr">{v}</span>
                <button
                  onClick={() => removeVehicle(v)}
                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 text-center">{error}</p>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className="btn-primary w-full flex items-center justify-center gap-2 h-11"
      >
        {status === "saving" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === "saved" ? (
          <Check className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {status === "saving" ? t("savingLabel") : status === "saved" ? t("savedLabel") : t("saveChanges")}
      </button>
    </div>
  );
}
