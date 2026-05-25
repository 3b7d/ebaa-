import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatArabicDate(value: string | Date | null | undefined) {
  if (!value) return "غير محدد";

  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeZone: "Asia/Riyadh"
  }).format(new Date(value));
}

export function formatArabicDateTime(value: string | Date | null | undefined) {
  if (!value) return "غير محدد";

  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh"
  }).format(new Date(value));
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("ar-SA").format(value ?? 0);
}
