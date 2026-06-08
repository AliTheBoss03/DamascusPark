"use client";

import { useState } from "react";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { DriverView } from "@/components/views/DriverView";
import { WardenView } from "@/components/views/WardenView";
import { AdminView } from "@/components/views/AdminView";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { UserRole } from "@/types";

export default function Home() {
  const [activeView, setActiveView] = useState<UserRole>("driver");

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-slate-900 font-bold text-sm leading-none">م</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-none">
                Mawqif
              </h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">
                موقف · Damascus
              </p>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Demo Mode
            </span>
          )}
        </div>
      </header>

      {/* View switcher */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex justify-center mb-2">
          <ViewToggle activeView={activeView} onChange={setActiveView} />
        </div>

        {!isSupabaseConfigured && (
          <p className="text-center text-xs text-slate-600 mt-2 mb-0">
            Running on mock data · Configure{" "}
            <code className="text-slate-500">.env.local</code> to connect
            Supabase
          </p>
        )}
      </div>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-16">
        {activeView === "driver" && <DriverView />}
        {activeView === "warden" && <WardenView />}
        {activeView === "admin" && <AdminView />}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur border-t border-slate-800/50">
        <p className="text-center text-xs text-slate-700 py-2">
          Mawqif MVP · Damascus Smart Parking · Pitch Prototype
        </p>
      </footer>
    </div>
  );
}
