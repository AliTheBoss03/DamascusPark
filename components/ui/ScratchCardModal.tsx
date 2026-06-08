"use client";
import { useState } from "react";
import { X, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

interface ScratchCardModalProps {
  onClose: () => void;
  onRedeem: (pin: string) => Promise<{ credits: number } | { error: string }>;
}

export function ScratchCardModal({ onClose, onRedeem }: ScratchCardModalProps) {
  const [pin, setPin] = useState("");
  const [state, setState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [credits, setCredits] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setState("loading");

    const result = await onRedeem(pin.trim().toUpperCase());
    if ("error" in result) {
      setState("error");
      setMessage(result.error);
    } else {
      setState("success");
      setCredits(result.credits);
      setMessage(`+${result.credits} credits added to your wallet`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
      <div className="relative card p-6 w-full max-w-sm animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500
                     hover:text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <CreditCard className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Redeem Scratch Card
            </h2>
            <p className="text-xs text-slate-500">
              Enter the PIN from your voucher
            </p>
          </div>
        </div>

        {state === "success" ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-green-400 font-bold text-lg">
              +{credits} Credits
            </p>
            <p className="text-slate-400 text-sm mt-1">{message}</p>
            <button onClick={onClose} className="btn-primary mt-5 w-full">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">
                Voucher PIN
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setState("idle");
                }}
                placeholder="XXXX-XXXX-XXXX"
                className="input-field font-mono tracking-widest uppercase text-center text-base"
                maxLength={20}
                autoFocus
                disabled={state === "loading"}
              />
              {state === "error" && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {message}
                </p>
              )}
            </div>

            <div className="text-xs text-slate-500 bg-slate-800/60 rounded-xl p-3">
              <p className="font-medium text-slate-400 mb-1">Demo PINs:</p>
              <ul className="space-y-0.5 font-mono">
                <li>1234-5678-ABCD → 100 credits</li>
                <li>MAWQ-IFSY-2025 → 200 credits</li>
                <li>DEMO-FREE-PARK → 75 credits</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={!pin.trim() || state === "loading"}
              className="btn-primary w-full"
            >
              {state === "loading" ? "Verifying…" : "Redeem Voucher"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
