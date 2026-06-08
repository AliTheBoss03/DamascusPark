"use client";
import { Wallet, TrendingUp } from "lucide-react";
import { formatCredits } from "@/lib/pricing";

interface WalletCardProps {
  balance: number;
  gasPriceSyp: number;
  userName: string;
  onTopUp: () => void;
}

export function WalletCard({
  balance,
  gasPriceSyp,
  userName,
  onTopUp,
}: WalletCardProps) {
  const lowBalance = balance < 20;
  const syp = balance * 1000;

  return (
    <div
      className={`card p-5 relative overflow-hidden
      ${lowBalance ? "border-red-500/40 bg-red-950/20" : ""}`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Mawqif Wallet
          </p>
          <p className="text-slate-400 text-sm mb-3">{userName}</p>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold tabular-nums text-slate-100">
              {formatCredits(balance)}
            </span>
            <span className="text-base font-semibold text-amber-400">
              credits
            </span>
          </div>
          <p className="text-xs text-slate-500">
            ≈ {(syp / 1000).toLocaleString()}K SYP at current gas price
          </p>

          {lowBalance && (
            <p className="mt-2 text-xs text-red-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              Low balance — top up now
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Wallet className="w-5 h-5 text-amber-400" />
          </div>
          <button onClick={onTopUp} className="btn-primary text-xs">
            Top Up
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-xs text-slate-500">
        <TrendingUp className="w-3.5 h-3.5" />
        Gas Index: {gasPriceSyp.toLocaleString()} SYP/L · 1 credit = 1,000 SYP
      </div>
    </div>
  );
}
