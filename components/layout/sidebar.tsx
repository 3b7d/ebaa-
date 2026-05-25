"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  Gauge,
  Settings,
  Users,
  UserRoundCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabels, type AppRole } from "@/lib/constants";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: Gauge, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/customers", label: "العملاء", icon: Users, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/visits", label: "الزيارات", icon: Building2, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/follow-ups", label: "المتابعات", icon: CalendarCheck, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/notifications", label: "الإشعارات", icon: Bell, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/reports", label: "التقارير", icon: BarChart3, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/settings", label: "الإعدادات", icon: Settings, roles: ["branch_supervisor", "general_manager", "admin"] }
] satisfies Array<{ href: string; label: string; icon: typeof Gauge; roles: AppRole[] }>;

type SidebarProps = {
  role: AppRole;
  fullName: string;
};

export function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden min-h-screen w-80 shrink-0 border-l border-border/70 bg-card/95 lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserRoundCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold">إباء للزيارات</p>
              <p className="text-xs text-muted-foreground">إدارة زيارات المعارض</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 p-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  isActive && "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/20"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <p className="truncate text-sm font-semibold">{fullName}</p>
          <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
        </div>
      </div>
    </aside>
  );
}
