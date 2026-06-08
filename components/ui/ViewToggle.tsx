"use client";
import { Car, ShieldCheck, BarChart3 } from "lucide-react";
import type { UserRole } from "@/types";

interface ViewToggleProps {
  activeView: UserRole;
  onChange: (view: UserRole) => void;
}

const VIEWS: { role: UserRole; label: string; icon: React.ReactNode }[] = [
  { role: "driver", label: "Driver", icon: <Car className="w-4 h-4" /> },
  {
    role: "warden",
    label: "Warden",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  { role: "admin", label: "Admin", icon: <BarChart3 className="w-4 h-4" /> },
];

export function ViewToggle({ activeView, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex bg-slate-800/80 border border-slate-700 rounded-2xl p-1 gap-1">
      {VIEWS.map(({ role, label, icon }) => (
        <button
          key={role}
          onClick={() => onChange(role)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            transition-all duration-200 select-none
            ${
              activeView === role
                ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
            }
          `}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
