import { addDays, getFollowUpDisplayStatus, startOfSaudiDay } from "@/lib/follow-ups";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

type NotificationCandidate = {
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_entity_type: string;
  related_entity_id: string;
};

async function insertIfMissing(candidate: NotificationCandidate) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", candidate.user_id)
    .eq("type", candidate.type)
    .eq("related_entity_type", candidate.related_entity_type)
    .eq("related_entity_id", candidate.related_entity_id)
    .maybeSingle();

  if (existing) return;
  await supabase.from("notifications").insert(candidate);
}

export async function syncUserNotifications(profile: Profile) {
  const supabase = createClient();
  const today = startOfSaudiDay();
  const tomorrow = addDays(today, 1);

  const [followUpsResult, assignedCustomersResult, highCustomersResult, qrVisitsResult] = await Promise.all([
    supabase
      .from("follow_ups")
      .select("id, scheduled_at, completed_at, status, customers(full_name, phone)")
      .eq("assigned_employee_id", profile.id)
      .is("completed_at", null)
      .neq("status", "cancelled")
      .lte("scheduled_at", tomorrow.toISOString())
      .limit(25),
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("assigned_employee_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("assigned_employee_id", profile.id)
      .in("purchase_probability", ["high", "very_high"])
      .neq("current_status", "sold")
      .neq("current_status", "closed")
      .order("updated_at", { ascending: true })
      .limit(15),
    supabase
      .from("visits")
      .select("id, customers(full_name, phone)")
      .eq("sales_employee_id", profile.id)
      .eq("visit_type", "qr_form")
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  const candidates: NotificationCandidate[] = [];

  for (const followUp of followUpsResult.data ?? []) {
    const status = getFollowUpDisplayStatus(followUp);
    const customer = followUp.customers as { full_name?: string; phone?: string } | null;
    if (status === "due_today") {
      candidates.push({
        user_id: profile.id,
        title: "متابعة مستحقة اليوم",
        message: `لديك متابعة اليوم مع ${customer?.full_name ?? "عميل غير محدد"}.`,
        type: "follow_up_due_today",
        related_entity_type: "follow_up",
        related_entity_id: followUp.id
      });
    }
    if (status === "overdue") {
      candidates.push({
        user_id: profile.id,
        title: "متابعة متأخرة",
        message: `توجد متابعة متأخرة مع ${customer?.full_name ?? "عميل غير محدد"}.`,
        type: "follow_up_overdue",
        related_entity_type: "follow_up",
        related_entity_id: followUp.id
      });
    }
  }

  for (const customer of assignedCustomersResult.data ?? []) {
    candidates.push({
      user_id: profile.id,
      title: "تم إسناد عميل لك",
      message: `تم إسناد العميل ${customer.full_name} إلى حسابك.`,
      type: "customer_assigned",
      related_entity_type: "customer",
      related_entity_id: customer.id
    });
  }

  for (const customer of highCustomersResult.data ?? []) {
    candidates.push({
      user_id: profile.id,
      title: "عميل عالي الاحتمالية لم يتم التواصل معه",
      message: `العميل ${customer.full_name} يحتاج تواصلًا سريعًا بسبب احتمالية الشراء العالية.`,
      type: "high_probability_customer",
      related_entity_type: "customer",
      related_entity_id: customer.id
    });
  }

  for (const visit of qrVisitsResult.data ?? []) {
    const customer = visit.customers as { full_name?: string; phone?: string } | null;
    candidates.push({
      user_id: profile.id,
      title: "زيارة جديدة من QR",
      message: `تم تسجيل زيارة من نموذج QR للعميل ${customer?.full_name ?? "غير محدد"}.`,
      type: "qr_visit_created",
      related_entity_type: "visit",
      related_entity_id: visit.id
    });
  }

  await Promise.all(candidates.slice(0, 30).map(insertIfMissing));
}
