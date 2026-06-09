"use client";

import { useI18n } from "@/lib/i18n/context";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const isAr = locale === "ar";

  return (
    <button
      onClick={() => setLocale(isAr ? "en" : "ar")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                 border border-slate-700 bg-slate-800/60 hover:bg-slate-700 hover:border-slate-600
                 text-slate-300 transition-all duration-150 select-none"
      title={isAr ? "Switch to English" : "التبديل إلى العربية"}
      aria-label="Toggle language"
    >
      {isAr ? (
        <>
          <span className="text-base leading-none">🇬🇧</span>
          <span>EN</span>
        </>
      ) : (
        <>
          <span className="text-base leading-none">🇸🇾</span>
          <span>ع</span>
        </>
      )}
    </button>
  );
}
