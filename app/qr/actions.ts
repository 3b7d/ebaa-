"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";

const submissionBuckets = new Map<string, { count: number; resetAt: number }>();

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

function fail(branchId: string, message: string): never {
  redirect(`/qr/${branchId}?error=${encodeURIComponent(message)}`);
}

function rateLimit(key: string) {
  const now = Date.now();
  const current = submissionBuckets.get(key);
  if (!current || current.resetAt < now) {
    submissionBuckets.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}

export async function submitQrInterestAction(formData: FormData) {
  const branchId = text(formData, "branch_id");
  const fullName = text(formData, "full_name");
  const phone = text(formData, "phone");
  const city = nullableText(formData, "city");
  const interestCategoryId = text(formData, "interest_category_id");
  const preferredContactTime = nullableText(formData, "preferred_contact_time");
  const notes = nullableText(formData, "notes");
  const hasMeasurements = booleanValue(formData, "has_measurements");

  if (!branchId) fail("غير-محدد", "تعذر تحديد الفرع");
  if (!hasSupabaseServiceEnv()) fail(branchId, "تعذر الاتصال بخدمة التسجيل، يرجى المحاولة لاحقًا");
  if (!rateLimit(`${branchId}:${phone || "unknown"}`)) {
    fail(branchId, "تم إرسال عدة طلبات خلال وقت قصير، يرجى المحاولة لاحقًا");
  }
  if (!fullName) fail(branchId, "الاسم مطلوب");
  if (!phone) fail(branchId, "رقم الجوال مطلوب");
  if (!interestCategoryId) fail(branchId, "يرجى اختيار القسم المهتم به");

  const supabase = createServiceClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("id, name, is_active")
    .eq("id", branchId)
    .eq("is_active", true)
    .maybeSingle();

  if (!branch) fail(branchId, "رابط النموذج غير صحيح أو الفرع غير متاح");

  const { data: category } = await supabase
    .from("interest_categories")
    .select("id")
    .eq("id", interestCategoryId)
    .eq("is_active", true)
    .maybeSingle();

  if (!category) fail(branchId, "يرجى اختيار القسم المهتم به");

  let { data: qrSource } = await supabase
    .from("lead_sources")
    .select("id")
    .eq("name", "QR داخل المعرض")
    .maybeSingle();

  if (!qrSource) {
    const created = await supabase
      .from("lead_sources")
      .insert({ name: "QR داخل المعرض", description: "تسجيل اهتمام من نموذج QR داخل المعرض" })
      .select("id")
      .single();
    qrSource = created.data;
  }

  const { data: branchSupervisor } = await supabase
    .from("profiles")
    .select("id")
    .eq("branch_id", branchId)
    .eq("role", "branch_supervisor")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const { data: branchSalesEmployee } = await supabase
    .from("profiles")
    .select("id")
    .eq("branch_id", branchId)
    .eq("role", "sales_employee")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const assignedUserId = branchSupervisor?.id ?? branchSalesEmployee?.id ?? null;
  if (!assignedUserId) fail(branchId, "تعذر تسجيل الطلب لعدم وجود مسؤول نشط لهذا الفرع");

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, full_name, city, general_notes")
    .eq("phone", phone)
    .maybeSingle();

  const customerPayload = {
    full_name: fullName,
    phone,
    city,
    source_id: qrSource?.id ?? null,
    branch_id: branchId,
    assigned_employee_id: branchSalesEmployee?.id ?? null,
    current_status: "needs_follow_up",
    general_notes: notes
  };

  let customerId = existingCustomer?.id ?? null;
  if (existingCustomer) {
    const { error } = await supabase
      .from("customers")
      .update({
        full_name: fullName || existingCustomer.full_name,
        city: city ?? existingCustomer.city,
        source_id: qrSource?.id ?? null,
        branch_id: branchId,
        assigned_employee_id: branchSalesEmployee?.id ?? null,
        current_status: "needs_follow_up",
        general_notes: notes ?? existingCustomer.general_notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingCustomer.id);
    if (error) fail(branchId, "تعذر تحديث بيانات العميل");
  } else {
    const { data: customer, error } = await supabase
      .from("customers")
      .insert(customerPayload)
      .select("id")
      .single();
    if (error || !customer) fail(branchId, "تعذر تسجيل بيانات العميل");
    customerId = customer.id;
  }

  if (!customerId) fail(branchId, "تعذر تسجيل بيانات العميل");
  const savedCustomerId = customerId;

  const visitNotes = [
    preferredContactTime ? `وقت التواصل المناسب: ${preferredContactTime}` : null,
    notes ? `ملاحظات العميل: ${notes}` : null
  ].filter(Boolean).join("\n");

  const { data: visit, error: visitError } = await supabase
    .from("visits")
    .insert({
      customer_id: savedCustomerId,
      branch_id: branchId,
      sales_employee_id: assignedUserId,
      visit_type: "qr_form",
      interest_category_id: interestCategoryId,
      has_measurements: hasMeasurements,
      customer_status: "needs_follow_up",
      notes: visitNotes || null,
      created_by: null
    })
    .select("id")
    .single();

  if (visitError || !visit) fail(branchId, "تعذر تسجيل الزيارة");

  await supabase.from("activity_logs").insert([
    {
      entity_type: "customer",
      entity_id: savedCustomerId,
      action: existingCustomer ? "customer_updated" : "customer_created",
      new_value: customerPayload,
      performed_by: null
    },
    {
      entity_type: "visit",
      entity_id: visit.id,
      action: "visit_created",
      new_value: {
        visit_type: "qr_form",
        source: "QR داخل المعرض",
        branch_id: branchId,
        interest_category_id: interestCategoryId
      },
      performed_by: null
    }
  ]);

  await supabase.from("notifications").insert({
    user_id: branchSupervisor?.id ?? assignedUserId,
    title: "زيارة جديدة من نموذج QR",
    message: `تم تسجيل اهتمام جديد من ${fullName} في ${branch.name}.`,
    type: "qr_visit_created",
    related_entity_type: "visit",
    related_entity_id: visit.id
  });

  revalidatePath(`/qr/${branchId}`);
  redirect(`/qr/${branchId}?success=1`);
}
