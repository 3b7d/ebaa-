import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { cancelFollowUpAction, completeFollowUpAction } from "@/app/(dashboard)/follow-ups/actions";
import { PageHeader } from "@/components/page-header";
import { CustomerStatusBadge, FollowUpStatusBadge, PurchaseProbabilityBadge } from "@/components/status-badge";
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
  followUpTypeLabels,
  purchaseProbabilities,
  purchaseProbabilityLabels,
  visitTypeLabels
} from "@/constants/statuses";
import { getFollowUpDisplayStatus } from "@/lib/follow-ups";
import { formatSaudiDateTime, shortId } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type FollowUpDetailsPageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

type FollowUpDetails = {
  id: string;
  customer_id: string;
  visit_id: string | null;
  assigned_employee_id: string;
  follow_up_type: string;
  scheduled_at: string;
  completed_at: string | null;
  result: string | null;
  status: string;
  notes: string | null;
  customers: {
    id: string;
    full_name: string;
    phone: string;
    city: string | null;
    current_status: string;
    purchase_probability: string | null;
  } | null;
  visits: { id: string; visit_datetime: string; visit_type: string } | null;
  profiles: { full_name: string } | null;
};

function param(searchParams: FollowUpDetailsPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function FollowUpDetailsPage({ params, searchParams }: FollowUpDetailsPageProps) {
  await requireUser();
  const supabase = createClient();
  const success = param(searchParams, "success");
  const error = param(searchParams, "error");

  const { data } = await supabase
    .from("follow_ups")
    .select(
      "id, customer_id, visit_id, assigned_employee_id, follow_up_type, scheduled_at, completed_at, result, status, notes, customers(id, full_name, phone, city, current_status, purchase_probability), visits(id, visit_datetime, visit_type), profiles!follow_ups_assigned_employee_id_fkey(full_name)"
    )
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const followUp = data as unknown as FollowUpDetails;
  const displayStatus = getFollowUpDisplayStatus(followUp);

  return (
    <div className="space-y-5">
      <PageHeader
        title="تفاصيل المتابعة"
        description="إكمال المتابعة أو تحديث حالة العميل وإنشاء موعد جديد عند الحاجة."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/follow-ups"><ArrowRight className="h-4 w-4" />العودة للمتابعات</Link>
            </Button>
            {followUp.customers ? (
              <Button asChild>
                <Link href={`/customers/${followUp.customers.id}`}>فتح ملف العميل</Link>
              </Button>
            ) : null}
          </>
        }
      />

      {success ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <AlertTitle>تمت العملية بنجاح</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert className="border-destructive/40 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تعذر تنفيذ العملية</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>بيانات المتابعة</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Info label="اسم العميل" value={followUp.customers?.full_name} />
            <Info label="رقم الجوال" value={followUp.customers?.phone} />
            <Info label="الموظف المسؤول" value={followUp.profiles?.full_name} />
            <Info label="نوع المتابعة" value={followUpTypeLabels[followUp.follow_up_type as keyof typeof followUpTypeLabels] ?? "أخرى"} />
            <Info label="تاريخ المتابعة" value={formatSaudiDateTime(followUp.scheduled_at)} />
            <Info label="تاريخ الإكمال" value={formatSaudiDateTime(followUp.completed_at)} />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">الحالة</p>
              <FollowUpStatusBadge status={displayStatus} />
            </div>
            <Info label="نتيجة آخر متابعة" value={followUp.result || "لا توجد نتيجة"} />
            <Info
              label="الزيارة المرتبطة"
              value={
                followUp.visits
                  ? `زيارة ${shortId(followUp.visits.id)} - ${visitTypeLabels[followUp.visits.visit_type as keyof typeof visitTypeLabels] ?? "أخرى"}`
                  : "بدون زيارة مرتبطة"
              }
            />
            <Info label="ملاحظات" value={followUp.notes || "لا توجد ملاحظات"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>بيانات العميل</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Info label="المدينة" value={followUp.customers?.city} />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">حالة العميل</p>
              <CustomerStatusBadge status={followUp.customers?.current_status} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">احتمالية الشراء</p>
              <PurchaseProbabilityBadge probability={followUp.customers?.purchase_probability} />
            </div>
          </CardContent>
        </Card>
      </div>

      {displayStatus !== "completed" && displayStatus !== "cancelled" ? (
        <Card>
          <CardHeader><CardTitle>إكمال المتابعة</CardTitle></CardHeader>
          <CardContent>
            <form action={completeFollowUpAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="follow_up_id" value={followUp.id} />
              <input type="hidden" name="customer_id" value={followUp.customer_id} />
              <input type="hidden" name="return_to" value={`/follow-ups/${followUp.id}`} />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="result">نتيجة المتابعة</Label>
                <Textarea id="result" name="result" rows={3} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_status">تحديث حالة العميل</Label>
                <Select id="customer_status" name="customer_status" defaultValue={followUp.customers?.current_status ?? ""}>
                  <option value="">بدون تغيير</option>
                  {customerStatuses.map((status) => (
                    <option key={status} value={status}>{customerStatusLabels[status]}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_probability">احتمالية الشراء</Label>
                <Select id="purchase_probability" name="purchase_probability" defaultValue={followUp.customers?.purchase_probability ?? ""}>
                  <option value="">بدون تغيير</option>
                  {purchaseProbabilities.map((probability) => (
                    <option key={probability} value={probability}>{purchaseProbabilityLabels[probability]}</option>
                  ))}
                </Select>
              </div>
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm md:col-span-2">
                <input name="needs_new_follow_up" type="checkbox" className="h-4 w-4 rounded border-input" />
                هل يحتاج متابعة جديدة؟
              </label>
              <div className="space-y-2">
                <Label htmlFor="next_scheduled_at">تاريخ المتابعة القادمة</Label>
                <Input id="next_scheduled_at" name="next_scheduled_at" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_notes">ملاحظات المتابعة القادمة</Label>
                <Input id="next_notes" name="next_notes" />
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="submit"><CheckCircle2 className="h-4 w-4" />إكمال المتابعة</Button>
              </div>
            </form>
            <form action={cancelFollowUpAction} className="mt-3">
              <input type="hidden" name="follow_up_id" value={followUp.id} />
              <input type="hidden" name="return_to" value={`/follow-ups/${followUp.id}`} />
              <Button type="submit" variant="outline"><XCircle className="h-4 w-4" />إلغاء المتابعة</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "غير محدد"}</p>
    </div>
  );
}
