"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Building2, CalendarCheck, ChevronLeft, ChevronRight, Gauge, Settings, Users, UserRoundCheck } from "lucide-react";
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

export function Sidebar({ role, fullName }: { role: AppRole; fullName: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const visibleItems = navItems.filter((item) => item.roles.includes(role));
  useEffect(() => {
    const value = window.localStorage.getItem("ebaa:sidebar-collapsed");
    if (value) setCollapsed(value === "true");
  }, []);
  useEffect(() => {
    window.localStorage.setItem("ebaa:sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <aside className={cn("hidden min-h-screen shrink-0 border-l border-border/50 bg-card/65 p-3 backdrop-blur xl:block", collapsed ? "w-20" : "w-64")}>
      <div className="premium-shell flex h-full flex-col p-3">
        <div className="mb-4 border-b border-border/60 pb-4">
          <div className={cn("mb-3 flex items-center rounded-2xl bg-secondary/40 p-2", collapsed ? "justify-center" : "justify-between gap-2")}>
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? "إظهار القائمة الجانبية" : "إخفاء القائمة الجانبية"}
              title={collapsed ? "إظهار القائمة الجانبية" : "إخفاء القائمة الجانبية"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/70 text-muted-foreground transition hover:text-foreground"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            {collapsed ? null : <p className="text-xs text-muted-foreground">إخفاء القائمة الجانبية</p>}
          </div>

          <div className={cn("flex items-center rounded-2xl bg-secondary/40", collapsed ? "justify-center p-2" : "gap-2 p-3")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary"><UserRoundCheck className="h-5 w-5" /></div>
            {collapsed ? null : <div><p className="text-base font-extrabold">إباء للزيارات</p><p className="text-xs text-muted-foreground">نظام تشغيلي لفِرق المبيعات</p></div>}
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={cn("flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-secondary/70 hover:text-foreground", collapsed ? "justify-center" : "gap-3", isActive && "bg-primary/15 text-primary ring-1 ring-primary/30") }>
                <Icon className="h-[18px] w-[18px]" />{collapsed ? null : item.label}
              </Link>
            );
          })}
        </nav>

        <div className={cn("mt-4 rounded-2xl border border-border/60 bg-secondary/35", collapsed ? "p-2 text-center" : "p-3")}>
          <p className="truncate text-sm font-bold">{collapsed ? fullName.slice(0, 1) : fullName}</p>
          {collapsed ? null : <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>}
        </div>
      </div>
    </aside>
  );
}
