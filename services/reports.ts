import type { Profile } from "@/lib/database.types";
import { getFollowUpDisplayStatus } from "@/lib/follow-ups";
import { createClient } from "@/lib/supabase/server";
import {
  customerStatusLabels,
  followUpStatusLabels,
  purchaseProbabilityLabels
} from "@/constants/statuses";

export type ReportRange = "today" | "last_7" | "last_30" | "this_month" | "previous_month" | "custom";

export type ReportFilters = {
  range: ReportRange;
  from?: string;
  to?: string;
  branch?: string;
  employee?: string;
  category?: string;
  source?: string;
  status?: string;
};

export type ReportRow = {
  name: string;
  value: number;
};

type CustomerRow = {
  id: string;
  full_name: string;
  phone: string;
  branch_id: string | null;
  assigned_employee_id: string | null;
  source_id: string | null;
  current_status: string;
  purchase_probability: string | null;
  created_at: string;
  updated_at: string;
};

type VisitRow = {
  id: string;
  customer_id: string;
  branch_id: string;
  sales_employee_id: string;
  visit_datetime: string;
  interest_category_id: string | null;
  customer_status: string;
};

type FollowUpRow = {
  id: string;
  customer_id: string;
  assigned_employee_id: string;
  follow_up_type: string;
  scheduled_at: string;
  completed_at: string | null;
  status: string;
  result: string | null;
};

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getDateRange(filters: ReportFilters) {
  const today = startOfDay();
  if (filters.range === "today") return { start: today, end: endOfDay(today) };
  if (filters.range === "last_7") return { start: addDays(today, -6), end: endOfDay(today) };
  if (filters.range === "this_month") return { start: startOfMonth(today), end: endOfMonth(today) };
  if (filters.range === "previous_month") {
    const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return { start: startOfMonth(previous), end: endOfMonth(previous) };
  }
  if (filters.range === "custom" && filters.from && filters.to) {
    return { start: startOfDay(new Date(filters.from)), end: endOfDay(new Date(filters.to)) };
  }
  return { start: addDays(today, -29), end: endOfDay(today) };
}

