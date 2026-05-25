"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Building2, CalendarCheck, Gauge, Settings, Users, UserRoundCheck } from "lucide-react";
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
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden min-h-screen w-80 shrink-0 border-l border-border/50 bg-card/65 p-4 backdrop-blur xl:block">
      <div className="premium-shell flex h-full flex-col p-4">
        <div className="mb-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary"><UserRoundCheck className="h-5 w-5" /></div>
            <div><p className="text-lg font-extrabold">إباء للزيارات</p><p className="text-xs text-muted-foreground">نظام تشغيلي لفِرق المبيعات</p></div>
          </div>
        </div>

        <nav className="flex-1 space-y-2.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-all hover:bg-secondary/70 hover:text-foreground", isActive && "bg-primary/15 text-primary ring-1 ring-primary/30") }>
                <Icon className="h-4 w-4" />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-2xl border border-border/60 bg-secondary/35 p-4">
          <p className="truncate text-sm font-bold">{fullName}</p>
          <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
        </div>
      </div>
    </aside>
  );
}
