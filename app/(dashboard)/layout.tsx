import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { syncUserNotifications } from "@/services/notifications";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser();
  const supabase = createClient();
  await syncUserNotifications(profile);
  const { data: branch } = profile.branch_id
    ? await supabase.from("branches").select("name").eq("id", profile.branch_id).maybeSingle()
    : { data: null };
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, related_entity_type, related_entity_id, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("is_read", false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={profile.role} fullName={profile.full_name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader
          role={profile.role}
          fullName={profile.full_name}
          branchName={branch?.name}
          notifications={notifications ?? []}
          unreadCount={unreadCount ?? 0}
        />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
