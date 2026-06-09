import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DriverView } from "@/components/views/DriverView";

export default async function DriverPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.user_metadata?.role ?? "driver";
  if (role !== "driver") redirect(`/${role}`);

  return <DriverView />;
}
