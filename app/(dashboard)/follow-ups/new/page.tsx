import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { createFollowUpAction } from "@/app/(dashboard)/follow-ups/actions";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { followUpTypeLabels, followUpTypes, visitTypeLabels } from "@/constants/statuses";
import { formatSaudiDateTime, shortId } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type NewFollowUpPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function param(searchParams: NewFollowUpPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewFollowUpPage({ searchParams }: NewFollowUpPageProps) {
  const context = await requireUser();
  const supabase = createClient();
  const error = param(searchParams, "error");
  const customerId = param(searchParams, "customer_id");
  const visitId = param(searchParams, "visit_id");

  const [customersResult, visitsResult, employeesResult] = await Promise.all([
    supabase.from("customers").select("id, full_name, phone").order("updated_at", { ascending: false }).limit(300),
    supabase.from("visits").select("id, customer_id, visit_datetime, visit_type, customers(full_name)").order("visit_datetime", { ascending: false }).limit(300),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name")
  ]);

  return (
    <div>
      <PageHeader
        title="إضافة متابعة"
        description="جدولة موعد متابعة مع عميل وربطه بزيارة عند الحاجة."
        actions={
          <Button asChild variant="outline">
            <Link href="/follow-ups"><ArrowRight className="h-4 w-4" />العودة للمتابعات</Link>
          </Button>
        }
      />

      {error ? (
        <Alert className="mb-5 border-destructive/40 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تعذر إضافة المتابعة</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form action={createFollowUpAction}>
        <input type="hidden" name="return_to" value="/follow-ups/new" />
        <Card>
          <CardHeader>
            <CardTitle>بيانات المتابعة</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer_id">العميل</Label>
              <Select id="customer_id" name="customer_id" defaultValue={customerId} required>
                <option value="">اختر العميل</option>
                {(customersResult.data ?? []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name} - {customer.phone}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit_id">الزيارة المرتبطة</Label>
              <Select id="visit_id" name="visit_id" defaultValue={visitId}>
                <option value="">بدون زيارة مرتبطة</option>
                {(visitsResult.data ?? []).map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    زيارة {shortId(visit.id)} - {(visit.customers as { full_name?: string } | null)?.full_name ?? "عميل"} - {visitTypeLabels[visit.visit_type as keyof typeof visitTypeLabels] ?? "أخرى"} - {formatSaudiDateTime(visit.visit_datetime)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_employee_id">الموظف المسؤول</Label>
              <Select id="assigned_employee_id" name="assigned_employee_id" defaultValue={context.userId} required>
                {(employeesResult.data ?? []).map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="follow_up_type">نوع المتابعة</Label>
              <Select id="follow_up_type" name="follow_up_type" defaultValue="call" required>
                {followUpTypes.map((type) => (
                  <option key={type} value={type}>{followUpTypeLabels[type]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_at">تاريخ ووقت المتابعة</Label>
              <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea id="notes" name="notes" rows={4} />
            </div>
            <div className="flex justify-end md:col-span-2">
              <Button type="submit">حفظ المتابعة</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
