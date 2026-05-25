"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageBranch, canViewAllBranches, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  isCustomerStatus,
  isFollowUpType,
  isPurchaseProbability
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

export async function createCustomerAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const fullName = text(formData, "full_name");
  const phone = text(formData, "phone");
  const email = nullableText(formData, "email");
  const status = text(formData, "current_status") || "new";
  const probability = nullableText(formData, "purchase_probability");

  if (!fullName) fail("/customers/new", "اسم العميل مطلوب");
  if (!phone) fail("/customers/new", "رقم الجوال مطلوب");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("/customers/new", "صيغة البريد الإلكتروني غير صحيحة");
  }

  const { data: existing } = await supabase
    .from("customers")
    .select("id, full_name, phone")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    redirect(
      `/customers/new?duplicate=${existing.id}&phone=${encodeURIComponent(phone)}&error=${encodeURIComponent(
        "رقم الجوال مستخدم مسبقًا"
      )}`
    );
  }

  const role = context.profile.role;
  const branchId =
    canViewAllBranches(role) || role === "branch_supervisor"
      ? nullableText(formData, "branch_id") || context.profile.branch_id
      : context.profile.branch_id;
  const assignedEmployeeId =
    canManageBranch(role) ? nullableText(formData, "assigned_employee_id") || context.userId : context.userId;

  const payload = {
    full_name: fullName,
    phone,
    secondary_phone: nullableText(formData, "secondary_phone"),
    city: nullableText(formData, "city"),
    district: nullableText(formData, "district"),
    email,
    source_id: nullableText(formData, "source_id"),
    assigned_employee_id: assignedEmployeeId,
    branch_id: branchId,
    current_status: isCustomerStatus(status) ? status : "new",
    purchase_probability: probability && isPurchaseProbability(probability) ? probability : null,
    general_notes: nullableText(formData, "general_notes"),
    created_by: context.userId
  };

  const { data: customer, error } = await supabase
    .from("customers")
    .insert(payload)
    .select("id")
    .single();

  if (error || !customer) {
    fail("/customers/new", error?.code === "23505" ? "رقم الجوال مستخدم مسبقًا" : "تعذر حفظ بيانات العميل");
  }

  await logActivity({
    entityType: "customer",
    entityId: customer.id,
    action: "customer_created",
    newValue: payload,
    performedBy: context.userId
  });

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}?success=${encodeURIComponent("تم حفظ العميل بنجاح")}`);
}

export async function updateCustomerAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const customerId = text(formData, "customer_id");
  const returnTo = `/customers/${customerId}`;
  const fullName = text(formData, "full_name");
  const phone = text(formData, "phone");
  const email = nullableText(formData, "email");
  const status = text(formData, "current_status") || "new";
  const probability = nullableText(formData, "purchase_probability");

  if (!customerId) fail("/customers", "تعذر تحديد العميل");
  if (!fullName) fail(returnTo, "اسم العميل مطلوب");
  if (!phone) fail(returnTo, "رقم الجوال مطلوب");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail(returnTo, "صيغة البريد الإلكتروني غير صحيحة");
  }
  if (!isCustomerStatus(status)) fail(returnTo, "حالة العميل غير صحيحة");
  if (probability && !isPurchaseProbability(probability)) fail(returnTo, "احتمالية الشراء غير صحيحة");

  const { data: previous, error: previousError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (previousError || !previous) fail(returnTo, "تعذر العثور على العميل");

  const { data: duplicate } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .neq("id", customerId)
    .maybeSingle();

  if (duplicate) fail(returnTo, "رقم الجوال مستخدم مسبقًا");

  const role = context.profile.role;
  const updates = {
    full_name: fullName,
    phone,
    secondary_phone: nullableText(formData, "secondary_phone"),
    city: nullableText(formData, "city"),
    district: nullableText(formData, "district"),
    email,
    source_id: nullableText(formData, "source_id"),
    branch_id:
      canViewAllBranches(role) || role === "branch_supervisor"
        ? nullableText(formData, "branch_id") || context.profile.branch_id
        : context.profile.branch_id,
    assigned_employee_id: canManageBranch(role)
      ? nullableText(formData, "assigned_employee_id") || context.userId
      : context.userId,
    current_status: status,
    purchase_probability: probability,
    general_notes: nullableText(formData, "general_notes"),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("customers").update(updates).eq("id", customerId);
  if (error) fail(returnTo, "تعذر تحديث بيانات العميل");

  await logActivity({
    entityType: "customer",
    entityId: customerId,
    action: "customer_updated",
    oldValue: previous,
    newValue: updates,
    performedBy: context.userId
  });

  revalidatePath("/customers");
  revalidatePath(returnTo);
  redirect(`${returnTo}?success=${encodeURIComponent("تم تحديث بيانات العميل")}`);
}

export async function updateCustomerStatusAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const customerId = text(formData, "customer_id");
  const nextStatus = text(formData, "current_status");
  const probability = nullableText(formData, "purchase_probability");
  const returnTo = text(formData, "return_to") || `/customers/${customerId}`;

  if (!customerId || !isCustomerStatus(nextStatus)) fail(returnTo, "تعذر تحديث حالة العميل");
  if (probability && !isPurchaseProbability(probability)) fail(returnTo, "تعذر تحديث احتمالية الشراء");

  const { data: previous, error: previousError } = await supabase
    .from("customers")
    .select("id, current_status, purchase_probability")
    .eq("id", customerId)
    .single();

  if (previousError || !previous) fail(returnTo, "تعذر العثور على العميل");

  const updates = {
    current_status: nextStatus,
    purchase_probability: probability,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("customers").update(updates).eq("id", customerId);
  if (error) fail(returnTo, "تعذر تحديث حالة العميل");

  await logActivity({
    entityType: "customer",
    entityId: customerId,
    action: previous.current_status === nextStatus ? "customer_updated" : "status_changed",
    oldValue: previous,
    newValue: updates,
    performedBy: context.userId
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`${returnTo}?success=${encodeURIComponent("تم تحديث حالة العميل")}`);
}

export async function createFollowUpForCustomerAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const customerId = text(formData, "customer_id");
  const visitId = nullableText(formData, "visit_id");
  const type = text(formData, "follow_up_type") || "call";
  const scheduledAt = text(formData, "scheduled_at");
  const assignedEmployeeId = nullableText(formData, "assigned_employee_id") || context.userId;
  const returnTo = text(formData, "return_to") || `/customers/${customerId}`;

  if (!customerId || !scheduledAt || !isFollowUpType(type)) fail(returnTo, "يرجى إدخال بيانات المتابعة بشكل صحيح");

  const payload = {
    customer_id: customerId,
    visit_id: visitId,
    assigned_employee_id: assignedEmployeeId,
    follow_up_type: type,
    scheduled_at: new Date(scheduledAt).toISOString(),
    status: "upcoming",
    notes: nullableText(formData, "notes"),
    created_by: context.userId
  };

  const { data: followUp, error } = await supabase
    .from("follow_ups")
    .insert(payload)
    .select("id")
    .single();

  if (error || !followUp) fail(returnTo, "تعذر إضافة المتابعة");

  await logActivity({
    entityType: "customer",
    entityId: customerId,
    action: "follow_up_created",
    newValue: payload,
    performedBy: context.userId
  });

  revalidatePath("/follow-ups");
  revalidatePath(`/customers/${customerId}`);
  redirect(`${returnTo}?success=${encodeURIComponent("تمت إضافة المتابعة")}`);
}
