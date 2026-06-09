import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WardenView } from "@/components/views/WardenView";
import type { ParkingZone, Fine } from "@/types";

export const dynamic = "force-dynamic";

export default async function WardenPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.app_metadata?.role ?? "driver";
  if (role !== "warden" && role !== "admin") redirect(`/${role}`);

  const [{ data: profile }, { data: zones }, { data: fines }, { data: gas }] =
    await Promise.all([
      supabase.from("profiles").select("name").eq("id", user.id).single(),
      supabase.from("parking_zones").select("*").order("hourly_rate_peg_ratio", { ascending: false }),
      supabase
        .from("fines")
        .select("*, zone:parking_zones(*)")
        .order("issued_at", { ascending: false })
        .limit(20),
      supabase.from("system_settings").select("value").eq("key", "gas_price_per_liter_syp").single(),
    ]);

  const gasPriceSyp = gas?.value ? parseInt(gas.value, 10) : 5000;

  return (
    <WardenView
      wardenId={user.id}
      wardenName={profile?.name ?? user.email ?? "Warden"}
      zones={(zones ?? []) as ParkingZone[]}
      gasPriceSyp={gasPriceSyp}
      initialFines={(fines ?? []) as Fine[]}
    />
  );
}
