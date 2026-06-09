import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/types";

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  warden: "/warden",
  driver: "/driver",
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session token — required on every request per Supabase SSR docs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // API routes authenticate themselves (JSON 401/403) and the Paymera webhook
  // authenticates via HMAC — never bounce them to an HTML login page. The
  // session cookie has still been refreshed above.
  if (pathname.startsWith("/api")) {
    return supabaseResponse;
  }

  // ── Unauthenticated page access ─────────────────────────────────────────────
  if (!user) {
    if (pathname === "/login") return supabaseResponse;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Trust app_metadata.role (service-role-set; not client-editable).
  const role = ((user.app_metadata as { role?: UserRole } | undefined)?.role ??
    "driver") as UserRole;

  // ── Logged in, hitting the landing/login pages → role home ──────────────────
  if (pathname === "/login" || pathname === "/") {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  // ── Role-based route guards ──────────────────────────────────────────────────
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }
  if (pathname.startsWith("/warden") && role !== "warden" && role !== "admin") {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
