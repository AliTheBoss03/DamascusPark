import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WardenView } from "@/components/views/WardenView";

export default async function WardenPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.user_metadata?.role ?? "driver";
  if (role !== "warden" && role !== "admin") redirect(`/${role}`);

  return <WardenView />;
}
