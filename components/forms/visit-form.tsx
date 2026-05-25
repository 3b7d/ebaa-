"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createVisitAction } from "@/app/(dashboard)/visits/actions";
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

export function VisitForm({
  branches,
  employees,
  sources,
  categories,
  defaultBranchId,
  defaultEmployeeId,
  initialCustomer
}: VisitFormProps) {
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
    <form
      action={(formData) => startTransition(() => createVisitAction(formData))}
      className="space-y-5"
    >
      <input type="hidden" name="customer_id" value={foundCustomer?.id ?? ""} />

      {foundCustomer ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>تم العثور على عميل بنفس رقم الجوال</AlertTitle>
          <AlertDescription>
            سيتم ربط الزيارة بملف العميل الحالي وتحديث حالته بعد الحفظ.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>بيانات العميل</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الجوال</Label>
            <Input
              id="phone"
              name="phone"
              value={fields.phone}
              onBlur={checkPhone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="0500000000"
              required
            />
            {checking ? <p className="text-xs text-muted-foreground">جاري التحقق من رقم الجوال...</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">اسم العميل</Label>
            <Input
              id="full_name"
              name="full_name"
              value={fields.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">المدينة</Label>
            <Input id="city" name="city" value={fields.city} onChange={(event) => updateField("city", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">الحي</Label>
            <Input
              id="district"
              name="district"
              value={fields.district}
              onChange={(event) => updateField("district", event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="source_id">مصدر العميل</Label>
            <Select id="source_id" name="source_id" value={fields.source_id} onChange={(event) => updateField("source_id", event.target.value)}>
              <option value="">غير محدد</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الزيارة</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="branch_id">الفرع</Label>
            <Select id="branch_id" name="branch_id" value={fields.branch_id} onChange={(event) => updateField("branch_id", event.target.value)} required>
              <option value="">اختر الفرع</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sales_employee_id">موظف المبيعات</Label>
            <Select
              id="sales_employee_id"
              name="sales_employee_id"
              value={fields.assigned_employee_id}
              onChange={(event) => updateField("assigned_employee_id", event.target.value)}
              required
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="visit_datetime">تاريخ ووقت الزيارة</Label>
            <Input id="visit_datetime" name="visit_datetime" type="datetime-local" defaultValue={toLocalDateTime()} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visit_type">نوع الزيارة</Label>
            <Select id="visit_type" name="visit_type" defaultValue="showroom_visit" required>
              {visitTypes.map((type) => (
                <option key={type} value={type}>
                  {visitTypeLabels[type]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest_category_id">القسم المهتم به</Label>
            <Select id="interest_category_id" name="interest_category_id">
              <option value="">غير محدد</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requested_product">المنتجات أو الخدمة المطلوبة</Label>
            <Input id="requested_product" name="requested_product" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_range">الميزانية التقريبية</Label>
            <Input id="budget_range" name="budget_range" />
          </div>
          <div className="grid gap-3 rounded-md border p-3 md:col-span-2 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input name="has_measurements" type="checkbox" className="h-4 w-4 rounded border-input" />
              هل يوجد مخطط أو مقاسات؟
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="needs_second_visit" type="checkbox" className="h-4 w-4 rounded border-input" />
              هل يحتاج زيارة أخرى؟
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_status">حالة العميل</Label>
            <Select
              id="customer_status"
              name="customer_status"
              value={fields.customer_status}
              onChange={(event) => updateField("customer_status", event.target.value)}
            >
              {customerStatuses.map((status) => (
                <option key={status} value={status}>
                  {customerStatusLabels[status]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchase_probability">احتمالية الشراء</Label>
            <Select
              id="purchase_probability"
              name="purchase_probability"
              value={fields.purchase_probability}
              onChange={(event) => updateField("purchase_probability", event.target.value)}
            >
              <option value="">غير محدد</option>
              {purchaseProbabilities.map((probability) => (
                <option key={probability} value={probability}>
                  {purchaseProbabilityLabels[probability]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_follow_up_at">موعد المتابعة القادم</Label>
            <Input id="next_follow_up_at" name="next_follow_up_at" type="datetime-local" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">ملاحظات الزيارة</Label>
            <Textarea id="notes" name="notes" rows={4} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "جاري حفظ الزيارة..." : "تسجيل الزيارة"}
        </Button>
      </div>

      {!fields.phone || !fields.full_name ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          يتم حفظ البيانات في قاعدة البيانات وربط الزيارة بملف العميل تلقائيًا.
        </p>
      ) : null}
    </form>
  );
}
