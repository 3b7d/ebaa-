import Link from "next/link";
import { Eye, FilePlus2, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CustomerStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { customerStatusLabels, customerStatuses, visitTypeLabels, visitTypes } from "@/constants/statuses";
import { requireUser } from "@/lib/auth";
import { formatSaudiDateTime, shortId } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type VisitsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type VisitRow = {
  id: string;
  visit_datetime: string;
  visit_type: string;
  customer_status: string;
  next_follow_up_at: string | null;
  customers: { id: string; full_name: string; phone: string } | null;
  branches: { name: string } | null;
  profiles: { full_name: string } | null;
  interest_categories: { name: string } | null;
};

function param(searchParams: VisitsPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function VisitsPage({ searchParams }: VisitsPageProps) {
  await requireUser();
  const supabase = createClient();
  const filters = {
    branch: param(searchParams, "branch"),
    employee: param(searchParams, "employee"),
    visitType: param(searchParams, "visit_type"),
    category: param(searchParams, "category"),
    status: param(searchParams, "status"),
    date: param(searchParams, "date")
  };

  const [branchesResult, employeesResult, categoriesResult] = await Promise.all([
    supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("interest_categories").select("id, name").eq("is_active", true).order("name")
  ]);

  let query = supabase
    .from("visits")
    .select(
      "id, visit_datetime, visit_type, customer_status, next_follow_up_at, customers(id, full_name, phone), branches(name), profiles!visits_sales_employee_id_fkey(full_name), interest_categories(name)"
    )
    .order("visit_datetime", { ascending: false })
    .limit(100);

  if (filters.branch) query = query.eq("branch_id", filters.branch);
  if (filters.employee) query = query.eq("sales_employee_id", filters.employee);
  if (filters.visitType) query = query.eq("visit_type", filters.visitType);
  if (filters.category) query = query.eq("interest_category_id", filters.category);
  if (filters.status) query = query.eq("customer_status", filters.status);
  if (filters.date) {
    const todayKey = filters.date === "today" ? new Date().toISOString().slice(0, 10) : filters.date;
    const start = new Date(`${todayKey}T00:00:00`);
    const end = new Date(`${todayKey}T23:59:59`);
    query = query.gte("visit_datetime", start.toISOString()).lte("visit_datetime", end.toISOString());
  }

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as VisitRow[];

  return (
    <div>
      <PageHeader
        title="الزيارات"
        description="متابعة جميع زيارات المعارض والاتصالات والقنوات المرتبطة بالعملاء."
        actions={
          <Button asChild>
            <Link href="/visits/new">
              <FilePlus2 className="h-4 w-4" />
              تسجيل زيارة جديدة
            </Link>
          </Button>
        }
      />

      <Card className="mb-5">
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            <Select name="branch" defaultValue={filters.branch}>
              <option value="">الفرع</option>
              {(branchesResult.data ?? []).map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </Select>
            <Select name="employee" defaultValue={filters.employee}>
              <option value="">موظف المبيعات</option>
              {(employeesResult.data ?? []).map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.full_name}</option>
              ))}
            </Select>
            <Select name="visit_type" defaultValue={filters.visitType}>
              <option value="">نوع الزيارة</option>
              {visitTypes.map((type) => (
                <option key={type} value={type}>{visitTypeLabels[type]}</option>
              ))}
            </Select>
            <Select name="category" defaultValue={filters.category}>
              <option value="">القسم</option>
              {(categoriesResult.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Select>
            <Select name="status" defaultValue={filters.status}>
              <option value="">الحالة</option>
              {customerStatuses.map((status) => (
                <option key={status} value={status}>{customerStatusLabels[status]}</option>
              ))}
            </Select>
            <Input name="date" defaultValue={filters.date} type="date" aria-label="التاريخ" />
            <Button type="submit">تطبيق الفلاتر</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-sm text-destructive">تعذر تحميل بيانات الزيارات</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={Search} title="لا توجد بيانات لعرضها" description="لا توجد زيارات مطابقة للفلاتر الحالية." className="m-6" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الزيارة</TableHead>
                  <TableHead>اسم العميل</TableHead>
                  <TableHead>رقم الجوال</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>موظف المبيعات</TableHead>
                  <TableHead>تاريخ الزيارة</TableHead>
                  <TableHead>نوع الزيارة</TableHead>
                  <TableHead>القسم المهتم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>موعد المتابعة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{shortId(visit.id)}</TableCell>
                    <TableCell className="font-medium">{visit.customers?.full_name ?? "غير محدد"}</TableCell>
                    <TableCell>{visit.customers?.phone ?? "غير محدد"}</TableCell>
                    <TableCell>{visit.branches?.name ?? "غير محدد"}</TableCell>
                    <TableCell>{visit.profiles?.full_name ?? "غير محدد"}</TableCell>
                    <TableCell>{formatSaudiDateTime(visit.visit_datetime)}</TableCell>
                    <TableCell>{visitTypeLabels[visit.visit_type as keyof typeof visitTypeLabels] ?? "غير محدد"}</TableCell>
                    <TableCell>{visit.interest_categories?.name ?? "غير محدد"}</TableCell>
                    <TableCell><CustomerStatusBadge status={visit.customer_status} /></TableCell>
                    <TableCell>{formatSaudiDateTime(visit.next_follow_up_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/visits/${visit.id}`}><Eye className="h-4 w-4" />عرض التفاصيل</Link>
                        </Button>
                        {visit.customers?.id ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/customers/${visit.customers.id}`}>فتح ملف العميل</Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
