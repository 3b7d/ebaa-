import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";
import type { AppRole } from "@/lib/constants";

export type UserContext = {
  userId: string;
  email: string;
  profile: Profile;
};

export async function getUserContext(): Promise<UserContext | null> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.is_active) return null;

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile
  };
}

export async function requireUser() {
  const context = await getUserContext();
  if (!context) redirect("/login");
  return context;
}

export function canManageUsers(role: AppRole) {
  return role === "admin";
}

export function canViewAllBranches(role: AppRole) {
  return role === "admin" || role === "general_manager";
}

export function canManageBranch(role: AppRole) {
  return role === "admin" || role === "general_manager" || role === "branch_supervisor";
}
