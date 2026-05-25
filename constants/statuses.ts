export type { AppRole } from "@/lib/database.types";
import type { AppRole } from "@/lib/database.types";

export const roleLabels: Record<AppRole, string> = {
  sales_employee: "موظف مبيعات",
  branch_supervisor: "مشرف فرع",
  general_manager: "مدير عام",
  admin: "مسؤول النظام"
};

export const customerStatuses = [
  "new",
  "interested",
  "needs_follow_up",
  "quotation_requested",
  "quotation_sent",
  "negotiation",
  "sold",
  "not_interested",
  "closed"
] as const;

export type CustomerStatus = (typeof customerStatuses)[number];

export const customerStatusLabels: Record<CustomerStatus, string> = {
  new: "جديد",
  interested: "مهتم",
  needs_follow_up: "يحتاج متابعة",
  quotation_requested: "طلب عرض سعر",
  quotation_sent: "تم إرسال عرض سعر",
  negotiation: "تفاوض",
  sold: "تم البيع",
  not_interested: "غير مهتم",
  closed: "مغلق"
};

export const customerStatusBadge: Record<
  CustomerStatus,
  "default" | "secondary" | "success" | "warning" | "info" | "destructive" | "outline"
> = {
  new: "info",
  interested: "success",
  needs_follow_up: "warning",
  quotation_requested: "default",
  quotation_sent: "default",
  negotiation: "warning",
  sold: "success",
  not_interested: "destructive",
  closed: "outline"
};

export const purchaseProbabilities = ["low", "medium", "high", "very_high"] as const;

export type PurchaseProbability = (typeof purchaseProbabilities)[number];

export const purchaseProbabilityLabels: Record<PurchaseProbability, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  very_high: "عالية جدًا"
};

export const visitTypes = [
  "showroom_visit",
  "call",
  "whatsapp",
  "qr_form",
  "website",
  "other"
] as const;

export type VisitType = (typeof visitTypes)[number];

export const visitTypeLabels: Record<VisitType, string> = {
  showroom_visit: "زيارة معرض",
  call: "اتصال",
  whatsapp: "واتساب",
  qr_form: "نموذج QR",
  website: "موقع إلكتروني",
  other: "أخرى"
};

export const followUpTypes = ["call", "whatsapp", "second_visit", "send_quotation", "other"] as const;

export type FollowUpType = (typeof followUpTypes)[number];

export const followUpTypeLabels: Record<FollowUpType, string> = {
  call: "اتصال",
  whatsapp: "واتساب",
  second_visit: "زيارة ثانية",
  send_quotation: "إرسال عرض سعر",
  other: "أخرى"
};

export const followUpStatuses = ["upcoming", "due_today", "overdue", "completed", "cancelled"] as const;

export type FollowUpStatus = (typeof followUpStatuses)[number];

export const followUpStatusLabels: Record<FollowUpStatus, string> = {
  upcoming: "قادمة",
  due_today: "مستحقة اليوم",
  overdue: "متأخرة",
  completed: "مكتملة",
  cancelled: "ملغاة"
};

export const followUpStatusBadge: Record<
  FollowUpStatus,
  "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  upcoming: "secondary",
  due_today: "warning",
  overdue: "destructive",
  completed: "success",
  cancelled: "outline"
};

export function isCustomerStatus(value: string | undefined | null): value is CustomerStatus {
  return customerStatuses.some((status) => status === value);
}

export function isPurchaseProbability(value: string | undefined | null): value is PurchaseProbability {
  return purchaseProbabilities.some((probability) => probability === value);
}

export function isFollowUpStatus(value: string | undefined | null): value is FollowUpStatus {
  return followUpStatuses.some((status) => status === value);
}

export function isVisitType(value: string | undefined | null): value is VisitType {
  return visitTypes.some((type) => type === value);
}

export function isFollowUpType(value: string | undefined | null): value is FollowUpType {
  return followUpTypes.some((type) => type === value);
}
