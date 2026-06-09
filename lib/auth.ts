import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export interface AuthedUser {
  id: string;
  role: UserRole;
  email: string | null;
}

/**
 * Resolve the authenticated user and their TRUSTED role from the request
 * session. The role is read from `app_metadata`, which only the service role
 * can write — a client cannot elevate itself via `supabase.auth.updateUser()`
 * (that only touches `user_metadata`). Absence of a role implies `driver`.
 *
 * Returns null when the request is unauthenticated.
 */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const appRole = (user.app_metadata as { role?: UserRole } | undefined)?.role;
  return {
    id: user.id,
    role: (appRole ?? "driver") as UserRole,
    email: user.email ?? null,
  };
}

/** True when `user` is present and holds one of the allowed roles. */
export function hasRole(
  user: AuthedUser | null,
  ...roles: UserRole[]
): boolean {
  return user !== null && roles.includes(user.role);
}
