"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  warden: "/warden",
  driver: "/driver",
};

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required");
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // Sync the user's saved language into the SSR locale cookie so the next
  // render is already in their preferred language.
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", data.user?.id ?? "")
    .single();

  const lang = profile?.preferred_language;
  if (lang === "ar" || lang === "en") {
    cookies().set("MAWQIF_LOCALE", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  const role = (data.user?.app_metadata?.role ?? "driver") as UserRole;
  redirect(ROLE_HOME[role]);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