export function normalizeReportFilters(raw: Record<string, string | undefined>, profile: Profile): ReportFilters {
  const rangeValues: ReportRange[] = ["today", "last_7", "last_30", "this_month", "previous_month", "custom"];
  const range = rangeValues.includes(raw.range as ReportRange) ? (raw.range as ReportRange) : "last_30";
  return {
    range,
    from: raw.from || undefined,
    to: raw.to || undefined,
    branch: profile.role === "branch_supervisor" ? profile.branch_id ?? undefined : raw.branch || undefined,
    employee: profile.role === "sales_employee" ? profile.id : raw.employee || undefined,
    category: raw.category || undefined,
    source: raw.source || undefined,
    status: raw.status || undefined
  };
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

function toPoints(counts: Map<string, number>, labels: Map<string, string> | Record<string, string>) {
  return Array.from(counts.entries())
    .map(([key, value]) => ({
      name: labels instanceof Map ? labels.get(key) ?? "غير محدد" : labels[key] ?? "غير محدد",
      value
    }))
    .sort((a, b) => b.value - a.value);
}

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

function withinPeriod(value: string, start: Date, end: Date) {
  const date = new Date(value);
  return date >= start && date <= end;
}

function applyCommonCustomerFilters(rows: CustomerRow[], filters: ReportFilters) {
  return rows.filter((customer) => {
    if (filters.branch && customer.branch_id !== filters.branch) return false;
    if (filters.employee && customer.assigned_employee_id !== filters.employee) return false;
    if (filters.source && customer.source_id !== filters.source) return false;
    if (filters.status && customer.current_status !== filters.status) return false;
    return true;
  });
}

export async function getReportsData(profile: Profile, filters: ReportFilters) {
  const supabase = createClient();
  const { start, end } = getDateRange(filters);

  const [
    branchesResult,
    employeesResult,
    categoriesResult,
    sourcesResult,
    customersResult,
    visitsResult,
    followUpsResult
  ] = await Promise.all([
    supabase.from("branches").select("id, name, city").eq("is_active", true).order("name"),
    supabase.from("profiles").select("id, full_name, role, branch_id").eq("is_active", true).order("full_name"),
    supabase.from("interest_categories").select("id, name").eq("is_active", true).order("name"),
    supabase.from("lead_sources").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("customers")
      .select("id, full_name, phone, branch_id, assigned_employee_id, source_id, current_status, purchase_probability, created_at, updated_at")
      .limit(5000),
    supabase
      .from("visits")
      .select("id, customer_id, branch_id, sales_employee_id, visit_datetime, interest_category_id, customer_status")
      .gte("visit_datetime", start.toISOString())
      .lte("visit_datetime", end.toISOString())
      .limit(5000),
    supabase
      .from("follow_ups")
      .select("id, customer_id, assigned_employee_id, follow_up_type, scheduled_at, completed_at, status, result")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .limit(5000)
  ]);

  const branches = branchesResult.data ?? [];
  const employees = employeesResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const sources = sourcesResult.data ?? [];
  const allCustomers = (customersResult.data ?? []) as CustomerRow[];
  const branchMap = new Map(branches.map((branch) => [branch.id, branch.name]));
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee.full_name]));
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const sourceMap = new Map(sources.map((source) => [source.id, source.name]));

  let customers = applyCommonCustomerFilters(allCustomers, filters).filter((customer) =>
    withinPeriod(customer.created_at, start, end)
  );
  let scopeCustomers = applyCommonCustomerFilters(allCustomers, filters);

  let visits = ((visitsResult.data ?? []) as VisitRow[]).filter((visit) => {
    if (filters.branch && visit.branch_id !== filters.branch) return false;
    if (filters.employee && visit.sales_employee_id !== filters.employee) return false;
    if (filters.category && visit.interest_category_id !== filters.category) return false;
    if (filters.status && visit.customer_status !== filters.status) return false;
    return true;
  });

  if (filters.source) {
    const sourceCustomerIds = new Set(scopeCustomers.map((customer) => customer.id));
    visits = visits.filter((visit) => sourceCustomerIds.has(visit.customer_id));
  }

  if (filters.category) {
    const categoryCustomerIds = new Set(visits.map((visit) => visit.customer_id));
    customers = customers.filter((customer) => categoryCustomerIds.has(customer.id));
    scopeCustomers = scopeCustomers.filter((customer) => categoryCustomerIds.has(customer.id));
  }

  const scopeCustomerIds = new Set(scopeCustomers.map((customer) => customer.id));
  const followUps = ((followUpsResult.data ?? []) as FollowUpRow[]).filter((followUp) => {
    if (!scopeCustomerIds.has(followUp.customer_id)) return false;
    if (filters.employee && followUp.assigned_employee_id !== filters.employee) return false;
    return true;
  });

  const quotationCustomers = customers.filter((customer) =>
    ["quotation_requested", "quotation_sent", "negotiation", "sold"].includes(customer.current_status)
  );
  const soldCustomers = customers.filter((customer) => customer.current_status === "sold");
  const overdueFollowUps = followUps.filter((followUp) => getFollowUpDisplayStatus(followUp) === "overdue");
  const highProbabilityCustomers = scopeCustomers.filter(
    (customer) => customer.purchase_probability === "high" || customer.purchase_probability === "very_high"
  );

  const branchSummaries = branches
    .map((branch) => ({
      id: branch.id,
      name: branch.name,
      city: branch.city,
      visits: visits.filter((visit) => visit.branch_id === branch.id).length,
      customers: customers.filter((customer) => customer.branch_id === branch.id).length,
      sold: soldCustomers.filter((customer) => customer.branch_id === branch.id).length
    }))
    .filter((row) => row.visits || row.customers || row.sold)
    .sort((a, b) => b.visits + b.sold * 2 - (a.visits + a.sold * 2));

  const employeeSummaries = employees
    .filter((employee) => employee.role === "sales_employee")
    .map((employee) => ({
      id: employee.id,
      name: employee.full_name,
      visits: visits.filter((visit) => visit.sales_employee_id === employee.id).length,
      customers: customers.filter((customer) => customer.assigned_employee_id === employee.id).length,
      sold: soldCustomers.filter((customer) => customer.assigned_employee_id === employee.id).length,
      overdue: overdueFollowUps.filter((followUp) => followUp.assigned_employee_id === employee.id).length
    }))
    .filter((row) => row.visits || row.customers || row.sold || row.overdue)
    .sort((a, b) => b.visits + b.sold * 2 - (a.visits + a.sold * 2));

  const categoryDemand = toPoints(countBy(visits, (visit) => visit.interest_category_id), categoryMap);
  const followUpCustomerIds = new Set(followUps.map((followUp) => followUp.customer_id));
  const customersWithoutFollowUp = scopeCustomers
    .filter((customer) => !followUpCustomerIds.has(customer.id))
    .slice(0, 30);

  return {
    filters,
    dateRange: { start, end },
    lookups: { branches, employees, categories, sources },
    cards: {
      totalVisits: visits.length,
      totalNewCustomers: customers.length,
      totalFollowUps: followUps.length,
      overdueFollowUps: overdueFollowUps.length,
      quotationRequests: quotationCustomers.length,
      soldCustomers: soldCustomers.length,
      quotationConversion: percentage(quotationCustomers.length, customers.length),
      saleConversion: percentage(soldCustomers.length, customers.length)
    },
    charts: {
      visitsByBranch: toPoints(countBy(visits, (visit) => visit.branch_id), branchMap),
      visitsByCategory: toPoints(countBy(visits, (visit) => visit.interest_category_id), categoryMap),
      customersBySource: toPoints(countBy(customers, (customer) => customer.source_id), sourceMap),
      customersByStatus: toPoints(countBy(customers, (customer) => customer.current_status), customerStatusLabels),
      dailyVisitTrend: buildDailyTrend(visits, start, end),
      employeePerformance: employeeSummaries.slice(0, 12).map((employee) => ({
        name: employee.name,
        value: employee.visits
      })),
      followUpsByStatus: toPoints(
        countBy(followUps, (followUp) => getFollowUpDisplayStatus(followUp)),
        followUpStatusLabels
      )
    },
    tables: {
      topBranches: branchSummaries.slice(0, 10),
      topEmployees: employeeSummaries.slice(0, 10),
      topCategories: categoryDemand.slice(0, 10),
      highProbabilityCustomers: highProbabilityCustomers.slice(0, 20).map((customer) => ({
        id: customer.id,
        name: customer.full_name,
        phone: customer.phone,
        branch: customer.branch_id ? branchMap.get(customer.branch_id) ?? "غير محدد" : "غير محدد",
        employee: customer.assigned_employee_id ? employeeMap.get(customer.assigned_employee_id) ?? "غير محدد" : "غير محدد",
        probability: customer.purchase_probability
          ? purchaseProbabilityLabels[customer.purchase_probability as keyof typeof purchaseProbabilityLabels] ?? "غير محدد"
          : "غير محدد"
      })),
      customersWithoutFollowUp: customersWithoutFollowUp.map((customer) => ({
        id: customer.id,
        name: customer.full_name,
        phone: customer.phone,
        branch: customer.branch_id ? branchMap.get(customer.branch_id) ?? "غير محدد" : "غير محدد",
        employee: customer.assigned_employee_id ? employeeMap.get(customer.assigned_employee_id) ?? "غير محدد" : "غير محدد"
      })),
      overdueByEmployee: employeeSummaries
        .filter((employee) => employee.overdue > 0)
        .sort((a, b) => b.overdue - a.overdue)
        .slice(0, 10)
        .map((employee) => ({
          name: employee.name,
          overdue: employee.overdue
        }))
    }
  };
}

