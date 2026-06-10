"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, LogIn, ShieldCheck, Car, BarChart3 } from "lucide-react";
import { signIn } from "@/app/(auth)/login/actions";
import { useI18n } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

interface DemoAccount {
  role: string;
  labelKey: "admin" | "warden" | "driver";
  email: string;
  icon: React.ReactNode;
  color: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: "admin",  labelKey: "admin",  email: "admin@mawqif.sy",  icon: <BarChart3 className="w-3.5 h-3.5" />, color: "text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20" },
  { role: "warden", labelKey: "warden", email: "warden@mawqif.sy", icon: <ShieldCheck className="w-3.5 h-3.5" />, color: "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20" },
  { role: "driver", labelKey: "driver", email: "driver@mawqif.sy", icon: <Car className="w-3.5 h-3.5" />, color: "text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20" },
];

const DEMO_PASSWORD = "Demo@Mawqif2025!";

export function LoginForm({ errorMessage }: { errorMessage?: string }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fillDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => { signIn(fd); });
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t("loginFormTitle")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("loginFormSubtitle")}</p>
        </div>
        <LanguageToggle />
      </div>

      {errorMessage && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={password} />

        <div>
          <label htmlFor="email-display" className="block text-xs font-medium text-slate-400 mb-2">
            {t("emailAddress")}
          </label>
          <input
            id="email-display"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            className="input-field"
            autoComplete="email"
            required
            disabled={isPending}
            dir="ltr"
          />
        </div>

        <div>
          <label htmlFor="password-display" className="block text-xs font-medium text-slate-400 mb-2">
            {t("password")}
          </label>
          <div className="relative">
            <input
              id="password-display"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="input-field pe-12"
              autoComplete="current-password"
              required
              disabled={isPending}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isPending || !email || !password} className="btn-primary w-full flex items-center justify-center gap-2 h-11">
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-neutral-900/40 border-t-neutral-900 rounded-full animate-spin" />
              {t("authenticating")}
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              {t("signIn")}
            </>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-700/60" />
        <span className="text-xs text-slate-600">{t("demoAccounts")}</span>
        <div className="flex-1 h-px bg-slate-700/60" />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-600 mb-3">{t("demoInstruction")}</p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => fillDemo(account)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs
                          font-medium transition-all duration-150 ${account.color}
                          ${email === account.email ? "ring-2 ring-current ring-offset-1 ring-offset-slate-900" : ""}`}
            >
              {account.icon}
              {t(account.labelKey)}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-700 text-center font-mono" dir="ltr">
          {t("demoPasswordLabel")} {DEMO_PASSWORD}
        </p>
      </div>

      <p className="text-xs text-slate-700 text-center">
        {t("seedNote")}{" "}
        <code className="text-slate-600">POST /api/seed</code>
      </p>
    </div>
  );
}
