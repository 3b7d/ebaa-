import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { createCustomerAction } from "@/app/(dashboard)/customers/actions";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  customerStatusLabels,
  customerStatuses,
  purchaseProbabilities,
  purchaseProbabilityLabels
} from "@/constants/statuses";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type NewCustomerPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function param(searchParams: NewCustomerPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewCustomerPage({ searchParams }: NewCustomerPageProps) {
  const context = await requireUser();
  const supabase = createClient();
  const error = param(searchParams, "error");
  const duplicateId = param(searchParams, "duplicate");

  const [branchesResult, employeesResult, sourcesResult, duplicateResult] = await Promise.all([
    supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("lead_sources").select("id, name").eq("is_active", true).order("name"),
    duplicateId
      ? supabase.from("customers").select("id, full_name, phone").eq("id", duplicateId).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  return (
    <div>
      <PageHeader
        title="إضافة عميل"
        description="تسجيل ملف عميل جديد وربطه بالفرع وموظف المبيعات المسؤول."
        actions={
          <Button asChild variant="outline">
            <Link href="/customers">
              <ArrowRight className="h-4 w-4" />
              العودة للعملاء
            </Link>
          </Button>
        }
      />

      {error ? (
        <Alert className="mb-5 border-destructive/40 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تعذر حفظ العميل</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {duplicateResult.data ? (
        <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>رقم الجوال مستخدم مسبقًا</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              العميل الموجود: {duplicateResult.data.full_name}، رقم الجوال: {duplicateResult.data.phone}
            </span>
            <span className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/customers/${duplicateResult.data.id}`}>فتح ملف العميل</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/visits/new?customer_id=${duplicateResult.data.id}`}>تسجيل زيارة للعميل</Link>
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      <form action={createCustomerAction}>
        <Card>
          <CardHeader>
            <CardTitle>بيانات العميل</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">اسم العميل</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الجوال</Label>
              <Input id="phone" name="phone" placeholder="0500000000" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_phone">رقم جوال إضافي</Label>
              <Input id="secondary_phone" name="secondary_phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <Input id="city" name="city" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">الحي</Label>
              <Input id="district" name="district" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_id">مصدر العميل</Label>
              <Select id="source_id" name="source_id">
                <option value="">غير محدد</option>
                {(sourcesResult.data ?? []).map((source) => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch_id">الفرع</Label>
              <Select id="branch_id" name="branch_id" defaultValue={context.profile.branch_id ?? ""}>
                <option value="">غير محدد</option>
                {(branchesResult.data ?? []).map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_employee_id">موظف المبيعات المسؤول</Label>
              <Select id="assigned_employee_id" name="assigned_employee_id" defaultValue={context.userId}>
                {(employeesResult.data ?? []).map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_status">الحالة</Label>
              <Select id="current_status" name="current_status" defaultValue="new">
                {customerStatuses.map((status) => (
                  <option key={status} value={status}>{customerStatusLabels[status]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_probability">احتمالية الشراء</Label>
              <Select id="purchase_probability" name="purchase_probability">
                <option value="">غير محدد</option>
                {purchaseProbabilities.map((probability) => (
                  <option key={probability} value={probability}>{purchaseProbabilityLabels[probability]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="general_notes">ملاحظات عامة</Label>
              <Textarea id="general_notes" name="general_notes" rows={4} />
            </div>
            <div className="flex justify-end md:col-span-2">
              <Button type="submit">حفظ العميل</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
