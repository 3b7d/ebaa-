import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  Download,
  FileSpreadsheet,
  FilterX,
  Percent,
  TrendingUp,
  Users
} from "lucide-react";
import {
  DashboardBarChart,
  DashboardLineChart,
  DashboardPieChart
} from "@/components/charts/dashboard-charts";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { DashboardDataTable } from "@/components/tables/dashboard-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  customerStatusLabels,
  customerStatuses
} from "@/constants/statuses";
import { requireUser } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";
import {
  getReportsData,
  normalizeReportFilters,
  type ReportRange
} from "@/services/reports";

type ReportsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const rangeLabels: Record<ReportRange, string> = {
  today: "اليوم",
  last_7: "آخر 7 أيام",
  last_30: "آخر 30 يوم",
  this_month: "هذا الشهر",
  previous_month: "الشهر السابق",
  custom: "فترة مخصصة"
};

function param(searchParams: ReportsPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function exportHref(searchParams: ReportsPageProps["searchParams"], format: "csv" | "excel") {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    const actual = Array.isArray(value) ? value[0] : value;
    if (actual) params.set(key, actual);
  }
  params.set("format", format);
  return `/reports/export?${params.toString()}`;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { profile } = await requireUser();
  const rawFilters = {
    range: param(searchParams, "range"),
    from: param(searchParams, "from"),
    to: param(searchParams, "to"),
    branch: param(searchParams, "branch"),
    employee: param(searchParams, "employee"),
    category: param(searchParams, "category"),
    source: param(searchParams, "source"),
    status: param(searchParams, "status")
  };
  const filters = normalizeReportFilters(rawFilters, profile);
  const report = await getReportsData(profile, filters);
  const isSalesEmployee = profile.role === "sales_employee";
  const isBranchSupervisor = profile.role === "branch_supervisor";

  return (
    <div className="space-y-6">
      <PageHeader
        title="التقارير"
        description="تحليل أداء الزيارات والعملاء والمتابعات حسب الفترة والفروع والموظفين."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={exportHref(searchParams, "csv")}>
                <Download className="h-4 w-4" />
                تصدير CSV
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={exportHref(searchParams, "excel")}>
                <FileSpreadsheet className="h-4 w-4" />
                تصدير Excel
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>فلاتر التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Select name="range" defaultValue={filters.range} aria-label="اختر الفترة الزمنية">
              {Object.entries(rangeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            <Input name="from" defaultValue={filters.from ?? ""} type="date" aria-label="من تاريخ" placeholder="من تاريخ" />
            <Input name="to" defaultValue={filters.to ?? ""} type="date" aria-label="إلى تاريخ" placeholder="إلى تاريخ" />
            <Select name="branch" defaultValue={filters.branch ?? ""} disabled={isSalesEmployee || isBranchSupervisor}>
              <option value="">الفرع</option>
              {report.lookups.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </Select>
            <Select name="employee" defaultValue={filters.employee ?? ""} disabled={isSalesEmployee}>
              <option value="">موظف المبيعات</option>
              {report.lookups.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.full_name}</option>
              ))}
            </Select>
            <Select name="category" defaultValue={filters.category ?? ""}>
              <option value="">القسم</option>
              {report.lookups.categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Select>
            <Select name="source" defaultValue={filters.source ?? ""}>
              <option value="">مصدر العميل</option>
              {report.lookups.sources.map((source) => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </Select>
            <Select name="status" defaultValue={filters.status ?? ""}>
              <option value="">حالة العميل</option>
              {customerStatuses.map((status) => (
                <option key={status} value={status}>{customerStatusLabels[status]}</option>
              ))}
            </Select>
            <div className="flex gap-2 xl:col-span-2">
              <Button type="submit" className="flex-1">تطبيق الفلاتر</Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/reports">
                  <FilterX className="h-4 w-4" />
                  إعادة تعيين
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid dashboard-grid gap-4">
        <MetricCard title="إجمالي الزيارات" value={report.cards.totalVisits} icon={CalendarCheck} />
        <MetricCard title="إجمالي العملاء الجدد" value={report.cards.totalNewCustomers} icon={Users} />
        <MetricCard title="إجمالي المتابعات" value={report.cards.totalFollowUps} icon={BarChart3} />
        <MetricCard title="المتابعات المتأخرة" value={report.cards.overdueFollowUps} icon={AlertTriangle} />
        <MetricCard title="طلبات عروض السعر" value={report.cards.quotationRequests} icon={FileSpreadsheet} />
        <MetricCard title="العملاء المحولون إلى بيع" value={report.cards.soldCustomers} icon={TrendingUp} />
        <PercentageCard title="نسبة التحويل إلى عرض سعر" value={report.cards.quotationConversion} />
        <PercentageCard title="نسبة التحويل إلى بيع" value={report.cards.saleConversion} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardBarChart title="الزيارات حسب الفرع" description="توزيع الزيارات ضمن الفترة المحددة" data={report.charts.visitsByBranch} barName="زيارة" />
        <DashboardBarChart title="الزيارات حسب القسم" description="الأقسام الأكثر طلبًا في الزيارات" data={report.charts.visitsByCategory} barName="زيارة" />
        <DashboardPieChart title="العملاء حسب المصدر" description="مصادر العملاء الجدد ضمن الفترة" data={report.charts.customersBySource} />
        <DashboardPieChart title="الحالات الحالية للعملاء" description="توزيع العملاء حسب الحالة الحالية" data={report.charts.customersByStatus} />
        <DashboardBarChart title="أداء موظفي المبيعات" description="عدد الزيارات لكل موظف ضمن الفترة" data={report.charts.employeePerformance} barName="زيارة" />
        <DashboardBarChart title="المتابعات حسب الحالة" description="حالات المتابعات حسب الموعد والإكمال" data={report.charts.followUpsByStatus} barName="متابعة" />
      </div>

      <DashboardLineChart
        title="اتجاه الزيارات اليومي"
        description="عدد الزيارات يوميًا ضمن الفترة المحددة"
        data={report.charts.dailyVisitTrend}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {!isSalesEmployee ? (
          <DashboardDataTable
            title="أفضل الفروع أداءً"
            description="ترتيب الفروع حسب الزيارات والعملاء والتحويل إلى بيع"
            headers={["الفرع", "المدينة", "الزيارات", "العملاء", "تم البيع"]}
            rows={report.tables.topBranches.map((row) => [
              <span key="name" className="font-medium">{row.name}</span>,
              row.city,
              formatNumber(row.visits),
              formatNumber(row.customers),
              formatNumber(row.sold)
            ])}
            emptyIcon={BarChart3}
          />
        ) : null}

        <DashboardDataTable
          title="أفضل موظفي المبيعات"
          description="ترتيب الموظفين حسب الزيارات والعملاء والبيع"
          headers={["الموظف", "الزيارات", "العملاء", "تم البيع", "متأخرة"]}
          rows={report.tables.topEmployees.map((row) => [
            <span key="name" className="font-medium">{row.name}</span>,
            formatNumber(row.visits),
            formatNumber(row.customers),
            formatNumber(row.sold),
            formatNumber(row.overdue)
          ])}
          emptyIcon={Users}
        />

        <DashboardDataTable
          title="أكثر الأقسام طلبًا"
          description="الأقسام الأعلى طلبًا حسب عدد الزيارات"
          headers={["القسم", "عدد الزيارات"]}
          rows={report.tables.topCategories.map((row) => [
            <span key="name" className="font-medium">{row.name}</span>,
            formatNumber(row.value)
          ])}
          emptyIcon={BarChart3}
        />

        <DashboardDataTable
          title="العملاء ذوو احتمالية الشراء العالية"
          description="عملاء يستحقون أولوية متابعة"
          headers={["العميل", "رقم الجوال", "الفرع", "الموظف", "الاحتمالية"]}
          rows={report.tables.highProbabilityCustomers.map((row) => [
            <Link key="name" href={`/customers/${row.id}`} className="font-medium text-primary hover:underline">{row.name}</Link>,
            row.phone,
            row.branch,
            row.employee,
            row.probability
          ])}
          emptyIcon={TrendingUp}
        />

        <DashboardDataTable
          title="العملاء بدون متابعة"
          description="عملاء لا تظهر لهم متابعة ضمن الفترة المحددة"
          headers={["العميل", "رقم الجوال", "الفرع", "الموظف"]}
          rows={report.tables.customersWithoutFollowUp.map((row) => [
            <Link key="name" href={`/customers/${row.id}`} className="font-medium text-primary hover:underline">{row.name}</Link>,
            row.phone,
            row.branch,
            row.employee
          ])}
          emptyIcon={Users}
        />

        <DashboardDataTable
          title="المتابعات المتأخرة حسب الموظف"
          description="توزيع المتابعات المتأخرة على موظفي المبيعات"
          headers={["الموظف", "المتابعات المتأخرة"]}
          rows={report.tables.overdueByEmployee.map((row) => [
            <span key="name" className="font-medium">{row.name}</span>,
            formatNumber(row.overdue)
          ])}
          emptyIcon={AlertTriangle}
          emptyTitle="لا توجد بيانات ضمن الفترة المحددة"
          emptyDescription="لا توجد متابعات متأخرة حسب الفلاتر الحالية."
        />
      </div>
    </div>
  );
}

function PercentageCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{formatNumber(value)}٪</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Percent className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
