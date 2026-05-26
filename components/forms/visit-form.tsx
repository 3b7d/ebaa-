"use client";

import Link from "next/link";
import { type ComponentType, useState, useTransition } from "react";
import { CheckCircle2, ClipboardList, Clock4, Loader2, NotebookPen, Sparkles, UserRound } from "lucide-react";
import { createVisitAction } from "@/app/(dashboard)/visits/actions";
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
  purchaseProbabilityLabels,
  visitTypeLabels,
  visitTypes
} from "@/constants/statuses";

type Lookup = { id: string; name: string };
type Employee = { id: string; full_name: string; branch_id: string | null };
type CustomerLookup = {
  id: string;
  full_name: string;
  phone: string;
  city: string | null;
  district: string | null;
  source_id: string | null;
  branch_id: string | null;
  assigned_employee_id: string | null;
  current_status: string;
  purchase_probability: string | null;
};

type VisitFormProps = {
  branches: Lookup[];
  employees: Employee[];
  sources: Lookup[];
  categories: Lookup[];
  defaultBranchId: string | null;
  defaultEmployeeId: string;
  initialCustomer: CustomerLookup | null;
};

function toLocalDateTime(value = new Date()) {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function SectionHeader({ icon: Icon, title, helper }: { icon: ComponentType<{ className?: string }>; title: string; helper: string }) {
  return (
    <CardHeader className="space-y-2 pb-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <CardTitle className="text-base font-bold md:text-lg">{title}</CardTitle>
      </div>
      <p className="text-sm text-muted-foreground">{helper}</p>
    </CardHeader>
  );
}

export function VisitForm({ branches, employees, sources, categories, defaultBranchId, defaultEmployeeId, initialCustomer }: VisitFormProps) {
  const [isPending, startTransition] = useTransition();
  const [checking, setChecking] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<CustomerLookup | null>(initialCustomer);
  const [fields, setFields] = useState({
    full_name: initialCustomer?.full_name ?? "",
    phone: initialCustomer?.phone ?? "",
    city: initialCustomer?.city ?? "",
    district: initialCustomer?.district ?? "",
    source_id: initialCustomer?.source_id ?? "",
    branch_id: initialCustomer?.branch_id ?? defaultBranchId ?? "",
    assigned_employee_id: initialCustomer?.assigned_employee_id ?? defaultEmployeeId,
    customer_status: initialCustomer?.current_status ?? "new",
    purchase_probability: initialCustomer?.purchase_probability ?? ""
  });

  async function checkPhone() {
    if (!fields.phone || fields.phone.length < 5) return;
    setChecking(true);
    const response = await fetch(`/api/customers/by-phone?phone=${encodeURIComponent(fields.phone)}`);
    const payload = (await response.json()) as { customer: CustomerLookup | null };
    setChecking(false);

    if (payload.customer) {
      setFoundCustomer(payload.customer);
      setFields((current) => ({
        ...current,
        full_name: payload.customer?.full_name ?? current.full_name,
        city: payload.customer?.city ?? current.city,
        district: payload.customer?.district ?? current.district,
        source_id: payload.customer?.source_id ?? current.source_id,
        branch_id: payload.customer?.branch_id ?? current.branch_id,
        assigned_employee_id: payload.customer?.assigned_employee_id ?? current.assigned_employee_id,
        customer_status: payload.customer?.current_status ?? current.customer_status,
        purchase_probability: payload.customer?.purchase_probability ?? current.purchase_probability
      }));
    } else {
      setFoundCustomer(null);
    }
  }

  function updateField(name: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  return (
    <form action={(formData) => startTransition(() => createVisitAction(formData))} className="space-y-5 pb-28">
      <input type="hidden" name="customer_id" value={foundCustomer?.id ?? ""} />

      <Card className="surface-card overflow-hidden rounded-2xl border-border/70">
        <SectionHeader icon={UserRound} title="١. بيانات العميل" helper="أدخل بيانات العميل الأساسية أو ابحث برقم الجوال إذا كان مسجلًا مسبقًا" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الجوال <span className="text-primary">*</span></Label>
            <Input id="phone" name="phone" value={fields.phone} onBlur={checkPhone} onChange={(event) => updateField("phone", event.target.value)} placeholder="0500000000" required className="h-11 rounded-xl" />
            {checking ? <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />يتم التحقق من رقم الجوال...</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">اسم العميل <span className="text-primary">*</span></Label>
            <Input id="full_name" name="full_name" value={fields.full_name} onChange={(event) => updateField("full_name", event.target.value)} required className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">المدينة</Label>
            <Input id="city" name="city" value={fields.city} onChange={(event) => updateField("city", event.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">الحي</Label>
            <Input id="district" name="district" value={fields.district} onChange={(event) => updateField("district", event.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="source_id">مصدر العميل</Label>
            <Select id="source_id" name="source_id" value={fields.source_id} onChange={(event) => updateField("source_id", event.target.value)} className="h-11 rounded-xl">
              <option value="">غير محدد</option>
              {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
            </Select>
          </div>

          {foundCustomer ? (
            <div className="md:col-span-2 rounded-2xl border border-emerald-300/60 bg-emerald-50/80 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <p className="mb-2 font-semibold text-emerald-800 dark:text-emerald-200">تم العثور على عميل مسجل بهذا الرقم</p>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <p>اسم العميل: <span className="font-medium">{foundCustomer.full_name}</span></p><p>رقم الجوال: <span className="font-medium">{foundCustomer.phone}</span></p>
                <p>الفرع: <span className="font-medium">{branches.find((branch) => branch.id === foundCustomer.branch_id)?.name ?? "غير محدد"}</span></p>
                <p>الموظف المسؤول: <span className="font-medium">{employees.find((employee) => employee.id === foundCustomer.assigned_employee_id)?.full_name ?? "غير محدد"}</span></p>
                <p className="md:col-span-2">الحالة: <span className="font-medium">{customerStatusLabels[foundCustomer.current_status as keyof typeof customerStatusLabels] ?? "غير محدد"}</span></p>
              </div>
              <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">سيتم ربط هذه الزيارة بالعميل الحالي بدل إنشاء عميل مكرر.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" asChild size="sm" variant="outline"><Link href={`/customers/${foundCustomer.id}`}>عرض ملف العميل</Link></Button>
                <Button type="button" size="sm" variant="ghost" disabled>متابعة تسجيل الزيارة</Button>
              </div>
            </div>
          ) : fields.phone.length >= 5 && !checking ? (
            <p className="md:col-span-2 text-sm text-muted-foreground">سيتم إنشاء عميل جديد بهذا الرقم.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="surface-card rounded-2xl border-border/70">
        <SectionHeader icon={ClipboardList} title="٢. بيانات الزيارة" helper="حدد الفرع والموظف ونوع الزيارة وتوقيتها" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="branch_id">الفرع <span className="text-primary">*</span></Label><Select id="branch_id" name="branch_id" value={fields.branch_id} onChange={(event) => updateField("branch_id", event.target.value)} required className="h-11 rounded-xl"><option value="">اختر الفرع</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Select></div>
          <div className="space-y-2"><Label htmlFor="sales_employee_id">موظف المبيعات <span className="text-primary">*</span></Label><Select id="sales_employee_id" name="sales_employee_id" value={fields.assigned_employee_id} onChange={(event) => updateField("assigned_employee_id", event.target.value)} required className="h-11 rounded-xl">{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}</Select></div>
          <div className="space-y-2"><Label htmlFor="visit_datetime">تاريخ ووقت الزيارة</Label><Input id="visit_datetime" name="visit_datetime" type="datetime-local" defaultValue={toLocalDateTime()} required className="h-11 rounded-xl" /></div>
          <div className="space-y-2"><Label htmlFor="visit_type">نوع الزيارة</Label><Select id="visit_type" name="visit_type" defaultValue="showroom_visit" required className="h-11 rounded-xl">{visitTypes.map((type) => <option key={type} value={type}>{visitTypeLabels[type]}</option>)}</Select></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="interest_category_id">القسم المهتم به <span className="text-primary">*</span></Label><Select id="interest_category_id" name="interest_category_id" required className="h-11 rounded-xl"><option value="">غير محدد</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div>
        </CardContent>
      </Card>

      <Card className="surface-card rounded-2xl border-border/70">
        <SectionHeader icon={Sparkles} title="٣. الاهتمام والميزانية" helper="سجل اهتمام العميل والمنتجات المطلوبة والميزانية المتوقعة" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2"><Label htmlFor="requested_product">المنتجات أو الخدمة المطلوبة</Label><Input id="requested_product" name="requested_product" className="h-11 rounded-xl" /></div>
          <div className="space-y-2"><Label htmlFor="budget_range">الميزانية التقريبية</Label><Input id="budget_range" name="budget_range" className="h-11 rounded-xl" /></div>
          <div className="space-y-2"><Label htmlFor="customer_status">حالة العميل</Label><Select id="customer_status" name="customer_status" value={fields.customer_status} onChange={(event) => updateField("customer_status", event.target.value)} className="h-11 rounded-xl">{customerStatuses.map((status) => <option key={status} value={status}>{customerStatusLabels[status]}</option>)}</Select></div>
          <div className="space-y-2"><Label htmlFor="purchase_probability">احتمالية الشراء</Label><Select id="purchase_probability" name="purchase_probability" value={fields.purchase_probability} onChange={(event) => updateField("purchase_probability", event.target.value)} className="h-11 rounded-xl"><option value="">غير محدد</option>{purchaseProbabilities.map((p) => <option key={p} value={p}>{purchaseProbabilityLabels[p]}</option>)}</Select></div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3 transition hover:border-primary/40">
            <input name="has_measurements" type="checkbox" className="mt-1 h-4 w-4 rounded border-input" />
            <span><span className="block text-sm font-medium">هل يوجد مخطط أو مقاسات؟</span><span className="text-xs text-muted-foreground">لدى العميل مخطط أو مقاسات يمكن الاعتماد عليها</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3 transition hover:border-primary/40">
            <input name="needs_second_visit" type="checkbox" className="mt-1 h-4 w-4 rounded border-input" />
            <span><span className="block text-sm font-medium">هل يحتاج زيارة أخرى؟</span><span className="text-xs text-muted-foreground">يرغب العميل بزيارة أخرى أو يحتاج موعدًا إضافيًا</span></span>
          </label>
        </CardContent>
      </Card>

      <Card className="surface-card rounded-2xl border-border/70">
        <SectionHeader icon={Clock4} title="٤. المتابعة القادمة" helper="حدد موعد المتابعة ليتم إنشاء تذكير تلقائي للموظف المسؤول" />
        <CardContent><div className="space-y-2"><Label htmlFor="next_follow_up_at">موعد المتابعة القادم</Label><Input id="next_follow_up_at" name="next_follow_up_at" type="datetime-local" className="h-11 rounded-xl" /></div></CardContent>
      </Card>

      <Card className="surface-card rounded-2xl border-border/70">
        <SectionHeader icon={NotebookPen} title="٥. الملاحظات" helper="أضف أي تفاصيل مهمة تساعد الفريق في المتابعة" />
        <CardContent><div className="space-y-2"><Label htmlFor="notes">ملاحظات الزيارة</Label><Textarea id="notes" name="notes" rows={4} className="rounded-xl" /></div></CardContent>
      </Card>

      <div className="sticky bottom-3 z-20 rounded-2xl border border-border/60 bg-background/90 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" asChild><Link href="/visits">إلغاء / الرجوع</Link></Button>
          <Button type="submit" disabled={isPending}>{isPending ? "جاري حفظ الزيارة..." : "تسجيل الزيارة"}</Button>
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" />يتم حفظ البيانات وربط الزيارة بملف العميل تلقائيًا وفق الصلاحيات.</p>
    </form>
  );
}
