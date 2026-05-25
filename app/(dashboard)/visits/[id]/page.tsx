import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarPlus, FolderOpen, Pencil } from "lucide-react";
import {
  createFollowUpForCustomerAction,
  updateCustomerStatusAction
} from "@/app/(dashboard)/customers/actions";
import { updateVisitAction } from "@/app/(dashboard)/visits/actions";
import { PageHeader } from "@/components/page-header";
import { CustomerStatusBadge, FollowUpStatusBadge, PurchaseProbabilityBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  customerStatusLabels,
  customerStatuses,
  followUpTypeLabels,
  followUpTypes,
  purchaseProbabilities,
  purchaseProbabilityLabels,
  visitTypeLabels,
  visitTypes
} from "@/constants/statuses";
import { requireUser } from "@/lib/auth";
import { activityLabel, formatSaudiDateTime, shortId } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type VisitDetailsPageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

type VisitDetails = {
  id: string;
  customer_id: string;
  visit_datetime: string;
  visit_type: string;
  interest_category_id: string | null;
  requested_product: string | null;
  budget_range: string | null;
  has_measurements: boolean | null;
  needs_second_visit: boolean | null;
  customer_status: string;
  purchase_probability: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  branches: { name: string } | null;
  profiles: { full_name: string } | null;
  interest_categories: { name: string } | null;
  customers: {
    id: string;
    full_name: string;
    phone: string;
    city: string | null;
    district: string | null;
    email: string | null;
    current_status: string;
    purchase_probability: string | null;
  } | null;
};

