import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserNav } from "@/components/auth/UserNav";
import type { UserRole } from "@/types";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile (wallet balance + persisted role)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, wallet_balance")
    .eq("id", user.id)
    .single();

  // Fall back to user_metadata if profiles table not yet migrated
  const role = (profile?.role ?? user.user_metadata?.role ?? "driver") as UserRole;
  const name = profile?.name ?? user.user_metadata?.name ?? user.email ?? "User";
  const walletBalance = profile?.wallet_balance ?? 0;

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-slate-900 font-bold text-sm leading-none">م</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-none">Mawqif</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">
                موقف · Damascus
              </p>
            </div>
          </div>

          <UserNav
            name={name}
            email={user.email ?? ""}
            role={role}
            walletBalance={walletBalance}
          />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-16">{children}</main>

      <footer className="fixed bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur border-t border-slate-800/50">
        <p className="text-center text-xs text-slate-700 py-2">
          Mawqif · Damascus Smart Parking · منصة المواقف الذكية
        </p>
      </footer>
    </div>
  );
}
