"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { AppRole } from "@/lib/database.types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length ? value : null;
}

function booleanText(formData: FormData, key: string) {
  return text(formData, key) === "true";
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function done(path: string, message: string): never {
  redirect(`${path}?success=${encodeURIComponent(message)}`);
}

async function requireAdmin(returnTo = "/settings") {
  const context = await requireUser();
  if (context.profile.role !== "admin") fail(returnTo, "ليس لديك صلاحية لتنفيذ هذا الإجراء");
  return context;
}

const roles: AppRole[] = ["sales_employee", "branch_supervisor", "general_manager", "admin"];

export async function createUserAction(formData: FormData) {
  await requireAdmin("/settings/users");
  const fullName = text(formData, "full_name");
  const email = text(formData, "email");
  const password = text(formData, "password");
  const phone = nullableText(formData, "phone");
  const role = text(formData, "role") as AppRole;
  const branchId = nullableText(formData, "branch_id");

  if (!fullName) fail("/settings/users", "اسم المستخدم مطلوب");
  if (!email) fail("/settings/users", "البريد الإلكتروني مطلوب");
  if (!password || password.length < 8) fail("/settings/users", "كلمة المرور المؤقتة يجب أن تكون 8 أحرف على الأقل");
  if (!roles.includes(role)) fail("/settings/users", "الدور غير صحيح");

  const service = createServiceClient();
  const { data: created, error: userError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    phone: phone ?? undefined,
    user_metadata: { full_name: fullName }
  });

  if (userError || !created.user) fail("/settings/users", "تعذر إنشاء حساب المستخدم");

  const { error } = await service.from("profiles").insert({
    id: created.user.id,
    full_name: fullName,
    email,
    phone,
    role,
    branch_id: branchId,
    is_active: true
  });

  if (error) fail("/settings/users", "تم إنشاء الحساب وتعذر حفظ ملف المستخدم");

  revalidatePath("/settings/users");
  done("/settings/users", "تمت إضافة المستخدم بنجاح");
}

export async function updateUserAction(formData: FormData) {
  await requireAdmin("/settings/users");
  const userId = text(formData, "user_id");
  const fullName = text(formData, "full_name");
  const email = text(formData, "email");
  const phone = nullableText(formData, "phone");
  const role = text(formData, "role") as AppRole;
  const branchId = nullableText(formData, "branch_id");

  if (!userId) fail("/settings/users", "تعذر تحديد المستخدم");
  if (!fullName) fail("/settings/users", "اسم المستخدم مطلوب");
  if (!email) fail("/settings/users", "البريد الإلكتروني مطلوب");
  if (!roles.includes(role)) fail("/settings/users", "الدور غير صحيح");

  const service = createServiceClient();
  await service.auth.admin.updateUserById(userId, {
    email,
    phone: phone ?? undefined,
    user_metadata: { full_name: fullName }
  });

  const { error } = await service.from("profiles").update({
    full_name: fullName,
    email,
    phone,
    role,
    branch_id: branchId,
    updated_at: new Date().toISOString()
  }).eq("id", userId);

  if (error) fail("/settings/users", "تعذر تحديث بيانات المستخدم");
  revalidatePath("/settings/users");
  done("/settings/users", "تم تحديث بيانات المستخدم");
}

export async function setUserActiveAction(formData: FormData) {
  await requireAdmin("/settings/users");
  const userId = text(formData, "user_id");
  const isActive = booleanText(formData, "is_active");
  if (!userId) fail("/settings/users", "تعذر تحديد المستخدم");

  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) fail("/settings/users", "تعذر تحديث حالة المستخدم");
  revalidatePath("/settings/users");
  done("/settings/users", isActive ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم");
}

export async function createBranchAction(formData: FormData) {
  await requireAdmin("/settings/branches");
  const name = text(formData, "name");
  const city = text(formData, "city");
  if (!name) fail("/settings/branches", "اسم الفرع مطلوب");
  if (!city) fail("/settings/branches", "المدينة مطلوبة");

  const supabase = createClient();
  const { error } = await supabase.from("branches").insert({
    name,
    city,
    region: nullableText(formData, "region"),
    manager_name: nullableText(formData, "manager_name"),
    is_active: true
  });
  if (error) fail("/settings/branches", "تعذر إضافة الفرع");
  revalidatePath("/settings/branches");
  done("/settings/branches", "تمت إضافة الفرع بنجاح");
}

