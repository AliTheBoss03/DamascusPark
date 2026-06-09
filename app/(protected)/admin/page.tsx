import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminView } from "@/components/views/AdminView";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.user_metadata?.role ?? "driver";
  if (role !== "admin") redirect(`/${role}`);

  return <AdminView />;
}
