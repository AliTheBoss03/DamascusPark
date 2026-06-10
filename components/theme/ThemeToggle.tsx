"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

const OPTIONS = [
  { value: "light", Icon: Sun, label: "Light" },
  { value: "system", Icon: Monitor, label: "System" },
  { value: "dark", Icon: Moon, label: "Dark" },
] as const;

/** Segmented Light / System / Dark control, persisted by next-themes. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes resolves the active theme on the client only; render a stable
  // value until mounted to avoid a hydration mismatch.
  useEffect(() => setMounted(true), []);
  const active = mounted ? theme ?? "system" : "system";

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-xl border border-slate-700 bg-slate-800/60 p-0.5"
      role="group"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={active === value}
          title={label}
          className={`p-1.5 rounded-lg transition-colors duration-150 ${
            active === value
              ? "bg-amber-500 text-neutral-900"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}