export async function updateBranchAction(formData: FormData) {
  await requireAdmin("/settings/branches");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const city = text(formData, "city");
  if (!id) fail("/settings/branches", "تعذر تحديد الفرع");
  if (!name) fail("/settings/branches", "اسم الفرع مطلوب");
  if (!city) fail("/settings/branches", "المدينة مطلوبة");

  const supabase = createClient();
  const { error } = await supabase.from("branches").update({
    name,
    city,
    region: nullableText(formData, "region"),
    manager_name: nullableText(formData, "manager_name"),
    updated_at: new Date().toISOString()
  }).eq("id", id);
  if (error) fail("/settings/branches", "تعذر تحديث الفرع");
  revalidatePath("/settings/branches");
  done("/settings/branches", "تم تحديث الفرع");
}

export async function setBranchActiveAction(formData: FormData) {
  await requireAdmin("/settings/branches");
  const id = text(formData, "id");
  const isActive = booleanText(formData, "is_active");
  const supabase = createClient();
  const { error } = await supabase.from("branches").update({ is_active: isActive }).eq("id", id);
  if (error) fail("/settings/branches", "تعذر تحديث حالة الفرع");
  revalidatePath("/settings/branches");
  done("/settings/branches", isActive ? "تم تفعيل الفرع" : "تم تعطيل الفرع");
}

export async function createInterestCategoryAction(formData: FormData) {
  await requireAdmin("/settings/interest-categories");
  const name = text(formData, "name");
  if (!name) fail("/settings/interest-categories", "اسم القسم مطلوب");
  const supabase = createClient();
  const { error } = await supabase.from("interest_categories").insert({
    name,
    description: nullableText(formData, "description"),
    is_active: true
  });
  if (error) fail("/settings/interest-categories", "تعذر إضافة القسم");
  revalidatePath("/settings/interest-categories");
  done("/settings/interest-categories", "تمت إضافة القسم");
}

export async function updateInterestCategoryAction(formData: FormData) {
  await requireAdmin("/settings/interest-categories");
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!id) fail("/settings/interest-categories", "تعذر تحديد القسم");
  if (!name) fail("/settings/interest-categories", "اسم القسم مطلوب");
  const supabase = createClient();
  const { error } = await supabase.from("interest_categories").update({
    name,
    description: nullableText(formData, "description"),
    updated_at: new Date().toISOString()
  }).eq("id", id);
  if (error) fail("/settings/interest-categories", "تعذر تحديث القسم");
  revalidatePath("/settings/interest-categories");
  done("/settings/interest-categories", "تم تحديث القسم");
}

export async function setInterestCategoryActiveAction(formData: FormData) {
  await requireAdmin("/settings/interest-categories");
  const id = text(formData, "id");
  const isActive = booleanText(formData, "is_active");
  const supabase = createClient();
  const { error } = await supabase.from("interest_categories").update({ is_active: isActive }).eq("id", id);
  if (error) fail("/settings/interest-categories", "تعذر تحديث حالة القسم");
  revalidatePath("/settings/interest-categories");
  done("/settings/interest-categories", isActive ? "تم تفعيل القسم" : "تم تعطيل القسم");
}

export async function createLeadSourceAction(formData: FormData) {
  await requireAdmin("/settings/lead-sources");
  const name = text(formData, "name");
  if (!name) fail("/settings/lead-sources", "اسم المصدر مطلوب");
  const supabase = createClient();
  const { error } = await supabase.from("lead_sources").insert({
    name,
    description: nullableText(formData, "description"),
    is_active: true
  });
  if (error) fail("/settings/lead-sources", "تعذر إضافة المصدر");
  revalidatePath("/settings/lead-sources");
  done("/settings/lead-sources", "تمت إضافة المصدر");
}

export async function updateLeadSourceAction(formData: FormData) {
  await requireAdmin("/settings/lead-sources");
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!id) fail("/settings/lead-sources", "تعذر تحديد المصدر");
  if (!name) fail("/settings/lead-sources", "اسم المصدر مطلوب");
  const supabase = createClient();
  const { error } = await supabase.from("lead_sources").update({
    name,
    description: nullableText(formData, "description"),
    updated_at: new Date().toISOString()
  }).eq("id", id);
  if (error) fail("/settings/lead-sources", "تعذر تحديث المصدر");
  revalidatePath("/settings/lead-sources");
  done("/settings/lead-sources", "تم تحديث المصدر");
}

export async function setLeadSourceActiveAction(formData: FormData) {
  await requireAdmin("/settings/lead-sources");
  const id = text(formData, "id");
  const isActive = booleanText(formData, "is_active");
  const supabase = createClient();
  const { error } = await supabase.from("lead_sources").update({ is_active: isActive }).eq("id", id);
  if (error) fail("/settings/lead-sources", "تعذر تحديث حالة المصدر");
  revalidatePath("/settings/lead-sources");
  done("/settings/lead-sources", isActive ? "تم تفعيل المصدر" : "تم تعطيل المصدر");
}
