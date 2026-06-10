import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/SettingsForm";
import type { Locale } from "@/lib/i18n/translations";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, preferred_language, saved_vehicles")
    .eq("id", user.id)
    .single();

  const role = (user.app_metadata?.role ?? "driver") as string;

  return (
    <SettingsForm
      email={user.email ?? ""}
      initialName={profile?.name ?? ""}
      initialLanguage={(profile?.preferred_language ?? "ar") as Locale}
      initialVehicles={(profile?.saved_vehicles ?? []) as string[]}
      backHref={`/${role}`}
    />
  );
}
