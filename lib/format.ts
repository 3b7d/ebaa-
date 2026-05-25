export function formatSaudiDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "غير محدد";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeZone: "Asia/Riyadh",
    ...options
  }).format(new Date(value));
}

export function formatSaudiDateTime(value: string | null | undefined) {
  if (!value) return "غير محدد";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh"
  }).format(new Date(value));
}

export function shortId(value: string) {
  return value.slice(0, 8);
}

export function activityLabel(action: string) {
  const labels: Record<string, string> = {
    customer_created: "تم إنشاء العميل",
    customer_updated: "تم تحديث بيانات العميل",
    visit_created: "تم تسجيل زيارة",
    visit_updated: "تم تحديث الزيارة",
    status_changed: "تم تغيير الحالة",
    follow_up_created: "تم إنشاء متابعة"
  };

  return labels[action] ?? "تم تنفيذ إجراء";
}
