"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getStoredFollowUpStatus } from "@/lib/follow-ups";
import { createClient } from "@/lib/supabase/server";
import { isCustomerStatus, isFollowUpType, isPurchaseProbability } from "@/constants/statuses";
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

export async function createFollowUpAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const returnTo = text(formData, "return_to") || "/follow-ups/new";
  const customerId = text(formData, "customer_id");
  const visitId = nullableText(formData, "visit_id");
  const assignedEmployeeId = text(formData, "assigned_employee_id") || context.userId;
  const type = text(formData, "follow_up_type") || "call";
  const scheduledAt = text(formData, "scheduled_at");

  if (!customerId) fail(returnTo, "يرجى اختيار العميل");
  if (!scheduledAt) fail(returnTo, "تاريخ ووقت المتابعة مطلوب");
  if (!isFollowUpType(type)) fail(returnTo, "نوع المتابعة غير صحيح");

  const scheduledIso = new Date(scheduledAt).toISOString();
  const payload = {
    customer_id: customerId,
    visit_id: visitId,
    assigned_employee_id: assignedEmployeeId,
    follow_up_type: type,
    scheduled_at: scheduledIso,
    status: getStoredFollowUpStatus({ scheduled_at: scheduledIso }),
    notes: nullableText(formData, "notes"),
    created_by: context.userId
  };

  const { data, error } = await supabase.from("follow_ups").insert(payload).select("id").single();
  if (error || !data) fail(returnTo, "تعذر إضافة المتابعة");

  await logActivity({
    entityType: "customer",
    entityId: customerId,
    action: "follow_up_created",
    newValue: payload,
    performedBy: context.userId
  });

  revalidatePath("/follow-ups");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/follow-ups/${data.id}?success=${encodeURIComponent("تمت إضافة المتابعة")}`);
}

export async function completeFollowUpAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const followUpId = text(formData, "follow_up_id");
  const customerId = text(formData, "customer_id");
  const returnTo = text(formData, "return_to") || `/follow-ups/${followUpId}`;
  const customerStatus = nullableText(formData, "customer_status");
  const probability = nullableText(formData, "purchase_probability");

  if (!followUpId || !customerId) fail("/follow-ups", "تعذر تحديد المتابعة");
  if (customerStatus && !isCustomerStatus(customerStatus)) fail(returnTo, "حالة العميل غير صحيحة");
  if (probability && !isPurchaseProbability(probability)) fail(returnTo, "احتمالية الشراء غير صحيحة");

  const { data: previous, error: previousError } = await supabase
    .from("follow_ups")
    .select("*")
    .eq("id", followUpId)
    .single();

  if (previousError || !previous) fail(returnTo, "تعذر العثور على المتابعة");

  const updates = {
    completed_at: new Date().toISOString(),
    result: nullableText(formData, "result"),
    notes: nullableText(formData, "notes") ?? previous.notes,
    status: "completed",
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("follow_ups").update(updates).eq("id", followUpId);
  if (error) fail(returnTo, "تعذر إكمال المتابعة");

  await logActivity({
    entityType: "follow_up",
    entityId: followUpId,
    action: "follow_up_completed",
    oldValue: previous,
    newValue: updates,
    performedBy: context.userId
  });

  if (customerStatus || probability) {
    const customerUpdates = {
      ...(customerStatus ? { current_status: customerStatus } : {}),
      ...(probability ? { purchase_probability: probability } : {}),
      updated_at: new Date().toISOString()
    };
    await supabase.from("customers").update(customerUpdates).eq("id", customerId);
    await logActivity({
      entityType: "customer",
      entityId: customerId,
      action: customerStatus ? "status_changed" : "customer_updated",
      newValue: customerUpdates,
      performedBy: context.userId
    });
  }

  if (booleanValue(formData, "needs_new_follow_up")) {
    const nextScheduled = text(formData, "next_scheduled_at");
    if (!nextScheduled) fail(returnTo, "يرجى إدخال تاريخ المتابعة القادمة");
    const nextScheduledIso = new Date(nextScheduled).toISOString();
    const newFollowUp = {
      customer_id: customerId,
      visit_id: previous.visit_id,
      assigned_employee_id: previous.assigned_employee_id,
      follow_up_type: previous.follow_up_type,
      scheduled_at: nextScheduledIso,
      status: getStoredFollowUpStatus({ scheduled_at: nextScheduledIso }),
      notes: nullableText(formData, "next_notes"),
      created_by: context.userId
    };
    const { data: created } = await supabase.from("follow_ups").insert(newFollowUp).select("id").single();
    if (created) {
      await logActivity({
        entityType: "customer",
        entityId: customerId,
        action: "follow_up_created",
        newValue: newFollowUp,
        performedBy: context.userId
      });
    }
  }

  revalidatePath("/follow-ups");
  revalidatePath(`/follow-ups/${followUpId}`);
  revalidatePath(`/customers/${customerId}`);
  redirect(`${returnTo}?success=${encodeURIComponent("تم إكمال المتابعة")}`);
}

export async function cancelFollowUpAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const followUpId = text(formData, "follow_up_id");
  const returnTo = text(formData, "return_to") || `/follow-ups/${followUpId}`;

  if (!followUpId) fail("/follow-ups", "تعذر تحديد المتابعة");

  const { data: previous } = await supabase.from("follow_ups").select("*").eq("id", followUpId).single();
  const updates = {
    status: "cancelled",
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("follow_ups").update(updates).eq("id", followUpId);
  if (error) fail(returnTo, "تعذر إلغاء المتابعة");

  await logActivity({
    entityType: "follow_up",
    entityId: followUpId,
    action: "follow_up_cancelled",
    oldValue: previous,
    newValue: updates,
    performedBy: context.userId
  });

  revalidatePath("/follow-ups");
  revalidatePath(`/follow-ups/${followUpId}`);
  redirect(`${returnTo}?success=${encodeURIComponent("تم إلغاء المتابعة")}`);
}
