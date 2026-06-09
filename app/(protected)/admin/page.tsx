import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminView } from "@/components/views/AdminView";
import type { ParkingZone, ParkingSession, Fine } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.app_metadata?.role ?? "driver";
  if (role !== "admin") redirect(`/${role}`);

  // Admin RLS grants global visibility across sessions/fines.
  const [{ data: zones }, { data: sessions }, { data: fines }, { data: settings }] =
    await Promise.all([
      supabase.from("parking_zones").select("*").order("hourly_rate_peg_ratio", { ascending: false }),
      supabase
        .from("parking_sessions")
        .select("*, zone:parking_zones(*)")
        .order("started_at", { ascending: false })
        .limit(200),
      supabase.from("fines").select("*").limit(500),
      supabase.from("system_settings").select("*"),
    ]);

  const settingsList = (settings ?? []) as { key: string; value: string }[];
  const gasPrice = parseInt(
    settingsList.find((s) => s.key === "gas_price_per_liter_syp")?.value ?? "5000",
    10
  );
  const govPct = parseInt(
    settingsList.find((s) => s.key === "revenue_split_government_pct")?.value ?? "60",
    10
  );

  return (
    <AdminView
      zones={(zones ?? []) as ParkingZone[]}
      sessions={(sessions ?? []) as ParkingSession[]}
      fines={(fines ?? []) as Fine[]}
      initialGasPrice={gasPrice}
      govPct={govPct}
    />
  );
}
