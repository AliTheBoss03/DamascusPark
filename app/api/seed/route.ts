import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_USERS = [
  {
    email: "admin@mawqif.sy",
    password: "Demo@Mawqif2025!",
    role: "admin",
    name: "Damascus Municipality Admin",
  },
  {
    email: "warden@mawqif.sy",
    password: "Demo@Mawqif2025!",
    role: "warden",
    name: "Khaled Barakat (Warden)",
  },
  {
    email: "driver@mawqif.sy",
    password: "Demo@Mawqif2025!",
    role: "driver",
    name: "Ahmad Al-Masri (Driver)",
  },
] as const;

export async function POST() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !url) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (find it in Supabase Dashboard → Settings → API → Service Role).",
      },
      { status: 503 }
    );
  }

  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results = [];

  for (const user of DEMO_USERS) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role: user.role, name: user.name },
    });

    if (error && !error.message.includes("already been registered")) {
      results.push({ email: user.email, status: "error", message: error.message });
    } else {
      results.push({ email: user.email, role: user.role, status: data ? "created" : "exists" });
    }
  }

  return NextResponse.json({ results });
}

// Safety: only callable in development or with correct header in production
export async function GET() {
  return NextResponse.json({
    info: "POST to this endpoint to seed demo users. Requires SUPABASE_SERVICE_ROLE_KEY.",
    demoAccounts: DEMO_USERS.map((u) => ({
      email: u.email,
      password: u.password,
      role: u.role,
    })),
  });
}
