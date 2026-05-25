import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ListChecks, QrCode, Settings, UserRoundCog } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const { profile } = await requireUser();
  if (profile.role === "sales_employee") redirect("/dashboard");

  const cards = [
    {
      href: "/settings/users",
      title: "المستخدمون",
      description: "إدارة حسابات المستخدمين والأدوار والفروع",
      icon: UserRoundCog,
      visible: profile.role === "admin" || profile.role === "general_manager"
    },
    {
      href: "/settings/branches",
      title: "الفروع",
      description: "إدارة بيانات الفروع وحالتها",
      icon: Building2,
      visible: true
    },
    {
      href: "/settings/interest-categories",
      title: "الأقسام",
      description: "إدارة أقسام الاهتمام المستخدمة في الزيارات",
      icon: ListChecks,
      visible: true
    },
    {
      href: "/settings/lead-sources",
      title: "مصادر العملاء",
      description: "إدارة مصادر العملاء والحملات",
      icon: Settings,
      visible: true
    },
    {
      href: "/settings/qr",
      title: "روابط QR",
      description: "عرض روابط نماذج QR لكل فرع",
      icon: QrCode,
      visible: profile.role === "admin" || profile.role === "branch_supervisor"
    }
  ];

  return (
    <div>
      <PageHeader
        title="الإعدادات"
        description="إدارة إعدادات النظام الأساسية حسب صلاحيات حسابك."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.filter((card) => card.visible).map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.href}>
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{card.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-auto">
                  <Link href={card.href}>فتح الإعداد</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
