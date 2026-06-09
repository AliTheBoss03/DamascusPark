"use client";

import { useTransition } from "react";
import { LogOut, Car, ShieldCheck, BarChart3 } from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";
import { useI18n } from "@/lib/i18n/context";
import type { UserRole } from "@/types";

interface UserNavProps {
  name: string;
  email: string;
  role: UserRole;
  walletBalance?: number;
}

export function UserNav({ name, email, role, walletBalance }: UserNavProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const ROLE_CONFIG: Record<UserRole, { icon: React.ReactNode; badge: string }> = {
    driver: { icon: <Car className="w-3.5 h-3.5" />, badge: "bg-green-500/15 text-green-400 border-green-500/25" },
    warden: { icon: <ShieldCheck className="w-3.5 h-3.5" />, badge: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
    admin:  { icon: <BarChart3 className="w-3.5 h-3.5" />,  badge: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
  };

  const config = ROLE_CONFIG[role];
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const handleSignOut = () => startTransition(() => { signOut(); });

  return (
    <div className="flex items-center gap-2">
      {/* Avatar + name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700
                        flex items-center justify-center text-xs font-bold text-slate-200
                        border border-slate-600 shrink-0">
          {initials}
        </div>
        <div className="hidden sm:block min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{name}</p>
          <p className="text-xs text-slate-500 truncate leading-tight" dir="ltr">{email}</p>
        </div>
      </div>

      {/* Role badge */}
      <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}>
        {config.icon}
        {t(role)}
      </span>

      {/* Wallet credits (driver only) */}
      {role === "driver" && walletBalance !== undefined && (
        <span className="hidden md:inline-flex items-center gap-1 text-xs font-mono text-amber-400">
          {walletBalance} {t("credits_abbr")}
        </span>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                   text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent
                   hover:border-red-500/20 transition-all duration-150 shrink-0"
        title={t("signOut")}
      >
        {isPending
          ? <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
          : <LogOut className="w-3.5 h-3.5" />
        }
        <span className="hidden sm:inline">{t("signOut")}</span>
      </button>
    </div>
  );
}
