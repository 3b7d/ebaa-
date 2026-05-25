import Link from "next/link";
import { Bell, CheckCheck, LogOut, Search, UserRound } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction
} from "@/app/(dashboard)/notifications/actions";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatSaudiDateTime } from "@/lib/format";
import { roleLabels, type AppRole } from "@/lib/constants";

type HeaderNotification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
};

type TopHeaderProps = {
  role: AppRole;
  fullName: string;
  branchName?: string;
  notifications?: HeaderNotification[];
  unreadCount?: number;
};

function notificationHref(type: string | null, id: string | null) {
  if (!type || !id) return "/notifications";
  if (type === "follow_up") return `/follow-ups/${id}`;
  if (type === "customer") return `/customers/${id}`;
  if (type === "visit") return `/visits/${id}`;
  return "/notifications";
}

export function TopHeader({
  role,
  fullName,
  branchName,
  notifications = [],
  unreadCount = 0
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <MobileNav role={role} />
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="ابحث عن عميل أو رقم جوال" className="pr-9" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="relative" aria-label="الإشعارات">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "٩+" : unreadCount}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <DropdownMenuLabel className="p-0">الإشعارات</DropdownMenuLabel>
                {unreadCount > 0 ? <Badge variant="info">{unreadCount}</Badge> : null}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">لا توجد إشعارات جديدة</div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="space-y-2 px-3 py-2">
                    <Link href={notificationHref(notification.related_entity_type, notification.related_entity_id)} className="block">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{notification.title}</p>
                        {!notification.is_read ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{formatSaudiDateTime(notification.created_at)}</p>
                    </Link>
                    {!notification.is_read ? (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="notification_id" value={notification.id} />
                        <input type="hidden" name="return_to" value="/dashboard" />
                        <Button type="submit" variant="ghost" size="sm" className="h-8 px-2">تعيين كمقروء</Button>
                      </form>
                    ) : null}
                  </div>
                ))
              )}
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between gap-2 p-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/notifications">عرض الكل</Link>
                </Button>
                <form action={markAllNotificationsReadAction}>
                  <input type="hidden" name="return_to" value="/dashboard" />
                  <Button type="submit" variant="ghost" size="sm" disabled={unreadCount === 0}>
                    <CheckCheck className="h-4 w-4" />
                    تعيين الكل كمقروء
                  </Button>
                </form>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                <UserRound className="h-4 w-4" />
                <span className="hidden sm:inline">{fullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>
                <span className="block">{fullName}</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {roleLabels[role]}{branchName ? `، ${branchName}` : ""}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={role === "sales_employee" ? "/dashboard" : "/settings"}>الملف الشخصي</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action="/auth/logout" method="post">
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full">
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
