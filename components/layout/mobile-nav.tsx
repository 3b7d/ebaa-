"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  Gauge,
  Menu,
  Settings,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/constants";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: Gauge, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/customers", label: "العملاء", icon: Users, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/visits", label: "الزيارات", icon: Building2, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/follow-ups", label: "المتابعات", icon: CalendarCheck, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/notifications", label: "الإشعارات", icon: Bell, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/reports", label: "التقارير", icon: BarChart3, roles: ["sales_employee", "branch_supervisor", "general_manager", "admin"] },
  { href: "/settings", label: "الإعدادات", icon: Settings, roles: ["branch_supervisor", "general_manager", "admin"] }
] satisfies Array<{ href: string; label: string; icon: typeof Gauge; roles: AppRole[] }>;

export function MobileNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="lg:hidden" aria-label="فتح القائمة">
          <Menu className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="right-4 left-auto top-4 max-h-[calc(100vh-2rem)] max-w-sm translate-x-0 translate-y-0 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>القائمة الرئيسية</DialogTitle>
        </DialogHeader>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  isActive && "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
