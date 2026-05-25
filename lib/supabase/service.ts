import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";

export function createServiceClient() {
  const { url, serviceRoleKey } = getSupabaseServiceEnv();

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
