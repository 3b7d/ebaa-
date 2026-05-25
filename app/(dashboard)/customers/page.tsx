import Link from "next/link";
import { Eye, FilePlus2, Pencil, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CustomerStatusBadge, PurchaseProbabilityBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  customerStatusLabels,
  customerStatuses,
  purchaseProbabilities,
  purchaseProbabilityLabels
} from "@/constants/statuses";
import { requireUser } from "@/lib/auth";
import { formatSaudiDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type CustomersPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type CustomerRow = {
  id: string;
  full_name: string;
  phone: string;
  city: string | null;
  current_status: string;
  purchase_probability: string | null;
  updated_at: string | null;
  branches: { name: string } | null;
  profiles: { full_name: string } | null;
  lead_sources: { name: string } | null;
};

function param(searchParams: CustomersPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  await requireUser();
  const supabase = createClient();
  const filters = {
    q: param(searchParams, "q"),
    branch: param(searchParams, "branch"),
    employee: param(searchParams, "employee"),
    category: param(searchParams, "category"),
    status: param(searchParams, "status"),
    source: param(searchParams, "source"),
    probability: param(searchParams, "probability"),
    createdFrom: param(searchParams, "created_from")
  };

  const [branchesResult, employeesResult, categoriesResult, sourcesResult] = await Promise.all([
    supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("interest_categories").select("id, name").eq("is_active", true).order("name"),
    supabase.from("lead_sources").select("id, name").eq("is_active", true).order("name")
  ]);

  let customerIdsByCategory: string[] | null = null;
  if (filters.category) {
    const { data } = await supabase
      .from("visits")
      .select("customer_id")
      .eq("interest_category_id", filters.category);
    customerIdsByCategory = Array.from(new Set((data ?? []).map((visit) => visit.customer_id)));
  }

  let query = supabase
    .from("customers")
    .select(
      "id, full_name, phone, city, current_status, purchase_probability, updated_at, created_at, branches(name), profiles!customers_assigned_employee_id_fkey(full_name), lead_sources(name)"
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (filters.q) query = query.or(`full_name.ilike.%${filters.q}%,phone.ilike.%${filters.q}%`);
  if (filters.branch) query = query.eq("branch_id", filters.branch);
  if (filters.employee) query = query.eq("assigned_employee_id", filters.employee);
  if (filters.status) query = query.eq("current_status", filters.status);
  if (filters.source) query = query.eq("source_id", filters.source);
  if (filters.probability) query = query.eq("purchase_probability", filters.probability);
  if (filters.createdFrom) query = query.gte("created_at", filters.createdFrom);
  if (customerIdsByCategory) {
    query = customerIdsByCategory.length ? query.in("id", customerIdsByCategory) : query.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { data: customers, error } = await query;
  const rows = (customers ?? []) as unknown as CustomerRow[];
  const customerIds = rows.map((customer) => customer.id);

  const [visitsResult, followUpsResult] = customerIds.length
    ? await Promise.all([
        supabase
          .from("visits")
          .select("customer_id, visit_datetime")
          .in("customer_id", customerIds)
          .order("visit_datetime", { ascending: false }),
        supabase
          .from("follow_ups")
          .select("customer_id, scheduled_at, status")
          .in("customer_id", customerIds)
          .neq("status", "completed")
          .order("scheduled_at", { ascending: true })
      ])
    : [{ data: [] }, { data: [] }];

  const latestVisitByCustomer = new Map<string, string>();
  for (const visit of visitsResult.data ?? []) {
    if (!latestVisitByCustomer.has(visit.customer_id)) latestVisitByCustomer.set(visit.customer_id, visit.visit_datetime);
  }

  const nextFollowUpByCustomer = new Map<string, string>();
  for (const followUp of followUpsResult.data ?? []) {
    if (!nextFollowUpByCustomer.has(followUp.customer_id)) {
      nextFollowUpByCustomer.set(followUp.customer_id, followUp.scheduled_at);
    }
  }

  return (
    <div>
      <PageHeader
        title="العملاء"
        description="إدارة العملاء المسجلين ومتابعة حالاتهم واهتماماتهم."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/visits/new">
                <FilePlus2 className="h-4 w-4" />
                تسجيل زيارة جديدة
              </Link>
            </Button>
            <Button asChild>
              <Link href="/customers/new">
                <Plus className="h-4 w-4" />
                إضافة عميل
              </Link>
            </Button>
          </>
        }
      />

      <Card className="surface-card mb-5">
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            <div className="relative md:col-span-2 xl:col-span-2">
              <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input name="q" defaultValue={filters.q} placeholder="بحث بالاسم أو رقم الجوال" className="pr-9" />
            </div>
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
            <Select name="category" defaultValue={filters.category}>
              <option value="">القسم المهتم</option>
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
            <Select name="source" defaultValue={filters.source}>
              <option value="">مصدر العميل</option>
              {(sourcesResult.data ?? []).map((source) => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </Select>
            <Select name="probability" defaultValue={filters.probability}>
              <option value="">احتمالية الشراء</option>
              {purchaseProbabilities.map((probability) => (
                <option key={probability} value={probability}>{purchaseProbabilityLabels[probability]}</option>
              ))}
            </Select>
            <Input name="created_from" defaultValue={filters.createdFrom} type="date" aria-label="تاريخ الإنشاء" />
            <Button type="submit">تطبيق الفلاتر</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-sm text-destructive">تعذر تحميل بيانات العملاء</div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Search}
              title="لا يوجد عملاء"
              description="ابدأ بإضافة أول عميل أو تسجيل زيارة جديدة."
              className="m-6"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العميل</TableHead>
                  <TableHead>رقم الجوال</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>موظف المبيعات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>احتمالية الشراء</TableHead>
                  <TableHead>آخر زيارة</TableHead>
                  <TableHead>موعد المتابعة القادم</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{customer.full_name.slice(0,2)}</div><div><p className="font-semibold">{customer.full_name}</p><p className="text-xs text-muted-foreground">{customer.city ?? "بدون مدينة"}</p></div></div></TableCell>
                    <TableCell>{customer.phone}</TableCell>
                                        <TableCell>{customer.branches?.name ?? "غير محدد"}</TableCell>
                    <TableCell>{customer.profiles?.full_name ?? "غير محدد"}</TableCell>
                    <TableCell><CustomerStatusBadge status={customer.current_status} /></TableCell>
                    <TableCell><PurchaseProbabilityBadge probability={customer.purchase_probability} /></TableCell>
                    <TableCell>{formatSaudiDateTime(latestVisitByCustomer.get(customer.id))}</TableCell>
                    <TableCell>{formatSaudiDateTime(nextFollowUpByCustomer.get(customer.id))}</TableCell>
                                        <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/customers/${customer.id}`}><Eye className="h-4 w-4" />عرض التفاصيل</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/customers/${customer.id}?edit=1`}><Pencil className="h-4 w-4" />تعديل</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/customers/${customer.id}#follow-up-form`}>إضافة متابعة</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/visits/new?customer_id=${customer.id}`}>تسجيل زيارة جديدة</Link>
                        </Button>
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
