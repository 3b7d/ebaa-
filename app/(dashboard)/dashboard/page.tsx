import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  Clock3,
  FileBarChart,
  Plus,
  Store,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";
import {
  DashboardBarChart,
  DashboardLineChart,
  DashboardPieChart,
  type ChartPoint,
  type TrendPoint
} from "@/components/charts/dashboard-charts";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { DashboardDataTable } from "@/components/tables/dashboard-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  customerStatusBadge,
  customerStatusLabels,
  followUpStatusBadge,
  followUpStatusLabels,
  followUpTypeLabels,
  isCustomerStatus,
  isFollowUpStatus,
  isFollowUpType,
  isPurchaseProbability,
  isVisitType,
  purchaseProbabilityLabels,
  visitTypeLabels
} from "@/lib/constants";
import type { AppRole, Customer, FollowUp, Profile, Visit } from "@/lib/database.types";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatArabicDateTime, formatNumber } from "@/lib/utils";

type CustomerRow = Pick<
  Customer,
  | "id"
  | "full_name"
  | "phone"
  | "current_status"
  | "purchase_probability"
  | "created_at"
  | "branch_id"
  | "assigned_employee_id"
  | "created_by"
  | "source_id"
>;

type VisitRow = Pick<
  Visit,
  | "id"
  | "customer_id"
  | "branch_id"
  | "sales_employee_id"
  | "visit_datetime"
  | "visit_type"
  | "interest_category_id"
  | "customer_status"
  | "purchase_probability"
  | "requested_product"
  | "created_by"
>;

type FollowUpRow = Pick<
  FollowUp,
  | "id"
  | "customer_id"
  | "assigned_employee_id"
  | "follow_up_type"
  | "scheduled_at"
  | "status"
  | "result"
  | "created_by"
>;

type ProfileRow = Pick<Profile, "id" | "full_name" | "role" | "branch_id">;

const customerSelect =
  "id,full_name,phone,current_status,purchase_probability,created_at,branch_id,assigned_employee_id,created_by,source_id";
const visitSelect =
  "id,customer_id,branch_id,sales_employee_id,visit_datetime,visit_type,interest_category_id,customer_status,purchase_probability,requested_product,created_by";
const followUpSelect =
  "id,customer_id,assigned_employee_id,follow_up_type,scheduled_at,status,result,created_by";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function iso(date: Date) {
  return date.toISOString();
}

function isToday(value: string) {
  const day = startOfDay();
  const nextDay = addDays(day, 1);
  const date = new Date(value);
  return date >= day && date < nextDay;
}

function isOverdue(followUp: FollowUpRow) {
  return followUp.status !== "completed" && followUp.status !== "cancelled" && new Date(followUp.scheduled_at) < startOfDay();
}

function isDueToday(followUp: FollowUpRow) {
  return followUp.status !== "completed" && followUp.status !== "cancelled" && isToday(followUp.scheduled_at);
}

