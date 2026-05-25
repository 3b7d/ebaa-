import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarPlus, FilePlus2, LockKeyhole, Pencil } from "lucide-react";
import {
  createFollowUpForCustomerAction,
  updateCustomerAction,
  updateCustomerStatusAction
} from "@/app/(dashboard)/customers/actions";
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
  visitTypeLabels
} from "@/constants/statuses";
import { requireUser } from "@/lib/auth";
import { activityLabel, formatSaudiDateTime, shortId } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type CustomerDetailsPageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

type CustomerDetails = {
  id: string;
  full_name: string;
  phone: string;
  secondary_phone: string | null;
  city: string | null;
  district: string | null;
  email: string | null;
  current_status: string;
  purchase_probability: string | null;
  general_notes: string | null;
  source_id: string | null;
  branch_id: string | null;
  assigned_employee_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  branches: { name: string } | null;
  profiles: { full_name: string } | null;
  lead_sources: { name: string } | null;
};

function param(searchParams: CustomerDetailsPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function CustomerDetailsPage({ params, searchParams }: CustomerDetailsPageProps) {
  const context = await requireUser();
  const supabase = createClient();
  const success = param(searchParams, "success");
  const error = param(searchParams, "error");
  const isEditMode = param(searchParams, "edit") === "1";

  const { data } = await supabase
    .from("customers")
    .select(
      "id, full_name, phone, secondary_phone, city, district, email, source_id, branch_id, assigned_employee_id, current_status, purchase_probability, general_notes, created_at, updated_at, branches(name), profiles!customers_assigned_employee_id_fkey(full_name), lead_sources(name)"
    )
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const customer = data as unknown as CustomerDetails;

  const [visitsResult, followUpsResult, activityResult, employeesResult, branchesResult, sourcesResult] = await Promise.all([
    supabase
      .from("visits")
      .select("id, visit_datetime, visit_type, customer_status, purchase_probability, next_follow_up_at, notes, interest_categories(name), branches(name), profiles!visits_sales_employee_id_fkey(full_name)")
      .eq("customer_id", params.id)
      .order("visit_datetime", { ascending: false })
      .limit(20),
    supabase
      .from("follow_ups")
      .select("id, follow_up_type, scheduled_at, completed_at, status, result, notes, profiles!follow_ups_assigned_employee_id_fkey(full_name)")
      .eq("customer_id", params.id)
      .order("scheduled_at", { ascending: false })
      .limit(20),
    supabase
      .from("activity_logs")
      .select("id, action, created_at, profiles!activity_logs_performed_by_fkey(full_name)")
      .eq("entity_id", params.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
    supabase.from("lead_sources").select("id, name").eq("is_active", true).order("name")
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={customer.full_name}
        description="ملف العميل الكامل والزيارات والمتابعات وسجل النشاط."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/customers"><ArrowRight className="h-4 w-4" />العودة للعملاء</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/visits/new?customer_id=${customer.id}`}><FilePlus2 className="h-4 w-4" />تسجيل زيارة جديدة</Link>
            </Button>
            <Button asChild>
              <Link href="#follow-up-form"><CalendarPlus className="h-4 w-4" />إضافة متابعة</Link>
            </Button>
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

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>بيانات العميل</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={isEditMode ? `/customers/${customer.id}` : "?edit=1"}>
                <Pencil className="h-4 w-4" />
                {isEditMode ? "إلغاء التعديل" : "تعديل بيانات العميل"}
              </Link>
            </Button>
          </CardHeader>
          {isEditMode ? (
            <CardContent>
              <form action={updateCustomerAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="customer_id" value={customer.id} />
                <div className="space-y-2">
                  <Label htmlFor="full_name">اسم العميل</Label>
                  <Input id="full_name" name="full_name" defaultValue={customer.full_name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الجوال</Label>
                  <Input id="phone" name="phone" defaultValue={customer.phone} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_phone">رقم جوال إضافي</Label>
                  <Input id="secondary_phone" name="secondary_phone" defaultValue={customer.secondary_phone ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" name="email" type="email" defaultValue={customer.email ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input id="city" name="city" defaultValue={customer.city ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">الحي</Label>
                  <Input id="district" name="district" defaultValue={customer.district ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source_id">مصدر العميل</Label>
                  <Select id="source_id" name="source_id" defaultValue={customer.source_id ?? ""}>
                    <option value="">غير محدد</option>
                    {(sourcesResult.data ?? []).map((source) => (
                      <option key={source.id} value={source.id}>{source.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch_id">الفرع</Label>
                  <Select id="branch_id" name="branch_id" defaultValue={customer.branch_id ?? ""}>
                    <option value="">غير محدد</option>
                    {(branchesResult.data ?? []).map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_employee_id">موظف المبيعات المسؤول</Label>
                  <Select id="assigned_employee_id" name="assigned_employee_id" defaultValue={customer.assigned_employee_id ?? context.userId}>
                    {(employeesResult.data ?? []).map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_status_edit">الحالة</Label>
                  <Select id="current_status_edit" name="current_status" defaultValue={customer.current_status}>
                    {customerStatuses.map((status) => (
                      <option key={status} value={status}>{customerStatusLabels[status]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_probability_edit">احتمالية الشراء</Label>
                  <Select id="purchase_probability_edit" name="purchase_probability" defaultValue={customer.purchase_probability ?? ""}>
                    <option value="">غير محدد</option>
                    {purchaseProbabilities.map((probability) => (
                      <option key={probability} value={probability}>{purchaseProbabilityLabels[probability]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="general_notes">ملاحظات عامة</Label>
                  <Textarea id="general_notes" name="general_notes" defaultValue={customer.general_notes ?? ""} rows={4} />
                </div>
                <div className="flex justify-end md:col-span-2">
                  <Button type="submit">حفظ التعديلات</Button>
                </div>
              </form>
            </CardContent>
          ) : (
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Info label="رقم الجوال" value={customer.phone} />
              <Info label="رقم جوال إضافي" value={customer.secondary_phone} />
              <Info label="المدينة" value={customer.city} />
              <Info label="الحي" value={customer.district} />
              <Info label="البريد الإلكتروني" value={customer.email} />
              <Info label="مصدر العميل" value={customer.lead_sources?.name} />
              <Info label="الفرع" value={customer.branches?.name} />
              <Info label="موظف المبيعات" value={customer.profiles?.full_name} />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">الحالة</p>
                <CustomerStatusBadge status={customer.current_status} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">احتمالية الشراء</p>
                <PurchaseProbabilityBadge probability={customer.purchase_probability} />
              </div>
              <Info label="تاريخ الإنشاء" value={formatSaudiDateTime(customer.created_at)} />
              <Info label="آخر تحديث" value={formatSaudiDateTime(customer.updated_at)} />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={updateCustomerStatusAction} className="space-y-3">
              <input type="hidden" name="customer_id" value={customer.id} />
              <input type="hidden" name="return_to" value={`/customers/${customer.id}`} />
              <div className="space-y-2">
                <Label htmlFor="current_status">تغيير الحالة</Label>
                <Select id="current_status" name="current_status" defaultValue={customer.current_status}>
                  {customerStatuses.map((status) => (
                    <option key={status} value={status}>{customerStatusLabels[status]}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_probability">احتمالية الشراء</Label>
                <Select id="purchase_probability" name="purchase_probability" defaultValue={customer.purchase_probability ?? ""}>
                  <option value="">غير محدد</option>
                  {purchaseProbabilities.map((probability) => (
                    <option key={probability} value={probability}>{purchaseProbabilityLabels[probability]}</option>
                  ))}
                </Select>
              </div>
              <Button type="submit" className="w-full">حفظ الحالة</Button>
            </form>
            <form action={updateCustomerStatusAction}>
              <input type="hidden" name="customer_id" value={customer.id} />
              <input type="hidden" name="current_status" value="closed" />
              <input type="hidden" name="purchase_probability" value={customer.purchase_probability ?? ""} />
              <input type="hidden" name="return_to" value={`/customers/${customer.id}`} />
              <Button type="submit" variant="outline" className="w-full">
                <LockKeyhole className="h-4 w-4" />
                إغلاق العميل
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>الزيارات السابقة</CardTitle></CardHeader>
        <CardContent className="p-0">
          {(visitsResult.data ?? []).length === 0 ? (
            <EmptyState icon={FilePlus2} title="لا توجد زيارات مسجلة اليوم" description="لم يتم تسجيل زيارات لهذا العميل بعد." className="m-6" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الزيارة</TableHead>
                  <TableHead>تاريخ الزيارة</TableHead>
                  <TableHead>نوع الزيارة</TableHead>
                  <TableHead>القسم المهتم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>موعد المتابعة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(visitsResult.data ?? []).map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{shortId(visit.id)}</TableCell>
                    <TableCell>{formatSaudiDateTime(visit.visit_datetime)}</TableCell>
                    <TableCell>{visitTypeLabels[visit.visit_type as keyof typeof visitTypeLabels] ?? "غير محدد"}</TableCell>
                    <TableCell>{(visit.interest_categories as { name?: string } | null)?.name ?? "غير محدد"}</TableCell>
                    <TableCell><CustomerStatusBadge status={visit.customer_status} /></TableCell>
                    <TableCell>{formatSaudiDateTime(visit.next_follow_up_at)}</TableCell>
                    <TableCell><Button asChild variant="ghost" size="sm"><Link href={`/visits/${visit.id}`}>فتح الزيارة</Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>المتابعات</CardTitle></CardHeader>
          <CardContent className="p-0">
            {(followUpsResult.data ?? []).length === 0 ? (
              <EmptyState icon={CalendarPlus} title="لا توجد بيانات لعرضها" description="لا توجد متابعات مرتبطة بهذا العميل." className="m-6" />
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

        <Card id="follow-up-form">
          <CardHeader><CardTitle>إضافة متابعة</CardTitle></CardHeader>
          <CardContent>
            <form action={createFollowUpForCustomerAction} className="space-y-4">
              <input type="hidden" name="customer_id" value={customer.id} />
              <input type="hidden" name="return_to" value={`/customers/${customer.id}`} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="follow_up_type">نوع المتابعة</Label>
                  <Select id="follow_up_type" name="follow_up_type" defaultValue="call">
                    {followUpTypes.map((type) => (
                      <option key={type} value={type}>{followUpTypeLabels[type]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">الموعد</Label>
                  <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="assigned_employee_id">الموظف المسؤول</Label>
                  <Select id="assigned_employee_id" name="assigned_employee_id" defaultValue={context.userId}>
                    {(employeesResult.data ?? []).map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
              </div>
              <Button type="submit">إضافة المتابعة</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>الملاحظات</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {customer.general_notes || "لا توجد ملاحظات مسجلة لهذا العميل."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>سجل النشاط</CardTitle></CardHeader>
          <CardContent>
            {(activityResult.data ?? []).length === 0 ? (
              <EmptyState icon={Pencil} title="لا توجد بيانات لعرضها" description="لم يتم تسجيل نشاطات على هذا العميل بعد." />
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
