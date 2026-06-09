import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  warden: "/warden",
  driver: "/driver",
};

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role ?? "driver") as UserRole;
  redirect(ROLE_HOME[role]);
}
