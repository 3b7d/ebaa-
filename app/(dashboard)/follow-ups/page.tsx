import Link from "next/link";
import { CalendarPlus, CheckCircle2, Clock3, Eye, Search, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FollowUpStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  followUpStatusLabels,
  followUpStatuses,
  followUpTypeLabels,
  followUpTypes
} from "@/constants/statuses";
import { getFollowUpDisplayStatus } from "@/lib/follow-ups";
import { formatSaudiDateTime } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type FollowUpsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type FollowUpRow = {
  id: string;
  customer_id: string;
  assigned_employee_id: string;
  follow_up_type: string;
  scheduled_at: string;
  completed_at: string | null;
  result: string | null;
  status: string;
  customers: { id: string; full_name: string; phone: string; branch_id: string | null } | null;
  profiles: { full_name: string } | null;
};

const tabs = [
  { key: "today", label: "متابعات اليوم", icon: Clock3 },
  { key: "overdue", label: "متابعات متأخرة", icon: Clock3 },
  { key: "upcoming", label: "متابعات قادمة", icon: CalendarPlus },
  { key: "completed", label: "مكتملة", icon: CheckCircle2 },
  { key: "cancelled", label: "ملغاة", icon: XCircle }
] as const;

function param(searchParams: FollowUpsPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function tabToStatus(tab: string) {
  if (tab === "today") return "due_today";
  if (tab === "overdue") return "overdue";
  if (tab === "completed") return "completed";
  if (tab === "cancelled") return "cancelled";
  return "upcoming";
}

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  await requireUser();
  const supabase = createClient();
  const activeTab = param(searchParams, "tab") || "today";
  const filters = {
    employee: param(searchParams, "employee"),
    branch: param(searchParams, "branch"),
    type: param(searchParams, "type"),
    status: param(searchParams, "status"),
    date: param(searchParams, "date"),
    q: param(searchParams, "q")
  };

  const [branchesResult, employeesResult] = await Promise.all([
    supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name")
  ]);

  let scopedCustomerIds: string[] | null = null;
  if (filters.branch || filters.q) {
    let customerQuery = supabase.from("customers").select("id");
    if (filters.branch) customerQuery = customerQuery.eq("branch_id", filters.branch);
    if (filters.q) customerQuery = customerQuery.or(`full_name.ilike.%${filters.q}%,phone.ilike.%${filters.q}%`);
    const { data: matchingCustomers } = await customerQuery.limit(500);
    scopedCustomerIds = (matchingCustomers ?? []).map((customer) => customer.id);
  }

  let query = supabase
    .from("follow_ups")
    .select(
      "id, customer_id, assigned_employee_id, follow_up_type, scheduled_at, completed_at, result, status, customers(id, full_name, phone, branch_id), profiles!follow_ups_assigned_employee_id_fkey(full_name)"
    )
    .order("scheduled_at", { ascending: true })
    .limit(200);

  if (filters.employee) query = query.eq("assigned_employee_id", filters.employee);
  if (filters.type) query = query.eq("follow_up_type", filters.type);
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00`);
    const end = new Date(`${filters.date}T23:59:59`);
    query = query.gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString());
  }
  if (scopedCustomerIds) {
    query = scopedCustomerIds.length ? query.in("customer_id", scopedCustomerIds) : query.eq("customer_id", "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await query;
  const allRows = ((data ?? []) as unknown as FollowUpRow[]).map((followUp) => ({
    ...followUp,
    displayStatus: getFollowUpDisplayStatus(followUp)
  }));
  const wantedStatus = filters.status || tabToStatus(activeTab);
  const rows = allRows.filter((followUp) => followUp.displayStatus === wantedStatus);

  return (
    <div>
      <PageHeader
        title="المتابعات"
        description="إدارة مواعيد التواصل مع العملاء حسب الحالة والموظف والفرع."
        actions={
          <Button asChild>
            <Link href="/follow-ups/new">
              <CalendarPlus className="h-4 w-4" />
              إضافة متابعة
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const href = `/follow-ups?tab=${tab.key}`;
          const isActive = activeTab === tab.key;
          return (
            <Button key={tab.key} asChild variant={isActive ? "default" : "outline"} size="sm">
              <Link href={href}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            </Button>
          );
        })}
      </div>

      <Card className="mb-5">
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            <input type="hidden" name="tab" value={activeTab} />
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input name="q" defaultValue={filters.q} placeholder="بحث بالاسم أو رقم الجوال" className="pr-9" />
            </div>
            <Select name="employee" defaultValue={filters.employee}>
              <option value="">الموظف المسؤول</option>
              {(employeesResult.data ?? []).map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.full_name}</option>
              ))}
            </Select>
            <Select name="branch" defaultValue={filters.branch}>
              <option value="">الفرع</option>
              {(branchesResult.data ?? []).map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </Select>
            <Select name="type" defaultValue={filters.type}>
              <option value="">نوع المتابعة</option>
              {followUpTypes.map((type) => (
                <option key={type} value={type}>{followUpTypeLabels[type]}</option>
              ))}
            </Select>
            <Select name="status" defaultValue={filters.status}>
              <option value="">الحالة</option>
              {followUpStatuses.map((status) => (
                <option key={status} value={status}>{followUpStatusLabels[status]}</option>
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
            <div className="p-6 text-sm text-destructive">تعذر تحميل بيانات المتابعات</div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title={wantedStatus === "overdue" ? "لا توجد متابعات متأخرة" : "لا توجد بيانات لعرضها"}
              description="لا توجد متابعات مطابقة للفلاتر الحالية."
              className="m-6"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم العميل</TableHead>
                  <TableHead>رقم الجوال</TableHead>
                  <TableHead>الموظف المسؤول</TableHead>
                  <TableHead>نوع المتابعة</TableHead>
                  <TableHead>تاريخ المتابعة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>نتيجة آخر متابعة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((followUp) => (
                  <TableRow key={followUp.id}>
                    <TableCell className="font-medium">{followUp.customers?.full_name ?? "غير محدد"}</TableCell>
                    <TableCell>{followUp.customers?.phone ?? "غير محدد"}</TableCell>
                    <TableCell>{followUp.profiles?.full_name ?? "غير محدد"}</TableCell>
                    <TableCell>{followUpTypeLabels[followUp.follow_up_type as keyof typeof followUpTypeLabels] ?? "أخرى"}</TableCell>
                    <TableCell>{formatSaudiDateTime(followUp.scheduled_at)}</TableCell>
                    <TableCell><FollowUpStatusBadge status={followUp.displayStatus} /></TableCell>
                    <TableCell>{followUp.result || "لا توجد نتيجة"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/follow-ups/${followUp.id}`}><Eye className="h-4 w-4" />عرض التفاصيل</Link>
                        </Button>
                        {followUp.customers?.id ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/customers/${followUp.customers.id}`}>فتح ملف العميل</Link>
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
