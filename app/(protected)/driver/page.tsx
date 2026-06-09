import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DriverView } from "@/components/views/DriverView";
import type { ParkingZone, ParkingSession } from "@/types";

export const dynamic = "force-dynamic";

export default async function DriverPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.app_metadata?.role ?? "driver";
  if (role !== "driver") redirect(`/${role}`);

  // Fetch the driver's live data server-side (RLS scopes everything to them).
  const [{ data: profile }, { data: zones }, { data: sessions }, { data: gas }] =
    await Promise.all([
      supabase.from("profiles").select("name, wallet_balance").eq("id", user.id).single(),
      supabase.from("parking_zones").select("*").order("hourly_rate_peg_ratio", { ascending: false }),
      supabase
        .from("parking_sessions")
        .select("*, zone:parking_zones(*)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false }),
      supabase.from("system_settings").select("value").eq("key", "gas_price_per_liter_syp").single(),
    ]);

  const sessionList = (sessions ?? []) as ParkingSession[];
  const activeSession = sessionList.find((s) => s.status === "active") ?? null;
  const recentSessions = sessionList.filter((s) => s.status === "completed").slice(0, 5);
  const gasPriceSyp = gas?.value ? parseInt(gas.value, 10) : 5000;

  return (
    <DriverView
      userName={profile?.name ?? user.email ?? "Driver"}
      initialBalance={profile?.wallet_balance ?? 0}
      zones={(zones ?? []) as ParkingZone[]}
      initialActiveSession={activeSession}
      recentSessions={recentSessions}
      gasPriceSyp={gasPriceSyp}
    />
  );
}
