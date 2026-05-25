import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { QrCode } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QrLinkActions } from "@/components/qr-link-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function getBaseUrl() {
  const headerStore = headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "127.0.0.1:3001";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export default async function QrSettingsPage() {
  const { profile } = await requireUser();
  if (profile.role !== "admin" && profile.role !== "branch_supervisor") redirect("/settings");

  const supabase = createClient();
  const query = supabase
    .from("branches")
    .select("id, name, city, is_active")
    .eq("is_active", true)
    .order("name");

  const { data: branches } =
    profile.role === "branch_supervisor" && profile.branch_id
      ? await query.eq("id", profile.branch_id)
      : await query;

  const baseUrl = getBaseUrl();

  return (
    <div>
      <PageHeader
        title="إعدادات QR"
        description="روابط النماذج العامة الخاصة بتسجيل اهتمام العملاء داخل المعرض."
      />

      {(branches ?? []).length === 0 ? (
        <EmptyState icon={QrCode} title="لا توجد فروع متاحة" description="يجب تفعيل فرع واحد على الأقل لإنشاء رابط نموذج QR." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {(branches ?? []).map((branch) => {
            const publicUrl = `${baseUrl}/qr/${branch.id}`;
            const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl)}`;
            return (
              <Card key={branch.id}>
                <CardHeader>
                  <CardTitle>{branch.name}</CardTitle>
                  <CardDescription>{branch.city}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رابط نموذج QR</label>
                    <Input value={publicUrl} readOnly />
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="rounded-lg border bg-white p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrImage} alt={`رمز QR ${branch.name}`} className="h-40 w-40" />
                    </div>
                    <QrLinkActions url={publicUrl} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
