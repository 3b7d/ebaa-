import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction
} from "@/app/(dashboard)/notifications/actions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatSaudiDateTime } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { syncUserNotifications } from "@/services/notifications";

function notificationHref(type: string | null, id: string | null) {
  if (!type || !id) return "/notifications";
  if (type === "follow_up") return `/follow-ups/${id}`;
  if (type === "customer") return `/customers/${id}`;
  if (type === "visit") return `/visits/${id}`;
  return "/notifications";
}

export default async function NotificationsPage() {
  const context = await requireUser();
  await syncUserNotifications(context.profile);
  const supabase = createClient();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, title, message, type, is_read, related_entity_type, related_entity_id, created_at")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  const unreadCount = (notifications ?? []).filter((notification) => !notification.is_read).length;

  return (
    <div>
      <PageHeader
        title="الإشعارات"
        description="متابعة التنبيهات المرتبطة بالمتابعات والعملاء والزيارات."
        actions={
          <form action={markAllNotificationsReadAction}>
            <input type="hidden" name="return_to" value="/notifications" />
            <Button type="submit" variant="outline" disabled={unreadCount === 0}>
              <CheckCheck className="h-4 w-4" />
              تعيين الكل كمقروء
            </Button>
          </form>
        }
      />

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-sm text-destructive">تعذر تحميل الإشعارات</div>
          ) : (notifications ?? []).length === 0 ? (
            <EmptyState icon={Bell} title="لا توجد إشعارات جديدة" description="ستظهر التنبيهات المهمة هنا عند توفرها." className="m-6" />
          ) : (
            <div className="divide-y">
              {(notifications ?? []).map((notification) => (
                <div key={notification.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{notification.title}</h2>
                      {!notification.is_read ? <Badge variant="info">جديد</Badge> : <Badge variant="outline">مقروء</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatSaudiDateTime(notification.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={notificationHref(notification.related_entity_type, notification.related_entity_id)}>فتح المرتبط</Link>
                    </Button>
                    {!notification.is_read ? (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="notification_id" value={notification.id} />
                        <input type="hidden" name="return_to" value="/notifications" />
                        <Button type="submit" size="sm">تعيين كمقروء</Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