function buildDailyTrend(visits: VisitRow[], start: Date, end: Date) {
  const days = Math.max(1, Math.min(62, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1));
  return Array.from({ length: days }).map((_, index) => {
    const date = addDays(start, index);
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

export function reportRowsForExport(data: Awaited<ReturnType<typeof getReportsData>>) {
  return {
    summary: [
      ["المؤشر", "القيمة"],
      ["إجمالي الزيارات", data.cards.totalVisits],
      ["إجمالي العملاء الجدد", data.cards.totalNewCustomers],
      ["إجمالي المتابعات", data.cards.totalFollowUps],
      ["المتابعات المتأخرة", data.cards.overdueFollowUps],
      ["طلبات عروض السعر", data.cards.quotationRequests],
      ["العملاء المحولون إلى بيع", data.cards.soldCustomers],
      ["نسبة التحويل إلى عرض سعر", `${data.cards.quotationConversion}%`],
      ["نسبة التحويل إلى بيع", `${data.cards.saleConversion}%`]
    ],
    topBranches: [
      ["الفرع", "المدينة", "الزيارات", "العملاء", "تم البيع"],
      ...data.tables.topBranches.map((row) => [row.name, row.city, row.visits, row.customers, row.sold])
    ],
    topEmployees: [
      ["موظف المبيعات", "الزيارات", "العملاء", "تم البيع", "المتابعات المتأخرة"],
      ...data.tables.topEmployees.map((row) => [row.name, row.visits, row.customers, row.sold, row.overdue])
    ],
    topCategories: [
      ["القسم", "عدد الزيارات"],
      ...data.tables.topCategories.map((row) => [row.name, row.value])
    ],
    highProbabilityCustomers: [
      ["العميل", "رقم الجوال", "الفرع", "الموظف", "احتمالية الشراء"],
      ...data.tables.highProbabilityCustomers.map((row) => [row.name, row.phone, row.branch, row.employee, row.probability])
    ],
    overdueByEmployee: [
      ["الموظف", "المتابعات المتأخرة"],
      ...data.tables.overdueByEmployee.map((row) => [row.name, row.overdue])
    ]
  };
}