function param(searchParams: VisitDetailsPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function VisitDetailsPage({ params, searchParams }: VisitDetailsPageProps) {
  const context = await requireUser();
  const supabase = createClient();
  const success = param(searchParams, "success");
  const error = param(searchParams, "error");
  const isEditMode = param(searchParams, "edit") === "1";

  const { data } = await supabase
    .from("visits")
    .select(
      "id, customer_id, visit_datetime, visit_type, interest_category_id, requested_product, budget_range, has_measurements, needs_second_visit, customer_status, purchase_probability, next_follow_up_at, notes, branches(name), profiles!visits_sales_employee_id_fkey(full_name), interest_categories(name), customers(id, full_name, phone, city, district, email, current_status, purchase_probability)"
    )
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const visit = data as unknown as VisitDetails;

  const [followUpsResult, activityResult, employeesResult, categoriesResult] = await Promise.all([
    supabase
      .from("follow_ups")
      .select("id, follow_up_type, scheduled_at, completed_at, status, result, notes, profiles!follow_ups_assigned_employee_id_fkey(full_name)")
      .or(`visit_id.eq.${params.id},customer_id.eq.${visit.customer_id}`)
      .order("scheduled_at", { ascending: false })
      .limit(20),
    supabase
      .from("activity_logs")
      .select("id, action, created_at, profiles!activity_logs_performed_by_fkey(full_name)")
      .in("entity_id", [params.id, visit.customer_id])
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("interest_categories").select("id, name").eq("is_active", true).order("name")
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`زيارة رقم ${shortId(visit.id)}`}
        description="تفاصيل الزيارة وبيانات العميل والمتابعات المرتبطة بها."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/visits"><ArrowRight className="h-4 w-4" />العودة للزيارات</Link>
            </Button>
            {visit.customers ? (
              <Button asChild>
                <Link href={`/customers/${visit.customers.id}`}><FolderOpen className="h-4 w-4" />فتح ملف العميل</Link>
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
          <AlertTitle>تعذر تنفيذ العملية</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>بيانات الزيارة</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={isEditMode ? `/visits/${visit.id}` : "?edit=1"}>
                <Pencil className="h-4 w-4" />
                {isEditMode ? "إلغاء التعديل" : "تعديل الزيارة"}
              </Link>
            </Button>
          </CardHeader>
          {isEditMode ? (
            <CardContent>
              <form action={updateVisitAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="visit_id" value={visit.id} />
                <input type="hidden" name="customer_id" value={visit.customer_id} />
                <div className="space-y-2">
                  <Label htmlFor="visit_datetime">تاريخ ووقت الزيارة</Label>
                  <Input id="visit_datetime" name="visit_datetime" type="datetime-local" defaultValue={toInputDateTime(visit.visit_datetime)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visit_type">نوع الزيارة</Label>
                  <Select id="visit_type" name="visit_type" defaultValue={visit.visit_type}>
                    {visitTypes.map((type) => (
                      <option key={type} value={type}>{visitTypeLabels[type]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interest_category_id">القسم المهتم</Label>
                  <Select id="interest_category_id" name="interest_category_id" defaultValue={visit.interest_category_id ?? ""}>
                    <option value="">غير محدد</option>
                    {(categoriesResult.data ?? []).map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requested_product">المنتجات أو الخدمة المطلوبة</Label>
                  <Input id="requested_product" name="requested_product" defaultValue={visit.requested_product ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_range">الميزانية التقريبية</Label>
                  <Input id="budget_range" name="budget_range" defaultValue={visit.budget_range ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_follow_up_at">موعد المتابعة القادم</Label>
                  <Input id="next_follow_up_at" name="next_follow_up_at" type="datetime-local" defaultValue={toInputDateTime(visit.next_follow_up_at)} />
                </div>
                <div className="grid gap-3 rounded-md border p-3 md:col-span-2 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input name="has_measurements" type="checkbox" defaultChecked={Boolean(visit.has_measurements)} className="h-4 w-4 rounded border-input" />
                    هل يوجد مخطط أو مقاسات؟
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input name="needs_second_visit" type="checkbox" defaultChecked={Boolean(visit.needs_second_visit)} className="h-4 w-4 rounded border-input" />
                    هل يحتاج زيارة أخرى؟
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_status_edit">حالة العميل</Label>
                  <Select id="customer_status_edit" name="customer_status" defaultValue={visit.customer_status}>
                    {customerStatuses.map((status) => (
                      <option key={status} value={status}>{customerStatusLabels[status]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_probability_edit">احتمالية الشراء</Label>
                  <Select id="purchase_probability_edit" name="purchase_probability" defaultValue={visit.purchase_probability ?? ""}>
                    <option value="">غير محدد</option>
                    {purchaseProbabilities.map((probability) => (
                      <option key={probability} value={probability}>{purchaseProbabilityLabels[probability]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">ملاحظات الزيارة</Label>
                  <Textarea id="notes" name="notes" defaultValue={visit.notes ?? ""} rows={4} />
                </div>
                <div className="flex justify-end md:col-span-2">
                  <Button type="submit">حفظ التعديلات</Button>
                </div>
              </form>
            </CardContent>
          ) : (
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Info label="تاريخ الزيارة" value={formatSaudiDateTime(visit.visit_datetime)} />
              <Info label="نوع الزيارة" value={visitTypeLabels[visit.visit_type as keyof typeof visitTypeLabels]} />
              <Info label="الفرع" value={visit.branches?.name} />
              <Info label="موظف المبيعات" value={visit.profiles?.full_name} />
              <Info label="القسم المهتم" value={visit.interest_categories?.name} />
              <Info label="المنتجات أو الخدمة المطلوبة" value={visit.requested_product} />
              <Info label="الميزانية التقريبية" value={visit.budget_range} />
              <Info label="يوجد مخطط أو مقاسات" value={visit.has_measurements ? "نعم" : "لا"} />
              <Info label="يحتاج زيارة أخرى" value={visit.needs_second_visit ? "نعم" : "لا"} />
              <Info label="موعد المتابعة القادم" value={formatSaudiDateTime(visit.next_follow_up_at)} />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">حالة العميل</p>
                <CustomerStatusBadge status={visit.customer_status} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">احتمالية الشراء</p>
                <PurchaseProbabilityBadge probability={visit.purchase_probability} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-muted-foreground">ملاحظات الزيارة</p>
                <p className="whitespace-pre-wrap text-sm leading-7">{visit.notes || "لا توجد ملاحظات مسجلة."}</p>
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>بيانات العميل</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {visit.customers ? (
              <>
                <Info label="اسم العميل" value={visit.customers.full_name} />
                <Info label="رقم الجوال" value={visit.customers.phone} />
                <Info label="المدينة" value={visit.customers.city} />
                <Info label="الحي" value={visit.customers.district} />
                <Info label="البريد الإلكتروني" value={visit.customers.email} />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">الحالة الحالية</p>
                  <CustomerStatusBadge status={visit.customers.current_status} />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/customers/${visit.customers.id}`}>فتح ملف العميل</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">تعذر عرض بيانات العميل المرتبط.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>إجراءات سريعة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {visit.customers ? (
              <form action={updateCustomerStatusAction} className="space-y-3">
                <input type="hidden" name="customer_id" value={visit.customers.id} />
                <input type="hidden" name="return_to" value={`/visits/${visit.id}`} />
                <div className="space-y-2">
                  <Label htmlFor="current_status">تغيير حالة العميل</Label>
                  <Select id="current_status" name="current_status" defaultValue={visit.customers.current_status}>
                    {customerStatuses.map((status) => (
                      <option key={status} value={status}>{customerStatusLabels[status]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_probability">احتمالية الشراء</Label>
                  <Select id="purchase_probability" name="purchase_probability" defaultValue={visit.customers.purchase_probability ?? ""}>
                    <option value="">غير محدد</option>
                    {purchaseProbabilities.map((probability) => (
                      <option key={probability} value={probability}>{purchaseProbabilityLabels[probability]}</option>
                    ))}
                  </Select>
                </div>
                <Button type="submit">حفظ حالة العميل</Button>
              </form>
            ) : null}
            <form action={createFollowUpForCustomerAction} className="space-y-3">
              <input type="hidden" name="customer_id" value={visit.customer_id} />
              <input type="hidden" name="visit_id" value={visit.id} />
              <input type="hidden" name="return_to" value={`/visits/${visit.id}`} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="follow_up_type">نوع المتابعة</Label>
                  <Select id="follow_up_type" name="follow_up_type" defaultValue="call">
                    {followUpTypes.map((type) => (
                      <option key={type} value={type}>{followUpTypeLabels[type]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">موعد المتابعة</Label>
                  <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_employee_id">الموظف المسؤول</Label>
                <Select id="assigned_employee_id" name="assigned_employee_id" defaultValue={context.userId}>
                  {(employeesResult.data ?? []).map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              <Button type="submit"><CalendarPlus className="h-4 w-4" />إضافة متابعة</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>المتابعات المرتبطة</CardTitle></CardHeader>
          <CardContent className="p-0">
            {(followUpsResult.data ?? []).length === 0 ? (
              <EmptyState icon={CalendarPlus} title="لا توجد بيانات لعرضها" description="لا توجد متابعات مرتبطة بهذه الزيارة." className="m-6" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع المتابعة</TableHead>
                    <TableHead>الموعد</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الموظف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(followUpsResult.data ?? []).map((followUp) => (
                    <TableRow key={followUp.id}>
                      <TableCell>{followUpTypeLabels[followUp.follow_up_type as keyof typeof followUpTypeLabels] ?? "أخرى"}</TableCell>
                      <TableCell>{formatSaudiDateTime(followUp.scheduled_at)}</TableCell>
                      <TableCell><FollowUpStatusBadge status={followUp.status} /></TableCell>
                      <TableCell>{(followUp.profiles as { full_name?: string } | null)?.full_name ?? "غير محدد"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>سجل النشاط</CardTitle></CardHeader>
        <CardContent>
          {(activityResult.data ?? []).length === 0 ? (
            <EmptyState icon={Pencil} title="لا توجد بيانات لعرضها" description="لم يتم تسجيل نشاطات على هذه الزيارة بعد." />
          ) : (
            <div className="space-y-3">
              {(activityResult.data ?? []).map((activity) => (
                <div key={activity.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{activityLabel(activity.action)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatSaudiDateTime(activity.created_at)} بواسطة {(activity.profiles as { full_name?: string } | null)?.full_name ?? "النظام"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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

function toInputDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}
