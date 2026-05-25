"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    redirect(`/login?error=${encodeMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور")}`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    redirect(`/login?error=${encodeMessage("البريد الإلكتروني أو كلمة المرور غير صحيحة")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeMessage("هذا الحساب غير نشط، يرجى التواصل مع المسؤول")}`);
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}
