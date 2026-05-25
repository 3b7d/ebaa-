"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function markNotificationReadAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const notificationId = text(formData, "notification_id");
  const returnTo = text(formData, "return_to") || "/notifications";

  if (notificationId) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", context.userId);
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  redirect(returnTo);
}

export async function markAllNotificationsReadAction(formData?: FormData) {
  const context = await requireUser();
  const supabase = createClient();
  const returnTo = formData ? text(formData, "return_to") || "/notifications" : "/notifications";

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", context.userId)
    .eq("is_read", false);

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  redirect(returnTo);
}
