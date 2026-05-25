"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageBranch, canViewAllBranches, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  isCustomerStatus,
  isPurchaseProbability,
  isVisitType
} from "@/constants/statuses";
import type { Json } from "@/lib/database.types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length ? value : null;
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

async function logActivity(input: {
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  performedBy: string;
}) {
  const supabase = createClient();
  await supabase.from("activity_logs").insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    old_value: input.oldValue === undefined ? null : asJson(input.oldValue),
    new_value: input.newValue === undefined ? null : asJson(input.newValue),
    performed_by: input.performedBy
  });
}

export async function createVisitAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const returnTo = "/visits/new";
  const role = context.profile.role;
  const fullName = text(formData, "full_name");
  const phone = text(formData, "phone");
  const customerIdFromForm = nullableText(formData, "customer_id");
  const visitType = text(formData, "visit_type") || "showroom_visit";
  const customerStatus = text(formData, "customer_status") || "new";
  const purchaseProbability = nullableText(formData, "purchase_probability");

  if (!fullName) fail(returnTo, "اسم العميل مطلوب");
  if (!phone) fail(returnTo, "رقم الجوال مطلوب");
  if (!isVisitType(visitType)) fail(returnTo, "نوع الزيارة غير صحيح");
  if (!isCustomerStatus(customerStatus)) fail(returnTo, "حالة العميل غير صحيحة");
  if (purchaseProbability && !isPurchaseProbability(purchaseProbability)) {
    fail(returnTo, "احتمالية الشراء غير صحيحة");
  }

  const branchId =
    canViewAllBranches(role) || role === "branch_supervisor"
      ? nullableText(formData, "branch_id") || context.profile.branch_id
      : context.profile.branch_id;
  const salesEmployeeId =
    canManageBranch(role) ? nullableText(formData, "sales_employee_id") || context.userId : context.userId;

  if (!branchId || !salesEmployeeId) fail(returnTo, "يرجى تحديد الفرع وموظف المبيعات");
  const requiredBranchId = branchId;
  const requiredSalesEmployeeId = salesEmployeeId;

  let customerId = customerIdFromForm;
  let previousCustomer:
    | {
        id: string;
        current_status: string;
        purchase_probability: string | null;
      }
    | null = null;

  if (customerId) {
    const { data } = await supabase
      .from("customers")
      .select("id, current_status, purchase_probability")
      .eq("id", customerId)
      .maybeSingle();
    previousCustomer = data;
  }

  if (!previousCustomer) {
    const { data } = await supabase
      .from("customers")
      .select("id, current_status, purchase_probability")
      .eq("phone", phone)
      .maybeSingle();
    previousCustomer = data;
    customerId = data?.id ?? null;
  }

  if (!customerId) {
    const customerPayload = {
      full_name: fullName,
      phone,
      city: nullableText(formData, "city"),
      district: nullableText(formData, "district"),
      source_id: nullableText(formData, "source_id"),
      branch_id: requiredBranchId,
      assigned_employee_id: requiredSalesEmployeeId,
      current_status: customerStatus,
      purchase_probability: purchaseProbability,
      created_by: context.userId
    };

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert(customerPayload)
      .select("id, current_status, purchase_probability")
      .single();

    if (customerError || !customer) fail(returnTo, "تعذر إنشاء العميل قبل تسجيل الزيارة");

    customerId = customer.id;
    previousCustomer = customer;
    await logActivity({
      entityType: "customer",
      entityId: customer.id,
      action: "customer_created",
      newValue: customerPayload,
      performedBy: context.userId
    });
  }

  const visitPayload = {
    customer_id: customerId,
    branch_id: requiredBranchId,
    sales_employee_id: requiredSalesEmployeeId,
    visit_datetime: text(formData, "visit_datetime")
      ? new Date(text(formData, "visit_datetime")).toISOString()
      : new Date().toISOString(),
    visit_type: visitType,
    interest_category_id: nullableText(formData, "interest_category_id"),
    requested_product: nullableText(formData, "requested_product"),
    budget_range: nullableText(formData, "budget_range"),
    has_measurements: booleanValue(formData, "has_measurements"),
    needs_second_visit: booleanValue(formData, "needs_second_visit"),
    customer_status: customerStatus,
    purchase_probability: purchaseProbability,
    next_follow_up_at: text(formData, "next_follow_up_at")
      ? new Date(text(formData, "next_follow_up_at")).toISOString()
      : null,
    notes: nullableText(formData, "notes"),
    created_by: context.userId
  };

  const { data: visit, error: visitError } = await supabase
    .from("visits")
    .insert(visitPayload)
    .select("id")
    .single();

  if (visitError || !visit) fail(returnTo, "تعذر تسجيل الزيارة");

  await logActivity({
    entityType: "visit",
    entityId: visit.id,
    action: "visit_created",
    newValue: visitPayload,
    performedBy: context.userId
  });

  const customerUpdates = {
    full_name: fullName,
    city: nullableText(formData, "city"),
    district: nullableText(formData, "district"),
    source_id: nullableText(formData, "source_id"),
    branch_id: requiredBranchId,
    assigned_employee_id: requiredSalesEmployeeId,
    current_status: customerStatus,
    purchase_probability: purchaseProbability,
    updated_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from("customers")
    .update(customerUpdates)
    .eq("id", customerId);

  if (!updateError) {
    await logActivity({
      entityType: "customer",
      entityId: customerId,
      action: previousCustomer?.current_status === customerStatus ? "customer_updated" : "status_changed",
      oldValue: previousCustomer,
      newValue: customerUpdates,
      performedBy: context.userId
    });
  }

  if (visitPayload.next_follow_up_at) {
    const followUpPayload = {
      customer_id: customerId,
      visit_id: visit.id,
      assigned_employee_id: requiredSalesEmployeeId,
      follow_up_type: "call",
      scheduled_at: visitPayload.next_follow_up_at,
      status: "upcoming",
      notes: nullableText(formData, "notes"),
      created_by: context.userId
    };

    const { error: followUpError } = await supabase.from("follow_ups").insert(followUpPayload);
    if (!followUpError) {
      await logActivity({
        entityType: "customer",
        entityId: customerId,
        action: "follow_up_created",
        newValue: followUpPayload,
        performedBy: context.userId
      });
    }
  }

  revalidatePath("/customers");
  revalidatePath("/visits");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/visits/${visit.id}?success=${encodeURIComponent("تم تسجيل الزيارة بنجاح")}`);
}

export async function updateVisitAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const visitId = text(formData, "visit_id");
  const customerId = text(formData, "customer_id");
  const returnTo = `/visits/${visitId}`;
  const visitType = text(formData, "visit_type");
  const customerStatus = text(formData, "customer_status");
  const purchaseProbability = nullableText(formData, "purchase_probability");

  if (!visitId || !customerId) fail("/visits", "تعذر تحديد الزيارة");
  if (!isVisitType(visitType)) fail(returnTo, "نوع الزيارة غير صحيح");
  if (!isCustomerStatus(customerStatus)) fail(returnTo, "حالة العميل غير صحيحة");
  if (purchaseProbability && !isPurchaseProbability(purchaseProbability)) {
    fail(returnTo, "احتمالية الشراء غير صحيحة");
  }

  const { data: previous, error: previousError } = await supabase
    .from("visits")
    .select("*")
    .eq("id", visitId)
    .single();

  if (previousError || !previous) fail(returnTo, "تعذر العثور على الزيارة");

  const updates = {
    visit_datetime: text(formData, "visit_datetime")
      ? new Date(text(formData, "visit_datetime")).toISOString()
      : previous.visit_datetime,
    visit_type: visitType,
    interest_category_id: nullableText(formData, "interest_category_id"),
    requested_product: nullableText(formData, "requested_product"),
    budget_range: nullableText(formData, "budget_range"),
    has_measurements: booleanValue(formData, "has_measurements"),
    needs_second_visit: booleanValue(formData, "needs_second_visit"),
    customer_status: customerStatus,
    purchase_probability: purchaseProbability,
    next_follow_up_at: text(formData, "next_follow_up_at")
      ? new Date(text(formData, "next_follow_up_at")).toISOString()
      : null,
    notes: nullableText(formData, "notes"),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("visits").update(updates).eq("id", visitId);
  if (error) fail(returnTo, "تعذر تحديث بيانات الزيارة");

  await logActivity({
    entityType: "visit",
    entityId: visitId,
    action: "visit_updated",
    oldValue: previous,
    newValue: updates,
    performedBy: context.userId
  });

  const { data: oldCustomer } = await supabase
    .from("customers")
    .select("id, current_status, purchase_probability")
    .eq("id", customerId)
    .maybeSingle();

  const customerUpdates = {
    current_status: customerStatus,
    purchase_probability: purchaseProbability,
    updated_at: new Date().toISOString()
  };

  await supabase.from("customers").update(customerUpdates).eq("id", customerId);

  await logActivity({
    entityType: "customer",
    entityId: customerId,
    action: oldCustomer?.current_status === customerStatus ? "customer_updated" : "status_changed",
    oldValue: oldCustomer,
    newValue: customerUpdates,
    performedBy: context.userId
  });

  if (updates.next_follow_up_at && updates.next_follow_up_at !== previous.next_follow_up_at) {
    const followUpPayload = {
      customer_id: customerId,
      visit_id: visitId,
      assigned_employee_id: previous.sales_employee_id,
      follow_up_type: "call",
      scheduled_at: updates.next_follow_up_at,
      status: "upcoming",
      notes: updates.notes,
      created_by: context.userId
    };

    const { error: followUpError } = await supabase.from("follow_ups").insert(followUpPayload);
    if (!followUpError) {
      await logActivity({
        entityType: "customer",
        entityId: customerId,
        action: "follow_up_created",
        newValue: followUpPayload,
        performedBy: context.userId
      });
    }
  }

  revalidatePath("/visits");
  revalidatePath(returnTo);
  revalidatePath(`/customers/${customerId}`);
  redirect(`${returnTo}?success=${encodeURIComponent("تم تحديث بيانات الزيارة")}`);
}
