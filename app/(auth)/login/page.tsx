import { LoginForm } from "@/components/auth/LoginForm";
import { MapPin, Shield, TrendingUp } from "lucide-react";

interface LoginPageProps {
  searchParams: { error?: string; redirect?: string };
}

const FEATURES = [
  {
    icon: <MapPin className="w-5 h-5 text-red-400" />,
    title: "3 Geo-fenced Zones",
    desc: "Red · Yellow · Green across central Damascus",
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
    title: "Inflation-Protected Rates",
    desc: "Pegged to the national Gasoline Price Index",
  },
  {
    icon: <Shield className="w-5 h-5 text-green-400" />,
    title: "Real-time Enforcement",
    desc: "Warden plate scanning with instant fine issuance",
  },
];

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorMessage = searchParams.error
    ? decodeURIComponent(searchParams.error)
    : undefined;

  return (
    <>
      {/* ── Left panel – Branding ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col bg-slate-900 border-e border-slate-800 p-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-slate-950/50 pointer-events-none" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-slate-900 font-bold text-xl leading-none">م</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 leading-none">Mawqif</h1>
              <p className="text-sm text-slate-500 leading-none mt-0.5">موقف</p>
            </div>
          </div>

          {/* Hero content */}
          <div className="my-auto">
            <h2 className="text-4xl xl:text-5xl font-black text-slate-100 leading-tight mb-4">
              Damascus
              <br />
              <span className="text-amber-400">Smart Parking</span>
              <br />
              Platform
            </h2>
            <p className="text-slate-400 text-lg mb-2 leading-relaxed">
              منصة المواقف الذكية في دمشق
            </p>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              An enterprise-grade digital parking ecosystem for the Syrian
              capital — inflation-resilient, offline-first, and built for
              government operations.
            </p>

            {/* Feature chips */}
            <div className="mt-10 space-y-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {f.title}
                    </p>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-slate-800">
            <p className="text-xs text-slate-600">
              In partnership with the Syrian Ministry of Transport & Damascus
              Municipal Council
            </p>
            <p className="text-xs text-slate-700 mt-1">
              وزارة النقل · مجلس مدينة دمشق
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel – Login form ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-base leading-none">م</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-none">Mawqif · موقف</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">
                Damascus Smart Parking
              </p>
            </div>
          </div>

          <LoginForm errorMessage={errorMessage} />
        </div>
      </div>
    </>
  );
}