function countBy<T>(rows: T[], getKey: (row: T) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = getKey(row);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function toChartPoints(counts: Map<string, number>, labels: Map<string, string> | Record<string, string>) {
  return Array.from(counts.entries())
    .map(([key, value]) => ({
      name: labels instanceof Map ? labels.get(key) ?? "غير محدد" : labels[key] ?? "غير محدد",
      value
    }))
    .filter((point) => point.value > 0)
    .sort((a, b) => b.value - a.value);
}

function customerName(customerMap: Map<string, CustomerRow>, id: string) {
  return customerMap.get(id)?.full_name ?? "غير محدد";
}

function employeeName(profileMap: Map<string, string>, id: string | null) {
  return id ? profileMap.get(id) ?? "غير محدد" : "غير محدد";
}

function statusBadge(statusValue: string) {
  const status = isCustomerStatus(statusValue) ? statusValue : "new";
  return <Badge variant={customerStatusBadge[status]}>{customerStatusLabels[status]}</Badge>;
}

function followUpStatusBadgeCell(statusValue: string) {
  const status = isFollowUpStatus(statusValue) ? statusValue : "upcoming";
  return <Badge variant={followUpStatusBadge[status]}>{followUpStatusLabels[status]}</Badge>;
}

function quickActions(role: AppRole) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <Link href="/visits">
          <CalendarCheck className="h-4 w-4" />
          تسجيل زيارة جديدة
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/customers">
          <UserPlus className="h-4 w-4" />
          إضافة عميل
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/follow-ups">
          <Clock3 className="h-4 w-4" />
          عرض المتابعات
        </Link>
      </Button>
      {role !== "sales_employee" ? (
        <Button asChild variant="outline">
          <Link href="/reports">
            <FileBarChart className="h-4 w-4" />
            عرض التقارير
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export default async function DashboardPage() {
  const context = await requireUser();

  if (context.profile.role === "sales_employee") {
    return <SalesEmployeeDashboard userId={context.userId} role={context.profile.role} />;
  }

  if (context.profile.role === "branch_supervisor") {
    return (
      <BranchSupervisorDashboard
        userId={context.userId}
        branchId={context.profile.branch_id}
        role={context.profile.role}
      />
    );
  }

  return <ManagementDashboard role={context.profile.role} />;
}

async function SalesEmployeeDashboard({ userId, role }: { userId: string; role: AppRole }) {
  const supabase = createClient();
  const today = startOfDay();
  const tomorrow = addDays(today, 1);

  const [
    { data: todayVisits },
    { data: newCustomers },
    { data: todayFollowUps },
    { data: overdueFollowUps },
    { data: latestCustomers },
    { data: upcomingFollowUps }
  ] = await Promise.all([
    supabase
      .from("visits")
      .select(visitSelect)
      .or(`sales_employee_id.eq.${userId},created_by.eq.${userId}`)
      .gte("visit_datetime", iso(today))
      .lt("visit_datetime", iso(tomorrow)),
    supabase
      .from("customers")
      .select(customerSelect)
      .or(`assigned_employee_id.eq.${userId},created_by.eq.${userId}`)
      .eq("current_status", "new"),
    supabase
      .from("follow_ups")
      .select(followUpSelect)
      .or(`assigned_employee_id.eq.${userId},created_by.eq.${userId}`)
      .gte("scheduled_at", iso(today))
      .lt("scheduled_at", iso(tomorrow)),
    supabase
      .from("follow_ups")
      .select(followUpSelect)
      .or(`assigned_employee_id.eq.${userId},created_by.eq.${userId}`)
      .lt("scheduled_at", iso(today))
      .not("status", "in", "(completed,cancelled)"),
    supabase
      .from("customers")
      .select(customerSelect)
      .or(`assigned_employee_id.eq.${userId},created_by.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("follow_ups")
      .select(followUpSelect)
      .or(`assigned_employee_id.eq.${userId},created_by.eq.${userId}`)
      .gte("scheduled_at", iso(today))
      .not("status", "in", "(completed,cancelled)")
      .order("scheduled_at", { ascending: true })
      .limit(6)
  ]);

  const latest = latestCustomers ?? [];
  const customerMap = new Map(latest.map((customer) => [customer.id, customer]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="متابعة يومية لزياراتك وعملائك ومهامك القادمة"
        actions={quickActions(role)}
      />

      <div className="grid dashboard-grid gap-4">
        <MetricCard title="زياراتي اليوم" value={todayVisits?.length ?? 0} icon={CalendarCheck} />
        <MetricCard title="عملائي الجدد" value={newCustomers?.length ?? 0} icon={Users} />
        <MetricCard title="متابعات اليوم" value={(todayFollowUps ?? []).filter(isDueToday).length} icon={Clock3} />
        <MetricCard title="المتابعات المتأخرة" value={overdueFollowUps?.length ?? 0} icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardDataTable
          title="آخر العملاء المسجلين"
          description="أحدث العملاء المسندين لك أو الذين قمت بإنشائهم"
          headers={["العميل", "رقم الجوال", "الحالة", "تاريخ التسجيل"]}
          rows={latest.map((customer) => [
            <span key="name" className="font-medium">{customer.full_name}</span>,
            customer.phone,
            statusBadge(customer.current_status),
            formatArabicDateTime(customer.created_at)
          ])}
          emptyIcon={Users}
          emptyTitle="لا توجد بيانات لعرضها"
          emptyDescription="لا يوجد عملاء مسجلون ضمن نطاقك حتى الآن."
        />

        <DashboardDataTable
          title="متابعاتي القادمة"
          description="أقرب مواعيد المتابعة غير المكتملة"
          headers={["العميل", "نوع المتابعة", "الحالة", "الموعد"]}
          rows={(upcomingFollowUps ?? []).map((followUp) => {
            const type = isFollowUpType(followUp.follow_up_type) ? followUp.follow_up_type : "other";
            return [
              customerName(customerMap, followUp.customer_id),
              followUpTypeLabels[type],
              followUpStatusBadgeCell(followUp.status),
              formatArabicDateTime(followUp.scheduled_at)
            ];
          })}
          emptyIcon={Clock3}
          emptyTitle="لا توجد بيانات لعرضها"
          emptyDescription="لا توجد متابعات قادمة مسجلة لك."
        />
      </div>

      {todayVisits?.length ? null : (
        <EmptyState
          icon={CalendarCheck}
          title="لا توجد زيارات مسجلة اليوم"
          description="يمكنك استخدام زر تسجيل زيارة جديدة عند استقبال أول عميل اليوم."
        />
      )}
    </div>
  );
}

async function BranchSupervisorDashboard({
  userId,
  branchId,
  role
}: {
  userId: string;
  branchId: string | null;
  role: AppRole;
}) {
  const supabase = createClient();
  const today = startOfDay();
  const tomorrow = addDays(today, 1);
  const weekStart = addDays(today, -6);

  if (!branchId) {
    return (
      <div className="space-y-6">
        <PageHeader title="لوحة التحكم" description="لم يتم ربط حسابك بفرع حتى الآن" actions={quickActions(role)} />
        <EmptyState
          icon={Store}
          title="لا توجد بيانات لعرضها"
          description="يرجى التواصل مع مسؤول النظام لربط حسابك بفرع."
        />
      </div>
    );
  }

  const [
    { data: branchCustomers },
    { data: branchVisits },
    { data: branchEmployees },
    { data: categories },
    { data: branchFollowUps }
  ] = await Promise.all([
    supabase.from("customers").select(customerSelect).eq("branch_id", branchId),
    supabase
      .from("visits")
      .select(visitSelect)
      .eq("branch_id", branchId)
      .gte("visit_datetime", iso(weekStart))
      .order("visit_datetime", { ascending: false }),
    supabase.from("profiles").select("id,full_name,role,branch_id").eq("branch_id", branchId).eq("is_active", true),
    supabase.from("interest_categories").select("id,name").eq("is_active", true),
    supabase.from("follow_ups").select(followUpSelect).order("scheduled_at", { ascending: true })
  ]);

  const customers = branchCustomers ?? [];
  const visits = branchVisits ?? [];
  const employees = branchEmployees ?? [];
  const followUps = branchFollowUps ?? [];
  const customerIds = new Set(customers.map((customer) => customer.id));
  const branchScopedFollowUps = followUps.filter((followUp) => customerIds.has(followUp.customer_id));
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee.full_name]));
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const customerMap = new Map(customers.map((customer) => [customer.id, customer]));

  const todayVisits = visits.filter((visit) => new Date(visit.visit_datetime) >= today && new Date(visit.visit_datetime) < tomorrow);
  const highProbabilityCustomers = customers.filter((customer) => customer.purchase_probability === "high" || customer.purchase_probability === "very_high");

  const employeePerformance = employees
    .filter((employee) => employee.role === "sales_employee")
    .map((employee) => ({
      employee,
      visits: visits.filter((visit) => visit.sales_employee_id === employee.id).length,
      customers: customers.filter((customer) => customer.assigned_employee_id === employee.id).length
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 8);

  const categoryRows = toChartPoints(countBy(visits, (visit) => visit.interest_category_id), categoryMap).slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="نظرة تشغيلية على أداء الفرع والموظفين والعملاء"
        actions={quickActions(role)}
      />

      <div className="grid dashboard-grid gap-4">
        <MetricCard title="زيارات الفرع اليوم" value={todayVisits.length} icon={CalendarCheck} />
        <MetricCard title="زيارات الأسبوع" value={visits.length} icon={BarChart3} />
        <MetricCard title="العملاء الجدد" value={customers.filter((customer) => customer.current_status === "new").length} icon={Users} />
        <MetricCard title="المتابعات المتأخرة" value={branchScopedFollowUps.filter(isOverdue).length} icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardDataTable
          title="أداء موظفي الفرع"
          description="عدد الزيارات والعملاء المسندين لكل موظف"
          headers={["الموظف", "الزيارات", "العملاء"]}
          rows={employeePerformance.map(({ employee, visits: visitCount, customers: customerCount }) => [
            <span key="name" className="font-medium">{employee.full_name}</span>,
            formatNumber(visitCount),
            formatNumber(customerCount)
          ])}
          emptyIcon={Users}
        />

        <Card>
          <CardHeader>
            <CardTitle>أكثر الأقسام طلبًا</CardTitle>
            <CardDescription>حسب تصنيف الاهتمام في زيارات الفرع</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryRows.length ? (
              <div className="space-y-3">
                {categoryRows.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-md border p-3">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="secondary">{formatNumber(item.value)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={BarChart3} title="لا توجد بيانات لعرضها" description="لا توجد زيارات مصنفة حتى الآن." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardDataTable
          title="آخر زيارات الفرع"
          description="أحدث الزيارات المسجلة في الفرع"
          headers={["العميل", "الموظف", "نوع الزيارة", "التاريخ"]}
          rows={visits.slice(0, 8).map((visit) => {
            const type = isVisitType(visit.visit_type) ? visit.visit_type : "other";
            return [
              customerName(customerMap, visit.customer_id),
              employeeName(employeeMap, visit.sales_employee_id),
              visitTypeLabels[type],
              formatArabicDateTime(visit.visit_datetime)
            ];
          })}
          emptyIcon={CalendarCheck}
          emptyTitle="لا توجد بيانات لعرضها"
          emptyDescription="لا توجد زيارات مسجلة لهذا الفرع."
        />

        <DashboardDataTable
          title="العملاء ذوو احتمالية الشراء العالية"
          description="عملاء الفرع المصنفون باحتمالية عالية أو عالية جدًا"
          headers={["العميل", "رقم الجوال", "الاحتمالية", "الحالة"]}
          rows={highProbabilityCustomers.slice(0, 8).map((customer) => {
            const probability = isPurchaseProbability(customer.purchase_probability) ? customer.purchase_probability : "high";
            return [
              <span key="name" className="font-medium">{customer.full_name}</span>,
              customer.phone,
              purchaseProbabilityLabels[probability],
              statusBadge(customer.current_status)
            ];
          })}
          emptyIcon={TrendingUp}
          emptyTitle="لا توجد بيانات لعرضها"
          emptyDescription="لا يوجد عملاء باحتمالية شراء عالية في الفرع."
        />
      </div>
    </div>
  );
}

async function ManagementDashboard({ role }: { role: AppRole }) {
  const supabase = createClient();
  const today = startOfDay();
  const tomorrow = addDays(today, 1);
  const thirtyDaysAgo = addDays(today, -29);

  const [
    { data: customers },
    { data: visits },
    { data: followUps },
    { data: branches },
    { data: sources },
    { data: categories },
    { data: profiles }
  ] = await Promise.all([
    supabase.from("customers").select(customerSelect),
    supabase.from("visits").select(visitSelect).gte("visit_datetime", iso(thirtyDaysAgo)).order("visit_datetime", { ascending: false }),
    supabase.from("follow_ups").select(followUpSelect).order("scheduled_at", { ascending: true }),
    supabase.from("branches").select("id,name,city").order("name"),
    supabase.from("lead_sources").select("id,name").eq("is_active", true),
    supabase.from("interest_categories").select("id,name").eq("is_active", true),
    supabase.from("profiles").select("id,full_name,role,branch_id").eq("is_active", true)
  ]);

  const customerRows = customers ?? [];
  const visitRows = visits ?? [];
  const followUpRows = followUps ?? [];
  const branchRows = branches ?? [];
  const profileRows = profiles ?? [];
  const branchMap = new Map(branchRows.map((branch) => [branch.id, branch.name]));
  const sourceMap = new Map((sources ?? []).map((source) => [source.id, source.name]));
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const customerMap = new Map(customerRows.map((customer) => [customer.id, customer]));
  const profileMap = new Map(profileRows.map((profile) => [profile.id, profile.full_name]));

  const todayVisits = visitRows.filter((visit) => new Date(visit.visit_datetime) >= today && new Date(visit.visit_datetime) < tomorrow);
  const overdueFollowUps = followUpRows.filter(isOverdue);
  const highProbabilityCustomers = customerRows.filter((customer) => customer.purchase_probability === "high" || customer.purchase_probability === "very_high");
  const soldCustomers = customerRows.filter((customer) => customer.current_status === "sold");

  const visitsByBranch = toChartPoints(countBy(visitRows, (visit) => visit.branch_id), branchMap);
  const customersBySource = toChartPoints(countBy(customerRows, (customer) => customer.source_id), sourceMap);
  const visitsByCategory = toChartPoints(countBy(visitRows, (visit) => visit.interest_category_id), categoryMap);
  const customersByStatus = toChartPoints(
    countBy(customerRows, (customer) => customer.current_status),
    customerStatusLabels
  );
  const visitTrend = buildVisitTrend(visitRows, thirtyDaysAgo);

  const topBranches = branchRows
    .map((branch) => ({
      branch,
      visits: visitRows.filter((visit) => visit.branch_id === branch.id).length,
      customers: customerRows.filter((customer) => customer.branch_id === branch.id).length,
      sold: soldCustomers.filter((customer) => customer.branch_id === branch.id).length
    }))
    .sort((a, b) => b.visits + b.sold * 2 - (a.visits + a.sold * 2))
    .slice(0, 8);

  const topEmployees = profileRows
    .filter((profile) => profile.role === "sales_employee")
    .map((profile) => ({
      profile,
      visits: visitRows.filter((visit) => visit.sales_employee_id === profile.id).length,
      customers: customerRows.filter((customer) => customer.assigned_employee_id === profile.id).length,
      sold: soldCustomers.filter((customer) => customer.assigned_employee_id === profile.id).length
    }))
    .sort((a, b) => b.visits + b.sold * 2 - (a.visits + a.sold * 2))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="لوحة مؤشرات شاملة لجميع الفروع والفرق"
        actions={quickActions(role)}
      />

      <div className="grid dashboard-grid gap-4">
        <MetricCard title="إجمالي الزيارات" value={visitRows.length} icon={CalendarCheck} />
        <MetricCard title="إجمالي العملاء" value={customerRows.length} icon={Users} />
        <MetricCard title="زيارات اليوم" value={todayVisits.length} icon={Clock3} />
        <MetricCard title="المتابعات المتأخرة" value={overdueFollowUps.length} icon={AlertTriangle} />
        <MetricCard title="العملاء ذوو الاحتمالية العالية" value={highProbabilityCustomers.length} icon={TrendingUp} />
        <MetricCard title="العملاء المحولون إلى بيع" value={soldCustomers.length} icon={BarChart3} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardBarChart title="الزيارات حسب الفرع" description="توزيع الزيارات على الفروع" data={visitsByBranch} barName="زيارة" />
        <DashboardPieChart title="العملاء حسب المصدر" description="مصادر العملاء المسجلة" data={customersBySource} />
        <DashboardBarChart title="الزيارات حسب القسم" description="تصنيفات الاهتمام في الزيارات" data={visitsByCategory} barName="زيارة" />
        <DashboardPieChart title="الحالات الحالية للعملاء" description="توزيع العملاء حسب الحالة الحالية" data={customersByStatus} />
      </div>

      <DashboardLineChart
        title="اتجاه الزيارات خلال آخر 30 يوم"
        description="عدد الزيارات المسجلة يوميًا"
        data={visitTrend}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardDataTable
          title="أفضل الفروع أداءً"
          description="ترتيب الفروع حسب الزيارات والبيع"
          headers={["الفرع", "الزيارات", "العملاء", "تم البيع"]}
          rows={topBranches.map(({ branch, visits, customers, sold }) => [
            <span key="branch" className="font-medium">{branch.name}</span>,
            formatNumber(visits),
            formatNumber(customers),
            formatNumber(sold)
          ])}
          emptyIcon={Store}
        />

        <DashboardDataTable
          title="أفضل موظفي المبيعات"
          description="ترتيب الموظفين حسب النشاط والنتائج"
          headers={["الموظف", "الزيارات", "العملاء", "تم البيع"]}
          rows={topEmployees.map(({ profile, visits, customers, sold }) => [
            <span key="employee" className="font-medium">{profile.full_name}</span>,
            formatNumber(visits),
            formatNumber(customers),
            formatNumber(sold)
          ])}
          emptyIcon={Users}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardDataTable
          title="آخر الزيارات المسجلة"
          description="آخر زيارات العملاء في النظام"
          headers={["العميل", "الفرع", "الموظف", "وقت الزيارة"]}
          rows={visitRows.slice(0, 8).map((visit) => [
            customerName(customerMap, visit.customer_id),
            branchMap.get(visit.branch_id) ?? "غير محدد",
            employeeName(profileMap, visit.sales_employee_id),
            formatArabicDateTime(visit.visit_datetime)
          ])}
          emptyIcon={CalendarCheck}
          emptyTitle="لا توجد بيانات لعرضها"
          emptyDescription="لا توجد زيارات مسجلة حتى الآن."
        />

        <DashboardDataTable
          title="المتابعات المتأخرة"
          description="المتابعات التي تجاوزت موعدها ولم تكتمل"
          headers={["العميل", "الموظف", "نوع المتابعة", "الموعد"]}
          rows={overdueFollowUps.slice(0, 8).map((followUp) => {
            const type = isFollowUpType(followUp.follow_up_type) ? followUp.follow_up_type : "other";
            return [
              customerName(customerMap, followUp.customer_id),
              employeeName(profileMap, followUp.assigned_employee_id),
              followUpTypeLabels[type],
              formatArabicDateTime(followUp.scheduled_at)
            ];
          })}
          emptyIcon={AlertTriangle}
          emptyTitle="لا توجد متابعات متأخرة"
          emptyDescription="كل المتابعات الحالية ضمن موعدها."
        />
      </div>
    </div>
  );
}

function buildVisitTrend(visits: VisitRow[], startDate: Date): TrendPoint[] {
  return Array.from({ length: 30 }).map((_, index) => {
    const date = addDays(startDate, index);
    const key = date.toISOString().slice(0, 10);
    const name = new Intl.DateTimeFormat("ar-SA", {
      day: "2-digit",
      month: "short",
      timeZone: "Asia/Riyadh"
    }).format(date);

    return {
      name,
      value: visits.filter((visit) => visit.visit_datetime.slice(0, 10) === key).length
    };
  });
}
